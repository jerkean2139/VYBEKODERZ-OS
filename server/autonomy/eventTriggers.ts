import { storeContext, queryMemories, type Memory } from '../memory/engine';
import { subscribe, type TaskEvent } from '../taskStore';
import { addNotification } from '../notifications/feed';
import { meteredClaudeCall } from './costMeter';
import { getKillSwitch } from './killSwitch';
import { evaluateForGraduation } from './insightGraduation';

// ============================================================
// Event-Driven Autonomy Triggers
//
// Unlike cron jobs, these fire immediately when events happen:
//   - PostTaskComplete — extract learnings from finished tasks
//   - PostTaskError — analyze failures for pattern correction
//   - PostOverride — learn from human corrections in real-time
//   - PostMemoryStore — lightweight pattern matching on every new memory
//
// All triggers check the kill switch before running.
// All Claude calls go through the cost meter.
// ============================================================

type TriggerListener = () => void;
const cleanupFns: TriggerListener[] = [];

// ============================================================
// POST-TASK-COMPLETE TRIGGER
// When a task finishes successfully, extract what the system learned.
// ============================================================

async function onTaskCompleted(event: TaskEvent) {
  const { task } = event;
  const tenantId = 'vybekoderz-demo'; // Production: extract from task

  if (getKillSwitch(tenantId).killed) return;

  // Store task completion as context memory
  storeContext(tenantId, `Task completed: "${task.title}" — routed to ${task.department}/${task.specialist}. Input: ${task.input.slice(0, 200)}`, {
    agentId: task.specialist ?? task.assignedAgent ?? undefined,
    taskId: task.id,
    sourceType: 'task',
    tags: ['task-completed', task.department ?? 'unknown', task.specialist ?? 'unknown'],
    confidence: 0.9,
  });

  // Check if this task pattern has been seen before — if so, boost confidence
  const similar = queryMemories({
    tenantId,
    tags: ['task-completed', task.specialist ?? ''],
    limit: 10,
  });

  // If 3+ similar tasks completed by same specialist, consider for insight graduation
  if (similar.length >= 3) {
    await evaluateForGraduation(tenantId, similar);
  }
}

// ============================================================
// POST-TASK-ERROR TRIGGER
// When a task fails, analyze the failure to prevent repeats.
// ============================================================

async function onTaskError(event: TaskEvent) {
  const { task } = event;
  const tenantId = 'vybekoderz-demo';

  if (getKillSwitch(tenantId).killed) return;

  // Store failure as high-importance memory
  storeContext(tenantId, `Task FAILED: "${task.title}" — routed to ${task.department}/${task.specialist}. Input: ${task.input.slice(0, 200)}`, {
    agentId: task.specialist ?? task.assignedAgent ?? undefined,
    taskId: task.id,
    sourceType: 'task',
    tags: ['task-failed', task.department ?? 'unknown', 'error-pattern'],
    confidence: 0.95,
  });

  // Check for repeated failures in same specialist
  const failures = queryMemories({
    tenantId,
    tags: ['task-failed', task.specialist ?? ''],
    limit: 5,
  });

  if (failures.length >= 3) {
    // Alert: repeated failures from same specialist
    addNotification({
      tenantId,
      type: 'failure_pattern',
      title: 'Repeated Failure Detected',
      message: `${task.specialist} has failed ${failures.length} tasks. Donna recommends reviewing routing rules.`,
      agentId: 'donna',
      taskId: task.id,
    });

    // Try to analyze the pattern
    try {
      const result = await meteredClaudeCall({
        tenantId,
        jobType: 'event-failure-analysis',
        system: `You are Donna. Analyze these task failures from the same specialist and identify the root cause in 1-2 sentences. Be specific and actionable.`,
        userMessage: `Failed tasks from ${task.specialist}:\n${failures.map(f => `- ${f.content}`).join('\n')}`,
        maxTokens: 256,
      });

      if (result) {
        storeContext(tenantId, `Failure analysis for ${task.specialist}: ${result.text}`, {
          agentId: 'donna',
          sourceType: 'analysis',
          tags: ['failure-analysis', 'auto-insight', task.specialist ?? 'unknown'],
          confidence: 0.85,
        });
      }
    } catch {
      // Analysis is best-effort
    }
  }
}

