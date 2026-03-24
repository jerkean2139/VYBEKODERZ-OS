import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { routeTask } from './donna';
import { createTask, routeTaskToAgent, getAllTasks, getTask, updateTaskStatus, subscribe } from './taskStore';
import { agents } from './agents';
import { signToken, type JWTPayload } from './auth/jwt';
import { getGoogleAuthUrl, getMicrosoftAuthUrl } from './auth/oauth';
import { authenticate, authorize, requireRole } from './auth/middleware';
import {
  storeContext, storeSOP, storeMemory, normalizeLegacyType,
  storeEpisodic, storeSemantic, storeProcedural, storeRelational, storePredictive,
  queryMemories, getMemoryStats, seedDemoMemories, type MemoryType,
} from './memory/engine';
import { calculateIQScore, calculateOperationalMetrics } from './memory/iqScore';
import { generateDailyReport } from './memory/report';
import { initJobQueue, enqueueRouteTask, enqueueWebhook } from './jobs/queue';
import { registerWorkers } from './jobs/workers';
import {
  registerAutonomyJobs, consolidateMemories, runDailyReport,
  runWeeklyAssessment, optimizeSOPs, detectSpecialistNeeds,
} from './jobs/autonomy';
import {
  registerEventTriggers, onHumanOverride,
  decomposeTask, getChildTaskIds, isParentTask, updateParentProgress,
  getKillSwitch, manualKill, manualResume,
  getAPIUsageStats, checkBudget, setDailyBudget,
  getAgentInstincts, getGraduatedInsights, runGraduationSweep,
} from './autonomy';
import {
  getNotifications, addNotification, markRead, markAllRead, getUnreadCount, onNotification,
} from './notifications/feed';
import {
  uploadArtifact, getArtifact, getArtifactPath, getArtifactsByTask,
  getArtifactsByTenant, deleteArtifact, isStorageConfigured,
} from './storage/artifacts';
import {
  checkTaskLimit, incrementTaskUsage, getUsageStats, type PlanTier,
} from './billing/limits';
import type { TaskEvent } from './types';

const app = express();
const PORT = process.env.PORT || 3001;
const DEMO_TENANT = 'vybekoderz-demo';
const DEMO_PLAN: PlanTier = 'enterprise';

// Prevent unhandled errors from crashing the server
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
});
process.on('SIGTERM', () => {
  console.log('[server] Received SIGTERM — shutting down gracefully');
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('[server] Received SIGINT — shutting down');
  process.exit(0);
});

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting — per-IP, 100 req/min for API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
  skip: (req) => !req.path.startsWith('/api/'),
});
app.use(apiLimiter);

// Stricter rate limit for auth endpoints (20 req/min)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts' },
});

// Serve static frontend in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Seed demo memories on startup
seedDemoMemories(DEMO_TENANT);

// ============================================================
// SSE — Real-time events
// ============================================================

const sseClients: Set<express.Response> = new Set();

subscribe((event: TaskEvent) => {
  const data = JSON.stringify(event);
  for (const client of sseClients) {
    client.write(`data: ${data}\n\n`);
  }
});

app.get('/api/events', (_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  sseClients.add(res);
  _req.on('close', () => sseClients.delete(res));
});

// ============================================================
// HEALTH — detailed diagnostics
// ============================================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    port: PORT,
    nodeVersion: process.version,
    pid: process.pid,
    env: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// AGENTS
// ============================================================

app.get('/api/agents', (_req, res) => {
  res.json(agents);
});

// ============================================================
// TASKS
// ============================================================

app.get('/api/tasks', (_req, res) => {
  res.json(getAllTasks());
});

