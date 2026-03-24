import { LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../hooks/useAuth';

interface TopBarProps {
  isConnected?: boolean;
  taskCount?: number;
}

export default function TopBar({ isConnected = false, taskCount = 14 }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-border-default bg-bg-surface-1 shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-display text-sm font-semibold tracking-wider uppercase text-text-secondary">
          Mission <span className="text-cyan">Control</span>
        </span>
        {isConnected ? (
          <div className="flex items-center gap-1.5 bg-[var(--mint-dim)] border border-mint/30 rounded-full px-2.5 py-0.5 font-body text-[10px] text-mint tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-mint animate-[blink_1.4s_ease-in-out_infinite]" />
            LIVE
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[var(--amber-dim)] border border-amber/30 rounded-full px-2.5 py-0.5 font-body text-[10px] text-amber tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-amber" />
            DEMO
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <span className="font-body text-[11px] text-text-muted hidden md:inline">
          Tasks <span className="text-text-primary font-medium">{taskCount}</span>
        </span>
        <span className="font-body text-[11px] text-text-muted hidden md:inline">
          Agents <span className="text-text-primary font-medium">5/5</span>
        </span>
        <span className="font-body text-[11px] text-text-muted hidden lg:inline">
          {user?.role === 'super_admin' ? 'Super Admin' : user?.name ?? 'VybeKoderz'}
        </span>

        <NotificationBell />

        <button
          onClick={logout}
          className="w-8 h-8 rounded-lg bg-bg-surface-2 border border-border-default flex items-center justify-center text-text-muted hover:text-red cursor-pointer transition-colors"
          title="Logout"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
