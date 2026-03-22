import type PgBoss from 'pg-boss';
import { queryMemories, storeContext, storeSOP, getMemoryStats, type Memory } from '../memory/engine';
import { generateDailyReport } from '../memory/report';
import { calculateOperationalMetrics } from '../memory/iqScore';
import { getAllTasks } from '../taskStore';
import { getAllSOPs } from '../browser/sopExecutor';
import { agents } from '../agents';
import { addNotification } from '../notifications/feed';
import { meteredClaudeCall, checkBudget } from '../autonomy/costMeter';
import { shouldJobRun } from '../autonomy/killSwitch';
import { runGraduationSweep } from '../autonomy/insightGraduation';

// ============================================================
// Autonomy Jobs — scheduled tasks that make the system smarter
//
// These run on pg-boss cron schedules and perform:
//   1. Memory Consolidation  — deduplicate, extract patterns, boost confidence
//   2. Daily Intelligence Report — Donna's morning briefing per tenant
//   3. Weekly IQ Assessment — health score snapshot + trend analysis
//   4. SOP Optimization — learn from task outcomes to improve procedures
//   5. Specialist Spawning — detect when a department needs a new specialist
//
// All jobs check the kill switch and cost budget before running.
// All Claude API calls flow through the cost meter.
// ============================================================

// Demo tenant for initial deployment (production: iterate all tenants)
const DEMO_TENANT = 'vybekoderz-demo';

// ============================================================
// JOB TYPE CONSTANTS
// ============================================================

export const AUTONOMY_JOBS = {
  MEMORY_CONSOLIDATION: 'autonomy-memory-consolidation',
  DAILY_INTELLIGENCE_REPORT: 'autonomy-daily-report',
  WEEKLY_IQ_ASSESSMENT: 'autonomy-weekly-iq',
  SOP_OPTIMIZATION: 'autonomy-sop-optimization',
  SPECIALIST_DETECTION: 'autonomy-specialist-detection',
} as const;

// ============================================================
// 1. MEMORY CONSOLIDATION
//    Runs daily at 2:00 AM — essential job (runs when throttled)
//
//    - Confidence decay/boost (no API call)
//    - Duplicate detection via metered Claude call
//    - Pattern extraction via metered Claude call
//    - Graduation sweep at the end
// ============================================================

interface ConsolidationResult {
  duplicatesRemoved: number;
  patternsExtracted: number;
  confidenceAdjusted: number;
  insightsGraduated: number;
  totalProcessed: number;
}

