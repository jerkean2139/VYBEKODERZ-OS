import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, Globe, Code, Settings, BookOpen, Plug, Shield } from 'lucide-react';
import { railAgents } from '../data/mockData';
import { useAuth } from '../hooks/useAuth';

const iconMap: Record<string, React.ReactNode> = {
  donna: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      <circle cx="19" cy="6" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
  sales: <ShoppingCart size={20} />,
  ops: <LayoutGrid size={20} />,
  marketing: <Globe size={20} />,
  dev: <Code size={20} />,
};

const statusColors: Record<string, string> = {
  cyan: 'bg-cyan',
  green: 'bg-mint',
  amber: 'bg-amber',
  red: 'bg-red',
};

export default function LeftRail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isHome = location.pathname === '/';

  return (
    <nav className="w-[72px] bg-bg-surface-1 border-r border-border-default flex flex-col items-center py-4 gap-1 shrink-0 z-10">
      {/* Logo — goes to dashboard */}
      <motion.button
        className="w-10 h-10 mb-4 flex items-center justify-center cursor-pointer bg-transparent border-none"
        onClick={() => navigate('/')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg viewBox="0 0 36 36" fill="none" className="w-9 h-9">
          <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
          <polygon points="18,8 28,13 28,23 18,28 8,23 8,13" fill="rgba(0,212,255,0.08)" stroke="#00D4FF" strokeWidth="1" opacity="0.6" />
          <circle cx="18" cy="18" r="3" fill="#00D4FF" />
        </svg>
      </motion.button>

      <div className="w-8 h-px bg-border-default my-2" />

      {/* Agent buttons */}
      {railAgents.map((agent, i) => (
        <div key={agent.id}>
          {i === 1 && <div className="w-8 h-px bg-border-default my-2 mx-auto" />}
          <motion.button
            onClick={() => navigate('/')}
            className={`relative w-12 h-12 rounded-xl border-none flex items-center justify-center cursor-pointer transition-colors duration-200 group
              ${isHome && agent.id === 'donna'
                ? 'bg-[var(--cyan-dim)] shadow-[0_0_0_1px_#00D4FF,0_0_16px_rgba(0,212,255,0.15)]'
                : isHome && i > 0
                  ? 'bg-[var(--violet-dim)] shadow-[0_0_0_1px_#7B2FFF,0_0_16px_rgba(123,47,255,0.15)]'
                  : 'bg-transparent hover:bg-bg-surface-3'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className={`transition-colors duration-200 ${
              isHome && agent.id === 'donna' ? 'text-cyan'
              : isHome && i > 0 ? 'text-violet'
              : 'text-text-muted group-hover:text-cyan'
            }`}>
              {iconMap[agent.icon]}
            </span>

            {/* Status dot */}
            <span className={`absolute bottom-1.5 right-1.5 w-[7px] h-[7px] rounded-full border-[1.5px] border-bg-surface-1 ${statusColors[agent.status]}`} />

            {/* Tooltip */}
            <span className="absolute left-[calc(72px+8px)] bg-bg-surface-2 border border-border-bright rounded-md px-2.5 py-1.5 whitespace-nowrap font-ui text-[11px] text-text-secondary pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[999]">
              {agent.label} {agent.sublabel && `— ${agent.sublabel}`} · {agent.tasks} active
            </span>
          </motion.button>
        </div>
      ))}

      <div className="w-8 h-px bg-border-default my-2" />

      {/* Navigation buttons */}
      {[
        { path: '/sops', icon: <BookOpen size={18} />, label: 'SOP Library' },
        { path: '/integrations', icon: <Plug size={18} />, label: 'Integrations' },
        ...(user?.role === 'super_admin' || user?.role === 'agency_admin'
          ? [{ path: '/admin', icon: <Shield size={18} />, label: 'Admin' }]
          : []),
      ].map((item) => (
        <motion.button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`relative w-12 h-12 rounded-xl border-none flex items-center justify-center cursor-pointer transition-colors duration-200 group
            ${location.pathname === item.path
              ? 'bg-[var(--cyan-dim)] shadow-[0_0_0_1px_#00D4FF,0_0_16px_rgba(0,212,255,0.15)] text-cyan'
              : 'bg-transparent hover:bg-bg-surface-3 text-text-muted hover:text-cyan'
            }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {item.icon}
          <span className="absolute left-[calc(72px+8px)] bg-bg-surface-2 border border-border-bright rounded-md px-2.5 py-1.5 whitespace-nowrap font-ui text-[11px] text-text-secondary pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[999]">
            {item.label}
          </span>
        </motion.button>
      ))}

      {/* Settings at bottom */}
      <motion.button
        className="relative w-12 h-12 rounded-xl border-none bg-transparent flex items-center justify-center cursor-pointer mt-auto text-text-muted hover:text-cyan hover:bg-bg-surface-3 transition-colors duration-200 group"
        onClick={() => navigate('/admin')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings size={20} />
        <span className="absolute left-[calc(72px+8px)] bg-bg-surface-2 border border-border-bright rounded-md px-2.5 py-1.5 whitespace-nowrap font-ui text-[11px] text-text-secondary pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[999]">
          Settings
        </span>
      </motion.button>
    </nav>
  );
}
