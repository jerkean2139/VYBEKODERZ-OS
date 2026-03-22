import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { db, withTenant } from './connection';
import * as schema from './schema';

// ============================================================
// TENANT REPOSITORY
// ============================================================

export async function createTenant(params: {
  name: string;
  slug: string;
  plan?: string;
  primaryColor?: string;
  donnaName?: string;
}) {
  const [tenant] = await db.insert(schema.tenants).values(params).returning();
  return tenant;
}

export async function getTenantBySlug(slug: string) {
  return db.query.tenants.findFirst({ where: eq(schema.tenants.slug, slug) });
}

export async function getTenantById(id: string) {
  return db.query.tenants.findFirst({ where: eq(schema.tenants.id, id) });
}

export async function getAllTenants() {
  return db.select().from(schema.tenants).orderBy(desc(schema.tenants.createdAt));
}

export async function updateTenant(id: string, data: Partial<{
  name: string;
  customDomain: string;
  logoUrl: string;
  primaryColor: string;
  donnaName: string;
  plan: string;
  isActive: boolean;
}>) {
  const [updated] = await db.update(schema.tenants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.tenants.id, id))
    .returning();
  return updated;
}

// ============================================================
// USER REPOSITORY
// ============================================================

export async function createUser(params: {
  tenantId: string;
  email: string;
  name: string;
  role?: typeof schema.userRoleEnum.enumValues[number];
  googleId?: string;
  microsoftId?: string;
  avatarUrl?: string;
  passwordHash?: string;
}) {
  const [user] = await db.insert(schema.users).values({
    ...params,
    role: params.role ?? 'builder',
  }).returning();
  return user;
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(schema.users.email, email) });
}

export async function getUserById(id: string) {
  return db.query.users.findFirst({ where: eq(schema.users.id, id) });
}

export async function getUserByGoogleId(googleId: string) {
  return db.query.users.findFirst({ where: eq(schema.users.googleId, googleId) });
}

export async function getUserByMicrosoftId(microsoftId: string) {
  return db.query.users.findFirst({ where: eq(schema.users.microsoftId, microsoftId) });
}

export async function getUsersByTenant(tenantId: string) {
  return withTenant(tenantId, () =>
    db.select().from(schema.users).where(eq(schema.users.tenantId, tenantId))
      .orderBy(desc(schema.users.createdAt))
  );
}

export async function updateUserLogin(userId: string) {
  await db.update(schema.users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
}

// ============================================================
// INVITE REPOSITORY
// ============================================================

export async function createInvite(params: {
  tenantId: string;
  email: string;
  role: typeof schema.userRoleEnum.enumValues[number];
  invitedBy: string;
  token: string;
  expiresAt: Date;
}) {
  const [invite] = await db.insert(schema.invites).values(params).returning();
  return invite;
}

export async function getInviteByToken(token: string) {
  return db.query.invites.findFirst({
    where: and(
      eq(schema.invites.token, token),
      sql`${schema.invites.acceptedAt} IS NULL`,
      gte(schema.invites.expiresAt, new Date()),
    ),
  });
}

export async function acceptInvite(token: string) {
  const [updated] = await db.update(schema.invites)
    .set({ acceptedAt: new Date() })
    .where(eq(schema.invites.token, token))
    .returning();
  return updated;
}

export async function getInvitesByTenant(tenantId: string) {
  return withTenant(tenantId, () =>
    db.select().from(schema.invites)
      .where(eq(schema.invites.tenantId, tenantId))
      .orderBy(desc(schema.invites.createdAt))
  );
}

// ============================================================
// TASK REPOSITORY
// ============================================================

export async function dbCreateTask(params: {
  tenantId: string;
  input: string;
  createdBy?: string;
}) {
  const [task] = await db.insert(schema.tasks).values({
    tenantId: params.tenantId,
    input: params.input,
    status: 'routing',
    progress: 0,
    progressLabel: 'Donna is routing...',
    createdBy: params.createdBy,
  }).returning();
  return task;
}

export async function dbGetTask(id: string) {
  return db.query.tasks.findFirst({ where: eq(schema.tasks.id, id) });
}

export async function dbGetAllTasks(tenantId: string) {
  return withTenant(tenantId, () =>
    db.select().from(schema.tasks)
      .where(eq(schema.tasks.tenantId, tenantId))
      .orderBy(desc(schema.tasks.createdAt))
  );
}

export async function dbUpdateTask(id: string, data: Partial<{
  title: string;
  description: string;
  department: typeof schema.departmentEnum.enumValues[number];
  assignedAgent: string;
  specialist: string;
  status: typeof schema.taskStatusEnum.enumValues[number];
  progress: number;
  progressLabel: string;
  priority: string;
  routingTrace: unknown[];
  routingReasoning: string;
  result: unknown;
  error: string;
  completedAt: Date;
}>) {
  const [updated] = await db.update(schema.tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.tasks.id, id))
    .returning();
  return updated;
}

