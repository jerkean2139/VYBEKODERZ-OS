import { queryMemories, storeContext, type Memory } from '../memory/engine';
import { addNotification } from '../notifications/feed';
import { meteredClaudeCall } from './costMeter';
import { getKillSwitch } from './killSwitch';

// ============================================================
// Insight Graduation Pipeline
//
// Patterns confirmed 3+ times get promoted to "graduated insights"
// that permanently modify agent behavior:
//
//   Stage 1: PATTERN — auto-extracted, tagged 'auto-pattern'
//   Stage 2: CANDIDATE — confirmed 3+ times, tagged 'graduation-candidate'
//   Stage 3: GRADUATED — Claude distills into actionable rule, tagged 'graduated-insight'
//   Stage 4: INSTINCT — accumulated graduated insights are serialized
//             into agent prompt augmentations per specialist
//
// Graduated insights have 0.98 confidence and are never decayed.
// They form the agent's "muscle memory" — learned behaviors that
// persist across sessions.
// ============================================================

export interface GraduatedInsight {
  id: string;
  agentId: string;
  rule: string;          // The distilled behavioral rule
  sourcePatternIds: string[];
  confirmationCount: number;
  graduatedAt: string;
}

// Per-agent accumulated instincts (prompt augmentations)
const agentInstincts: Map<string, string[]> = new Map();

// ============================================================
// Evaluate a set of similar memories for graduation
// Called by event triggers when a pattern is detected
// ============================================================

export async function evaluateForGraduation(tenantId: string, similarMemories: Memory[]) {
  if (getKillSwitch(tenantId).killed) return;

  // Check for existing graduation candidates
  const candidates = queryMemories({
    tenantId,
    tags: ['graduation-candidate'],
    limit: 20,
  });

  for (const candidate of candidates) {
    const confirmations = (candidate.metadata.confirmations as number) ?? 0;
    if (confirmations < 3) continue;

    // Already graduated?
    if (candidate.tags.includes('graduated-insight')) continue;

    // Graduate this insight
    await graduateInsight(tenantId, candidate);
  }
}

// ============================================================
// Graduate a confirmed pattern into a permanent behavioral rule
// ============================================================

async function graduateInsight(tenantId: string, pattern: Memory) {
  try {
    // Find related memories that confirmed this pattern
    const related = queryMemories({
      tenantId,
      tags: pattern.tags.filter(t => t !== 'graduation-candidate' && t !== 'auto-pattern'),
      limit: 10,
    });

    const result = await meteredClaudeCall({
      tenantId,
      jobType: 'insight-graduation',
      system: `You are Donna, Chief AI Agent. A pattern has been confirmed multiple times by real task outcomes. Distill it into a single, permanent behavioral rule that an agent should follow from now on.

Rules must be:
- Specific and actionable (not vague)
- Written as a direct instruction ("Always...", "When X, do Y...", "Never...")
- Based on evidence, not speculation
- One sentence maximum

Return JSON: {"rule": "the behavioral rule", "agentId": "which specialist this applies to or 'all'"}`,
      userMessage: `Pattern (confirmed ${pattern.metadata.confirmations} times): ${pattern.content}\n\nSupporting evidence:\n${related.map(m => `- ${m.content}`).join('\n')}`,
      maxTokens: 256,
    });

    if (!result) return;

    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const { rule, agentId } = JSON.parse(jsonMatch[0]);
    if (!rule) return;

    // Mark pattern as graduated
    pattern.tags.push('graduated-insight');
    pattern.confidence = 0.98;
    pattern.metadata.graduatedAt = new Date().toISOString();
    pattern.metadata.graduatedRule = rule;
    pattern.metadata.targetAgent = agentId ?? 'all';

    // Store the graduated insight as a separate high-confidence memory
    const insight = storeContext(tenantId, `[GRADUATED INSIGHT] ${rule}`, {
      agentId: agentId !== 'all' ? agentId : undefined,
      sourceType: 'analysis',
      tags: ['graduated-insight', 'instinct', agentId ?? 'all'],
      confidence: 0.98,
    });
    insight.metadata.sourcePatternId = pattern.id;
    insight.metadata.confirmationCount = pattern.metadata.confirmations;

    // Add to agent's instinct bank
    const targetAgent = agentId ?? 'all';
    if (!agentInstincts.has(targetAgent)) {
      agentInstincts.set(targetAgent, []);
    }
    agentInstincts.get(targetAgent)!.push(rule);

    addNotification({
      tenantId,
      type: 'insight_graduated',
      title: 'New Instinct Learned',
      message: `Pattern confirmed ${pattern.metadata.confirmations}x → graduated to permanent rule for ${targetAgent}: "${rule.slice(0, 120)}"`,
      agentId: 'donna',
    });

    console.log(`[graduation] New instinct for ${targetAgent}: ${rule}`);
  } catch {
    // Graduation is best-effort
  }
}

// ============================================================
// Get instincts for an agent — used to augment agent prompts
// ============================================================

export function getAgentInstincts(agentId: string): string[] {
  const specific = agentInstincts.get(agentId) ?? [];
  const global = agentInstincts.get('all') ?? [];
  return [...global, ...specific];
}

// ============================================================
// Export all graduated insights for a tenant
// (for dashboard display and instinct serialization)
// ============================================================

export function getGraduatedInsights(tenantId: string): Memory[] {
  return queryMemories({
    tenantId,
    tags: ['graduated-insight'],
    limit: 100,
    minConfidence: 0.95,
  });
}

// ============================================================
// Batch graduation check — run by daily cron as well
// ============================================================

export async function runGraduationSweep(tenantId: string): Promise<number> {
  if (getKillSwitch(tenantId).killed) return 0;

  const candidates = queryMemories({
    tenantId,
    tags: ['graduation-candidate'],
    limit: 20,
  });

  let graduated = 0;
  for (const candidate of candidates) {
    if (candidate.tags.includes('graduated-insight')) continue;
    const confirmations = (candidate.metadata.confirmations as number) ?? 0;
    if (confirmations >= 3) {
      await graduateInsight(tenantId, candidate);
      graduated++;
    }
  }

  return graduated;
}
