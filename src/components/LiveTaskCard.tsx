import { motion } from 'framer-motion';
import type { ServerTask } from '../api';

const statusConfig: Record<string, { chipClass: string; label: string }> = {
  routing: {
    chipClass: 'text-cyan bg-[var(--cyan-dim)] border-cyan/30',
    label: 'Routing',
  },
  running: {
    chipClass: 'text-mint bg-[var(--mint-dim)] border-mint/30',
    label: 'Running',
  },
  waiting: {
    chipClass: 'text-amber bg-[var(--amber-dim)] border-amber/30',
    label: 'Waiting',
  },
  error: {
    chipClass: 'text-red bg-[var(--red-dim)] border-red/30',
    label: 'Error',
  },
  done: {
    chipClass: 'text-text-muted bg-bg-surface-2 border-border-default',
    label: 'Done',
  },
};

const borderColors: Record<string, string> = {
  routing: '#00D4FF',
  running: '#00FF9C',
  waiting: '#FFD93D',
  error: '#FF3860',
  done: '#4A5568',
};

const progressColors: Record<string, string> = {
  routing: 'bg-cyan',
  running: 'bg-mint',
  waiting: 'bg-amber',
  error: 'bg-red',
  done: 'bg-text-muted',
};

const deptColors: Record<string, string> = {
  sales: '#7B2FFF',
  ops: '#7B2FFF',
  marketing: '#7B2FFF',
  dev: '#7B2FFF',
};

interface LiveTaskCardProps {
  task: ServerTask;
  index: number;
}

export default function LiveTaskCard({ task, index }: LiveTaskCardProps) {
  const config = statusConfig[task.status] ?? statusConfig.running;

  const agentLabel = task.specialist
    ? `${task.department ? task.department.charAt(0).toUpperCase() + task.department.slice(1) : ''} Agent → ${task.specialist.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
    : task.assignedAgent ?? 'Donna';

  return (
    <motion.div
      className={`bg-bg-surface-1 border border-border-default rounded-lg p-3.5 px-4 relative cursor-pointer overflow-hidden transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
        ${task.status === 'running' ? 'animate-[card-pulse_3s_ease-in-out_infinite]' : ''}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: borderColors[task.status] ?? '#00D4FF' }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: deptColors[task.department ?? ''] ?? '#00D4FF' }}
          />
          <span className="font-body text-[10px] text-text-muted uppercase tracking-wide">
            {agentLabel}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 font-body text-[10px] rounded-full px-2 py-0.5 border ${config.chipClass}`}>
          <span className={`w-[5px] h-[5px] rounded-full bg-current ${
            task.status === 'running' || task.status === 'routing' ? 'animate-[blink_1.2s_ease-in-out_infinite]' : ''
          }`} />
          {config.label}
        </div>
      </div>

      {/* Title + desc */}
      <div className="font-display text-[13px] font-semibold text-text-primary mb-1.5 leading-snug">
        {task.title || task.input}
      </div>
      {task.description && (
        <div className="font-body text-[11px] text-text-secondary mb-3 leading-relaxed">
          {task.description}
        </div>
      )}

      {/* Progress */}
      <div className="mb-2">
        <div className="h-0.5 bg-border-default rounded-sm overflow-hidden mb-1">
          <motion.div
            className={`h-full rounded-sm ${progressColors[task.status] ?? 'bg-cyan'}`}
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between font-body text-[10px] text-text-muted">
          <span>{task.progressLabel}</span>
          <span>{task.progress}%</span>
        </div>
      </div>

      {/* Routing trace indicator */}
      {task.routingTrace.length > 0 && (
        <div className="flex gap-1.5 mt-2 pt-2 border-t border-border-default">
          <span className="font-body text-[9px] text-text-muted uppercase tracking-wider">Route:</span>
          {task.routingTrace.map((step, i) => (
            <span key={i} className="font-body text-[9px]" style={{ color: step.color }}>
              {i === 0 ? step.from : ''} → {step.to.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
