export interface SOPStep {
  id: string;
  order: number;
  action: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot' | 'extract' | 'scroll' | 'select' | 'assert';
  target?: string;       // CSS selector or URL
  value?: string;        // text to type or value to select
  description: string;   // human-readable step description
  timeout?: number;      // ms
  optional?: boolean;    // if true, failure doesn't stop SOP
}

export interface SOPDefinition {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  agentId: string;
  steps: SOPStep[];
  schedule?: CronSchedule;
  triggers?: SOPTrigger[];
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CronSchedule {
  expression: string;  // e.g. "0 7 * * 1" (Monday 7am)
  timezone: string;    // e.g. "America/New_York"
  enabled: boolean;
}

export interface SOPTrigger {
  type: 'event' | 'webhook' | 'schedule';
  source: string;      // e.g. "ghl:new_contact", "webhook:incoming"
  condition?: string;
}

export type BrowserSessionStatus = 'idle' | 'starting' | 'running' | 'paused' | 'completed' | 'error';

export interface BrowserSession {
  id: string;
  tenantId: string;
  taskId: string | null;
  agentId: string;
  sopId: string | null;
  status: BrowserSessionStatus;
  currentUrl: string | null;
  currentStep: number;
  totalSteps: number;
  screenshots: Screenshot[];
  stepLog: StepLogEntry[];
  error: string | null;
  browserbaseSessionId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface Screenshot {
  stepIndex: number;
  url: string;
  timestamp: string;
  description: string;
}

export interface StepLogEntry {
  stepIndex: number;
  action: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  timestamp: string;
}
