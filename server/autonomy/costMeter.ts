import Anthropic from '@anthropic-ai/sdk';

// ============================================================
// Cost Metering — tracks Claude API token usage per tenant/job
//
// Every autonomy job and agent call flows through this meter.
// Provides per-tenant, per-job cost tracking with daily budgets.
// ============================================================

const client = new Anthropic();

export interface APICallMetrics {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;  // approximate
  model: string;
  jobType: string;
  tenantId: string;
  timestamp: string;
}

interface TenantUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  callCount: number;
  byJob: Record<string, { inputTokens: number; outputTokens: number; costUsd: number; calls: number }>;
  dailyBudgetUsd: number;
  lastReset: string;
}

// Per-tenant usage tracking
const usageStore: Map<string, TenantUsage> = new Map();

// Approximate pricing (per 1M tokens) — updated for Claude Sonnet 4
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6-20250514': { input: 3.0, output: 15.0 },
  'default': { input: 3.0, output: 15.0 },
};

function getOrCreateUsage(tenantId: string): TenantUsage {
  let usage = usageStore.get(tenantId);
  if (!usage) {
    usage = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      callCount: 0,
      byJob: {},
      dailyBudgetUsd: 10.0, // default $10/day
      lastReset: new Date().toISOString().split('T')[0],
    };
    usageStore.set(tenantId, usage);
  }

  // Reset daily if new day
  const today = new Date().toISOString().split('T')[0];
  if (usage.lastReset !== today) {
    usage.totalInputTokens = 0;
    usage.totalOutputTokens = 0;
    usage.totalCostUsd = 0;
    usage.callCount = 0;
    usage.byJob = {};
    usage.lastReset = today;
  }

  return usage;
}

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING[model] ?? PRICING['default'];
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
}

// ============================================================
// Record an API call's token usage
// ============================================================

export function recordAPIUsage(params: {
  tenantId: string;
  jobType: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): APICallMetrics {
  const cost = estimateCost(params.model, params.inputTokens, params.outputTokens);
  const usage = getOrCreateUsage(params.tenantId);

  usage.totalInputTokens += params.inputTokens;
  usage.totalOutputTokens += params.outputTokens;
  usage.totalCostUsd += cost;
  usage.callCount++;

  // Track per-job
  if (!usage.byJob[params.jobType]) {
    usage.byJob[params.jobType] = { inputTokens: 0, outputTokens: 0, costUsd: 0, calls: 0 };
  }
  const job = usage.byJob[params.jobType];
  job.inputTokens += params.inputTokens;
  job.outputTokens += params.outputTokens;
  job.costUsd += cost;
  job.calls++;

  return {
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    estimatedCostUsd: cost,
    model: params.model,
    jobType: params.jobType,
    tenantId: params.tenantId,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================
// Budget check — returns false if tenant is over daily budget
// ============================================================

export function checkBudget(tenantId: string): { allowed: boolean; remaining: number; used: number; budget: number } {
  const usage = getOrCreateUsage(tenantId);
  return {
    allowed: usage.totalCostUsd < usage.dailyBudgetUsd,
    remaining: Math.max(0, usage.dailyBudgetUsd - usage.totalCostUsd),
    used: usage.totalCostUsd,
    budget: usage.dailyBudgetUsd,
  };
}

export function setDailyBudget(tenantId: string, budgetUsd: number) {
  const usage = getOrCreateUsage(tenantId);
  usage.dailyBudgetUsd = budgetUsd;
}

// ============================================================
// Get usage stats for API/dashboard
// ============================================================

export function getAPIUsageStats(tenantId: string) {
  const usage = getOrCreateUsage(tenantId);
  return {
    date: usage.lastReset,
    totalInputTokens: usage.totalInputTokens,
    totalOutputTokens: usage.totalOutputTokens,
    totalCostUsd: Math.round(usage.totalCostUsd * 10000) / 10000,
    callCount: usage.callCount,
    dailyBudgetUsd: usage.dailyBudgetUsd,
    remainingBudgetUsd: Math.round(Math.max(0, usage.dailyBudgetUsd - usage.totalCostUsd) * 10000) / 10000,
    byJob: Object.fromEntries(
      Object.entries(usage.byJob).map(([k, v]) => [k, {
        ...v,
        costUsd: Math.round(v.costUsd * 10000) / 10000,
      }])
    ),
  };
}

// ============================================================
// Metered Claude API call — wraps Anthropic SDK with tracking
// ============================================================

export async function meteredClaudeCall(params: {
  tenantId: string;
  jobType: string;
  model?: string;
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<{ text: string; metrics: APICallMetrics } | null> {
  const model = params.model ?? 'claude-sonnet-4-6-20250514';

  // Check budget before calling
  const budget = checkBudget(params.tenantId);
  if (!budget.allowed) {
    console.log(`[metering] Budget exceeded for ${params.tenantId}: $${budget.used.toFixed(4)}/$${budget.budget}`);
    return null;
  }

  const message = await client.messages.create({
    model,
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: [{ role: 'user', content: params.userMessage }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const metrics = recordAPIUsage({
    tenantId: params.tenantId,
    jobType: params.jobType,
    model,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  });

  return { text, metrics };
}
