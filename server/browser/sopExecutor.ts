import { v4 as uuid } from 'uuid';
import type { SOPDefinition, SOPStep, BrowserSession, StepLogEntry, Screenshot } from './types';
import { storeEpisodic, storeProcedural } from '../memory/engine';

// ============================================================
// SOP Executor
// Executes Standard Operating Procedures via browser automation.
// In production: Playwright + Stagehand + Browserbase
// Here: simulated execution with step logging
//
// Flow: SOP Document → Agent Parser → Step Sequencer →
//       Browser Executor → Result Logger
// ============================================================

const sessions: Map<string, BrowserSession> = new Map();
const sops: Map<string, SOPDefinition> = new Map();

// SSE listeners for browser events
const sessionListeners: Set<(session: BrowserSession) => void> = new Set();

export function onSessionUpdate(listener: (session: BrowserSession) => void) {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function emit(session: BrowserSession) {
  for (const listener of sessionListeners) {
    listener(session);
  }
}

// ============================================================
// SOP Management
// ============================================================

export function createSOP(params: {
  tenantId: string;
  name: string;
  description: string;
  agentId: string;
  steps: SOPStep[];
}): SOPDefinition {
  const sop: SOPDefinition = {
    id: uuid(),
    tenantId: params.tenantId,
    name: params.name,
    description: params.description,
    agentId: params.agentId,
    steps: params.steps.map((s, i) => ({ ...s, id: s.id || uuid(), order: i })),
    version: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sops.set(sop.id, sop);
  return sop;
}

export function getSOP(id: string): SOPDefinition | undefined {
  return sops.get(id);
}

export function getAllSOPs(tenantId: string): SOPDefinition[] {
  return Array.from(sops.values()).filter(s => s.tenantId === tenantId);
}

// ============================================================
// Browser Session Management
// ============================================================

export function createSession(params: {
  tenantId: string;
  taskId?: string;
  agentId: string;
  sopId?: string;
}): BrowserSession {
  const sop = params.sopId ? sops.get(params.sopId) : null;

  const session: BrowserSession = {
    id: uuid(),
    tenantId: params.tenantId,
    taskId: params.taskId ?? null,
    agentId: params.agentId,
    sopId: params.sopId ?? null,
    status: 'idle',
    currentUrl: null,
    currentStep: 0,
    totalSteps: sop?.steps.length ?? 0,
    screenshots: [],
    stepLog: [],
    error: null,
    browserbaseSessionId: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): BrowserSession | undefined {
  return sessions.get(id);
}

export function getAllSessions(tenantId: string): BrowserSession[] {
  return Array.from(sessions.values())
    .filter(s => s.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ============================================================
// SOP Execution (Simulated)
// In production, this would use Playwright + Stagehand via Browserbase
// ============================================================

export async function executeSOP(sessionId: string): Promise<BrowserSession> {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Session not found');
  if (!session.sopId) throw new Error('No SOP assigned to session');

  const sop = sops.get(session.sopId);
  if (!sop) throw new Error('SOP not found');

  session.status = 'starting';
  session.startedAt = new Date().toISOString();
  session.browserbaseSessionId = `bb_${uuid().slice(0, 8)}`;
  emit(session);

  // Store episodic memory of SOP execution start
  storeEpisodic(
    session.tenantId,
    `Browser session started: "${sop.name}" — ${sop.steps.length} steps to execute`,
    session.agentId,
    session.taskId ?? undefined
  );

  // Execute steps sequentially (simulated)
  session.status = 'running';
  emit(session);

  for (let i = 0; i < sop.steps.length; i++) {
    const step = sop.steps[i];
    session.currentStep = i;

    // Log step start
    const logEntry: StepLogEntry = {
      stepIndex: i,
      action: step.action,
      description: step.description,
      status: 'running',
      timestamp: new Date().toISOString(),
    };
    session.stepLog.push(logEntry);
    emit(session);

    // Simulate step execution
    const success = await simulateStep(session, step, i);

    // Update log entry
    logEntry.status = success ? 'success' : (step.optional ? 'skipped' : 'failed');
    logEntry.duration = 500 + Math.random() * 2000; // simulated duration
    emit(session);

    if (!success && !step.optional) {
      session.status = 'error';
      session.error = `Step ${i + 1} failed: ${step.description}`;
      emit(session);

      storeEpisodic(
        session.tenantId,
        `Browser SOP failed at step ${i + 1}: "${step.description}" — session ${session.id}`,
        session.agentId
      );
      return session;
    }
  }

  // Complete
  session.status = 'completed';
  session.completedAt = new Date().toISOString();
  emit(session);

  // Store success memory
  storeEpisodic(
    session.tenantId,
    `Browser SOP completed: "${sop.name}" — all ${sop.steps.length} steps successful`,
    session.agentId,
    session.taskId ?? undefined
  );

  return session;
}

async function simulateStep(session: BrowserSession, step: SOPStep, index: number): Promise<boolean> {
  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

  // Update URL for navigate actions
  if (step.action === 'navigate' && step.target) {
    session.currentUrl = step.target;
  }

  // Simulate screenshot capture
  if (step.action === 'screenshot' || index % 3 === 0) {
    const screenshot: Screenshot = {
      stepIndex: index,
      url: `/screenshots/${session.id}_step${index}.png`,
      timestamp: new Date().toISOString(),
      description: step.description,
    };
    session.screenshots.push(screenshot);
  }

  // 95% success rate simulation
  return Math.random() > 0.05;
}

// ============================================================
// Human Override — Co-Pilot Learning
// When human takes over: capture actions → offer to save as SOP steps
// ============================================================

export function captureOverrideStep(sessionId: string, step: Omit<SOPStep, 'id' | 'order'>): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  const logEntry: StepLogEntry = {
    stepIndex: session.stepLog.length,
    action: step.action,
    description: `[HUMAN] ${step.description}`,
    status: 'success',
    timestamp: new Date().toISOString(),
  };
  session.stepLog.push(logEntry);
  emit(session);
}

export function learnFromOverride(sessionId: string, tenantId: string): SOPDefinition | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const humanSteps = session.stepLog
    .filter(l => l.description.startsWith('[HUMAN]'))
    .map((l, i): SOPStep => ({
      id: uuid(),
      order: i,
      action: l.action as SOPStep['action'],
      description: l.description.replace('[HUMAN] ', ''),
    }));

  if (humanSteps.length === 0) return null;

  // Create new SOP from learned steps
  const sop = createSOP({
    tenantId,
    name: `Learned SOP from session ${sessionId.slice(0, 8)}`,
    description: 'Auto-generated from human override session',
    agentId: session.agentId,
    steps: humanSteps,
  });

  // Store procedural memory
  storeProcedural(
    tenantId,
    `New SOP learned from override: "${sop.name}" — ${humanSteps.length} steps captured`,
    session.agentId
  );

  return sop;
}

// ============================================================
// Seed Demo SOPs
// ============================================================

export function seedDemoSOPs(tenantId: string) {
  createSOP({
    tenantId,
    name: 'Empire Title — Weekly Report',
    description: 'Log into SoftPro, pull closing schedule, generate Monday briefing',
    agentId: 'sop-executor',
    steps: [
      { id: '', order: 0, action: 'navigate', target: 'https://softpro.example.com/login', description: 'Navigate to SoftPro login page' },
      { id: '', order: 1, action: 'type', target: '#username', value: '{{credentials.username}}', description: 'Enter username' },
      { id: '', order: 2, action: 'type', target: '#password', value: '{{credentials.password}}', description: 'Enter password' },
      { id: '', order: 3, action: 'click', target: '#login-btn', description: 'Click login button' },
      { id: '', order: 4, action: 'wait', target: '.dashboard', description: 'Wait for dashboard to load', timeout: 5000 },
      { id: '', order: 5, action: 'navigate', target: 'https://softpro.example.com/closings', description: 'Navigate to closing schedule' },
      { id: '', order: 6, action: 'screenshot', description: 'Capture closing schedule screenshot' },
      { id: '', order: 7, action: 'extract', target: '.closing-table', description: 'Extract closing data to CSV' },
      { id: '', order: 8, action: 'screenshot', description: 'Capture final state screenshot' },
    ],
  });

  createSOP({
    tenantId,
    name: 'GHL Contact Onboarding',
    description: 'Process new GoHighLevel contact through onboarding workflow',
    agentId: 'browser-agent',
    steps: [
      { id: '', order: 0, action: 'navigate', target: 'https://app.gohighlevel.com/contacts', description: 'Open GHL contacts page' },
      { id: '', order: 1, action: 'click', target: '.contact-latest', description: 'Open latest contact record' },
      { id: '', order: 2, action: 'extract', target: '.contact-details', description: 'Extract contact information' },
      { id: '', order: 3, action: 'click', target: '#add-to-workflow', description: 'Add to onboarding workflow' },
      { id: '', order: 4, action: 'select', target: '#workflow-select', value: 'New Client Onboarding', description: 'Select onboarding workflow' },
      { id: '', order: 5, action: 'click', target: '#confirm-btn', description: 'Confirm workflow assignment' },
      { id: '', order: 6, action: 'screenshot', description: 'Capture confirmation screenshot' },
    ],
  });
}
