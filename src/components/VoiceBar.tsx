import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

const waveBars = [
  { height: 8, delay: 0, accent: false },
  { height: 14, delay: 0.1, accent: false },
  { height: 20, delay: 0.2, accent: true },
  { height: 24, delay: 0.3, accent: true },
  { height: 18, delay: 0.4, accent: true },
  { height: 22, delay: 0.5, accent: false },
  { height: 14, delay: 0.6, accent: false },
  { height: 10, delay: 0.7, accent: false },
  { height: 18, delay: 0.8, accent: false },
  { height: 12, delay: 0.9, accent: false },
  { height: 20, delay: 1.0, accent: false },
  { height: 8, delay: 1.1, accent: false },
];

export default function VoiceBar() {
  return (
    <div className="border-t border-border-default px-6 py-3 flex items-center gap-3.5 bg-bg-surface-1 shrink-0">
      <motion.button
        className="w-9 h-9 rounded-full bg-[var(--cyan-dim)] border border-cyan/40 flex items-center justify-center cursor-pointer shrink-0 text-cyan"
        whileHover={{ scale: 1.1, boxShadow: '0 0 12px rgba(0,212,255,0.2)' }}
        whileTap={{ scale: 0.9 }}
      >
        <Mic size={16} />
      </motion.button>

      <div className="flex-1 flex items-center gap-[3px] h-7">
        {waveBars.map((bar, i) => (
          <motion.div
            key={i}
            className={`w-[3px] rounded-sm ${bar.accent ? 'bg-cyan' : 'bg-border-bright'}`}
            style={{ height: bar.height }}
            animate={{
              scaleY: [0.5, 1, 0.5],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: bar.delay,
            }}
          />
        ))}
      </div>

      <div className="font-body text-[11px] text-text-muted shrink-0">
        Push to talk · Donna is listening
      </div>
    </div>
  );
}