async function consolidateMemories(tenantId: string): Promise<ConsolidationResult> {
  const result: ConsolidationResult = {
    duplicatesRemoved: 0,
    patternsExtracted: 0,
    confidenceAdjusted: 0,
    insightsGraduated: 0,
    totalProcessed: 0,
  };

  const allMemories = queryMemories({ tenantId, limit: 200 });
  result.totalProcessed = allMemories.length;

  if (allMemories.length < 3) return result;

  // ---- Step 1: Confidence decay / boost (no API call) ----
  const now = Date.now();
  for (const memory of allMemories) {
    // Never decay graduated insights
    if (memory.tags.includes('graduated-insight')) continue;

    const ageMs = now - new Date(memory.updatedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (memory.accessCount > 5 && memory.confidence < 0.95) {
      memory.confidence = Math.min(0.95, memory.confidence + 0.02);
      result.confidenceAdjusted++;
    }

    if (ageDays > 30 && memory.accessCount < 2 && memory.confidence > 0.3) {
      memory.confidence = Math.max(0.3, memory.confidence - 0.05);
      result.confidenceAdjusted++;
    }

    memory.updatedAt = new Date().toISOString();
  }

  // ---- Step 2: Duplicate detection via metered Claude call ----
  const contextMemories = allMemories.filter(m => m.type === 'context').slice(0, 50);

  if (contextMemories.length >= 5) {
    try {
      const response = await meteredClaudeCall({
        tenantId,
        jobType: 'memory-consolidation-dedup',
        system: `You analyze a list of memory items and find duplicates or near-duplicates that say the same thing.
Return a JSON array of duplicate groups: [{"keep": 0, "remove": [1, 3], "merged": "combined content"}]
Indices refer to the input list. Only flag clear duplicates. Maximum 10 groups.
Return [] if no duplicates found.`,
        userMessage: `Find duplicate memories:\n${contextMemories.map((m, i) => `[${i}] ${m.content}`).join('\n')}`,
      });

      if (response) {
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const groups = JSON.parse(jsonMatch[0]);
          for (const group of groups) {
            const keepMemory = contextMemories[group.keep];
            if (!keepMemory) continue;
            if (group.merged) {
              keepMemory.content = group.merged;
              keepMemory.confidence = Math.min(0.95, keepMemory.confidence + 0.05);
            }
            for (const removeIdx of group.remove ?? []) {
              const dup = contextMemories[removeIdx];
              if (dup) { dup.isActive = false; result.duplicatesRemoved++; }
            }
          }
        }
      }
    } catch { /* best-effort */ }
  }

  // ---- Step 3: Pattern extraction via metered Claude call ----
  const recentMemories = allMemories.slice(0, 30);
  if (recentMemories.length >= 5) {
    try {
      const response = await meteredClaudeCall({
        tenantId,
        jobType: 'memory-consolidation-patterns',
        system: `You are Donna, Chief AI Agent. Analyze these memories and extract high-level patterns, trends, or insights that aren't explicitly stated but emerge from the data.
Return a JSON array of pattern objects: [{"pattern": "description of the pattern", "confidence": 0.7, "tags": ["tag1"]}]
Maximum 5 patterns. Only include meaningful, actionable insights. Return [] if no patterns found.`,
        userMessage: `Extract patterns from recent memories:\n${recentMemories.map((m, i) => `[${i}] (${m.type}) ${m.content}`).join('\n')}`,
      });

      if (response) {
        const jsonMatch = response.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const patterns = JSON.parse(jsonMatch[0]);
          for (const p of patterns) {
            storeContext(tenantId, p.pattern, {
              sourceType: 'analysis',
              tags: [...(p.tags ?? []), 'auto-pattern', 'consolidation'],
              confidence: p.confidence ?? 0.7,
            });
            result.patternsExtracted++;
          }
        }
      }
    } catch { /* best-effort */ }
  }

  // ---- Step 4: Graduation sweep ----
  result.insightsGraduated = await runGraduationSweep(tenantId);

  return result;
}

// ============================================================
// 2. DAILY INTELLIGENCE REPORT
//    Runs daily at 6:00 AM — essential job
// ============================================================

async function runDailyReport(tenantId: string) {
  const report = await generateDailyReport(tenantId);

  storeContext(tenantId, `Daily Intelligence Report (${report.reportDate}): ${report.summary}`, {
    agentId: 'donna',
    sourceType: 'analysis',
    tags: ['daily-report', 'donna', 'intelligence'],
    confidence: 0.95,
  });

  addNotification({
    tenantId,
    type: 'daily_report',
    title: 'Daily Intelligence Report',
    message: report.summary,
    agentId: 'donna',
  });

  return report;
}

// ============================================================
// 3. WEEKLY IQ ASSESSMENT
//    Runs every Monday at 7:00 AM — essential job
// ============================================================

interface WeeklyAssessment {
  metrics: ReturnType<typeof calculateOperationalMetrics>;
  recommendations: string[];
  trend: 'improving' | 'stable' | 'declining';
  summary: string;
}

