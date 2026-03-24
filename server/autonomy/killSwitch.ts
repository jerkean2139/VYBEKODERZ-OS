import { calculateOperationalMetrics } from '../memory/iqScore';
import { addNotification } from '../notifications/feed';

// ============================================================
// Kill Switch — auto-disable autonomy when health is critical
//
// Levels:
//   1. Throttle  — health < 50: reduce job frequency, skip non-essential
//   2. Kill      — health < 30: halt all autonomy jobs immediately
//   3. Manual    — admin explicitly kills/resumes via API
//
// Jobs check getKillSwitch() before running any Claude API call.
// The switch auto-resets when health recovers above threshold.
// ============================================================

interface KillSwitchState {
  killed: boolean;
  throttled: boolean;
  reason: string;
  triggeredAt: string | null;
  triggeredBy: 'auto' | 'manual' | null;
  healthScore: number;
  healthLevel: string;
}

const switchState: Map<string, KillSwitchState> = new Map();

const KILL_THRESHOLD = 30;
const THROTTLE_THRESHOLD = 50;
const RECOVERY_THRESHOLD = 55; // Hysteresis — must recover above throttle to un-throttle

function getOrCreateState(tenantId: string): KillSwitchState {
  let state = switchState.get(tenantId);
  if (!state) {
    state = {
      killed: false,
      throttled: false,
      reason: '',
      triggeredAt: null,
      triggeredBy: null,
      healthScore: 100,
      healthLevel: 'optimal',
    };
    switchState.set(tenantId, state);
  }
  return state;
}

// ============================================================
// Evaluate health and update kill switch state
// Called before each autonomy job runs
// ============================================================

export function evaluateKillSwitch(tenantId: string): KillSwitchState {
  const state = getOrCreateState(tenantId);
  const metrics = calculateOperationalMetrics(tenantId);

  state.healthScore = metrics.healthScore;
  state.healthLevel = metrics.healthLevel;

  // Don't override manual kill
  if (state.triggeredBy === 'manual') return state;

  const wasKilled = state.killed;
  const wasThrottled = state.throttled;

  if (metrics.healthScore < KILL_THRESHOLD) {
    state.killed = true;
    state.throttled = true;
    state.reason = `Health score critical (${metrics.healthScore}). All autonomy halted.`;
    state.triggeredAt = new Date().toISOString();
    state.triggeredBy = 'auto';

    if (!wasKilled) {
      console.log(`[kill-switch] KILLED: ${tenantId} — health ${metrics.healthScore}`);
      addNotification({
        tenantId,
        type: 'kill_switch_activated',
        title: 'Autonomy Halted',
        message: `Health score dropped to ${metrics.healthScore} (critical). All automated jobs paused until health recovers above ${RECOVERY_THRESHOLD}.`,
        agentId: 'donna',
      });
    }
  } else if (metrics.healthScore < THROTTLE_THRESHOLD) {
    state.killed = false;
    state.throttled = true;
    state.reason = `Health score degraded (${metrics.healthScore}). Non-essential jobs throttled.`;
    state.triggeredAt = state.triggeredAt ?? new Date().toISOString();
    state.triggeredBy = 'auto';

    if (!wasThrottled) {
      console.log(`[kill-switch] THROTTLED: ${tenantId} — health ${metrics.healthScore}`);
      addNotification({
        tenantId,
        type: 'kill_switch_throttled',
        title: 'Autonomy Throttled',
        message: `Health score at ${metrics.healthScore} (degraded). Non-essential autonomy jobs paused.`,
        agentId: 'donna',
      });
    }
  } else if (metrics.healthScore >= RECOVERY_THRESHOLD) {
    if (wasKilled || wasThrottled) {
      state.killed = false;
      state.throttled = false;
      state.reason = '';
      state.triggeredAt = null;
      state.triggeredBy = null;

      console.log(`[kill-switch] RECOVERED: ${tenantId} — health ${metrics.healthScore}`);
      addNotification({
        tenantId,
        type: 'kill_switch_recovered',
        title: 'Autonomy Resumed',
        message: `Health score recovered to ${metrics.healthScore}. All autonomy jobs active.`,
        agentId: 'donna',
      });
    }
  }

  return state;
}

// ============================================================
// Read current state (no evaluation, just check)
// ============================================================

export function getKillSwitch(tenantId: string): KillSwitchState {
  return getOrCreateState(tenantId);
}

// ============================================================
// Manual override — admin can force kill/resume
// ============================================================

export function manualKill(tenantId: string, reason: string): KillSwitchState {
  const state = getOrCreateState(tenantId);
  state.killed = true;
  state.throttled = true;
  state.reason = reason || 'Manually halted by admin';
  state.triggeredAt = new Date().toISOString();
  state.triggeredBy = 'manual';

  console.log(`[kill-switch] MANUAL KILL: ${tenantId} — ${reason}`);
  addNotification({
    tenantId,
    type: 'kill_switch_manual',
    title: 'Autonomy Manually Halted',
    message: reason || 'Admin has paused all automated jobs.',
    agentId: 'donna',
  });

  return state;
}

export function manualResume(tenantId: string): KillSwitchState {
  const state = getOrCreateState(tenantId);
  state.killed = false;
  state.throttled = false;
  state.reason = '';
  state.triggeredAt = null;
  state.triggeredBy = null;

  console.log(`[kill-switch] MANUAL RESUME: ${tenantId}`);
  addNotification({
    tenantId,
    type: 'kill_switch_resumed',
    title: 'Autonomy Manually Resumed',
    message: 'Admin has resumed all automated jobs.',
    agentId: 'donna',
  });

  return state;
}

// ============================================================
// Guard function for jobs — returns true if job should run
// essential=true means the job runs even when throttled
// ============================================================

export function shouldJobRun(tenantId: string, essential: boolean = false): boolean {
  const state = evaluateKillSwitch(tenantId);
  if (state.killed) return false;
  if (state.throttled && !essential) return false;
  return true;
}
