import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../../server/auth/roles';

const roles: { value: Role; label: string; description: string; icon: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full platform access across all tenants', icon: '⚡' },
  { value: 'agency_admin', label: 'Agency Admin', description: 'Manage your team, agents & client work', icon: '🏢' },
  { value: 'project_lead', label: 'Project Lead', description: 'Lead projects with task & override access', icon: '📋' },
  { value: 'builder', label: 'Builder', description: 'Create and execute tasks', icon: '🔨' },
  { value: 'client_viewer', label: 'Client Viewer', description: 'View-only portal access', icon: '👁' },
];

export default function LoginPage() {
  const { login, loginWithProvider } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('agency_admin');
  const [isLoading, setIsLoading] = useState(false);

  async function handleDemoLogin() {
    setIsLoading(true);
    await login(selectedRole);
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen w-full bg-bg-base flex">
      {/* Left side — branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 via-bg-base to-violet/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan/3 blur-[120px]" />

        <div className="relative z-10 text-center px-12 max-w-lg">
          {/* Logo */}
          <motion.div
            className="w-24 h-24 mx-auto mb-8 rounded-3xl border-2 border-cyan/30 bg-cyan/10 flex items-center justify-center backdrop-blur-sm"
            animate={{ boxShadow: ['0 0 30px rgba(0,212,255,0.15)', '0 0 60px rgba(0,212,255,0.3)', '0 0 30px rgba(0,212,255,0.15)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="font-display text-5xl font-bold text-cyan">V</span>
          </motion.div>

          <h1 className="font-display text-4xl font-bold text-text-primary tracking-wide mb-3">
            VybeKoderz
          </h1>
          <h2 className="font-display text-xl text-cyan/80 font-medium tracking-wider mb-6">
            AI Agent OS
          </h2>
          <p className="font-ui text-base text-text-secondary leading-relaxed">
            Your AI-powered operations platform. Agents that delegate, remember, learn, and operate 24/7.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {['Agent Routing', 'Memory Engine', 'Browser Automation', 'Voice AI', '18 Integrations'].map((feat) => (
              <span key={feat} className="font-ui text-xs text-text-muted bg-bg-surface-2 border border-border-default rounded-full px-4 py-1.5">
                {feat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 lg:max-w-xl flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-10">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl border-2 border-cyan/30 bg-cyan/10 flex items-center justify-center"
            animate={{ boxShadow: ['0 0 20px rgba(0,212,255,0.15)', '0 0 40px rgba(0,212,255,0.3)', '0 0 20px rgba(0,212,255,0.15)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="font-display text-3xl font-bold text-cyan">V</span>
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-text-primary">VybeKoderz AI Agent OS</h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-2xl font-bold text-text-primary mb-1">Welcome back</h2>
          <p className="font-ui text-base text-text-secondary mb-8">Sign in to Mission Control</p>

          {/* OAuth Providers */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => loginWithProvider('google')}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-bg-surface-1 border border-border-default hover:border-cyan/30 hover:bg-bg-surface-2 text-text-primary font-ui text-base transition-all cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button
              onClick={() => loginWithProvider('microsoft')}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl bg-bg-surface-1 border border-border-default hover:border-violet/30 hover:bg-bg-surface-2 text-text-primary font-ui text-base transition-all cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
              Continue with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border-default" />
            <span className="font-ui text-sm text-text-muted">or try a demo</span>
            <div className="flex-1 h-px bg-border-default" />
          </div>

          {/* Role Selector */}
          <div className="space-y-2 mb-6">
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                  selectedRole === role.value
                    ? 'bg-cyan/8 border-cyan/40 text-text-primary shadow-[0_0_20px_rgba(0,212,255,0.08)]'
                    : 'bg-bg-surface-1 border-border-default text-text-secondary hover:border-border-bright hover:bg-bg-surface-2'
                }`}
              >
                <span className="text-xl">{role.icon}</span>
                <div className="flex-1">
                  <div className="font-display text-sm font-semibold">{role.label}</div>
                  <div className="font-ui text-xs text-text-muted mt-0.5">{role.description}</div>
                </div>
                {selectedRole === role.value && (
                  <motion.div
                    className="w-2.5 h-2.5 rounded-full bg-cyan"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Login Button */}
          <motion.button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan to-cyan/80 text-bg-base font-display text-base font-bold tracking-wider cursor-pointer disabled:opacity-50 transition-all hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Connecting to Donna...' : `Enter as ${roles.find(r => r.value === selectedRole)?.label}`}
          </motion.button>

          <p className="text-center font-ui text-sm text-text-muted mt-6">
            Powered by Claude API + MCP Stack
          </p>
        </motion.div>
      </div>
    </div>
  );
}
