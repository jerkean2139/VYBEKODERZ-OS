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

// ============================================================
// MEMORY ENGINE
// ============================================================

export interface ServerMemory {
  id: string;
  type: 'episodic' | 'semantic' | 'procedural' | 'relational' | 'predictive';
  content: string;
  confidence: number;
  connections: { memoryId: string; relationship: string; strength: number }[];
  createdAt: string;
}

export interface MemoryStats {
  totalMemories: number;
  confidenceAvg: number;
  connectionCount: number;
  predictiveTriggers: number;
  byType: Record<string, number>;
}

export interface IQScore {
  clientKnowledge: number;
  processMastery: number;
  relationalIntel: number;
  predictiveAccuracy: number;
  errorLearning: number;
  totalScore: number;
  level: string;
  delta: number;
}

export interface MemoryReport {
  reportDate: string;
  newMemories: { id: string; content: string; type: string }[];
  connectionsMade: { from: string; to: string; relationship: string }[];
  flaggedReview: { id: string; content: string; reason: string }[];
  stats: MemoryStats;
  iqScore: IQScore;
  summary: string;
}

export async function fetchMemories(type?: string): Promise<ServerMemory[]> {
  const params = type ? `?type=${type}` : '';
  const res = await fetch(`${API_BASE}/api/memory${params}`);
  if (!res.ok) throw new Error('Failed to fetch memories');
  return res.json();
}

export async function fetchMemoryStats(): Promise<MemoryStats> {
  const res = await fetch(`${API_BASE}/api/memory/stats`);
  if (!res.ok) throw new Error('Failed to fetch memory stats');
  return res.json();
}

export async function fetchIQScore(): Promise<IQScore> {
  const res = await fetch(`${API_BASE}/api/iq`);
  if (!res.ok) throw new Error('Failed to fetch IQ score');
  return res.json();
}

export async function fetchMemoryReport(): Promise<MemoryReport> {
  const res = await fetch(`${API_BASE}/api/memory/report`);
  if (!res.ok) throw new Error('Failed to fetch memory report');
  return res.json();
}

export async function storeMemory(type: string, content: string, metadata?: Record<string, unknown>): Promise<ServerMemory> {
  const res = await fetch(`${API_BASE}/api/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, content, metadata }),
  });
  if (!res.ok) throw new Error('Failed to store memory');
  return res.json();
}

// ============================================================
// AUTH
// ============================================================

export async function demoLogin(role?: string): Promise<{ token: string; user: Record<string, string> }> {
  const res = await fetch(`${API_BASE}/api/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error('Login failed');
  return res.json();
}

// ============================================================
// SSE
// ============================================================

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
