export type TaskStatus = 'running' | 'waiting' | 'error' | 'done';
export type AgentStatus = 'online' | 'waiting' | 'error' | 'offline';

export interface Task {
  id: string;
  agentName: string;
  agentColor: string;
  title: string;
  description: string;
  status: TaskStatus;
  progress: number;
  progressLabel: string;
  borderColor: string;
}

export interface DeptAgent {
  id: string;
  name: string;
  icon: string;
  status: AgentStatus;
  statusLabel: string;
  activeTasks: number;
  specialists: number;
}

export interface MemoryItem {
  text: string;
  type: 'new' | 'connection' | 'flagged';
}

export interface IQMetric {
  label: string;
  value: number;
  color?: string;
}

export const tasks: Task[] = [
  {
    id: '1',
    agentName: 'Sales Agent → Outbound Specialist',
    agentColor: '#7B2FFF',
    title: 'GHL Pipeline Follow-Up Sequence',
    description: 'Auto-drafting follow-up emails for 14 stalled leads in the Acme Corp pipeline. Checking last contact date and conversation history.',
    status: 'running',
    progress: 67,
    progressLabel: '9 of 14 leads processed',
    borderColor: '#00FF9C',
  },
  {
    id: '2',
    agentName: 'Dev Agent → AI Engineer',
    agentColor: '#FF6B35',
    title: 'ISOHUB Multi-Tenant RLS Audit',
    description: 'Scanning all database queries for missing tenant_id filters. Running Sentinel QA gate before next deploy.',
    status: 'running',
    progress: 42,
    progressLabel: '23 of 54 queries checked',
    borderColor: '#7B2FFF',
  },
  {
    id: '3',
    agentName: 'Ops Agent',
    agentColor: '#FFD93D',
    title: 'Empire Title — Weekly SOP Execution',
    description: 'Browser agent queued to log into SoftPro, pull closing schedule, and generate Monday briefing. Scheduled for 7:00 AM.',
    status: 'waiting',
    progress: 0,
    progressLabel: 'Scheduled: 7:00 AM tomorrow',
    borderColor: '#FFD93D',
  },
  {
    id: '4',
    agentName: 'Marketing Agent → Content Specialist',
    agentColor: '#FF3860',
    title: 'LinkedIn Post Sequence — Manumation Method',
    description: 'Auth session expired mid-publish. Patch agent flagged: LinkedIn cookie needs refresh via /setup-browser-cookies before retry.',
    status: 'error',
    progress: 30,
    progressLabel: 'Failed at step 3 of 10',
    borderColor: '#FF3860',
  },
];

export const deptAgents: DeptAgent[] = [
  { id: 'sales', name: 'Sales', icon: 'shopping-cart', status: 'online', statusLabel: 'Running', activeTasks: 3, specialists: 2 },
  { id: 'ops', name: 'Operations', icon: 'layout-grid', status: 'waiting', statusLabel: 'Waiting', activeTasks: 1, specialists: 3 },
  { id: 'marketing', name: 'Marketing', icon: 'globe', status: 'online', statusLabel: 'Running', activeTasks: 2, specialists: 4 },
  { id: 'dev', name: 'Dev', icon: 'code', status: 'online', statusLabel: 'Running', activeTasks: 4, specialists: 3 },
];

export const memories: MemoryItem[] = [
  { text: 'Client prefers Loom over written docs', type: 'new' },
  { text: 'New SOP: weekly Empire Title reporting', type: 'new' },
  { text: 'Browser step learned from override session', type: 'new' },
  { text: 'Invoice delays correlate with board meeting weeks', type: 'connection' },
  { text: 'Support requests spike on Mondays', type: 'connection' },
  { text: '2 memories low-confidence — verify', type: 'flagged' },
  { text: '1 SOP may be outdated — client process changed?', type: 'flagged' },
];

export const iqMetrics: IQMetric[] = [
  { label: 'Client Knowledge', value: 88 },
  { label: 'Process Mastery', value: 91 },
  { label: 'Relational Intel', value: 79, color: '#00D4FF' },
  { label: 'Predictive Accuracy', value: 74, color: '#FFD93D' },
  { label: 'Error Learning', value: 88 },
];

export const railAgents = [
  { id: 'donna', label: 'Donna', sublabel: 'Chief AI Agent', tasks: 7, status: 'cyan' as const, icon: 'donna' },
  { id: 'sales', label: 'Sales Agent', sublabel: '', tasks: 3, status: 'green' as const, icon: 'sales' },
  { id: 'ops', label: 'Ops Agent', sublabel: '', tasks: 1, status: 'amber' as const, icon: 'ops' },
  { id: 'marketing', label: 'Marketing Agent', sublabel: '', tasks: 2, status: 'green' as const, icon: 'marketing' },
  { id: 'dev', label: 'Dev Agent', sublabel: '', tasks: 4, status: 'green' as const, icon: 'dev' },
];
