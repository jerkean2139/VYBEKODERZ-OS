import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

interface TaskInputProps {
  onSubmit: (input: string) => Promise<void>;
  isCreating: boolean;
}

export default function TaskInput({ onSubmit, isCreating }: TaskInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isCreating) return;
    await onSubmit(input.trim());
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <div className="flex-1 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell Donna what to do..."
          disabled={isCreating}
          className="w-full bg-bg-surface-2 border border-border-default rounded-lg px-4 py-2.5 font-body text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan/50 focus:shadow-[0_0_0_1px_rgba(0,212,255,0.2)] transition-all duration-200 disabled:opacity-50"
        />
        {isCreating && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 font-body text-[10px] text-cyan">
            <motion.div
              className="w-2 h-2 rounded-full bg-cyan"
              animate={{ scale: [1, 0.7, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            Donna is routing...
          </div>
        )}
      </div>
      <motion.button
        type="submit"
        disabled={!input.trim() || isCreating}
        className="w-9 h-9 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center text-cyan disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </motion.button>
    </form>
  );
}
