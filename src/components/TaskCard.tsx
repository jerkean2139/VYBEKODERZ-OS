import { motion } from 'framer-motion';
import type { Task } from '../data/mockData';

const statusConfig: Record<string, { chipClass: string; label: string }> = {
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

const progressBarColor: Record<string, string> = {
  running: 'bg-mint',
  waiting: 'bg-amber',
  error: 'bg-red',
  done: 'bg-text-muted',
};

interface TaskCardProps {
  task: Task;
  index: number;
}

export default function TaskCard({ task, index }: TaskCardProps) {
  const config = statusConfig[task.status];

  return (
    <motion.div
      className={`bg-bg-surface-1 border border-border-default rounded-lg p-3.5 px-4 relative cursor-pointer overflow-hidden transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
        ${task.status === 'running' ? 'animate-[card-pulse_3s_ease-in-out_infinite]' : ''}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: task.borderColor }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: task.agentColor }} />
          <span className="font-body text-[10px] text-text-muted uppercase tracking-wide">{task.agentName}</span>
        </div>
        <div className={`flex items-center gap-1.5 font-body text-[10px] rounded-full px-2 py-0.5 border ${config.chipClass}`}>
          <span className={`w-[5px] h-[5px] rounded-full bg-current ${task.status === 'running' ? 'animate-[blink_1.2s_ease-in-out_infinite]' : ''}`} />
          {config.label}
        </div>
      </div>

      {/* Title + desc */}
      <div className="font-display text-[13px] font-semibold text-text-primary mb-1.5 leading-snug">{task.title}</div>
      <div className="font-body text-[11px] text-text-secondary mb-3 leading-relaxed">{task.description}</div>

      {/* Progress */}
      <div className="mb-2">
        <div className="h-0.5 bg-border-default rounded-sm overflow-hidden mb-1">
          <motion.div
            className={`h-full rounded-sm ${progressBarColor[task.status]}`}
            initial={{ width: 0 }}
            animate={{ width: `${task.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 + index * 0.1 }}
          />
        </div>
        <div className="flex justify-between font-body text-[10px] text-text-muted">
          <span>{task.progressLabel}</span>
          <span>{task.progress > 0 ? `${task.progress}%` : 'Queued'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-border-default">
        {task.status === 'error' ? (
          <>
            <button className="font-body text-[10px] text-amber border border-amber/40 bg-bg-surface-2 rounded px-2 py-1 cursor-pointer hover:text-text-primary hover:border-border-bright transition-colors">
              Take Control
            </button>
            <button className="font-body text-[10px] text-text-muted border border-border-default bg-bg-surface-2 rounded px-2 py-1 cursor-pointer hover:text-text-primary hover:border-border-bright transition-colors">
              View Error
            </button>
            <button className="font-body text-[10px] text-text-muted border border-border-default bg-bg-surface-2 rounded px-2 py-1 cursor-pointer hover:text-text-primary hover:border-border-bright transition-colors">
              Retry
            </button>
          </>
        ) : (
          <>
            <button className="font-body text-[10px] text-text-muted border border-border-default bg-bg-surface-2 rounded px-2 py-1 cursor-pointer hover:text-text-primary hover:border-border-bright transition-colors">
              View Log
            </button>
            <button className="font-body text-[10px] text-text-muted border border-border-default bg-bg-surface-2 rounded px-2 py-1 cursor-pointer hover:text-amber hover:border-amber/40 transition-colors">
              Override
            </button>
            <button className="font-body text-[10px] text-text-muted border border-border-default bg-bg-surface-2 rounded px-2 py-1 cursor-pointer hover:text-text-primary hover:border-border-bright transition-colors">
              {task.status === 'running' ? 'Pause' : task.status === 'waiting' ? 'Run Now' : 'Cancel'}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
