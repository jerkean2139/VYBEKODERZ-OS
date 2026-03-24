import { motion } from 'framer-motion';

export default function DonnaHero() {
  return (
    <div className="bg-bg-surface-1 border border-border-default rounded-xl p-5 px-6 flex items-center gap-5 relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(0,212,255,0.06)_0%,transparent_60%)] pointer-events-none" />

      {/* Avatar with rings */}
      <div className="relative shrink-0">
        <motion.div
          className="absolute -inset-[6px] rounded-full border-2 border-transparent border-t-cyan border-r-cyan/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -inset-[10px] rounded-full border border-transparent border-b-cyan/20"
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />
        <div className="w-14 h-14 rounded-full bg-bg-surface-3 border-2 border-cyan flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.25),0_0_40px_rgba(0,212,255,0.1)]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-cyan">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <circle cx="19" cy="6" r="2" fill="currentColor" stroke="none" opacity="0.7" />
          </svg>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="font-display text-lg font-bold text-text-primary tracking-wide mb-0.5">DONNA</div>
        <div className="font-body text-[11px] text-cyan tracking-wider uppercase mb-2">Chief AI Agent — Org Level</div>
        <div className="flex items-center gap-5">
          <div className="font-body text-[11px] text-text-muted">
            <strong className="block text-text-primary text-base font-medium">7</strong>
            Active Tasks
          </div>
          <div className="font-body text-[11px] text-text-muted">
            <strong className="block text-text-primary text-base font-medium">1,247</strong>
            Memories
          </div>
          <div className="font-body text-[11px] text-text-muted">
            <strong className="block text-text-primary text-base font-medium">43</strong>
            Connections
          </div>
          <div className="flex items-center gap-2 font-body text-[11px] text-text-secondary bg-bg-surface-2 border border-border-default rounded-md px-3 py-2">
            <motion.div
              className="w-2 h-2 rounded-full bg-cyan"
              animate={{ scale: [1, 0.7, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            Routing: GHL follow-up → Sales Agent
          </div>
        </div>
      </div>

      {/* IQ Badge */}
      <div className="bg-bg-surface-2 border border-border-default rounded-lg p-3 px-4 text-center min-w-[80px]">
        <motion.div
          className="font-display text-[28px] font-bold text-mint leading-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          84
        </motion.div>
        <div className="font-body text-[9px] text-text-muted uppercase tracking-wider mt-0.5">IQ Score</div>
        <div className="font-body text-[10px] text-mint mt-0.5">↑ +3 this week</div>
      </div>
    </div>
  );
}