async function runWeeklyAssessment(tenantId: string): Promise<WeeklyAssessment> {
  const metrics = calculateOperationalMetrics(tenantId);

  let recommendations: string[] = [];
  let summary = '';

  try {
    const response = await meteredClaudeCall({
      tenantId,
      jobType: 'weekly-iq-assessment',
      system: `You are Donna, Chief AI Agent. Analyze these operational metrics and provide 3-5 specific, actionable recommendations to improve system performance. Also write a 1-sentence trend summary.
Return JSON: {"recommendations": ["rec1", "rec2"], "summary": "one sentence trend summary"}`,
      userMessage: `Weekly metrics snapshot:
- Health Score: ${metrics.healthScore}/100 (${metrics.healthLevel}) — delta: ${metrics.delta > 0 ? '+' : ''}${metrics.delta}
- Task Success Rate: ${metrics.taskSuccessRate}% (${metrics.tasksCompleted}/${metrics.tasksTotal})
- SOP Success Rate: ${metrics.sopSuccessRate}% (${metrics.sopExecutions} executions)
- Human Override Rate: ${metrics.overrideRate}%
- Avg Routing Time: ${metrics.avgRoutingTimeMs}ms
- Total Memories: ${metrics.totalMemories} (context: ${metrics.contextMemories}, SOPs: ${metrics.sopMemories})
- Avg Confidence: ${metrics.avgConfidence}%`,
      maxTokens: 512,
    });

    if (response) {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendations = parsed.recommendations ?? [];
        summary = parsed.summary ?? '';
      }
    }
  } catch {
    recommendations = ['Continue monitoring task success rates', 'Review low-confidence memories for accuracy'];
    summary = `Health score at ${metrics.healthScore} (${metrics.healthLevel}).`;
  }

  if (!summary) summary = `Health score at ${metrics.healthScore} (${metrics.healthLevel}).`;

  const trend: WeeklyAssessment['trend'] = metrics.delta > 2 ? 'improving'
    : metrics.delta < -2 ? 'declining'
    : 'stable';

  const assessment: WeeklyAssessment = { metrics, recommendations, trend, summary };

  storeContext(tenantId, `Weekly IQ Assessment: ${summary} Recommendations: ${recommendations.join('; ')}`, {
    agentId: 'donna',
    sourceType: 'analysis',
    tags: ['weekly-assessment', 'iq-score', 'donna'],
    confidence: 0.9,
  });

  addNotification({
    tenantId,
    type: 'weekly_assessment',
    title: `Weekly Assessment: ${metrics.healthLevel}`,
    message: summary,
    agentId: 'donna',
  });

  return assessment;
}

// ============================================================
// 4. SOP OPTIMIZATION
//    Runs daily at 3:00 AM — non-essential (skipped when throttled)
// ============================================================

interface SOPOptimizationResult {
  sopUpdates: number;
  newSOPs: number;
  flaggedForReview: number;
}

async function optimizeSOPs(tenantId: string): Promise<SOPOptimizationResult> {
  const result: SOPOptimizationResult = { sopUpdates: 0, newSOPs: 0, flaggedForReview: 0 };

  const tasks = getAllTasks();
  const completedTasks = tasks.filter(t => t.status === 'done');
  const sopMemories = queryMemories({ tenantId, type: 'sop', limit: 50 });

  // Flag SOP failures
  const sopExecMemories = queryMemories({ tenantId, tags: ['sop-execution'], limit: 50 });
  const failedSOPExecs = sopExecMemories.filter(m => m.content.includes('failed') || m.content.includes('error'));

  for (const failure of failedSOPExecs.slice(0, 5)) {
    storeContext(tenantId, `SOP flagged for review: ${failure.content}`, {
      agentId: 'donna',
      sourceType: 'analysis',
      tags: ['sop-review', 'auto-flagged'],
      confidence: 0.8,
    });
    result.flaggedForReview++;
  }

  // Detect repeated task patterns → suggest new SOPs
  if (completedTasks.length >= 5) {
    try {
      const recentCompleted = completedTasks.slice(0, 20);
      const existingSOPContent = sopMemories.map(m => m.content).join('\n---\n');

      const response = await meteredClaudeCall({
        tenantId,
        jobType: 'sop-optimization',
        system: `You are Donna, Chief AI Agent. Analyze completed tasks and existing SOPs.
Identify repeated task patterns that could become new SOPs — standardized procedures that would make the team more efficient.
Only suggest SOPs for patterns that appear 2+ times and aren't already covered.
Return JSON: {"newSOPs": [{"name": "SOP Name", "steps": "Step 1) ... Step 2) ...", "department": "ops"}], "updates": [{"existingSOP": "content snippet", "suggestion": "what to change"}]}
Return {"newSOPs": [], "updates": []} if nothing to suggest.`,
        userMessage: `Completed tasks:\n${recentCompleted.map(t => `- [${t.department}/${t.specialist}] ${t.title}: ${t.description}`).join('\n')}\n\nExisting SOPs:\n${existingSOPContent || '(none)'}`,
      });

      if (response) {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          for (const sop of suggestions.newSOPs ?? []) {
            storeSOP(tenantId, `${sop.name}: ${sop.steps}`, {
              tags: ['auto-generated', sop.department ?? 'ops'],
            });
            result.newSOPs++;
          }
          for (const update of suggestions.updates ?? []) {
            storeContext(tenantId, `SOP update suggestion: ${update.suggestion} (for: ${update.existingSOP?.slice(0, 80)})`, {
              agentId: 'donna',
              sourceType: 'analysis',
              tags: ['sop-update-suggestion', 'auto-generated'],
              confidence: 0.75,
            });
            result.sopUpdates++;
          }
        }
      }
    } catch { /* best-effort */ }
  }

  if (result.newSOPs > 0 || result.sopUpdates > 0 || result.flaggedForReview > 0) {
    addNotification({
      tenantId,
      type: 'sop_optimization',
      title: 'SOP Optimization Complete',
      message: `${result.newSOPs} new SOPs created, ${result.sopUpdates} update suggestions, ${result.flaggedForReview} flagged for review`,
      agentId: 'donna',
    });
  }

  return result;
}

