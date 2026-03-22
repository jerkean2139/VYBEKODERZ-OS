import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Building2, Users, Plug, Play } from 'lucide-react';

type OnboardingStep = 'workspace' | 'team' | 'integrations' | 'done';

const steps: { key: OnboardingStep; label: string; icon: React.ReactNode }[] = [
  { key: 'workspace', label: 'Workspace', icon: <Building2 size={16} /> },
  { key: 'team', label: 'Invite Team', icon: <Users size={16} /> },
  { key: 'integrations', label: 'Connect Tools', icon: <Plug size={16} /> },
  { key: 'done', label: 'Launch', icon: <Play size={16} /> },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('workspace');
  const [workspace, setWorkspace] = useState({ name: '', donnaName: 'Donna', color: '#00D4FF' });
  const [invites, setInvites] = useState(['']);

  const stepIndex = steps.findIndex(s => s.key === currentStep);

  function nextStep() {
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].key);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-[11px] font-bold ${
              i < stepIndex ? 'bg-mint text-bg-base'
              : i === stepIndex ? 'bg-cyan text-bg-base'
              : 'bg-bg-surface-3 text-text-muted border border-border-default'
            }`}>
              {i < stepIndex ? <CheckCircle size={14} /> : step.icon}
            </div>
            <span className={`font-display text-[10px] font-semibold tracking-wider ${
              i <= stepIndex ? 'text-text-primary' : 'text-text-muted'
            }`}>
              {step.label}
            </span>
            {i < steps.length - 1 && <div className={`w-8 h-px ${i < stepIndex ? 'bg-mint' : 'bg-border-default'}`} />}
          </div>
        ))}
      </div>

      {/* Step: Workspace */}
      {currentStep === 'workspace' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="font-display text-lg font-bold text-text-primary mb-1">Set up your workspace</h2>
          <p className="font-body text-[11px] text-text-muted mb-6">Name your org and customize your AI assistant.</p>

          <div className="space-y-4">
            <div>
              <label className="block font-display text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Workspace Name</label>
              <input
                value={workspace.name}
                onChange={e => setWorkspace({ ...workspace, name: e.target.value })}
                placeholder="Your Company Name"
                className="w-full px-3 py-2 rounded-lg bg-bg-surface-2 border border-border-default text-text-primary font-body text-sm focus:outline-none focus:border-cyan/50"
              />
            </div>
            <div>
              <label className="block font-display text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">AI Assistant Name</label>
              <input
                value={workspace.donnaName}
                onChange={e => setWorkspace({ ...workspace, donnaName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface-2 border border-border-default text-text-primary font-body text-sm focus:outline-none focus:border-cyan/50"
              />
              <p className="font-body text-[9px] text-text-muted mt-1">Your chief AI agent. Default: Donna</p>
            </div>
            <div>
              <label className="block font-display text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">Brand Color</label>
              <div className="flex gap-2">
                {['#00D4FF', '#7B2FFF', '#FF6B35', '#00FF9C', '#FFD93D'].map(c => (
                  <button
                    key={c}
                    onClick={() => setWorkspace({ ...workspace, color: c })}
                    className={`w-8 h-8 rounded-lg cursor-pointer transition-transform ${workspace.color === c ? 'scale-110 ring-2 ring-white/30' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <motion.button
            onClick={nextStep}
            disabled={!workspace.name}
            className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan text-bg-base font-display text-[11px] font-bold tracking-wider cursor-pointer disabled:opacity-50"
            whileTap={{ scale: 0.98 }}
          >
            Continue <ArrowRight size={12} />
          </motion.button>
        </motion.div>
      )}

      {/* Step: Team */}
      {currentStep === 'team' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="font-display text-lg font-bold text-text-primary mb-1">Invite your team</h2>
          <p className="font-body text-[11px] text-text-muted mb-6">Add team members by email. You can always invite more later.</p>

          <div className="space-y-2 mb-4">
            {invites.map((email, i) => (
              <input
                key={i}
                value={email}
                onChange={e => {
                  const updated = [...invites];
                  updated[i] = e.target.value;
                  setInvites(updated);
                }}
                placeholder={`team${i + 1}@company.com`}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface-2 border border-border-default text-text-primary font-body text-sm focus:outline-none focus:border-cyan/50"
              />
            ))}
          </div>
          <button
            onClick={() => setInvites([...invites, ''])}
            className="font-body text-[10px] text-cyan cursor-pointer hover:underline mb-6 block"
          >
            + Add another
          </button>

          <div className="flex gap-2">
            <motion.button
              onClick={nextStep}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan text-bg-base font-display text-[11px] font-bold tracking-wider cursor-pointer"
              whileTap={{ scale: 0.98 }}
            >
              Continue <ArrowRight size={12} />
            </motion.button>
            <button onClick={nextStep} className="px-4 py-2 font-body text-[11px] text-text-muted cursor-pointer hover:text-text-secondary">
              Skip for now
            </button>
          </div>
        </motion.div>
      )}

      {/* Step: Integrations */}
      {currentStep === 'integrations' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="font-display text-lg font-bold text-text-primary mb-1">Connect your tools</h2>
          <p className="font-body text-[11px] text-text-muted mb-6">Connect the services your agents will use. All optional.</p>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {['Gmail', 'Google Calendar', 'Slack', 'GoHighLevel', 'Stripe', 'Notion'].map(tool => (
              <button
                key={tool}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-bg-surface-1 border border-border-default text-text-secondary hover:border-cyan/30 hover:text-text-primary cursor-pointer transition-colors"
              >
                <Plug size={12} />
                <span className="font-display text-[10px] font-semibold">{tool}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={nextStep}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan text-bg-base font-display text-[11px] font-bold tracking-wider cursor-pointer"
              whileTap={{ scale: 0.98 }}
            >
              Continue <ArrowRight size={12} />
            </motion.button>
            <button onClick={nextStep} className="px-4 py-2 font-body text-[11px] text-text-muted cursor-pointer hover:text-text-secondary">
              Skip for now
            </button>
          </div>
        </motion.div>
      )}

      {/* Step: Done */}
      {currentStep === 'done' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl border border-mint/30 bg-[var(--mint-dim)] flex items-center justify-center"
            animate={{ boxShadow: ['0 0 20px rgba(0,255,156,0.2)', '0 0 40px rgba(0,255,156,0.4)', '0 0 20px rgba(0,255,156,0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle size={28} className="text-mint" />
          </motion.div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">You're all set!</h2>
          <p className="font-body text-[11px] text-text-muted mb-6">
            {workspace.donnaName || 'Donna'} is ready to start routing tasks for {workspace.name || 'your workspace'}.
          </p>
          <motion.button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-lg bg-cyan text-bg-base font-display text-sm font-bold tracking-wider cursor-pointer"
            whileTap={{ scale: 0.98 }}
          >
            Launch Mission Control
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