// ============================================================
// MEMORY REPOSITORY
// ============================================================

export async function dbStoreMemory(params: {
  tenantId: string;
  type: typeof schema.memoryTypeEnum.enumValues[number];
  content: string;
  agentId?: string;
  scope?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  sourceTaskId?: string;
  sourceType?: string;
  confidence?: number;
  connections?: unknown[];
  version?: number;
  previousVersionId?: string;
}) {
  const [memory] = await db.insert(schema.memories).values({
    tenantId: params.tenantId,
    type: params.type,
    content: params.content,
    agentId: params.agentId,
    scope: params.scope ?? (params.agentId ? 'agent' : 'tenant'),
    summary: params.summary,
    metadata: params.metadata ?? {},
    sourceTaskId: params.sourceTaskId,
    sourceType: params.sourceType,
    confidence: params.confidence ?? 0.8,
    connections: params.connections ?? [],
    version: params.version ?? 1,
    previousVersionId: params.previousVersionId,
  }).returning();
  return memory;
}

export async function dbGetMemories(params: {
  tenantId: string;
  type?: typeof schema.memoryTypeEnum.enumValues[number];
  agentId?: string;
  minConfidence?: number;
  limit?: number;
}) {
  return withTenant(params.tenantId, async () => {
    let query = db.select().from(schema.memories)
      .where(and(
        eq(schema.memories.tenantId, params.tenantId),
        eq(schema.memories.isActive, true),
        params.type ? eq(schema.memories.type, params.type) : undefined,
        params.minConfidence ? gte(schema.memories.confidence, params.minConfidence) : undefined,
      ))
      .orderBy(desc(schema.memories.confidence))
      .$dynamic();

    if (params.limit) {
      query = query.limit(params.limit);
    }

    return query;
  });
}

export async function dbGetMemoryStats(tenantId: string) {
  return withTenant(tenantId, async () => {
    const all = await db.select().from(schema.memories)
      .where(and(
        eq(schema.memories.tenantId, tenantId),
        eq(schema.memories.isActive, true),
      ));

    const byType: Record<string, number> = {};
    let totalConfidence = 0;
    let connectionCount = 0;
    let predictiveCount = 0;

    for (const m of all) {
      byType[m.type] = (byType[m.type] || 0) + 1;
      totalConfidence += m.confidence ?? 0;
      connectionCount += Array.isArray(m.connections) ? (m.connections as unknown[]).length : 0;
      if (m.type === 'predictive') predictiveCount++;
    }

    return {
      totalMemories: all.length,
      confidenceAvg: all.length > 0 ? Math.round((totalConfidence / all.length) * 100) : 0,
      connectionCount,
      predictiveTriggers: predictiveCount,
      byType,
    };
  });
}

// ============================================================
// IQ SCORE REPOSITORY
// ============================================================

export async function dbStoreIQScore(params: {
  tenantId: string;
  agentId?: string;
  clientKnowledge: number;
  processMastery: number;
  relationalIntel: number;
  predictiveAccuracy: number;
  errorLearning: number;
  totalScore: number;
  level: string;
  delta: number;
}) {
  const [score] = await db.insert(schema.iqScores).values({
    ...params,
    agentId: params.agentId ?? 'donna',
  }).returning();
  return score;
}

export async function dbGetLatestIQScore(tenantId: string) {
  return withTenant(tenantId, () =>
    db.query.iqScores.findFirst({
      where: eq(schema.iqScores.tenantId, tenantId),
      orderBy: desc(schema.iqScores.testDate),
    })
  );
}

// ============================================================
// BROWSER SESSION REPOSITORY
// ============================================================

export async function dbCreateBrowserSession(params: {
  tenantId: string;
  agentId: string;
  taskId?: string;
  browserbaseSessionId?: string;
}) {
  const [session] = await db.insert(schema.browserSessions).values(params).returning();
  return session;
}

export async function dbUpdateBrowserSession(id: string, data: Partial<{
  status: string;
  currentUrl: string;
  screenshots: unknown[];
  stepLog: unknown[];
  browserbaseSessionId: string;
  startedAt: Date;
  completedAt: Date;
}>) {
  const [updated] = await db.update(schema.browserSessions)
    .set(data)
    .where(eq(schema.browserSessions.id, id))
    .returning();
  return updated;
}

export async function dbGetBrowserSessions(tenantId: string) {
  return withTenant(tenantId, () =>
    db.select().from(schema.browserSessions)
      .where(eq(schema.browserSessions.tenantId, tenantId))
      .orderBy(desc(schema.browserSessions.createdAt))
  );
}

// ============================================================
// OVERRIDE REPOSITORY
// ============================================================

export async function dbCreateOverride(params: {
  tenantId: string;
  taskId: string;
  userId: string;
  level: typeof schema.overrideLevelEnum.enumValues[number];
  reason?: string;
  actions?: unknown[];
  learnedSteps?: unknown[];
}) {
  const [override] = await db.insert(schema.overrides).values(params).returning();
  return override;
}