// ============================================================
// 5. SPECIALIST SPAWNING DETECTION
//    Runs daily at 4:00 AM — non-essential (skipped when throttled)
// ============================================================

interface SpawnRecommendation {
  department: string;
  name: string;
  reason: string;
  taskPattern: string;
}

async function detectSpecialistNeeds(tenantId: string): Promise<SpawnRecommendation[]> {
  const tasks = getAllTasks();
  if (tasks.length < 10) return [];

  const specialistCounts: Record<string, number> = {};
  const deptCounts: Record<string, number> = {};

  for (const task of tasks) {
    if (task.specialist) specialistCounts[task.specialist] = (specialistCounts[task.specialist] || 0) + 1;
    if (task.department) deptCounts[task.department] = (deptCounts[task.department] || 0) + 1;
  }

  const overloaded: { specialist: string; department: string; ratio: number }[] = [];
  for (const [specialistId, count] of Object.entries(specialistCounts)) {
    const agent = agents.find(a => a.id === specialistId);
    if (!agent) continue;
    const deptTotal = deptCounts[agent.department] || 1;
    const ratio = count / deptTotal;
    if (ratio > 0.4 && count >= 5) {
      overloaded.push({ specialist: specialistId, department: agent.department, ratio });
    }
  }

  if (overloaded.length === 0) return [];

  try {
    const response = await meteredClaudeCall({
      tenantId,
      jobType: 'specialist-detection',
      system: `You are Donna, Chief AI Agent. Analyze overloaded specialist agents and suggest new specialists to spawn.
Each new specialist should handle a specific subset of the overloaded agent's work.
Return JSON array: [{"department": "ops", "name": "Report Generator", "reason": "why needed", "taskPattern": "what tasks it handles"}]
Maximum 3 recommendations. Return [] if spawning isn't warranted.`,
      userMessage: `Overloaded specialists:\n${overloaded.map(o => {
        const agent = agents.find(a => a.id === o.specialist);
        const relatedTasks = tasks.filter(t => t.specialist === o.specialist).slice(0, 10);
        return `- ${agent?.name ?? o.specialist} (${o.department}): ${Math.round(o.ratio * 100)}% of dept tasks\n  Recent tasks: ${relatedTasks.map(t => t.title).join(', ')}`;
      }).join('\n')}`,
      maxTokens: 512,
    });

    if (response) {
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations: SpawnRecommendation[] = JSON.parse(jsonMatch[0]);
        for (const rec of recommendations) {
          storeContext(tenantId, `Specialist spawn recommendation: "${rec.name}" for ${rec.department} department. Reason: ${rec.reason}. Task pattern: ${rec.taskPattern}`, {
            agentId: 'donna',
            sourceType: 'analysis',
            tags: ['specialist-spawn', 'auto-recommendation', rec.department],
            confidence: 0.8,
          });
        }
        if (recommendations.length > 0) {
          addNotification({
            tenantId,
            type: 'specialist_recommendation',
            title: 'New Specialist Recommended',
            message: `Donna recommends spawning ${recommendations.length} new specialist(s): ${recommendations.map(r => r.name).join(', ')}`,
            agentId: 'donna',
          });
        }
        return recommendations;
      }
    }
  } catch { /* best-effort */ }

  return [];
}

// ============================================================
// SCHEDULER — Register cron jobs with pg-boss
// Each job checks kill switch + budget before running.
// ============================================================

