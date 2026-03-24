import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, ChevronDown, ChevronRight, Clock, CheckCircle } from 'lucide-react';

interface SOPItem {
  id: string;
  name: string;
  description: string;
  steps: number;
  lastRun: string | null;
  status: 'active' | 'draft' | 'disabled';
  agent: string;
}

const demoSOPs: SOPItem[] = [
  { id: '1', name: 'Empire Title — Weekly Report', description: 'Log into SoftPro, pull closing schedule, generate Monday briefing', steps: 9, lastRun: '2h ago', status: 'active', agent: 'Browser Agent' },
  { id: '2', name: 'GHL Contact Onboarding', description: 'Process new GoHighLevel contact through onboarding workflow', steps: 7, lastRun: '1d ago', status: 'active', agent: 'Browser Agent' },
  { id: '3', name: 'Weekly Social Post — LinkedIn', description: 'Generate and schedule weekly LinkedIn thought leadership post', steps: 5, lastRun: '3d ago', status: 'active', agent: 'Marketing Agent' },
  { id: '4', name: 'Invoice Follow-up Sequence', description: 'Check overdue invoices in Stripe, send follow-up via Gmail', steps: 6, lastRun: null, status: 'draft', agent: 'Ops Agent' },
  { id: '5', name: 'Client Onboarding Checklist', description: 'Set up new client workspace, invite users, configure agents', steps: 12, lastRun: '5d ago', status: 'active', agent: 'Ops Agent' },
];

const statusBadge: Record<string, { color: string; bg: string }> = {
  active: { color: 'text-mint', bg: 'bg-[var(--mint-dim)] border-mint/30' },
  draft: { color: 'text-amber', bg: 'bg-[var(--amber-dim)] border-amber/30' },
  disabled: { color: 'text-text-muted', bg: 'bg-bg-surface-2 border-border-default' },
};

export default function SOPLibraryPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-lg font-bold text-text-primary tracking-wider">SOP Library</h1>
          <p className="font-body text-[10px] text-text-muted mt-0.5">Standard Operating Procedures — automated browser workflows</p>
        </div>
        <motion.button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan text-bg-base font-display text-[11px] font-bold tracking-wider cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={12} />
          New SOP
        </motion.button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total SOPs', value: demoSOPs.length, color: 'text-text-primary' },
          { label: 'Active', value: demoSOPs.filter(s => s.status === 'active').length, color: 'text-mint' },
          { label: 'Drafts', value: demoSOPs.filter(s => s.status === 'draft').length, color: 'text-amber' },
          { label: 'Executions Today', value: 3, color: 'text-cyan' },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-surface-1 border border-border-default rounded-lg px-3 py-2">
            <div className={`font-display text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="font-body text-[9px] text-text-muted uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* SOP List */}
      <div className="space-y-2">
        {demoSOPs.map((sop, i) => {
          const isExpanded = expandedId === sop.id;
          const badge = statusBadge[sop.status];

          return (
            <motion.div
              key={sop.id}
              className="bg-bg-surface-1 border border-border-default rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-surface-2/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : sop.id)}
              >
                <span className="text-text-muted">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <div className="flex-1">
                  <div className="font-display text-[12px] font-semibold text-text-primary">{sop.name}</div>
                  <div className="font-body text-[9px] text-text-muted">{sop.description}</div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-body ${badge.color} ${badge.bg}`}>
                  {sop.status}
                </div>
                <div className="flex items-center gap-1 text-text-muted font-body text-[9px]">
                  <Clock size={10} />
                  {sop.lastRun ?? 'Never'}
                </div>
                <div className="font-body text-[9px] text-text-muted">
                  {sop.steps} steps
                </div>
                <motion.button
                  className="w-7 h-7 rounded-lg bg-bg-surface-3 border border-border-default flex items-center justify-center text-cyan hover:bg-[var(--cyan-dim)] hover:border-cyan/30 transition-colors cursor-pointer"
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Play size={12} />
                </motion.button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="px-4 py-3 border-t border-border-default bg-bg-surface-2/30"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="font-body text-[9px] text-text-muted">
                        Agent: <span className="text-orange">{sop.agent}</span>
                      </div>
                      <div className="font-body text-[9px] text-text-muted">
                        Version: <span className="text-text-secondary">1.0</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {Array.from({ length: sop.steps }, (_, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <CheckCircle size={10} className="text-text-muted shrink-0" />
                          <span className="font-body text-[10px] text-text-secondary">
                            Step {j + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