app.get('/api/tasks/:id', (req, res) => {
  const task = getTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/api/tasks', async (req, res) => {
  const { input } = req.body;
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Missing input string' });
  }

  // Billing enforcement — check task limit
  const limitCheck = checkTaskLimit(DEMO_TENANT, DEMO_PLAN);
  if (!limitCheck.allowed) {
    return res.status(429).json({
      error: 'Monthly task limit reached',
      limit: limitCheck.limit,
      remaining: limitCheck.remaining,
    });
  }

  const task = createTask(input);
  incrementTaskUsage(DEMO_TENANT);

  try {
    const decision = await routeTask(input);
    const routed = routeTaskToAgent(task.id, decision);

    // Store context memory of task creation
    storeContext(DEMO_TENANT, `Task created: "${decision.title}" — routed to ${decision.department}/${decision.specialist}`, {
      agentId: 'donna', taskId: task.id, sourceType: 'task', tags: ['task', 'routing'],
    });

    // Emit notification
    addNotification({
      tenantId: DEMO_TENANT,
      type: 'task_routed',
      title: 'Task Routed',
      message: `"${decision.title}" → ${decision.department} → ${decision.specialist}`,
      agentId: 'donna',
      taskId: task.id,
    });

    res.status(201).json({ task: routed, routing: decision });
  } catch {
    updateTaskStatus(task.id, 'error');

    addNotification({
      tenantId: DEMO_TENANT,
      type: 'task_error',
      title: 'Routing Failed',
      message: `Failed to route: "${input.slice(0, 60)}..."`,
      agentId: 'donna',
      taskId: task.id,
    });

    res.status(500).json({ error: 'Routing failed', taskId: task.id });
  }
});

app.patch('/api/tasks/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['running', 'waiting', 'error', 'done'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` });
  }
  const task = updateTaskStatus(req.params.id, status);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// ============================================================
// AUTH — OAuth + JWT
// ============================================================

// Get OAuth URLs with CSRF nonce
import crypto from 'crypto';
const oauthStates: Map<string, number> = new Map(); // nonce -> expiry timestamp

app.get('/api/auth/providers', (_req, res) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  oauthStates.set(nonce, Date.now() + 5 * 60 * 1000); // 5 min expiry
  // Clean expired states
  for (const [key, exp] of oauthStates) {
    if (exp < Date.now()) oauthStates.delete(key);
  }
  res.json({
    google: getGoogleAuthUrl(nonce),
    microsoft: getMicrosoftAuthUrl(nonce),
    state: nonce,
  });
});

// Demo login (development only — generates JWT without OAuth)
app.post('/api/auth/demo', authLimiter, (req, res) => {
  const { role = 'agency_admin', name = 'Demo User' } = req.body;
  const payload: JWTPayload = {
    userId: 'demo-user-001',
    tenantId: DEMO_TENANT,
    email: 'demo@vybekoderz.com',
    role,
  };
  const token = signToken(payload);
  res.json({ token, user: { ...payload, name } });
});

// Verify current token
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json(req.auth);
});

// ============================================================
// OAUTH CALLBACKS — full code exchange → user upsert → JWT
// ============================================================

import { exchangeGoogleCode, exchangeMicrosoftCode, type OAuthUserProfile } from './auth/oauth';
import {
  getUserByEmail, getUserByGoogleId, getUserByMicrosoftId,
  createUser, updateUserLogin, getTenantBySlug,
  createInvite, getInviteByToken, acceptInvite, getInvitesByTenant,
  getUsersByTenant, getAllTenants, updateTenant,
} from './db/repository';
import { v4 as uuidv4 } from 'uuid';

async function handleOAuthUser(profile: OAuthUserProfile): Promise<{ token: string; user: JWTPayload }> {
  // Check if user exists by provider ID or email
  let user = profile.provider === 'google'
    ? await getUserByGoogleId(profile.providerId)
    : await getUserByMicrosoftId(profile.providerId);

  if (!user) {
    user = await getUserByEmail(profile.email);
  }

  if (user) {
    // Existing user — update login time
    await updateUserLogin(user.id);
    const payload: JWTPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
    return { token: signToken(payload), user: payload };
  }

  // New user — check for pending invite
  // If no invite exists, create in default tenant with client_viewer role
  const defaultTenant = await getTenantBySlug('vybekoderz');
  const tenantId = defaultTenant?.id ?? DEMO_TENANT;

  const newUser = await createUser({
    tenantId,
    email: profile.email,
    name: profile.name,
    role: 'client_viewer',
    googleId: profile.provider === 'google' ? profile.providerId : undefined,
    microsoftId: profile.provider === 'microsoft' ? profile.providerId : undefined,
    avatarUrl: profile.avatarUrl,
  });

  const payload: JWTPayload = {
    userId: newUser.id,
    tenantId: newUser.tenantId,
    email: newUser.email,
    role: newUser.role,
  };
  return { token: signToken(payload), user: payload };
}

