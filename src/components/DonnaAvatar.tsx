import { motion } from 'framer-motion';

interface DonnaAvatarProps {
  size?: number;
  status?: 'Routing' | 'Idle' | 'Processing';
  showLabel?: boolean;
}

export default function DonnaAvatar({ size = 80, status = 'Routing', showLabel = true }: DonnaAvatarProps) {
  const r = size / 2;
  const innerR = r * 0.55;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Outer geometric ring */}
          <motion.circle
            cx={r}
            cy={r}
            r={r - 4}
            fill="none"
            stroke="var(--cyan)"
            strokeWidth={2}
            strokeDasharray="6 4"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: 'center' }}
          />
          {/* Pulsing glow ring */}
          <motion.circle
            cx={r}
            cy={r}
            r={r - 8}
            fill="none"
            stroke="var(--cyan)"
            strokeWidth={1.5}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              r: [r - 10, r - 7, r - 10],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Inner hexagonal shape approximated with circle + geometric details */}
          <circle cx={r} cy={r} r={innerR} fill="var(--bg-elevated)" stroke="var(--cyan)" strokeWidth={1} opacity={0.6} />
          {/* Center diamond */}
          <motion.polygon
            points={`${r},${r - innerR * 0.6} ${r + innerR * 0.5},${r} ${r},${r + innerR * 0.6} ${r - innerR * 0.5},${r}`}
            fill="var(--cyan)"
            opacity={0.9}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: 'center' }}
          />
          {/* Corner accents */}
          <line x1={r - innerR * 0.3} y1={r - innerR * 0.3} x2={r} y2={r - innerR * 0.6} stroke="var(--cyan)" strokeWidth={0.5} opacity={0.4} />
          <line x1={r + innerR * 0.3} y1={r - innerR * 0.3} x2={r} y2={r - innerR * 0.6} stroke="var(--cyan)" strokeWidth={0.5} opacity={0.4} />
        </svg>
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      {showLabel && (
        <div className="text-center">
          <div className="text-sm font-semibold tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--cyan)' }}>
            DONNA
          </div>
          <div className="text-xs mt-0.5" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            {status}
          </div>
        </div>
      )}
    </div>
  );
}
