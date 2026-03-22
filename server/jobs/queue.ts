import PgBoss from 'pg-boss';

// ============================================================
// Job Queue — pg-boss backed by PostgreSQL
//
// Replaces setTimeout-based task simulation.
// Tasks survive restarts, support retry, and work cross-instance.
// ============================================================

let boss: PgBoss | null = null;

export async function initJobQueue(): Promise<PgBoss | null> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('  Job queue: skipped (no DATABASE_URL)');
    return null;
  }

  boss = new PgBoss(dbUrl);

  boss.on('error', (err) => {
    console.error('pg-boss error:', err);
  });

  await boss.start();
  console.log('  Job queue: pg-boss started');
  return boss;
}

export function getQueue(): PgBoss | null {
  return boss;
}

export async function stopJobQueue() {
  if (boss) {
    await boss.stop();
    boss = null;
  }
}

// ============================================================
// Job Types
// ============================================================

export const JOB_TYPES = {
  ROUTE_TASK: 'route-task',
  EXECUTE_SOP: 'execute-sop',
  PROCESS_WEBHOOK: 'process-webhook',
  GENERATE_REPORT: 'generate-daily-report',
  SEND_NOTIFICATION: 'send-notification',
} as const;

export interface RouteTaskJob {
  taskId: string;
  input: string;
  tenantId: string;
}

export interface ExecuteSOPJob {
  sessionId: string;
  sopId: string;
  tenantId: string;
}

export interface ProcessWebhookJob {
  source: string;
  payload: unknown;
  tenantId: string;
}

export interface NotificationJob {
  tenantId: string;
  type: string;
  title: string;
  message: string;
  agentId?: string;
  taskId?: string;
}

// ============================================================
// Enqueue helpers
// ============================================================

export async function enqueueRouteTask(data: RouteTaskJob) {
  if (!boss) return null;
  return boss.send(JOB_TYPES.ROUTE_TASK, data, {
    retryLimit: 3,
    retryDelay: 5,
    retryBackoff: true,
    expireInMinutes: 5,
  });
}

export async function enqueueExecuteSOP(data: ExecuteSOPJob) {
  if (!boss) return null;
  return boss.send(JOB_TYPES.EXECUTE_SOP, data, {
    retryLimit: 2,
    retryDelay: 10,
    retryBackoff: true,
    expireInMinutes: 15,
  });
}

export async function enqueueWebhook(data: ProcessWebhookJob) {
  if (!boss) return null;
  return boss.send(JOB_TYPES.PROCESS_WEBHOOK, data, {
    retryLimit: 3,
    retryDelay: 5,
    retryBackoff: true,
  });
}

export async function enqueueNotification(data: NotificationJob) {
  if (!boss) return null;
  return boss.send(JOB_TYPES.SEND_NOTIFICATION, data, {
    retryLimit: 1,
    expireInMinutes: 1,
  });
}
