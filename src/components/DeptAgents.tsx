import { motion } from 'framer-motion';
import { ShoppingCart, LayoutGrid, Globe, Code } from 'lucide-react';
import { deptAgents } from '../data/mockData';

const iconMap: Record<string, React.ReactNode> = {
  'shopping-cart': <ShoppingCart size={16} />,
  'layout-grid': <LayoutGrid size={16} />,
  'globe': <Globe size={16} />,
  'code': <Code size={16} />,
};

const statusDotColor: Record<string, string> = {
  online: 'bg-mint',
  waiting: 'bg-amber',
  error: 'bg-red',
  offline: 'bg-text-muted',
};

export default function DeptAgents() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="font-display text-[11px] font-semibold tracking-widest uppercase text-text-muted">
          Department Agents
        </div>
        <div className="font-body text-[11px] text-text-muted bg-bg-surface-2 border border-border-default rounded-full px-2 py-0.5">
          4 online
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {deptAgents.map((agent, i) => (
          <motion.div
            key={agent.id}
            className="bg-bg-surface-1 border border-border-default rounded-lg p-3.5 relative overflow-hidden cursor-pointer hover:border-border-bright hover:bg-bg-surface-2 transition-colors duration-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            whileHover={{ y: -1 }}
          >
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet" />

            <div className="flex items-center justify-between mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--violet-dim)] border border-violet/30 flex items-center justify-center text-violet">
                {iconMap[agent.icon]}
              </div>
              <div className="flex items-center gap-1.5 font-body text-[10px] text-text-muted">
                <span className={`w-[7px] h-[7px] rounded-full ${statusDotColor[agent.status]}`} />
                {agent.statusLabel}
              </div>
            </div>

            <div className="font-display text-[13px] font-semibold text-text-primary mb-1">{agent.name}</div>
            <div className="font-body text-[10px] text-text-muted">
              <span className="text-violet">{agent.activeTasks}</span> active · {agent.specialists} specialists
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
