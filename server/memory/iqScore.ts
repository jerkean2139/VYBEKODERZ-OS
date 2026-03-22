import { getAllTasks } from '../taskStore';
import { queryMemories, getMemoryStats } from './engine';

// ============================================================
// Operational Metrics — replaces vanity IQ scoring
//
// Concrete, actionable numbers:
// - Tasks completed / failed / total
// - SOP success rate
// - Average routing time
// - Human override frequency
// - Memory utilization
// ============================================================

export interface OperationalMetrics {
  tasksCompleted: number;
  tasksFailed: number;
  tasksTotal: number;
  taskSuccessRate: number;       // 0-100
  avgRoutingTimeMs: number;
  sopExecutions: number;
  sopSuccessRate: number;        // 0-100
  humanOverrides: number;
  overrideRate: number;          // 0-100
  totalMemories: number;
  contextMemories: number;
  sopMemories: number;
  avgConfidence: number;         // 0-100
  healthScore: number;           // 0-100 weighted composite
  healthLevel: string;           // 'critical' | 'degraded' | 'healthy' | 'optimal'
  delta: number;
}

const scoreHistory: Map<string, number> = new Map();

export function calculateOperationalMetrics(tenantId: string): OperationalMetrics {
  const tasks = getAllTasks();

  const completed = tasks.filter(t => t.status === 'done').length;
  const failed = tasks.filter(t => t.status === 'error').length;
  const total = tasks.length;
  const taskSuccessRate = total > 0 ? Math.round((completed / total) * 100) : 100;

  // Avg routing time from trace timestamps
  let avgRoutingTimeMs = 0;
  const routedTasks = tasks.filter(t => t.routingTrace.length >= 2);
  if (routedTasks.length > 0) {
    const totalTime = routedTasks.reduce((sum, t) => {
      const first = new Date(t.routingTrace[0]?.timestamp ?? t.createdAt).getTime();
      const last = new Date(t.routingTrace[t.routingTrace.length - 1]?.timestamp ?? t.createdAt).getTime();
      return sum + (last - first);
    }, 0);
    avgRoutingTimeMs = Math.round(totalTime / routedTasks.length);
  }

  // Memory metrics
  const memStats = getMemoryStats(tenantId);
  const contextMemories = memStats.byType['context'] ?? 0;
  const sopMemories = memStats.byType['sop'] ?? 0;

  // SOP execution success
  const sopExecMems = queryMemories({ tenantId, tags: ['sop-execution'], limit: 100 });
  const sopSuccesses = sopExecMems.filter(m => m.content.includes('completed')).length;
  const sopTotal = sopExecMems.length;
  const sopSuccessRate = sopTotal > 0 ? Math.round((sopSuccesses / sopTotal) * 100) : 100;

  // Override rate
  const overrideMems = queryMemories({ tenantId, tags: ['override'], limit: 100 });
  const humanOverrides = overrideMems.length;
  const overrideRate = total > 0 ? Math.round((humanOverrides / Math.max(total, 1)) * 100) : 0;

  // Health score: weighted composite
  const healthScore = Math.round(
    taskSuccessRate * 0.35 +
    sopSuccessRate * 0.25 +
    (100 - Math.min(overrideRate * 5, 100)) * 0.15 +
    Math.min(memStats.confidenceAvg, 100) * 0.15 +
    Math.min(memStats.totalMemories * 2, 100) * 0.10
  );

  const healthLevel = healthScore >= 90 ? 'optimal'
    : healthScore >= 70 ? 'healthy'
    : healthScore >= 50 ? 'degraded'
    : 'critical';

  const prevScore = scoreHistory.get(tenantId) ?? healthScore;
  const delta = healthScore - prevScore;
  scoreHistory.set(tenantId, healthScore);

  return {
    tasksCompleted: completed, tasksFailed: failed, tasksTotal: total,
    taskSuccessRate, avgRoutingTimeMs,
    sopExecutions: sopTotal, sopSuccessRate,
    humanOverrides, overrideRate,
    totalMemories: memStats.totalMemories, contextMemories, sopMemories,
    avgConfidence: memStats.confidenceAvg,
    healthScore, healthLevel, delta,
  };
}

// Legacy alias — existing routes and frontend use calculateIQScore
export function calculateIQScore(tenantId: string) {
  const m = calculateOperationalMetrics(tenantId);
  return {
    clientKnowledge: m.taskSuccessRate,
    processMastery: m.sopSuccessRate,
    relationalIntel: m.avgConfidence,
    predictiveAccuracy: 100 - m.overrideRate,
    errorLearning: Math.min(m.totalMemories * 5, 100),
    totalScore: m.healthScore,
    level: m.healthLevel,
    delta: m.delta,
    metrics: m,
  };
}
