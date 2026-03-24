// ============================================================
// Billing Enforcement — Plan Limits
//
// Enforces task caps, agent limits, and usage metering per plan.
// Checked on every task creation and agent registration.
// ============================================================

export type PlanTier = 'starter' | 'pro' | 'enterprise';

export interface PlanLimits {
  maxTasksPerMonth: number;
  maxAgents: number;
  maxMemories: number;
  maxSOPs: number;
  maxTeamMembers: number;
  browserSessions: boolean;
  voiceEnabled: boolean;
  customDomain: boolean;
  maxStorageMB: number;
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  starter: {
    maxTasksPerMonth: 100,
    maxAgents: 5,
    maxMemories: 500,
    maxSOPs: 5,
    maxTeamMembers: 2,
    browserSessions: false,
    voiceEnabled: false,
    customDomain: false,
    maxStorageMB: 100,
  },
  pro: {
    maxTasksPerMonth: 1000,
    maxAgents: 10,
    maxMemories: 5000,
    maxSOPs: 50,
    maxTeamMembers: 10,
    browserSessions: true,
    voiceEnabled: true,
    customDomain: false,
    maxStorageMB: 1000,
  },
  enterprise: {
    maxTasksPerMonth: -1, // unlimited
    maxAgents: -1,
    maxMemories: -1,
    maxSOPs: -1,
    maxTeamMembers: -1,
    browserSessions: true,
    voiceEnabled: true,
    customDomain: true,
    maxStorageMB: 10000,
  },
};

export function getPlanLimits(plan: PlanTier): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;
}

// In-memory usage tracking per tenant per month
const usageStore: Map<string, { tasks: number; month: string }> = new Map();

function getMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getUsage(tenantId: string): { tasks: number; month: string } {
  const key = getMonthKey();
  const usage = usageStore.get(tenantId);
  if (!usage || usage.month !== key) {
    const fresh = { tasks: 0, month: key };
    usageStore.set(tenantId, fresh);
    return fresh;
  }
  return usage;
}

export function checkTaskLimit(tenantId: string, plan: PlanTier): { allowed: boolean; remaining: number; limit: number } {
  const limits = getPlanLimits(plan);
  if (limits.maxTasksPerMonth === -1) return { allowed: true, remaining: -1, limit: -1 };

  const usage = getUsage(tenantId);
  const remaining = limits.maxTasksPerMonth - usage.tasks;
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    limit: limits.maxTasksPerMonth,
  };
}

export function incrementTaskUsage(tenantId: string): void {
  const usage = getUsage(tenantId);
  usage.tasks++;
}

export function checkFeatureAccess(plan: PlanTier, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan);
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return true;
}

export function getUsageStats(tenantId: string, plan: PlanTier) {
  const limits = getPlanLimits(plan);
  const usage = getUsage(tenantId);
  return {
    plan,
    tasksUsed: usage.tasks,
    tasksLimit: limits.maxTasksPerMonth,
    tasksRemaining: limits.maxTasksPerMonth === -1 ? -1 : Math.max(0, limits.maxTasksPerMonth - usage.tasks),
    features: {
      browserSessions: limits.browserSessions,
      voiceEnabled: limits.voiceEnabled,
      customDomain: limits.customDomain,
    },
    limits,
  };
}
