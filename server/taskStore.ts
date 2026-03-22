import { v4 as uuid } from 'uuid';
import type { Task, TaskEvent, RoutingDecision } from './types';
import { getDeptAgent } from './agents';

const tasks: Map<string, Task> = new Map();
const listeners: Set<(event: TaskEvent) => void> = new Set();

export function subscribe(listener: (event: TaskEvent) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(type: TaskEvent['type'], task: Task) {
  const event: TaskEvent = { type, task, timestamp: new Date().toISOString() };
  for (const listener of listeners) {
    listener(event);
  }
}

export function createTask(input: string): Task {
  const task: Task = {
    id: uuid(),
    input,
    title: '',
    description: '',
    department: null,
    assignedAgent: null,
    specialist: null,
    status: 'routing',
    progress: 0,
    progressLabel: 'Donna is routing...',
    routingTrace: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.set(task.id, task);
  emit('task_created', task);
  return task;
}

export function routeTaskToAgent(taskId: string, decision: RoutingDecision): Task | null {
  const task = tasks.get(taskId);
  if (!task) return null;

  const deptAgent = getDeptAgent(decision.department);
  const deptAgentId = deptAgent?.id ?? `${decision.department}-agent`;

  task.title = decision.title;
  task.description = decision.description;
  task.department = decision.department;
  task.assignedAgent = deptAgentId;
  task.specialist = decision.specialist;
  task.status = 'running';
  task.progress = 5;
  task.progressLabel = 'Assigned and starting...';
  task.updatedAt = new Date().toISOString();

  // Routing trace: Donna → Dept Agent
  task.routingTrace.push({
    from: 'donna',
    to: deptAgentId,
    timestamp: new Date().toISOString(),
    color: '#00D4FF', // cyan for Donna routing
  });

  // Routing trace: Dept Agent → Specialist
  task.routingTrace.push({
    from: deptAgentId,
    to: decision.specialist,
    timestamp: new Date().toISOString(),
    color: '#7B2FFF', // violet for dept routing
  });

  emit('task_routed', task);

  // Simulate progress over time
  simulateProgress(taskId);

  return task;
}

function simulateProgress(taskId: string) {
  const steps = [
    { progress: 15, label: 'Analyzing context...', delay: 2000 },
    { progress: 30, label: 'Gathering data...', delay: 4000 },
    { progress: 50, label: 'Processing...', delay: 6000 },
    { progress: 70, label: 'Generating output...', delay: 9000 },
    { progress: 90, label: 'Finalizing...', delay: 12000 },
    { progress: 100, label: 'Complete', delay: 15000 },
  ];

  for (const step of steps) {
    setTimeout(() => {
      const task = tasks.get(taskId);
      if (!task || task.status === 'error' || task.status === 'done') return;

      task.progress = step.progress;
      task.progressLabel = step.label;
      task.updatedAt = new Date().toISOString();

      if (step.progress === 100) {
        task.status = 'done';
        emit('task_completed', task);
      } else {
        emit('task_progress', task);
      }
    }, step.delay);
  }
}

export function getTask(id: string): Task | undefined {
  return tasks.get(id);
}

export function getAllTasks(): Task[] {
  return Array.from(tasks.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function updateTaskStatus(id: string, status: Task['status']): Task | null {
  const task = tasks.get(id);
  if (!task) return null;
  task.status = status;
  task.updatedAt = new Date().toISOString();
  emit(status === 'error' ? 'task_error' : 'task_progress', task);
  return task;
}
