// ============================================================
// Integration Hub — MCP Server Connectors
//
// All integrations connect via MCP (Model Context Protocol).
// This hub manages connection configs, health checks, and
// provides a unified interface for agents to use integrations.
// ============================================================

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';
export type IntegrationCategory = 'google' | 'microsoft' | 'crm' | 'pm' | 'automation' | 'communication';

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  icon: string;
  status: IntegrationStatus;
  description: string;
  mcpEndpoint: string;
  requiredScopes: string[];
  config: Record<string, unknown>;
  connectedAt: string | null;
  lastHealthCheck: string | null;
}

// ============================================================
// Integration Registry
// ============================================================

const integrations: Map<string, Integration> = new Map();

function register(integration: Omit<Integration, 'status' | 'connectedAt' | 'lastHealthCheck'> & { status?: IntegrationStatus }) {
  integrations.set(integration.id, {
    ...integration,
    status: integration.status ?? 'disconnected',
    connectedAt: null,
    lastHealthCheck: null,
  });
}

// Google Workspace
register({
  id: 'google-gmail',
  name: 'Gmail',
  category: 'google',
  icon: 'mail',
  description: 'Read/send emails, manage labels, search inbox',
  mcpEndpoint: 'mcp://google/gmail',
  requiredScopes: ['gmail.readonly', 'gmail.send'],
  config: {},
});

register({
  id: 'google-calendar',
  name: 'Google Calendar',
  category: 'google',
  icon: 'calendar',
  description: 'Read/create events, check availability, manage calendars',
  mcpEndpoint: 'mcp://google/calendar',
  requiredScopes: ['calendar.events', 'calendar.readonly'],
  config: {},
});

register({
  id: 'google-drive',
  name: 'Google Drive',
  category: 'google',
  icon: 'hard-drive',
  description: 'Read/create files, share documents, manage folders',
  mcpEndpoint: 'mcp://google/drive',
  requiredScopes: ['drive.readonly', 'drive.file'],
  config: {},
});

register({
  id: 'google-sheets',
  name: 'Google Sheets',
  category: 'google',
  icon: 'table',
  description: 'Read/write spreadsheets, manage data ranges',
  mcpEndpoint: 'mcp://google/sheets',
  requiredScopes: ['spreadsheets'],
  config: {},
});

register({
  id: 'google-meet',
  name: 'Google Meet',
  category: 'google',
  icon: 'video',
  description: 'Schedule meetings, get join links, manage recordings',
  mcpEndpoint: 'mcp://google/meet',
  requiredScopes: ['meetings.space.created'],
  config: {},
});

// Microsoft 365
register({
  id: 'microsoft-outlook',
  name: 'Outlook',
  category: 'microsoft',
  icon: 'mail',
  description: 'Email management, calendar, contacts',
  mcpEndpoint: 'mcp://microsoft/outlook',
  requiredScopes: ['Mail.ReadWrite', 'Calendars.ReadWrite'],
  config: {},
});

register({
  id: 'microsoft-teams',
  name: 'Teams',
  category: 'microsoft',
  icon: 'message-square',
  description: 'Send messages, manage channels, schedule meetings',
  mcpEndpoint: 'mcp://microsoft/teams',
  requiredScopes: ['Chat.ReadWrite', 'Channel.ReadBasic.All'],
  config: {},
});

register({
  id: 'microsoft-onedrive',
  name: 'OneDrive',
  category: 'microsoft',
  icon: 'cloud',
  description: 'File storage, sharing, collaboration',
  mcpEndpoint: 'mcp://microsoft/onedrive',
  requiredScopes: ['Files.ReadWrite'],
  config: {},
});

register({
  id: 'microsoft-sharepoint',
  name: 'SharePoint',
  category: 'microsoft',
  icon: 'folder-open',
  description: 'Document libraries, lists, site management',
  mcpEndpoint: 'mcp://microsoft/sharepoint',
  requiredScopes: ['Sites.ReadWrite.All'],
  config: {},
});

// CRM / Ops
register({
  id: 'gohighlevel',
  name: 'GoHighLevel',
  category: 'crm',
  icon: 'zap',
  description: 'CRM, pipeline management, automations, contacts',
  mcpEndpoint: 'mcp://ghl/api',
  requiredScopes: ['contacts', 'opportunities', 'workflows'],
  config: {},
  status: 'connected', // demo: GHL is connected
});

