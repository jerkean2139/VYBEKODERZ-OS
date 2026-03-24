import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../../server/auth/roles';

const roles: { value: Role; label: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'VybeKoderz — full platform access' },
  { value: 'agency_admin', label: 'Agency Admin', description: 'Team lead — manage agents & tasks' },
  { value: 'project_lead', label: 'Project Lead', description: 'Client lead — tasks & overrides' },
  { value: 'builder', label: 'Builder', description: 'Team member — create tasks' },
  { value: 'client_viewer', label: 'Client Viewer', description: 'Read-only portal' },
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
    <div className="h-screen w-screen bg-bg-base flex items-center justify-center">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl border border-cyan/30 bg-[var(--cyan-dim)] flex items-center justify-center"
            animate={{ boxShadow: ['0 0 20px rgba(0,212,255,0.2)', '0 0 40px rgba(0,212,255,0.4)', '0 0 20px rgba(0,212,255,0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="font-display text-2xl font-bold text-cyan">V</span>
          </motion.div>
          <h1 className="font-display text-xl font-bold text-text-primary tracking-wider">
            VybeKoderz AI Agent OS
          </h1>
          <p className="font-body text-xs text-text-muted mt-1">Mission Control Access</p>
        </div>

        {/* Login Card */}
        <div className="bg-bg-surface-1 border border-border-default rounded-xl p-6">
          {/* OAuth Providers */}
          <div className="space-y-2 mb-4">
            <button
              onClick={() => loginWithProvider('google')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-bg-surface-2 border border-border-default hover:border-border-bright text-text-primary font-ui text-sm transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button
              onClick={() => loginWithProvider('microsoft')}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-bg-surface-2 border border-border-default hover:border-border-bright text-text-primary font-ui text-sm transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
              Continue with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border-default" />
            <span className="font-body text-[10px] text-text-muted uppercase tracking-wider">Demo Login</span>
            <div className="flex-1 h-px bg-border-default" />
          </div>

          {/* Role Selector */}
          <div className="space-y-1.5 mb-4">
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                  selectedRole === role.value
                    ? 'bg-[var(--cyan-dim)] border-cyan/40 text-text-primary'
                    : 'bg-bg-surface-2 border-border-default text-text-secondary hover:border-border-bright'
                }`}
              >
                <div className="font-display text-[11px] font-semibold">{role.label}</div>
                <div className="font-body text-[9px] text-text-muted">{role.description}</div>
              </button>
            ))}
          </div>

          {/* Login Button */}
          <motion.button
            onClick={handleDemoLogin}
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-cyan text-bg-base font-display text-sm font-bold tracking-wider cursor-pointer disabled:opacity-50 transition-colors hover:bg-cyan/90"
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Connecting...' : `Enter as ${roles.find(r => r.value === selectedRole)?.label}`}
          </motion.button>
        </div>

        <p className="text-center font-body text-[9px] text-text-muted mt-4">
          Powered by Claude API + MCP Stack
        </p>
      </motion.div>
    </div>
  );
}
