import { motion, AnimatePresence } from 'framer-motion';
import type { RoutingStep } from '../api';

interface RoutingAnimationProps {
  steps: RoutingStep[] | null;
}

const agentPositions: Record<string, { label: string }> = {
  donna: { label: 'Donna' },
  'sales-agent': { label: 'Sales' },
  'ops-agent': { label: 'Ops' },
  'marketing-agent': { label: 'Marketing' },
  'dev-agent': { label: 'Dev' },
  'outbound-specialist': { label: 'Outbound' },
  'deal-strategist': { label: 'Deal' },
  'sop-executor': { label: 'SOP' },
  'scheduler': { label: 'Scheduler' },
  'browser-agent': { label: 'Browser' },
  'content-creator': { label: 'Content' },
  'seo-specialist': { label: 'SEO' },
  'social-manager': { label: 'Social' },
  'campaign-runner': { label: 'Campaign' },
  'ai-engineer': { label: 'AI Eng' },
  'backend-architect': { label: 'Backend' },
  'devops-automator': { label: 'DevOps' },
};

export default function RoutingAnimation({ steps }: RoutingAnimationProps) {
  return (
    <AnimatePresence>
      {steps && steps.length > 0 && (
        <motion.div
          className="fixed inset-0 z-[900] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-bg-base/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Routing trace visualization */}
          <div className="relative flex items-center gap-6">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                {/* From node */}
                {i === 0 && (
                  <motion.div
                    className="flex flex-col items-center gap-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0, duration: 0.3 }}
                  >
                    <div
                      className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: step.color, boxShadow: `0 0 20px ${step.color}40` }}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ background: step.color }} />
                    </div>
                    <span className="font-body text-[10px] text-text-secondary">
                      {agentPositions[step.from]?.label ?? step.from}
                    </span>
                  </motion.div>
                )}

                {/* Connecting line */}
                <div className="relative w-24 h-0.5">
                  <div className="absolute inset-0 bg-border-default" />
                  <motion.div
                    className="absolute inset-y-0 left-0 h-full"
                    style={{ background: step.color }}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ delay: i * 0.5 + 0.3, duration: 0.5, ease: 'easeOut' }}
                  />
                  {/* Traveling dot */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                    style={{ background: step.color, boxShadow: `0 0 10px ${step.color}` }}
                    initial={{ left: 0, opacity: 0 }}
                    animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
                    transition={{ delay: i * 0.5 + 0.3, duration: 0.5, ease: 'easeOut' }}
                  />
                </div>

                {/* To node */}
                <motion.div
                  className="flex flex-col items-center gap-2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.5 + 0.7, duration: 0.3, type: 'spring' }}
                >
                  <div
                    className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: step.color, boxShadow: `0 0 20px ${step.color}40` }}
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full"
                      style={{ background: step.color }}
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ delay: i * 0.5 + 0.8, duration: 0.3 }}
                    />
                  </div>
                  <span className="font-body text-[10px] text-text-secondary">
                    {agentPositions[step.to]?.label ?? step.to}
                  </span>
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
