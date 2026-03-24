import { pgTable, uuid, text, timestamp, integer, boolean, jsonb, pgPolicy, pgEnum, real, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',    // VybeKoderz — sees all tenants
  'agency_admin',   // Agency admin — manages team + clients
  'project_lead',   // Leads specific client projects
  'builder',        // Team member — does DFY work
  'client_viewer',  // Client — read-only portal access
]);

export const agentTierEnum = pgEnum('agent_tier', ['org', 'department', 'specialist']);
export const departmentEnum = pgEnum('department', ['sales', 'ops', 'marketing', 'dev']);
export const taskStatusEnum = pgEnum('task_status', ['routing', 'running', 'waiting', 'error', 'done']);
export const memoryTypeEnum = pgEnum('memory_type', ['episodic', 'semantic', 'procedural', 'relational', 'predictive']);
export const overrideLevelEnum = pgEnum('override_level', ['soft_nudge', 'session_takeover', 'hard_stop', 'rollback']);

// ============================================================
// TENANTS
// ============================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  customDomain: text('custom_domain'),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#00D4FF'),
  donnaName: text('donna_name').default('Donna'), // clients can rename their Donna
  plan: text('plan').default('starter'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// USERS
// ============================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').notNull().default('builder'),
  googleId: text('google_id'),
  microsoftId: text('microsoft_id'),
  passwordHash: text('password_hash'), // fallback if no SSO
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('users_tenant_idx').on(table.tenantId),
  index('users_email_idx').on(table.email),
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
]);

// ============================================================
// WORKSPACE INVITES
// ============================================================

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: text('email').notNull(),
  role: userRoleEnum('role').notNull().default('builder'),
  invitedBy: uuid('invited_by').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
]);

// ============================================================
// AGENTS (registered agent definitions per tenant)
// ============================================================

export const agentDefinitions = pgTable('agent_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  agentId: text('agent_id').notNull(), // 'donna', 'sales-agent', etc.
  name: text('name').notNull(),
  tier: agentTierEnum('tier').notNull(),
  department: departmentEnum('department'),
  color: text('color').notNull(),
  systemPrompt: text('system_prompt'),
  isActive: boolean('is_active').default(true),
  config: jsonb('config').default({}), // agent-specific configuration
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('agent_defs_tenant_idx').on(table.tenantId),
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
]);

// ============================================================
// TASKS
// ============================================================

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  input: text('input').notNull(),
  title: text('title'),
  description: text('description'),
  department: departmentEnum('department'),
  assignedAgent: text('assigned_agent'),
  specialist: text('specialist'),
  status: taskStatusEnum('status').notNull().default('routing'),
  progress: integer('progress').default(0),
  progressLabel: text('progress_label').default('Routing...'),
  priority: text('priority').default('medium'),
  routingTrace: jsonb('routing_trace').default([]),
  routingReasoning: text('routing_reasoning'),
  result: jsonb('result'), // final output/result of the task
  error: text('error'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => [
  index('tasks_tenant_idx').on(table.tenantId),
  index('tasks_status_idx').on(table.tenantId, table.status),
  index('tasks_agent_idx').on(table.tenantId, table.assignedAgent),
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
]);

// ============================================================
// MEMORY — 5 Layers
// ============================================================

export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  type: memoryTypeEnum('type').notNull(),
  agentId: text('agent_id'), // which agent stored this (null = global)
  scope: text('scope').default('tenant'), // 'global' | 'tenant' | 'agent'

  // Content
  content: text('content').notNull(),
  summary: text('summary'), // AI-generated summary
  embedding: jsonb('embedding'), // vector embedding for semantic search
  metadata: jsonb('metadata').default({}),

  // Source tracking
  sourceTaskId: uuid('source_task_id').references(() => tasks.id),
  sourceType: text('source_type'), // 'conversation', 'task', 'override', 'sop', 'observation'

  // Quality
  confidence: real('confidence').default(0.8),
  accessCount: integer('access_count').default(0),
  lastAccessedAt: timestamp('last_accessed_at'),

  // Connections (relational layer)
  connections: jsonb('connections').default([]), // [{memoryId, relationship, strength}]

  // Versioning (procedural layer — SOPs)
  version: integer('version').default(1),
  previousVersionId: uuid('previous_version_id'),

  // Lifecycle
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('memories_tenant_idx').on(table.tenantId),
  index('memories_type_idx').on(table.tenantId, table.type),
  index('memories_agent_idx').on(table.tenantId, table.agentId),
  index('memories_confidence_idx').on(table.tenantId, table.confidence),
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
]);

// ============================================================
// MEMORY IQ SCORES (weekly snapshots)
// ============================================================

export const iqScores = pgTable('iq_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  agentId: text('agent_id').default('donna'),

  // Scores (0-100)
  clientKnowledge: real('client_knowledge').notNull(),
  processMastery: real('process_mastery').notNull(),
  relationalIntel: real('relational_intel').notNull(),
  predictiveAccuracy: real('predictive_accuracy').notNull(),
  errorLearning: real('error_learning').notNull(),

  // Computed
  totalScore: real('total_score').notNull(), // weighted average
  level: text('level').notNull(), // 'apprentice' | 'practitioner' | 'expert' | 'master' | 'genius'
  delta: real('delta').default(0), // change from previous week

  testDate: timestamp('test_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('iq_scores_tenant_idx').on(table.tenantId),
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
]);

// ============================================================
// MEMORY INTELLIGENCE REPORTS (daily)
// ============================================================

export const memoryReports = pgTable('memory_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  reportDate: timestamp('report_date').notNull(),
  newMemories: jsonb('new_memories').default([]),       // [{id, content, type}]
  connectionsMade: jsonb('connections_made').default([]), // [{from, to, relationship}]
  flaggedReview: jsonb('flagged_review').default([]),     // [{id, reason}]

  // Health stats
  totalMemories: integer('total_memories').default(0),
  confidenceAvg: real('confidence_avg').default(0),
  connectionCount: integer('connection_count').default(0),
  predictiveTriggers: integer('predictive_triggers').default(0),

  generatedBy: text('generated_by').default('donna'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('memory_reports_tenant_idx').on(table.tenantId),
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
]);

// ============================================================
// HUMAN OVERRIDES (audit log)
// ============================================================

export const overrides = pgTable('overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  taskId: uuid('task_id').references(() => tasks.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),

  level: overrideLevelEnum('level').notNull(),
  reason: text('reason'),
  actions: jsonb('actions').default([]), // what the human did during takeover
  learnedSteps: jsonb('learned_steps').default([]), // SOP steps learned from override

  memoryCheckpointId: uuid('memory_checkpoint_id'), // for rollback
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('overrides_tenant_idx').on(table.tenantId),
  index('overrides_task_idx').on(table.taskId),
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
]);

// ============================================================
// BROWSER SESSIONS
// ============================================================

export const browserSessions = pgTable('browser_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  taskId: uuid('task_id').references(() => tasks.id),
  agentId: text('agent_id').notNull(),

  browserbaseSessionId: text('browserbase_session_id'),
  status: text('status').default('idle'), // 'idle' | 'running' | 'paused' | 'completed' | 'error'
  currentUrl: text('current_url'),
  screenshots: jsonb('screenshots').default([]),
  stepLog: jsonb('step_log').default([]),

  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('browser_sessions_tenant_idx').on(table.tenantId),
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    using: sql`tenant_id = current_setting('app.current_tenant_id')::uuid`,
  }),
]);
