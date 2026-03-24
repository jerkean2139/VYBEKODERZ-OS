import { motion } from 'framer-motion';
import { Globe, Pause, Eye, Camera } from 'lucide-react';

interface BrowserStep {
  action: string;
  description: string;
  status: 'success' | 'running' | 'pending' | 'failed';
}

const demoSteps: BrowserStep[] = [
  { action: 'navigate', description: 'Navigate to SoftPro login page', status: 'success' },
  { action: 'type', description: 'Enter username', status: 'success' },
  { action: 'type', description: 'Enter password', status: 'success' },
  { action: 'click', description: 'Click login button', status: 'success' },
  { action: 'wait', description: 'Wait for dashboard to load', status: 'running' },
  { action: 'navigate', description: 'Navigate to closing schedule', status: 'pending' },
  { action: 'screenshot', description: 'Capture closing schedule', status: 'pending' },
  { action: 'extract', description: 'Extract closing data to CSV', status: 'pending' },
  { action: 'screenshot', description: 'Capture final state', status: 'pending' },
];

const statusIcon: Record<string, string> = {
  success: '✓',
  running: '●',
  pending: '○',
  failed: '✗',
};

const statusColor: Record<string, string> = {
  success: 'text-mint',
  running: 'text-cyan',
  pending: 'text-text-muted',
  failed: 'text-red',
};

export default function BrowserMonitor() {
  const completedSteps = demoSteps.filter(s => s.status === 'success').length;
  const progress = Math.round((completedSteps / demoSteps.length) * 100);

  return (
    <motion.div
      className="bg-bg-surface-1 border border-border-default rounded-xl overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--orange-dim)] border border-orange/30 flex items-center justify-center text-orange">
            <Globe size={14} />
          </div>
          <div>
            <div className="font-display text-[12px] font-semibold text-text-primary">Browser Agent</div>
            <div className="font-body text-[9px] text-text-muted uppercase tracking-wider">Empire Title — Weekly Report</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-body text-[10px] text-cyan bg-[var(--cyan-dim)] border border-cyan/30 rounded-full px-2 py-0.5">
            <span className="w-[5px] h-[5px] rounded-full bg-cyan animate-[blink_1.2s_ease-in-out_infinite]" />
            Running
          </div>
          <button className="w-6 h-6 rounded bg-bg-surface-3 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer">
            <Pause size={12} />
          </button>
          <button className="w-6 h-6 rounded bg-bg-surface-3 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer">
            <Eye size={12} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 border-b border-border-default">
        <div className="flex justify-between font-body text-[9px] text-text-muted mb-1">
          <span>Step {completedSteps + 1} of {demoSteps.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-[3px] bg-border-default rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-orange rounded-sm"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Step log */}
      <div className="px-4 py-2 max-h-[200px] overflow-y-auto">
        {demoSteps.map((step, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-2 py-1.5"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className={`font-body text-[11px] w-3 shrink-0 ${statusColor[step.status]} ${
              step.status === 'running' ? 'animate-[blink_1s_ease-in-out_infinite]' : ''
            }`}>
              {statusIcon[step.status]}
            </span>
            <div className="flex-1">
              <span className={`font-body text-[10px] ${step.status === 'pending' ? 'text-text-muted' : 'text-text-secondary'}`}>
                {step.description}
              </span>
            </div>
            {step.status === 'success' && step.action === 'screenshot' && (
              <Camera size={10} className="text-text-muted shrink-0 mt-0.5" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border-default flex items-center justify-between">
        <span className="font-body text-[9px] text-text-muted">
          Session: bb_a1b2c3d4
        </span>
        <div className="flex gap-1.5">
          <button className="font-body text-[9px] text-text-muted bg-bg-surface-2 border border-border-default rounded px-2 py-0.5 cursor-pointer hover:text-amber hover:border-amber/40 transition-colors">
            Take Control
          </button>
          <button className="font-body text-[9px] text-text-muted bg-bg-surface-2 border border-border-default rounded px-2 py-0.5 cursor-pointer hover:text-text-primary hover:border-border-bright transition-colors">
            View Screenshots
          </button>
        </div>
      </div>
    </motion.div>
  );
}
