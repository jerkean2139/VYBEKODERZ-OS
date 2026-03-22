const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ServerTask {
  id: string;
  input: string;
  title: string;
  description: string;
  department: string | null;
  assignedAgent: string | null;
  specialist: string | null;
  status: 'routing' | 'running' | 'waiting' | 'error' | 'done';
  progress: number;
  progressLabel: string;
  routingTrace: RoutingStep[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutingStep {
  from: string;
  to: string;
  timestamp: string;
  color: string;
}

export interface RoutingDecision {
  department: string;
  specialist: string;
  title: string;
  description: string;
  reasoning: string;
  priority: string;
}

export interface TaskEvent {
  type: 'connected' | 'task_created' | 'task_routed' | 'task_assigned' | 'task_progress' | 'task_completed' | 'task_error';
  task?: ServerTask;
  timestamp?: string;
}

export async function fetchTasks(): Promise<ServerTask[]> {
  const res = await fetch(`${API_BASE}/api/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(input: string): Promise<{ task: ServerTask; routing: RoutingDecision }> {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTaskStatus(id: string, status: string): Promise<ServerTask> {
  const res = await fetch(`${API_BASE}/api/tasks/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export function subscribeToEvents(onEvent: (event: TaskEvent) => void): () => void {
  const source = new EventSource(`${API_BASE}/api/events`);

  source.onmessage = (e) => {
    try {
      const event: TaskEvent = JSON.parse(e.data);
      onEvent(event);
    } catch {
      // ignore parse errors
    }
  };

  source.onerror = () => {
    // EventSource auto-reconnects
  };

  return () => source.close();
}
