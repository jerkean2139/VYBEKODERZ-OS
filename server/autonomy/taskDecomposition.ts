import { v4 as uuid } from 'uuid';
import { createTask, routeTaskToAgent } from '../taskStore';
import { routeTask } from '../donna';
import { storeContext } from '../memory/engine';
import { addNotification } from '../notifications/feed';
import { meteredClaudeCall } from './costMeter';
import { getKillSwitch } from './killSwitch';
import { getAgentInstincts } from './insightGraduation';
import type { Task } from '../types';

// ============================================================
// Task Decomposition — Donna splits complex tasks into subtasks
//
// When Donna detects a multi-step or multi-department request,
// she decomposes it into parallel subtasks, each routed to the
// appropriate specialist.
//
// Flow:
//   1. User submits complex task
//   2. Donna analyzes → determines if decomposition is needed
//   3. If yes: creates parent task + N child subtasks
//   4. Each subtask is independently routed to a specialist
//   5. Parent task tracks progress of all children
//   6. Parent completes when all children complete
//
// This enables parallel specialist execution — marketing + sales
// working simultaneously on different parts of a campaign launch.
// ============================================================

export interface DecompositionResult {
  isComplex: boolean;
  parentTaskId: string | null;
  subtasks: { taskId: string; department: string; specialist: string; title: string }[];
  reasoning: string;
}

// Track parent → children relationships
const parentChildMap: Map<string, string[]> = new Map();
const childParentMap: Map<string, string> = new Map();

// ============================================================
// Analyze a task and decompose if complex
// ============================================================

export async function decomposeTask(input: string, tenantId: string): Promise<DecompositionResult> {
  // First check: is decomposition needed?
  const analysis = await analyzeComplexity(input, tenantId);

  if (!analysis || !analysis.shouldDecompose) {
    return { isComplex: false, parentTaskId: null, subtasks: [], reasoning: analysis?.reasoning ?? 'Simple task' };
  }

  // Create parent task
  const parentTask = createTask(input);
  parentTask.title = analysis.parentTitle;
  parentTask.description = `Complex task decomposed into ${analysis.subtasks.length} parallel subtasks`;
  parentTask.status = 'running';
  parentTask.progress = 0;
  parentTask.progressLabel = `Coordinating ${analysis.subtasks.length} subtasks...`;

  const childIds: string[] = [];
  const subtaskResults: DecompositionResult['subtasks'] = [];

  // Create and route each subtask
  for (const sub of analysis.subtasks) {
    const childTask = createTask(sub.input);

    // Track relationship
    childIds.push(childTask.id);
    childParentMap.set(childTask.id, parentTask.id);

    // Route the subtask
    try {
      const decision = await routeTask(sub.input);
      routeTaskToAgent(childTask.id, decision);

      subtaskResults.push({
        taskId: childTask.id,
        department: decision.department,
        specialist: decision.specialist,
        title: decision.title,
      });
    } catch {
      // If routing fails, route with the suggested department
      const fallbackDecision = {
        department: sub.department as 'sales' | 'ops' | 'marketing' | 'dev',
        specialist: sub.specialist,
        title: sub.title,
        description: sub.input,
        reasoning: 'Fallback routing from decomposition',
        priority: 'medium' as const,
      };
      routeTaskToAgent(childTask.id, fallbackDecision);

      subtaskResults.push({
        taskId: childTask.id,
        department: sub.department,
        specialist: sub.specialist,
        title: sub.title,
      });
    }
  }

  parentChildMap.set(parentTask.id, childIds);

  // Store decomposition as memory
  storeContext(tenantId, `Task decomposed: "${parentTask.title}" → ${subtaskResults.map(s => `${s.department}/${s.specialist}: ${s.title}`).join('; ')}`, {
    agentId: 'donna',
    taskId: parentTask.id,
    sourceType: 'task',
    tags: ['decomposition', 'parallel-execution'],
    confidence: 0.9,
  });

  addNotification({
    tenantId,
    type: 'task_decomposed',
    title: 'Task Decomposed',
    message: `"${analysis.parentTitle}" split into ${subtaskResults.length} parallel subtasks`,
    agentId: 'donna',
    taskId: parentTask.id,
  });

  return {
    isComplex: true,
    parentTaskId: parentTask.id,
    subtasks: subtaskResults,
    reasoning: analysis.reasoning,
  };
}

