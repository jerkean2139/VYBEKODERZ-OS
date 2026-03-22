export type Department = 'sales' | 'ops' | 'marketing' | 'dev';
export type TaskStatus = 'routing' | 'running' | 'waiting' | 'error' | 'done';
export type AgentTier = 'org' | 'department' | 'specialist';

export interface Agent {
  id: string;
  name: string;
  department: Department | 'org';
  tier: AgentTier;
  color: string;
  status: 'online' | 'busy' | 'offline';
  activeTasks: number;
  specialists?: string[];
}

export interface Task {
  id: string;
  input: string;
  title: string;
  description: string;
  department: Department | null;
  assignedAgent: string | null;
  specialist: string | null;
  status: TaskStatus;
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
  department: Department;
  specialist: string;
  title: string;
  description: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TaskCreateRequest {
  input: string;
}

export interface TaskEvent {
  type: 'task_created' | 'task_routed' | 'task_assigned' | 'task_progress' | 'task_completed' | 'task_error';
  task: Task;
  timestamp: string;
}
