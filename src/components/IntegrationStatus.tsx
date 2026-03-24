import { motion } from 'framer-motion';
import {
  Mail, Calendar, HardDrive, Table, Video,
  MessageSquare, Cloud, FolderOpen, Zap, CreditCard,
  Target, Hash, CheckSquare, BookOpen, ListChecks, Repeat, Workflow,
} from 'lucide-react';

interface IntegrationItem {
  name: string;
  icon: string;
  category: string;
  connected: boolean;
}

const demoIntegrations: IntegrationItem[] = [
  { name: 'GoHighLevel', icon: 'zap', category: 'CRM', connected: true },
  { name: 'Slack', icon: 'hash', category: 'Comms', connected: true },
  { name: 'Gmail', icon: 'mail', category: 'Google', connected: false },
  { name: 'Google Calendar', icon: 'calendar', category: 'Google', connected: false },
  { name: 'Google Drive', icon: 'hard-drive', category: 'Google', connected: false },
  { name: 'Outlook', icon: 'mail', category: 'Microsoft', connected: false },
  { name: 'Teams', icon: 'message-square', category: 'Microsoft', connected: false },
  { name: 'Stripe', icon: 'credit-card', category: 'CRM', connected: false },
  { name: 'Notion', icon: 'book-open', category: 'PM', connected: false },
  { name: 'Zapier', icon: 'repeat', category: 'Auto', connected: false },
];

const iconMap: Record<string, React.ReactNode> = {
  mail: <Mail size={12} />,
  calendar: <Calendar size={12} />,
  'hard-drive': <HardDrive size={12} />,
  table: <Table size={12} />,
  video: <Video size={12} />,
  'message-square': <MessageSquare size={12} />,
  cloud: <Cloud size={12} />,
  'folder-open': <FolderOpen size={12} />,
  zap: <Zap size={12} />,
  'credit-card': <CreditCard size={12} />,
  target: <Target size={12} />,
  hash: <Hash size={12} />,
  'check-square': <CheckSquare size={12} />,
  'book-open': <BookOpen size={12} />,
  'list-checks': <ListChecks size={12} />,
  repeat: <Repeat size={12} />,
  workflow: <Workflow size={12} />,
};

export default function IntegrationStatus() {
  const connected = demoIntegrations.filter(i => i.connected).length;

  return (
    <motion.div
      className="bg-bg-surface-1 border border-border-default rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <div className="font-display text-[11px] font-semibold tracking-widest uppercase text-text-muted">
          Integration Hub
        </div>
        <div className="font-body text-[10px] text-text-muted">
          <span className="text-mint">{connected}</span> / {demoIntegrations.length} connected
        </div>
      </div>

      {/* Integration grid */}
      <div className="p-3 grid grid-cols-5 gap-2">
        {demoIntegrations.map((integration, i) => (
          <motion.div
            key={integration.name}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-all duration-200
              ${integration.connected
                ? 'bg-[var(--mint-dim)] border border-mint/20 hover:border-mint/40'
                : 'bg-bg-surface-2 border border-border-default hover:border-border-bright'
              }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ scale: 1.05 }}
          >
            <span className={integration.connected ? 'text-mint' : 'text-text-muted'}>
              {iconMap[integration.icon] ?? <Zap size={12} />}
            </span>
            <span className="font-body text-[8px] text-text-muted text-center leading-tight truncate w-full">
              {integration.name}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