// ============================================================
// Complexity analysis — determine if task needs decomposition
// ============================================================

interface ComplexityAnalysis {
  shouldDecompose: boolean;
  parentTitle: string;
  reasoning: string;
  subtasks: {
    input: string;
    department: string;
    specialist: string;
    title: string;
  }[];
}

async function analyzeComplexity(input: string, tenantId: string): Promise<ComplexityAnalysis | null> {
  if (getKillSwitch(tenantId).killed) return null;

  // Load Donna's instincts to augment her analysis
  const instincts = getAgentInstincts('donna');
  const instinctBlock = instincts.length > 0
    ? `\n\nYour learned instincts:\n${instincts.map(i => `- ${i}`).join('\n')}`
    : '';

  try {
    const result = await meteredClaudeCall({
      tenantId,
      jobType: 'task-decomposition',
      system: `You are Donna, Chief AI Agent. Analyze if this task requires multiple specialists from different departments working in parallel.

Decompose ONLY when:
- The task explicitly involves 2+ departments (e.g., "create a campaign AND build the landing page")
- The task has independent subtasks that can run simultaneously
- Each subtask maps to a different specialist

Do NOT decompose:
- Simple single-department tasks
- Tasks where steps are sequential (one depends on another)
- Tasks that are just detailed but belong to one specialist

Valid departments: sales, ops, marketing, dev
Valid specialists: outbound-specialist, deal-strategist, sop-executor, scheduler, browser-agent, content-creator, seo-specialist, social-manager, campaign-runner, ai-engineer, backend-architect, devops-automator

Return JSON:
{
  "shouldDecompose": true/false,
  "parentTitle": "overall task title",
  "reasoning": "why decompose or not",
  "subtasks": [{"input": "subtask description for the specialist", "department": "dept", "specialist": "id", "title": "short title"}]
}
Return subtasks as empty array if shouldDecompose is false.${instinctBlock}`,
      userMessage: `Analyze this task: "${input}"`,
      maxTokens: 512,
    });

    if (!result) return null;

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

// ============================================================
// Parent task progress tracking
// ============================================================

export function getParentTaskId(childTaskId: string): string | undefined {
  return childParentMap.get(childTaskId);
}

export function getChildTaskIds(parentTaskId: string): string[] {
  return parentChildMap.get(parentTaskId) ?? [];
}

export function isParentTask(taskId: string): boolean {
  return parentChildMap.has(taskId);
}

// Called by task event listener to update parent progress
export function updateParentProgress(childTaskId: string, childStatus: string, getAllTasks: () => Task[]) {
  const parentId = childParentMap.get(childTaskId);
  if (!parentId) return;

  const childIds = parentChildMap.get(parentId);
  if (!childIds) return;

  const allTasks = getAllTasks();
  const children = childIds.map(id => allTasks.find(t => t.id === id)).filter(Boolean) as Task[];

  const completed = children.filter(t => t.status === 'done').length;
  const failed = children.filter(t => t.status === 'error').length;
  const total = children.length;

  const parent = allTasks.find(t => t.id === parentId);
  if (!parent) return;

  parent.progress = Math.round(((completed + failed) / total) * 100);
  parent.progressLabel = `${completed}/${total} subtasks complete${failed > 0 ? ` (${failed} failed)` : ''}`;
  parent.updatedAt = new Date().toISOString();

  // All children done → parent done
  if (completed + failed === total) {
    parent.status = failed > 0 ? 'error' : 'done';
    parent.progress = 100;
    parent.progressLabel = failed > 0
      ? `Completed with ${failed} failure(s)`
      : 'All subtasks complete';
  }
}
