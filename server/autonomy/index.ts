// ============================================================
// Autonomy Engine — barrel export
//
// The brain that makes the system smarter and more autonomous:
//   - Event Triggers: react immediately to task/override/memory events
//   - Insight Graduation: promote confirmed patterns to permanent agent behavior
//   - Task Decomposition: split complex tasks across parallel specialists
//   - Cost Metering: track Claude API spend per tenant/job with daily budgets
//   - Kill Switch: auto-halt autonomy when health degrades
// ============================================================

export { registerEventTriggers, cleanupEventTriggers, onHumanOverride, onMemoryStored } from './eventTriggers';
export { evaluateForGraduation, getAgentInstincts, getGraduatedInsights, runGraduationSweep } from './insightGraduation';
export { decomposeTask, getParentTaskId, getChildTaskIds, isParentTask, updateParentProgress } from './taskDecomposition';
export { meteredClaudeCall, recordAPIUsage, checkBudget, setDailyBudget, getAPIUsageStats } from './costMeter';
export { getKillSwitch, evaluateKillSwitch, manualKill, manualResume, shouldJobRun } from './killSwitch';
