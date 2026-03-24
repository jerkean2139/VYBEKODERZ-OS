import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  agentId?: string;
  read: boolean;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  task_routed: 'border-cyan/40',
  task_error: 'border-red/40',
  sop_completed: 'border-mint/40',
  sop_failed: 'border-orange/40',
  webhook_received: 'border-violet/40',
  memory_stored: 'border-mint/40',
};

const typeDot: Record<string, string> = {
  task_routed: 'bg-cyan',
  task_error: 'bg-red',
  sop_completed: 'bg-mint',
  sop_failed: 'bg-orange',
  webhook_received: 'bg-violet',
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const [notifRes, countRes] = await Promise.all([
        fetch(`${API_BASE}/api/notifications?limit=20`),
        fetch(`${API_BASE}/api/notifications/count`),
      ]);
      if (notifRes.ok) setNotifications(await notifRes.json());
      if (countRes.ok) {
        const { unread } = await countRes.json();
        setUnreadCount(unread);
      }
    } catch {
      // Backend offline
    }
  }

  async function handleMarkAllRead() {
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, { method: 'POST' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {}
  }

  function timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}d`;
  }

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        className="relative w-8 h-8 rounded-lg bg-bg-surface-2 border border-border-default flex items-center justify-center text-text-muted hover:text-text-primary cursor-pointer transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
      >
        <Bell size={14} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red text-[9px] font-body font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 top-10 w-80 bg-bg-surface-1 border border-border-default rounded-xl shadow-2xl overflow-hidden z-50"
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border-default">
              <span className="font-display text-[11px] font-semibold text-text-primary tracking-wider">
                Notifications
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="font-body text-[9px] text-cyan cursor-pointer hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-3 py-6 text-center font-body text-[10px] text-text-muted">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-3 py-2 border-l-2 ${typeColors[n.type] ?? 'border-border-default'} ${
                      n.read ? 'opacity-60' : ''
                    } hover:bg-bg-surface-2/50 transition-colors`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`w-[6px] h-[6px] rounded-full shrink-0 mt-1 ${typeDot[n.type] ?? 'bg-text-muted'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-[10px] font-semibold text-text-primary">{n.title}</div>
                        <div className="font-body text-[9px] text-text-muted truncate">{n.message}</div>
                      </div>
                      <span className="font-body text-[8px] text-text-muted shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
