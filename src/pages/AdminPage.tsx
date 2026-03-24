import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, Shield, UserPlus, Copy, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface Tenant {
  id: string;
  name: string;
  plan: 'starter' | 'pro' | 'enterprise';
  users: number;
  agents: number;
  tasksThisMonth: number;
  status: 'active' | 'suspended';
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
  status: 'active' | 'invited';
}

const demoTenants: Tenant[] = [
  { id: '1', name: 'VybeKoderz', plan: 'enterprise', users: 8, agents: 17, tasksThisMonth: 142, status: 'active' },
  { id: '2', name: 'Empire Title Company', plan: 'pro', users: 3, agents: 6, tasksThisMonth: 67, status: 'active' },
  { id: '3', name: 'Acme Digital Agency', plan: 'pro', users: 5, agents: 8, tasksThisMonth: 89, status: 'active' },
  { id: '4', name: 'StartupXYZ', plan: 'starter', users: 1, agents: 4, tasksThisMonth: 12, status: 'active' },
];

const demoTeam: TeamMember[] = [
  { id: '1', name: 'Alex Chen', email: 'alex@vybekoderz.com', role: 'Agency Admin', lastActive: '2m ago', status: 'active' },
  { id: '2', name: 'Sarah Kim', email: 'sarah@vybekoderz.com', role: 'Project Lead', lastActive: '1h ago', status: 'active' },
  { id: '3', name: 'Dev Patel', email: 'dev@vybekoderz.com', role: 'Builder', lastActive: '3h ago', status: 'active' },
  { id: '4', name: 'invite pending', email: 'new@client.com', role: 'Client Viewer', lastActive: '—', status: 'invited' },
];

const planBadge: Record<string, string> = {
  starter: 'text-text-muted bg-bg-surface-3 border-border-default',
  pro: 'text-violet bg-[var(--violet-dim)] border-violet/30',
  enterprise: 'text-cyan bg-[var(--cyan-dim)] border-cyan/30',
};

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'tenants' | 'team' | 'settings'>('tenants');
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-lg font-bold text-text-primary tracking-wider">Admin Panel</h1>
          <p className="font-body text-[10px] text-text-muted mt-0.5">
            {isSuperAdmin ? 'Super Admin — manage all tenants & users' : 'Manage your workspace'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-bg-surface-1 border border-border-default rounded-lg p-1 w-fit">
        {[
          { key: 'tenants', label: 'Tenants', icon: <Building2 size={12} />, show: isSuperAdmin },
          { key: 'team', label: 'Team', icon: <Users size={12} />, show: true },
          { key: 'settings', label: 'Settings', icon: <Shield size={12} />, show: true },
        ].filter(t => t.show).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-display text-[10px] font-semibold tracking-wider cursor-pointer transition-colors ${
              tab === t.key
                ? 'bg-bg-surface-3 text-text-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tenants Tab */}
      {tab === 'tenants' && isSuperAdmin && (
        <div className="space-y-2">
          {demoTenants.map((tenant, i) => (
            <motion.div
              key={tenant.id}
              className="bg-bg-surface-1 border border-border-default rounded-xl px-4 py-3 flex items-center gap-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="w-9 h-9 rounded-lg bg-bg-surface-3 border border-border-default flex items-center justify-center">
                <Building2 size={14} className="text-text-muted" />
              </div>
              <div className="flex-1">
                <div className="font-display text-[12px] font-semibold text-text-primary">{tenant.name}</div>
                <div className="font-body text-[9px] text-text-muted">
                  {tenant.users} users · {tenant.agents} agents · {tenant.tasksThisMonth} tasks/mo
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded-full border font-body text-[9px] ${planBadge[tenant.plan]}`}>
                {tenant.plan}
              </div>
              <div className={`w-2 h-2 rounded-full ${tenant.status === 'active' ? 'bg-mint' : 'bg-red'}`} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Team Tab */}
      {tab === 'team' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="font-body text-[10px] text-text-muted">{demoTeam.length} members</div>
            <motion.button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan text-bg-base font-display text-[10px] font-bold tracking-wider cursor-pointer"
              whileTap={{ scale: 0.98 }}
            >
              <UserPlus size={12} />
              Invite
            </motion.button>
          </div>

          <div className="space-y-2">
            {demoTeam.map((member, i) => (
              <motion.div
                key={member.id}
                className="bg-bg-surface-1 border border-border-default rounded-xl px-4 py-3 flex items-center gap-4"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="w-8 h-8 rounded-full bg-bg-surface-3 border border-border-default flex items-center justify-center font-display text-[11px] font-bold text-text-muted">
                  {member.status === 'invited' ? '?' : member.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className={`font-display text-[11px] font-semibold ${member.status === 'invited' ? 'text-text-muted italic' : 'text-text-primary'}`}>
                    {member.name}
                  </div>
                  <div className="font-body text-[9px] text-text-muted">{member.email}</div>
                </div>
                <div className="font-body text-[9px] text-violet bg-[var(--violet-dim)] border border-violet/30 rounded-full px-2 py-0.5">
                  {member.role}
                </div>
                <div className="font-body text-[9px] text-text-muted w-12 text-right">{member.lastActive}</div>
                <div className="flex gap-1">
                  {member.status === 'invited' && (
                    <button className="w-6 h-6 rounded bg-bg-surface-3 flex items-center justify-center text-text-muted hover:text-text-primary cursor-pointer transition-colors">
                      <Copy size={10} />
                    </button>
                  )}
                  <button className="w-6 h-6 rounded bg-bg-surface-3 flex items-center justify-center text-text-muted hover:text-red cursor-pointer transition-colors">
                    <Trash2 size={10} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="max-w-lg space-y-4">
          {[
            { label: 'Workspace Name', value: 'VybeKoderz', type: 'text' },
            { label: 'Custom Donna Name', value: 'Donna', type: 'text' },
            { label: 'Primary Brand Color', value: '#00D4FF', type: 'color' },
            { label: 'Custom Domain', value: '', type: 'text', placeholder: 'app.yourcompany.com' },
          ].map((field) => (
            <div key={field.label}>
              <label className="block font-display text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-1">
                {field.label}
              </label>
              <input
                type={field.type === 'color' ? 'text' : 'text'}
                defaultValue={field.value}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg bg-bg-surface-2 border border-border-default text-text-primary font-body text-sm focus:outline-none focus:border-cyan/50 transition-colors"
              />
            </div>
          ))}

          <motion.button
            className="px-4 py-2 rounded-lg bg-cyan text-bg-base font-display text-[11px] font-bold tracking-wider cursor-pointer"
            whileTap={{ scale: 0.98 }}
          >
            Save Changes
          </motion.button>
        </div>
      )}
    </div>
  );
}
