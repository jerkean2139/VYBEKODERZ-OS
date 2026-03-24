-- ============================================================
-- VybeKoderz AI Agent OS — Row-Level Security Policies
-- Run this AFTER initial schema migration
-- ============================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE iq_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (important for security)
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE invites FORCE ROW LEVEL SECURITY;
ALTER TABLE agent_definitions FORCE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE memories FORCE ROW LEVEL SECURITY;
ALTER TABLE iq_scores FORCE ROW LEVEL SECURITY;
ALTER TABLE memory_reports FORCE ROW LEVEL SECURITY;
ALTER TABLE overrides FORCE ROW LEVEL SECURITY;
ALTER TABLE browser_sessions FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Tenant isolation policies
-- Each policy restricts access to rows matching the current tenant
-- Set via: SELECT set_config('app.current_tenant_id', '<uuid>', true)
-- ============================================================

-- Users
CREATE POLICY tenant_isolation_users ON users
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Invites
CREATE POLICY tenant_isolation_invites ON invites
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Agent Definitions
CREATE POLICY tenant_isolation_agents ON agent_definitions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Tasks
CREATE POLICY tenant_isolation_tasks ON tasks
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Memories
CREATE POLICY tenant_isolation_memories ON memories
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- IQ Scores
CREATE POLICY tenant_isolation_iq ON iq_scores
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Memory Reports
CREATE POLICY tenant_isolation_reports ON memory_reports
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Overrides
CREATE POLICY tenant_isolation_overrides ON overrides
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Browser Sessions
CREATE POLICY tenant_isolation_browser ON browser_sessions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- ============================================================
-- Super Admin bypass (VybeKoderz can see all tenants)
-- ============================================================

CREATE POLICY super_admin_users ON users
  FOR ALL USING (current_setting('app.is_super_admin', true)::boolean = true);

CREATE POLICY super_admin_tasks ON tasks
  FOR ALL USING (current_setting('app.is_super_admin', true)::boolean = true);

CREATE POLICY super_admin_memories ON memories
  FOR ALL USING (current_setting('app.is_super_admin', true)::boolean = true);

-- ============================================================
-- Global memory access (org-level memories visible to all tenants)
-- ============================================================

CREATE POLICY global_memory_read ON memories
  FOR SELECT USING (scope = 'global');