// ============================================================
// POST-OVERRIDE TRIGGER
// When a human takes over, immediately learn from their actions.
// Don't wait for the daily SOP optimization cron.
// ============================================================

export async function onHumanOverride(params: {
  tenantId: string;
  taskId: string;
  agentId: string;
  overrideType: 'soft_nudge' | 'session_takeover' | 'hard_stop' | 'rollback';
  humanAction: string;
}) {
  if (getKillSwitch(params.tenantId).killed) return;

  // Store override as high-confidence memory
  storeContext(params.tenantId, `Human override (${params.overrideType}) on task ${params.taskId}: ${params.humanAction}`, {
    agentId: params.agentId,
    taskId: params.taskId,
    sourceType: 'override',
    tags: ['override', params.overrideType, 'human-correction'],
    confidence: 0.95,
  });

  // If session takeover, analyze what the human did differently
  if (params.overrideType === 'session_takeover' || params.overrideType === 'hard_stop') {
    try {
      const result = await meteredClaudeCall({
        tenantId: params.tenantId,
        jobType: 'event-override-learning',
        system: `You are Donna. A human just took over from an AI agent. Analyze the override and extract a lesson the agent should learn. Be specific: what should the agent do differently next time? Output a single actionable sentence.`,
        userMessage: `Agent: ${params.agentId}\nOverride type: ${params.overrideType}\nHuman action: ${params.humanAction}`,
        maxTokens: 128,
      });

      if (result) {
        storeContext(params.tenantId, `Agent lesson from human override: ${result.text}`, {
          agentId: params.agentId,
          sourceType: 'analysis',
          tags: ['agent-lesson', 'override-learning', 'auto-insight'],
          confidence: 0.9,
        });

        addNotification({
          tenantId: params.tenantId,
          type: 'override_learning',
          title: 'Override Learning Captured',
          message: result.text.slice(0, 200),
          agentId: 'donna',
          taskId: params.taskId,
        });
      }
    } catch {
      // Learning is best-effort
    }
  }
}

// ============================================================
// POST-MEMORY-STORE TRIGGER
// Lightweight pattern matching on every new memory.
// Checks if new evidence confirms or contradicts existing patterns.
// ============================================================

export function onMemoryStored(memory: Memory) {
  const tenantId = memory.tenantId;

  if (getKillSwitch(tenantId).killed) return;

  // Skip auto-generated memories to prevent infinite loops
  if (memory.tags.includes('auto-pattern') || memory.tags.includes('auto-insight')) return;

  // Check if this memory confirms an existing pattern
  const patterns = queryMemories({
    tenantId,
    tags: ['auto-pattern'],
    limit: 10,
  });

  for (const pattern of patterns) {
    // Simple keyword overlap check (cheap, no API call)
    const patternWords = new Set(pattern.content.toLowerCase().split(/\s+/));
    const memoryWords = memory.content.toLowerCase().split(/\s+/);
    const overlap = memoryWords.filter(w => patternWords.has(w) && w.length > 4).length;

    if (overlap >= 3) {
      // Confirmed! Boost pattern confidence
      pattern.confidence = Math.min(0.98, pattern.confidence + 0.03);
      pattern.accessCount++;
      pattern.updatedAt = new Date().toISOString();

      // Track confirmation count in metadata
      const confirmations = (pattern.metadata.confirmations as number ?? 0) + 1;
      pattern.metadata.confirmations = confirmations;

      // If confirmed 3+ times, tag for graduation
      if (confirmations >= 3 && !pattern.tags.includes('graduation-candidate')) {
        pattern.tags.push('graduation-candidate');
      }
    }
  }
}

// ============================================================
// REGISTRATION — subscribe to task events
// ============================================================

export function registerEventTriggers() {
  const unsub = subscribe((event: TaskEvent) => {
    switch (event.type) {
      case 'task_completed':
        onTaskCompleted(event).catch(err => console.error('[event-trigger] task_completed error:', err));
        break;
      case 'task_error':
        onTaskError(event).catch(err => console.error('[event-trigger] task_error error:', err));
        break;
    }
  });

  cleanupFns.push(unsub);
  console.log('  Event triggers: task_completed, task_error listeners registered');
}

export function cleanupEventTriggers() {
  for (const fn of cleanupFns) fn();
  cleanupFns.length = 0;
}
