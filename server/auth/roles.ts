// ============================================================
// VybeKoderz Role Matrix
// Super Admin → Agency Admin → Project Lead → Builder → Client Viewer
// ============================================================

export type Role = 'super_admin' | 'agency_admin' | 'project_lead' | 'builder' | 'client_viewer';

interface RolePermissions {
  canManageTenants: boolean;
  canManageUsers: boolean;
  canManageAgents: boolean;
  canCreateTasks: boolean;
  canOverrideTasks: boolean;
  canViewAllTasks: boolean;
  canAccessMemory: boolean;
  canEditSOPs: boolean;
  canViewDashboard: boolean;
  canManageBilling: boolean;
}

const roleHierarchy: Role[] = ['super_admin', 'agency_admin', 'project_lead', 'builder', 'client_viewer'];

const permissions: Record<Role, RolePermissions> = {
  super_admin: {
    canManageTenants: true,
    canManageUsers: true,
    canManageAgents: true,
    canCreateTasks: true,
    canOverrideTasks: true,
    canViewAllTasks: true,
    canAccessMemory: true,
    canEditSOPs: true,
    canViewDashboard: true,
    canManageBilling: true,
  },
  agency_admin: {
    canManageTenants: false,
    canManageUsers: true,
    canManageAgents: true,
    canCreateTasks: true,
    canOverrideTasks: true,
    canViewAllTasks: true,
    canAccessMemory: true,
    canEditSOPs: true,
    canViewDashboard: true,
    canManageBilling: true,
  },
  project_lead: {
    canManageTenants: false,
    canManageUsers: false,
    canManageAgents: false,
    canCreateTasks: true,
    canOverrideTasks: true,
    canViewAllTasks: true,
    canAccessMemory: true,
    canEditSOPs: true,
    canViewDashboard: true,
    canManageBilling: false,
  },
  builder: {
    canManageTenants: false,
    canManageUsers: false,
    canManageAgents: false,
    canCreateTasks: true,
    canOverrideTasks: false,
    canViewAllTasks: false,
    canAccessMemory: false,
    canEditSOPs: false,
    canViewDashboard: true,
    canManageBilling: false,
  },
  client_viewer: {
    canManageTenants: false,
    canManageUsers: false,
    canManageAgents: false,
    canCreateTasks: false,
    canOverrideTasks: false,
    canViewAllTasks: false,
    canAccessMemory: false,
    canEditSOPs: false,
    canViewDashboard: true,
    canManageBilling: false,
  },
};

export function getPermissions(role: Role): RolePermissions {
  return permissions[role];
}

export function hasPermission(role: Role, permission: keyof RolePermissions): boolean {
  return permissions[role][permission];
}

export function isRoleAtLeast(role: Role, minRole: Role): boolean {
  return roleHierarchy.indexOf(role) <= roleHierarchy.indexOf(minRole);
}
