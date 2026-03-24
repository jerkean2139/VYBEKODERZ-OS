import { motion } from 'framer-motion';
import {
  Mail, Calendar, HardDrive, Table, Video,
  MessageSquare, Cloud, FolderOpen, Zap, CreditCard,
  Target, Hash, CheckSquare, BookOpen, ListChecks, Repeat, Workflow,
  Check, X,
} from 'lucide-react';

interface IntegrationItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  categoryLabel: string;
  connected: boolean;
  description: string;
}

const integrations: IntegrationItem[] = [
  { id: 'google-gmail', name: 'Gmail', icon: 'mail', category: 'google', categoryLabel: 'Google', connected: false, description: 'Read/send emails, manage labels' },
  { id: 'google-calendar', name: 'Calendar', icon: 'calendar', category: 'google', categoryLabel: 'Google', connected: false, description: 'Events, availability, scheduling' },
  { id: 'google-drive', name: 'Drive', icon: 'hard-drive', category: 'google', categoryLabel: 'Google', connected: false, description: 'Files, sharing, folders' },
  { id: 'google-sheets', name: 'Sheets', icon: 'table', category: 'google', categoryLabel: 'Google', connected: false, description: 'Spreadsheets, data ranges' },
  { id: 'google-meet', name: 'Meet', icon: 'video', category: 'google', categoryLabel: 'Google', connected: false, description: 'Meetings, recordings' },
  { id: 'microsoft-outlook', name: 'Outlook', icon: 'mail', category: 'microsoft', categoryLabel: 'Microsoft', connected: false, description: 'Email, calendar, contacts' },
  { id: 'microsoft-teams', name: 'Teams', icon: 'message-square', category: 'microsoft', categoryLabel: 'Microsoft', connected: false, description: 'Messages, channels' },
  { id: 'microsoft-onedrive', name: 'OneDrive', icon: 'cloud', category: 'microsoft', categoryLabel: 'Microsoft', connected: false, description: 'File storage, collaboration' },
  { id: 'microsoft-sharepoint', name: 'SharePoint', icon: 'folder-open', category: 'microsoft', categoryLabel: 'Microsoft', connected: false, description: 'Doc libraries, lists' },
  { id: 'gohighlevel', name: 'GoHighLevel', icon: 'zap', category: 'crm', categoryLabel: 'CRM', connected: true, description: 'CRM, pipelines, automations' },
  { id: 'stripe', name: 'Stripe', icon: 'credit-card', category: 'crm', categoryLabel: 'CRM', connected: false, description: 'Payments, subscriptions' },
  { id: 'hubspot', name: 'HubSpot', icon: 'target', category: 'crm', categoryLabel: 'CRM', connected: false, description: 'CRM, marketing, sales' },
  { id: 'slack', name: 'Slack', icon: 'hash', category: 'communication', categoryLabel: 'Communication', connected: true, description: 'Messaging, channels, files' },
  { id: 'asana', name: 'Asana', icon: 'check-square', category: 'pm', categoryLabel: 'PM Tools', connected: false, description: 'Tasks, projects' },
  { id: 'notion', name: 'Notion', icon: 'book-open', category: 'pm', categoryLabel: 'PM Tools', connected: false, description: 'Wiki, databases' },
  { id: 'clickup', name: 'ClickUp', icon: 'list-checks', category: 'pm', categoryLabel: 'PM Tools', connected: false, description: 'Tasks, docs, goals' },
  { id: 'zapier', name: 'Zapier', icon: 'repeat', category: 'automation', categoryLabel: 'Automation', connected: false, description: 'Workflow automation' },
  { id: 'make', name: 'Make', icon: 'workflow', category: 'automation', categoryLabel: 'Automation', connected: false, description: 'Advanced scenarios' },
];

const iconMap: Record<string, React.ReactNode> = {
  mail: <Mail size={16} />, calendar: <Calendar size={16} />, 'hard-drive': <HardDrive size={16} />,
  table: <Table size={16} />, video: <Video size={16} />, 'message-square': <MessageSquare size={16} />,
  cloud: <Cloud size={16} />, 'folder-open': <FolderOpen size={16} />, zap: <Zap size={16} />,
  'credit-card': <CreditCard size={16} />, target: <Target size={16} />, hash: <Hash size={16} />,
  'check-square': <CheckSquare size={16} />, 'book-open': <BookOpen size={16} />,
  'list-checks': <ListChecks size={16} />, repeat: <Repeat size={16} />, workflow: <Workflow size={16} />,
};

const categories = ['google', 'microsoft', 'crm', 'communication', 'pm', 'automation'];

export default function IntegrationsPage() {
  const connected = integrations.filter(i => i.connected).length;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-lg font-bold text-text-primary tracking-wider">Integration Hub</h1>
          <p className="font-body text-[10px] text-text-muted mt-0.5">MCP-connected services — {connected} of {integrations.length} active</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-bg-surface-1 border border-border-default rounded-lg px-4 py-3">
          <div className="font-display text-2xl font-bold text-text-primary">{integrations.length}</div>
          <div className="font-body text-[9px] text-text-muted uppercase tracking-wider">Total Integrations</div>
        </div>
        <div className="bg-bg-surface-1 border border-border-default rounded-lg px-4 py-3">
          <div className="font-display text-2xl font-bold text-mint">{connected}</div>
          <div className="font-body text-[9px] text-text-muted uppercase tracking-wider">Connected</div>
        </div>
        <div className="bg-bg-surface-1 border border-border-default rounded-lg px-4 py-3">
          <div className="font-display text-2xl font-bold text-text-muted">{integrations.length - connected}</div>
          <div className="font-body text-[9px] text-text-muted uppercase tracking-wider">Available</div>
        </div>
      </div>

      {/* Categories */}
      {categories.map((cat) => {
        const items = integrations.filter(i => i.category === cat);
        if (items.length === 0) return null;

        return (
          <div key={cat} className="mb-5">
            <div className="font-display text-[11px] font-semibold tracking-widest uppercase text-text-muted mb-2">
              {items[0].categoryLabel}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
                    ${item.connected
                      ? 'bg-[var(--mint-dim)] border-mint/20 hover:border-mint/40'
                      : 'bg-bg-surface-1 border-border-default hover:border-border-bright'
                    }`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -1 }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.connected ? 'bg-mint/15 text-mint' : 'bg-bg-surface-3 text-text-muted'
                  }`}>
                    {iconMap[item.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[11px] font-semibold text-text-primary">{item.name}</div>
                    <div className="font-body text-[9px] text-text-muted truncate">{item.description}</div>
                  </div>
                  <div>
                    {item.connected ? (
                      <div className="w-6 h-6 rounded-full bg-mint/20 flex items-center justify-center">
                        <Check size={12} className="text-mint" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-bg-surface-3 flex items-center justify-center">
                        <X size={12} className="text-text-muted" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
