import { motion } from 'framer-motion';
import { Bot, TrendingUp, Settings, Megaphone, Code, Cpu } from 'lucide-react';
import { agents, type Agent, type DepartmentId } from '../data/mockData';
import { useState } from 'react';

const iconMap: Record<DepartmentId, React.ReactNode> = {
  donna: <Cpu size={22} />,
  sales: <TrendingUp size={22} />,
  ops: <Settings size={22} />,
  marketing: <Megaphone size={22} />,
  dev: <Code size={22} />,
};

const statusDotColor: Record<string, string> = {
  active: 'var(--mint)',
  idle: 'var(--amber)',
  error: 'var(--red)',
};

export default function AgentRail({ activeAgent, onSelect }: { activeAgent: DepartmentId; onSelect: (id: DepartmentId) => void }) {
  const [hovered, setHovered] = useState<DepartmentId | null>(null);

  return (
    <div
      className="flex flex-col items-center py-4 gap-1 relative"
      style={{
        width: 72,
        minWidth: 72,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Logo */}
      <div className="mb-4 flex items-center justify-center w-10 h-10">
        <Bot size={24} style={{ color: 'var(--cyan)' }} />
      </div>

      {agents.map((agent) => {
        const isActive = activeAgent === agent.id;
        return (
          <div key={agent.id} className="relative">
            <motion.button
              className="relative w-12 h-12 rounded-xl flex items-center justify-center border-0 cursor-pointer"
              style={{
                background: isActive ? `${agent.color}15` : 'transparent',
                color: isActive ? agent.color : 'var(--text-secondary)',
              }}
              whileHover={{ background: `${agent.color}15` }}
              onClick={() => onSelect(agent.id)}
              onMouseEnter={() => setHovered(agent.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {iconMap[agent.id]}
              {/* Status dot */}
              <div
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{
                  background: statusDotColor[agent.status],
                  boxShadow: `0 0 6px ${statusDotColor[agent.status]}`,
                }}
              />
              {/* Active glow */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ boxShadow: `0 0 12px ${agent.color}33` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>

            {/* Tooltip */}
            {hovered === agent.id && (
              <motion.div
                className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md whitespace-nowrap z-50"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                }}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div style={{ color: agent.color, fontWeight: 600 }}>{agent.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                  {agent.activeTasks} active task{agent.activeTasks !== 1 ? 's' : ''}
                </div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
