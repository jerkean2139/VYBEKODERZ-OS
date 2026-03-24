import type { Agent } from './types';

export const agents: Agent[] = [
  // Org Level
  {
    id: 'donna',
    name: 'Donna',
    department: 'org',
    tier: 'org',
    color: '#00D4FF',
    status: 'online',
    activeTasks: 0,
  },

  // Department Agents
  {
    id: 'sales-agent',
    name: 'Sales Agent',
    department: 'sales',
    tier: 'department',
    color: '#7B2FFF',
    status: 'online',
    activeTasks: 0,
    specialists: ['outbound-specialist', 'deal-strategist'],
  },
  {
    id: 'ops-agent',
    name: 'Ops Agent',
    department: 'ops',
    tier: 'department',
    color: '#7B2FFF',
    status: 'online',
    activeTasks: 0,
    specialists: ['sop-executor', 'scheduler', 'browser-agent'],
  },
  {
    id: 'marketing-agent',
    name: 'Marketing Agent',
    department: 'marketing',
    tier: 'department',
    color: '#7B2FFF',
    status: 'online',
    activeTasks: 0,
    specialists: ['content-creator', 'seo-specialist', 'social-manager', 'campaign-runner'],
  },
  {
    id: 'dev-agent',
    name: 'Dev Agent',
    department: 'dev',
    tier: 'department',
    color: '#7B2FFF',
    status: 'online',
    activeTasks: 0,
    specialists: ['ai-engineer', 'backend-architect', 'devops-automator'],
  },

  // Specialists — Sales
  {
    id: 'outbound-specialist',
    name: 'Outbound Specialist',
    department: 'sales',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },
  {
    id: 'deal-strategist',
    name: 'Deal Strategist',
    department: 'sales',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },

  // Specialists — Ops
  {
    id: 'sop-executor',
    name: 'SOP Executor',
    department: 'ops',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },
  {
    id: 'scheduler',
    name: 'Scheduler',
    department: 'ops',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },
  {
    id: 'browser-agent',
    name: 'Browser Agent',
    department: 'ops',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },

  // Specialists — Marketing
  {
    id: 'content-creator',
    name: 'Content Creator',
    department: 'marketing',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },
  {
    id: 'seo-specialist',
    name: 'SEO Specialist',
    department: 'marketing',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },
  {
    id: 'social-manager',
    name: 'Social Manager',
    department: 'marketing',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },
  {
    id: 'campaign-runner',
    name: 'Campaign Runner',
    department: 'marketing',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },

  // Specialists — Dev
  {
    id: 'ai-engineer',
    name: 'AI Engineer',
    department: 'dev',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },
  {
    id: 'backend-architect',
    name: 'Backend Architect',
    department: 'dev',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },
  {
    id: 'devops-automator',
    name: 'DevOps Automator',
    department: 'dev',
    tier: 'specialist',
    color: '#FF6B35',
    status: 'online',
    activeTasks: 0,
  },
];

export function getAgent(id: string): Agent | undefined {
  return agents.find(a => a.id === id);
}

export function getDeptAgent(department: string): Agent | undefined {
  return agents.find(a => a.department === department && a.tier === 'department');
}

export function getSpecialists(department: string): Agent[] {
  return agents.filter(a => a.department === department && a.tier === 'specialist');
}