// Verify OAuth state nonce (CSRF protection)
function verifyOAuthState(state: string | undefined): boolean {
  if (!state) return false;
  const expiry = oauthStates.get(state);
  if (!expiry || expiry < Date.now()) return false;
  oauthStates.delete(state); // single-use
  return true;
}

// Google OAuth callback
app.get('/api/auth/google/callback', authLimiter, async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing auth code' });
  if (!verifyOAuthState(state as string)) return res.status(403).json({ error: 'Invalid OAuth state' });

  try {
    const profile = await exchangeGoogleCode(code as string);
    const { token } = await handleOAuthUser(profile);
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    res.redirect(`${appUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

// Microsoft OAuth callback
app.get('/api/auth/microsoft/callback', authLimiter, async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).json({ error: 'Missing auth code' });
  if (!verifyOAuthState(state as string)) return res.status(403).json({ error: 'Invalid OAuth state' });

  try {
    const profile = await exchangeMicrosoftCode(code as string);
    const { token } = await handleOAuthUser(profile);
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    res.redirect(`${appUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Microsoft OAuth error:', error);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

// ============================================================
// INVITE SYSTEM
// ============================================================

// Create invite
app.post('/api/invites', authenticate, authorize('canManageUsers'), async (req, res) => {
  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invite = await createInvite({
      tenantId: req.auth!.tenantId,
      email,
      role: role || 'builder',
      invitedBy: req.auth!.userId,
      token,
      expiresAt,
    });
    res.status(201).json(invite);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// List invites for current tenant
app.get('/api/invites', authenticate, authorize('canManageUsers'), async (req, res) => {
  try {
    const invites = await getInvitesByTenant(req.auth!.tenantId);
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list invites' });
  }
});

// Accept invite
app.post('/api/invites/:token/accept', async (req, res) => {
  try {
    const invite = await getInviteByToken(req.params.token);
    if (!invite) return res.status(404).json({ error: 'Invalid or expired invite' });

    // Create user from invite (or link existing)
    const existingUser = await getUserByEmail(invite.email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const { name, password } = req.body;
    const user = await createUser({
      tenantId: invite.tenantId,
      email: invite.email,
      name: name || invite.email.split('@')[0],
      role: invite.role,
    });

    await acceptInvite(req.params.token);

    const payload: JWTPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };
    res.json({ token: signToken(payload), user: payload });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// ============================================================
// TEAM MANAGEMENT
// ============================================================

app.get('/api/team', authenticate, authorize('canManageUsers'), async (req, res) => {
  try {
    const users = await getUsersByTenant(req.auth!.tenantId);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list team' });
  }
});

// ============================================================
// TENANT MANAGEMENT (super admin only)
// ============================================================

app.get('/api/tenants', authenticate, requireRole('super_admin'), async (_req, res) => {
  try {
    const tenants = await getAllTenants();
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list tenants' });
  }
});

app.patch('/api/tenants/:id', authenticate, requireRole('super_admin'), async (req, res) => {
  try {
    const tenant = await updateTenant(req.params.id, req.body);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// ============================================================
// BROWSERBASE SESSIONS
// ============================================================

import {
  createBrowserbaseSession, getBrowserbaseSession, stopBrowserbaseSession,
  getDebugUrls, isBrowserbaseConfigured,
} from './browser/browserbase';

app.get('/api/browserbase/status', (_req, res) => {
  res.json({ configured: isBrowserbaseConfigured() });
});

app.post('/api/browserbase/sessions', async (_req, res) => {
  try {
    const session = await createBrowserbaseSession();
    if (!session) return res.status(503).json({ error: 'Browserbase not configured' });
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create browser session' });
  }
});

app.get('/api/browserbase/sessions/:id', async (req, res) => {
  const session = await getBrowserbaseSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.post('/api/browserbase/sessions/:id/stop', async (req, res) => {
  const stopped = await stopBrowserbaseSession(req.params.id);
  res.json({ stopped });
});

app.get('/api/browserbase/sessions/:id/debug', async (req, res) => {
  const urls = await getDebugUrls(req.params.id);
  if (!urls) return res.status(404).json({ error: 'Debug URLs not available' });
  res.json(urls);
});

// ============================================================
// MEMORY ENGINE
// ============================================================

// Store a new memory
app.post('/api/memory', (req, res) => {
  const { type, content, agentId, tags, metadata } = req.body;
  if (!content || !type) {
    return res.status(400).json({ error: 'Missing content or type' });
  }

  // Accept both new types (context, sop) and legacy types (episodic, semantic, etc.)
  const normalized = normalizeLegacyType(type);
  const memory = normalized === 'sop'
    ? storeSOP(DEMO_TENANT, content, { agentId, tags })
    : storeContext(DEMO_TENANT, content, { agentId, sourceType: metadata?.sourceType as string, tags });

  res.status(201).json(memory);
});

// Query memories
app.get('/api/memory', (req, res) => {
  const { type, agentId, limit, minConfidence } = req.query;
  const results = queryMemories({
    tenantId: DEMO_TENANT,
    type: type as MemoryType | undefined,
    agentId: agentId as string | undefined,
    limit: limit ? parseInt(limit as string) : 20,
    minConfidence: minConfidence ? parseFloat(minConfidence as string) : undefined,
  });
  res.json(results);
});

// Memory stats
app.get('/api/memory/stats', (_req, res) => {
  res.json(getMemoryStats(DEMO_TENANT));
});

// ============================================================
// IQ SCORE
// ============================================================

app.get('/api/iq', (_req, res) => {
  const score = calculateIQScore(DEMO_TENANT);
  res.json(score);
});

// ============================================================
// MEMORY INTELLIGENCE REPORT
// ============================================================

app.get('/api/memory/report', async (_req, res) => {
  try {
    const report = await generateDailyReport(DEMO_TENANT);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// ============================================================
// AUTONOMY — manual triggers for scheduled jobs
// ============================================================

app.post('/api/autonomy/consolidate', async (_req, res) => {
  try {
    const result = await consolidateMemories(DEMO_TENANT);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Memory consolidation failed' });
  }
});

app.post('/api/autonomy/report', async (_req, res) => {
  try {
    const report = await runDailyReport(DEMO_TENANT);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Daily report generation failed' });
  }
});

app.post('/api/autonomy/assessment', async (_req, res) => {
  try {
    const assessment = await runWeeklyAssessment(DEMO_TENANT);
    res.json(assessment);
  } catch (error) {
    res.status(500).json({ error: 'Weekly assessment failed' });
  }
});

app.post('/api/autonomy/optimize-sops', async (_req, res) => {
  try {
    const result = await optimizeSOPs(DEMO_TENANT);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'SOP optimization failed' });
  }
});

app.post('/api/autonomy/detect-specialists', async (_req, res) => {
  try {
    const recommendations = await detectSpecialistNeeds(DEMO_TENANT);
    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: 'Specialist detection failed' });
  }
});

app.post('/api/autonomy/graduate', async (_req, res) => {
  try {
    const graduated = await runGraduationSweep(DEMO_TENANT);
    res.json({ graduated });
  } catch (error) {
    res.status(500).json({ error: 'Graduation sweep failed' });
  }
});

// ============================================================
// KILL SWITCH — halt/resume autonomy
// ============================================================

app.get('/api/autonomy/kill-switch', (_req, res) => {
  res.json(getKillSwitch(DEMO_TENANT));
});

app.post('/api/autonomy/kill', (req, res) => {
  const { reason } = req.body ?? {};
  res.json(manualKill(DEMO_TENANT, reason ?? 'Manual kill via API'));
});

app.post('/api/autonomy/resume', (_req, res) => {
  res.json(manualResume(DEMO_TENANT));
});

// ============================================================
// COST METERING — track Claude API spend
// ============================================================

app.get('/api/autonomy/cost', (_req, res) => {
  res.json(getAPIUsageStats(DEMO_TENANT));
});

app.get('/api/autonomy/budget', (_req, res) => {
  res.json(checkBudget(DEMO_TENANT));
});

app.patch('/api/autonomy/budget', (req, res) => {
  const { dailyBudgetUsd } = req.body ?? {};
  if (typeof dailyBudgetUsd !== 'number' || dailyBudgetUsd <= 0) {
    return res.status(400).json({ error: 'dailyBudgetUsd must be a positive number' });
  }
  setDailyBudget(DEMO_TENANT, dailyBudgetUsd);
  res.json(checkBudget(DEMO_TENANT));
});

// ============================================================
// INSTINCTS — graduated insights & agent behavior
// ============================================================

app.get('/api/autonomy/instincts', (_req, res) => {
  res.json(getGraduatedInsights(DEMO_TENANT));
});

app.get('/api/autonomy/instincts/:agentId', (req, res) => {
  res.json({ agentId: req.params.agentId, instincts: getAgentInstincts(req.params.agentId) });
});

// ============================================================
// TASK DECOMPOSITION — complex task splitting
// ============================================================

app.post('/api/tasks/decompose', async (req, res) => {
  const { input } = req.body ?? {};
  if (!input) return res.status(400).json({ error: 'input is required' });
  try {
    const result = await decomposeTask(input, DEMO_TENANT);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Task decomposition failed' });
  }
});

app.get('/api/tasks/:id/subtasks', (req, res) => {
  const taskId = req.params.id;
  if (!isParentTask(taskId)) {
    return res.json({ isParent: false, subtasks: [] });
  }
  const childIds = getChildTaskIds(taskId);
  const children = childIds.map(id => getTask(id)).filter(Boolean);
  res.json({ isParent: true, subtasks: children });
});

// ============================================================
// HUMAN OVERRIDE — real-time learning from corrections
// ============================================================

app.post('/api/override', async (req, res) => {
  const { taskId, agentId, overrideType, humanAction } = req.body ?? {};
  if (!taskId || !agentId || !overrideType || !humanAction) {
    return res.status(400).json({ error: 'taskId, agentId, overrideType, and humanAction are required' });
  }
  try {
    await onHumanOverride({
      tenantId: DEMO_TENANT,
      taskId,
      agentId,
      overrideType,
      humanAction,
    });
    res.json({ learned: true });
  } catch (error) {
    res.status(500).json({ error: 'Override learning failed' });
  }
});

// ============================================================
// BROWSER AGENT
// ============================================================

import {
  createSOP, getSOP, getAllSOPs,
  createSession, getSession, getAllSessions, executeSOP as executeSOPFn,
  captureOverrideStep, learnFromOverride, seedDemoSOPs, onSessionUpdate,
} from './browser/sopExecutor';

// Seed demo SOPs
seedDemoSOPs(DEMO_TENANT);

// Broadcast browser session updates via SSE
onSessionUpdate((session) => {
  const data = JSON.stringify({ type: 'browser_update', session });
  for (const client of sseClients) {
    client.write(`data: ${data}\n\n`);
  }
});

// SOP routes
app.get('/api/sops', (_req, res) => {
  res.json(getAllSOPs(DEMO_TENANT));
});

app.get('/api/sops/:id', (req, res) => {
  const sop = getSOP(req.params.id);
  if (!sop) return res.status(404).json({ error: 'SOP not found' });
  res.json(sop);
});

app.post('/api/sops', (req, res) => {
  const { name, description, agentId, steps } = req.body;
  if (!name || !steps?.length) {
    return res.status(400).json({ error: 'Missing name or steps' });
  }
  const sop = createSOP({ tenantId: DEMO_TENANT, name, description, agentId: agentId || 'sop-executor', steps });
  res.status(201).json(sop);
});

// Browser session routes
app.get('/api/browser/sessions', (_req, res) => {
  res.json(getAllSessions(DEMO_TENANT));
});

app.get('/api/browser/sessions/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.post('/api/browser/sessions', (req, res) => {
  const { taskId, agentId, sopId } = req.body;
  const session = createSession({ tenantId: DEMO_TENANT, taskId, agentId: agentId || 'browser-agent', sopId });
  res.status(201).json(session);
});

app.post('/api/browser/sessions/:id/execute', async (req, res) => {
  try {
    const session = await executeSOPFn(req.params.id);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/browser/sessions/:id/override', (req, res) => {
  const { step } = req.body;
  if (!step) return res.status(400).json({ error: 'Missing step' });
  captureOverrideStep(req.params.id, step);
  res.json({ success: true });
});

app.post('/api/browser/sessions/:id/learn', (req, res) => {
  const sop = learnFromOverride(req.params.id, DEMO_TENANT);
  if (!sop) return res.status(404).json({ error: 'No override steps to learn from' });
  res.json(sop);
});

// ============================================================
// VOICE LAYER
// ============================================================

import {
  createVoiceSession, getVoiceSession,
  transcribeAudio, synthesizeSpeech, extractMeetingActions,
} from './voice/voiceService';

app.post('/api/voice/sessions', (_req, res) => {
  const session = createVoiceSession(DEMO_TENANT);
  res.status(201).json(session);
});

app.get('/api/voice/sessions/:id', (req, res) => {
  const session = getVoiceSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

app.post('/api/voice/sessions/:id/transcribe', async (req, res) => {
  try {
    // In production: parse multipart audio buffer
    const audioBuffer = Buffer.from('simulated-audio');
    const entry = await transcribeAudio(req.params.id, audioBuffer);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/voice/sessions/:id/speak', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });
  try {
    const entry = await synthesizeSpeech(req.params.id, text);
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/voice/meeting-actions', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'Missing transcript' });
  const actions = await extractMeetingActions(transcript);
  res.json(actions);
});

// ============================================================
// INTEGRATION HUB
// ============================================================

import {
  getAllIntegrations, getIntegration, getByCategory, getConnected,
  connectIntegration, disconnectIntegration, healthCheck, getHubStats,
} from './integrations/hub';

app.get('/api/integrations', (req, res) => {
  const { category } = req.query;
  if (category) {
    res.json(getByCategory(category as Parameters<typeof getByCategory>[0]));
  } else {
    res.json(getAllIntegrations());
  }
});

app.get('/api/integrations/stats', (_req, res) => {
  res.json(getHubStats());
});

app.get('/api/integrations/connected', (_req, res) => {
  res.json(getConnected());
});

app.get('/api/integrations/:id', (req, res) => {
  const integration = getIntegration(req.params.id);
  if (!integration) return res.status(404).json({ error: 'Integration not found' });
  res.json(integration);
});

app.post('/api/integrations/:id/connect', (req, res) => {
  const result = connectIntegration(req.params.id, req.body.config);
  if (!result) return res.status(404).json({ error: 'Integration not found' });
  res.json(result);
});

app.post('/api/integrations/:id/disconnect', (req, res) => {
  const result = disconnectIntegration(req.params.id);
  if (!result) return res.status(404).json({ error: 'Integration not found' });
  res.json(result);
});

app.get('/api/integrations/:id/health', (req, res) => {
  res.json(healthCheck(req.params.id));
});

// ============================================================
// WEBHOOK INGESTION — event-driven task creation
// ============================================================

const webhookLimiter = rateLimit({ windowMs: 60 * 1000, max: 50, message: { error: 'Webhook rate limit exceeded' } });

app.post('/api/webhooks/:source', webhookLimiter, async (req, res) => {
  const { source } = req.params;
  const payload = req.body;
  const tenantId = (req.query.tenant as string) || DEMO_TENANT;

  // Enqueue for async processing if job queue available
  await enqueueWebhook({ source, payload, tenantId });

  // Also create a task if the webhook has actionable content
  if (payload.action || payload.event || payload.type) {
    const input = `[Webhook: ${source}] ${payload.action || payload.event || payload.type}: ${JSON.stringify(payload.data || payload).slice(0, 200)}`;
    const task = createTask(input);

    // Route async
    const decision = await routeTask(input).catch(() => null);
    if (decision) routeTaskToAgent(task.id, decision);

    return res.status(201).json({ task: task.id, queued: true });
  }

  res.json({ received: true, source });
});

// ============================================================
// NOTIFICATION FEED
// ============================================================

// Broadcast notifications via SSE
onNotification((notification) => {
  const data = JSON.stringify({ type: 'notification', notification });
  for (const client of sseClients) {
    client.write(`data: ${data}\n\n`);
  }
});

app.get('/api/notifications', (req, res) => {
  const tenantId = DEMO_TENANT;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const unreadOnly = req.query.unread === 'true';
  res.json(getNotifications(tenantId, { limit, unreadOnly }));
});

app.get('/api/notifications/count', (_req, res) => {
  res.json({ unread: getUnreadCount(DEMO_TENANT) });
});

app.post('/api/notifications/:id/read', (req, res) => {
  markRead(DEMO_TENANT, req.params.id);
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (_req, res) => {
  const count = markAllRead(DEMO_TENANT);
  res.json({ marked: count });
});

// ============================================================
// ARTIFACT STORAGE
// ============================================================

import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB max

app.get('/api/storage/status', (_req, res) => {
  res.json({ configured: isStorageConfigured() });
});

app.post('/api/artifacts', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const artifact = await uploadArtifact({
    tenantId: DEMO_TENANT,
    taskId: req.body.taskId,
    filename: req.file.originalname,
    contentType: req.file.mimetype,
    data: req.file.buffer,
  });
  res.status(201).json(artifact);
});

app.get('/api/artifacts', (req, res) => {
  const taskId = req.query.taskId as string;
  if (taskId) {
    res.json(getArtifactsByTask(taskId));
  } else {
    res.json(getArtifactsByTenant(DEMO_TENANT));
  }
});

app.get('/api/artifacts/:id', (req, res) => {
  const artifact = getArtifact(req.params.id);
  if (!artifact) return res.status(404).json({ error: 'Artifact not found' });
  res.json(artifact);
});

app.get('/api/artifacts/:id/download', (req, res) => {
  const file = getArtifactPath(req.params.id);
  if (!file) return res.status(404).json({ error: 'Artifact not found' });
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
  res.sendFile(file.filePath);
});

app.delete('/api/artifacts/:id', async (req, res) => {
  const deleted = await deleteArtifact(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Artifact not found' });
  res.json({ deleted: true });
});

// ============================================================
// BILLING & USAGE
// ============================================================

app.get('/api/billing/usage', (_req, res) => {
  res.json(getUsageStats(DEMO_TENANT, DEMO_PLAN));
});

app.get('/api/billing/limits', (_req, res) => {
  const check = checkTaskLimit(DEMO_TENANT, DEMO_PLAN);
  res.json(check);
});

// ============================================================
// OPERATIONAL METRICS
// ============================================================

app.get('/api/metrics', (_req, res) => {
  res.json(calculateOperationalMetrics(DEMO_TENANT));
});

// ============================================================
// SPA FALLBACK — serve index.html for all non-API routes
// ============================================================

const indexPath = path.join(distPath, 'index.html');

app.get('/{*splat}', (_req, res) => {
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('[server] sendFile error:', err);
      res.status(500).send('Server error');
    }
  });
});

// Global error handler — prevents unhandled route errors from crashing Express
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server] Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================
// START — listen immediately, then initialize background services
// ============================================================

// Start HTTP server first so healthcheck passes immediately
// Bind to 0.0.0.0 explicitly for Railway container networking
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`VybeKoderz Agent OS server running on port ${PORT}`);
  console.log(`  Demo tenant: ${DEMO_TENANT}`);
  console.log(`  Memory engine: ${getMemoryStats(DEMO_TENANT).totalMemories} memories seeded`);
  console.log(`  Health: ${calculateOperationalMetrics(DEMO_TENANT).healthScore} (${calculateOperationalMetrics(DEMO_TENANT).healthLevel})`);
  console.log(`  SOPs: ${getAllSOPs(DEMO_TENANT).length} demo SOPs loaded`);
  console.log(`  Integrations: ${getHubStats().total} configured, ${getHubStats().connected} connected`);
  console.log(`  Rate limiting: active (100 req/min API, 20 req/min auth)`);
  console.log(`  Kill switch: ${getKillSwitch(DEMO_TENANT).killed ? 'KILLED' : getKillSwitch(DEMO_TENANT).throttled ? 'THROTTLED' : 'active'}`);
  console.log(`  Storage: local disk (${isStorageConfigured() ? 'ready' : 'not configured'})`);
});

// Heartbeat — log every 60s so Railway logs show the server is alive
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(`[heartbeat] alive | rss=${Math.round(mem.rss / 1024 / 1024)}MB heap=${Math.round(mem.heapUsed / 1024 / 1024)}/${Math.round(mem.heapTotal / 1024 / 1024)}MB | uptime=${Math.round(process.uptime())}s`);
}, 60_000).unref();

// Register event-driven autonomy triggers (runs without pg-boss)
registerEventTriggers();

// Track parent task progress when subtasks complete
subscribe((event) => {
  if (event.type === 'task_completed' || event.type === 'task_error') {
    updateParentProgress(event.task.id, event.task.status, getAllTasks);
  }
});

// Initialize job queue in background — never blocks server startup
initJobQueue().then(async (boss) => {
  if (boss) {
    try {
      await registerWorkers(boss);
    } catch (err) {
      console.error('  Job queue: worker registration failed —', (err as Error).message);
    }
    try {
      await registerAutonomyJobs(boss);
    } catch (err) {
      console.error('  Job queue: autonomy jobs failed —', (err as Error).message);
    }
    console.log('  Job queue: pg-boss initialized');
  } else {
    console.log('  Job queue: in-memory fallback');
  }
}).catch((err) => {
  console.error('  Job queue init error:', err);
});