register({
  id: 'stripe',
  name: 'Stripe',
  category: 'crm',
  icon: 'credit-card',
  description: 'Payments, subscriptions, invoicing',
  mcpEndpoint: 'mcp://stripe/api',
  requiredScopes: ['charges', 'customers', 'invoices'],
  config: {},
});

register({
  id: 'hubspot',
  name: 'HubSpot',
  category: 'crm',
  icon: 'target',
  description: 'CRM, marketing automation, sales pipeline',
  mcpEndpoint: 'mcp://hubspot/api',
  requiredScopes: ['contacts', 'deals', 'marketing'],
  config: {},
});

// PM Tools
register({
  id: 'slack',
  name: 'Slack',
  category: 'communication',
  icon: 'hash',
  description: 'Messaging, channels, notifications, file sharing',
  mcpEndpoint: 'mcp://slack/api',
  requiredScopes: ['chat:write', 'channels:read', 'files:write'],
  config: {},
  status: 'connected', // demo: Slack is connected
});

register({
  id: 'asana',
  name: 'Asana',
  category: 'pm',
  icon: 'check-square',
  description: 'Task management, project tracking, workspaces',
  mcpEndpoint: 'mcp://asana/api',
  requiredScopes: ['tasks', 'projects', 'workspaces'],
  config: {},
});

register({
  id: 'notion',
  name: 'Notion',
  category: 'pm',
  icon: 'book-open',
  description: 'Wiki, databases, project management',
  mcpEndpoint: 'mcp://notion/api',
  requiredScopes: ['read_content', 'update_content', 'insert_content'],
  config: {},
});

register({
  id: 'clickup',
  name: 'ClickUp',
  category: 'pm',
  icon: 'list-checks',
  description: 'Tasks, docs, goals, time tracking',
  mcpEndpoint: 'mcp://clickup/api',
  requiredScopes: ['tasks', 'spaces', 'folders'],
  config: {},
});

// Automation
register({
  id: 'zapier',
  name: 'Zapier',
  category: 'automation',
  icon: 'repeat',
  description: 'Workflow automation, triggers, multi-app connections',
  mcpEndpoint: 'mcp://zapier/nla',
  requiredScopes: ['execute'],
  config: {},
});

register({
  id: 'make',
  name: 'Make',
  category: 'automation',
  icon: 'workflow',
  description: 'Advanced automation scenarios, data transformation',
  mcpEndpoint: 'mcp://make/api',
  requiredScopes: ['scenarios', 'connections'],
  config: {},
});

// ============================================================
// Hub API
// ============================================================

export function getAllIntegrations(): Integration[] {
  return Array.from(integrations.values());
}

export function getIntegration(id: string): Integration | undefined {
  return integrations.get(id);
}

export function getByCategory(category: IntegrationCategory): Integration[] {
  return Array.from(integrations.values()).filter(i => i.category === category);
}

export function getConnected(): Integration[] {
  return Array.from(integrations.values()).filter(i => i.status === 'connected');
}

export function connectIntegration(id: string, config: Record<string, unknown> = {}): Integration | null {
  const integration = integrations.get(id);
  if (!integration) return null;

  integration.status = 'connected';
  integration.connectedAt = new Date().toISOString();
  integration.config = { ...integration.config, ...config };
  integration.lastHealthCheck = new Date().toISOString();
  return integration;
}

export function disconnectIntegration(id: string): Integration | null {
  const integration = integrations.get(id);
  if (!integration) return null;

  integration.status = 'disconnected';
  integration.connectedAt = null;
  return integration;
}

export function healthCheck(id: string): { healthy: boolean; latency: number } {
  const integration = integrations.get(id);
  if (!integration) return { healthy: false, latency: -1 };

  // Simulated health check
  integration.lastHealthCheck = new Date().toISOString();
  const healthy = integration.status === 'connected';
  return { healthy, latency: healthy ? 50 + Math.random() * 200 : -1 };
}

export function getHubStats() {
  const all = Array.from(integrations.values());
  return {
    total: all.length,
    connected: all.filter(i => i.status === 'connected').length,
    disconnected: all.filter(i => i.status === 'disconnected').length,
    error: all.filter(i => i.status === 'error').length,
    byCategory: {
      google: all.filter(i => i.category === 'google').length,
      microsoft: all.filter(i => i.category === 'microsoft').length,
      crm: all.filter(i => i.category === 'crm').length,
      pm: all.filter(i => i.category === 'pm').length,
      automation: all.filter(i => i.category === 'automation').length,
      communication: all.filter(i => i.category === 'communication').length,
    },
  };
}
