import type PgBoss from 'pg-boss';
import { JOB_TYPES, type RouteTaskJob, type ExecuteSOPJob, type ProcessWebhookJob, type NotificationJob } from './queue';
import { routeTask } from '../donna';
import { getTask, routeTaskToAgent, updateTaskStatus } from '../taskStore';
import { executeSOP, getSession } from '../browser/sopExecutor';
import { storeContext } from '../memory/engine';
import { addNotification } from '../notifications/feed';

// ============================================================
// Job Workers — process queued jobs with retry logic
// All handlers wrapped in try/catch to prevent server crashes
// ============================================================

export async function registerWorkers(boss: PgBoss) {
  // Create queues before registering workers
  for (const queueName of Object.values(JOB_TYPES)) {
    await boss.createQueue(queueName);
  }

  // ---- Route Task ----
  await boss.work<RouteTaskJob>(JOB_TYPES.ROUTE_TASK, { teamSize: 5 }, async (job) => {
    try {
      const { taskId, input, tenantId } = job.data;
      const task = getTask(taskId);
      if (!task) { console.error(`[worker] Task ${taskId} not found`); return; }

      try {
        const decision = await routeTask(input);
        routeTaskToAgent(taskId, decision);

        addNotification({
          tenantId,
          type: 'task_routed',
          title: 'Task Routed',
          message: `"${decision.title}" → ${decision.department} → ${decision.specialist}`,
          agentId: 'donna',
          taskId,
        });
      } catch (error) {
        updateTaskStatus(taskId, 'error');
        addNotification({
          tenantId,
          type: 'task_error',
          title: 'Task Routing Failed',
          message: `Failed to route: "${input.slice(0, 60)}..."`,
          agentId: 'donna',
          taskId,
        });
        console.error('[worker] Route task failed:', (error as Error).message);
      }
    } catch (err) {
      console.error('[worker] Route task outer error:', (err as Error).message);
    }
  });

  // ---- Execute SOP ----
  await boss.work<ExecuteSOPJob>(JOB_TYPES.EXECUTE_SOP, { teamSize: 2 }, async (job) => {
    try {
      const { sessionId, tenantId } = job.data;
      const session = await executeSOP(sessionId);

      addNotification({
        tenantId,
        type: session.status === 'completed' ? 'sop_completed' : 'sop_failed',
        title: session.status === 'completed' ? 'SOP Completed' : 'SOP Failed',
        message: session.error ?? `Browser session ${sessionId.slice(0, 8)} finished`,
        taskId: session.taskId ?? undefined,
      });
    } catch (err) {
      console.error('[worker] Execute SOP failed:', (err as Error).message);
    }
  });

  // ---- Process Webhook ----
  await boss.work<ProcessWebhookJob>(JOB_TYPES.PROCESS_WEBHOOK, { teamSize: 5 }, async (job) => {
    try {
      const { source, payload, tenantId } = job.data;

      storeContext(tenantId, `Webhook received from ${source}: ${JSON.stringify(payload).slice(0, 200)}`, {
        sourceType: 'webhook',
        tags: ['webhook', source],
      });

      addNotification({
        tenantId,
        type: 'webhook_received',
        title: 'Webhook Received',
        message: `Event from ${source}`,
      });
    } catch (err) {
      console.error('[worker] Process webhook failed:', (err as Error).message);
    }
  });

  // ---- Send Notification ----
  await boss.work<NotificationJob>(JOB_TYPES.SEND_NOTIFICATION, { teamSize: 10 }, async (job) => {
    try {
      addNotification(job.data);
    } catch (err) {
      console.error('[worker] Send notification failed:', (err as Error).message);
    }
  });

  console.log('  Workers: all job handlers registered');
}
