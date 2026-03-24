import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { useState } from 'react';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

const statusLabels: Record<VoiceStatus, string> = {
  idle: 'Push to talk',
  listening: 'Listening…',
  processing: 'Processing…',
  speaking: 'Speaking…',
};

function WaveformBar({ index, active }: { index: number; active: boolean }) {
  return (
    <motion.div
      className="rounded-full"
      style={{
        width: 3,
        background: 'var(--cyan)',
      }}
      animate={
        active
          ? {
              height: [8, 20 + Math.random() * 16, 8],
              opacity: [0.4, 1, 0.4],
            }
          : { height: 8, opacity: 0.2 }
      }
      transition={
        active
          ? {
              duration: 0.4 + Math.random() * 0.4,
              repeat: Infinity,
              delay: index * 0.05,
              ease: 'easeInOut',
            }
          : { duration: 0.3 }
      }
    />
  );
}

export default function VoiceInputBar() {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const isActive = status === 'listening';

  const handleClick = () => {
    if (status === 'idle') {
      setStatus('listening');
      setTimeout(() => setStatus('processing'), 3000);
      setTimeout(() => setStatus('speaking'), 4500);
      setTimeout(() => setStatus('idle'), 6000);
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 mx-4 mb-4 rounded-xl"
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${isActive ? 'var(--cyan)' : 'var(--border-subtle)'}`,
        transition: 'border-color 0.3s',
      }}
    >
      {/* Mic button */}
      <motion.button
        className="w-10 h-10 rounded-full flex items-center justify-center border-0 cursor-pointer flex-shrink-0"
        style={{
          background: isActive ? 'var(--cyan)' : 'var(--bg-hover)',
          color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
      >
        <Mic size={18} />
      </motion.button>

      {/* Waveform */}
      <div className="flex items-center gap-1 flex-1 h-8 justify-center">
        {Array.from({ length: 24 }).map((_, i) => (
          <WaveformBar key={i} index={i} active={isActive} />
        ))}
      </div>

      {/* Status */}
      <span
        className="text-xs whitespace-nowrap flex-shrink-0"
        style={{
          fontFamily: 'var(--font-mono)',
          color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
        }}
      >
        {statusLabels[status]}
      </span>
    </div>
  );
}