export async function registerAutonomyJobs(boss: PgBoss) {
  // Create queues before scheduling (pg-boss requires queues to exist first)
  for (const queueName of Object.values(AUTONOMY_JOBS)) {
    await boss.createQueue(queueName);
  }

  // Memory Consolidation: daily 2AM — ESSENTIAL (runs when throttled)
  await boss.schedule(AUTONOMY_JOBS.MEMORY_CONSOLIDATION, '0 2 * * *', { tenantId: DEMO_TENANT });
  await boss.work(AUTONOMY_JOBS.MEMORY_CONSOLIDATION, async (job) => {
    const { tenantId } = job.data as { tenantId: string };
    if (!shouldJobRun(tenantId, true)) { console.log('[autonomy] Memory consolidation: killed'); return; }
    console.log(`[autonomy] Memory consolidation starting for ${tenantId}`);
    const result = await consolidateMemories(tenantId);
    console.log(`[autonomy] Memory consolidation complete:`, result);
  });

  // SOP Optimization: daily 3AM — NON-ESSENTIAL (skipped when throttled)
  await boss.schedule(AUTONOMY_JOBS.SOP_OPTIMIZATION, '0 3 * * *', { tenantId: DEMO_TENANT });
  await boss.work(AUTONOMY_JOBS.SOP_OPTIMIZATION, async (job) => {
    const { tenantId } = job.data as { tenantId: string };
    if (!shouldJobRun(tenantId, false)) { console.log('[autonomy] SOP optimization: throttled/killed'); return; }
    console.log(`[autonomy] SOP optimization starting for ${tenantId}`);
    const result = await optimizeSOPs(tenantId);
    console.log(`[autonomy] SOP optimization complete:`, result);
  });

  // Specialist Detection: daily 4AM — NON-ESSENTIAL
  await boss.schedule(AUTONOMY_JOBS.SPECIALIST_DETECTION, '0 4 * * *', { tenantId: DEMO_TENANT });
  await boss.work(AUTONOMY_JOBS.SPECIALIST_DETECTION, async (job) => {
    const { tenantId } = job.data as { tenantId: string };
    if (!shouldJobRun(tenantId, false)) { console.log('[autonomy] Specialist detection: throttled/killed'); return; }
    console.log(`[autonomy] Specialist detection starting for ${tenantId}`);
    const recommendations = await detectSpecialistNeeds(tenantId);
    console.log(`[autonomy] Specialist detection complete: ${recommendations.length} recommendations`);
  });

  // Daily Report: daily 6AM — ESSENTIAL
  await boss.schedule(AUTONOMY_JOBS.DAILY_INTELLIGENCE_REPORT, '0 6 * * *', { tenantId: DEMO_TENANT });
  await boss.work(AUTONOMY_JOBS.DAILY_INTELLIGENCE_REPORT, async (job) => {
    const { tenantId } = job.data as { tenantId: string };
    if (!shouldJobRun(tenantId, true)) { console.log('[autonomy] Daily report: killed'); return; }
    console.log(`[autonomy] Daily intelligence report starting for ${tenantId}`);
    const report = await runDailyReport(tenantId);
    console.log(`[autonomy] Daily report complete: ${report.summary.slice(0, 100)}...`);
  });

  // Weekly IQ Assessment: Mondays 7AM — ESSENTIAL
  await boss.schedule(AUTONOMY_JOBS.WEEKLY_IQ_ASSESSMENT, '0 7 * * 1', { tenantId: DEMO_TENANT });
  await boss.work(AUTONOMY_JOBS.WEEKLY_IQ_ASSESSMENT, async (job) => {
    const { tenantId } = job.data as { tenantId: string };
    if (!shouldJobRun(tenantId, true)) { console.log('[autonomy] Weekly assessment: killed'); return; }
    console.log(`[autonomy] Weekly IQ assessment starting for ${tenantId}`);
    const assessment = await runWeeklyAssessment(tenantId);
    console.log(`[autonomy] Weekly assessment complete: ${assessment.trend} — ${assessment.summary}`);
  });

  console.log('  Autonomy: 5 scheduled jobs registered (consolidation, SOPs, specialists, report, IQ)');
}

// ============================================================
// MANUAL TRIGGERS — for API routes and testing
// ============================================================

export { consolidateMemories, runDailyReport, runWeeklyAssessment, optimizeSOPs, detectSpecialistNeeds };
