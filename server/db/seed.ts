import { db } from './connection';
import { createTenant, createUser } from './repository';
import * as schema from './schema';

/**
 * Seed the database with demo data.
 * Usage: npx tsx server/db/seed.ts
 */
async function main() {
  console.log('Seeding database...');

  // 1. Create VybeKoderz tenant (Super Admin org)
  const vybekoderz = await createTenant({
    name: 'VybeKoderz',
    slug: 'vybekoderz',
    plan: 'enterprise',
    primaryColor: '#00D4FF',
    donnaName: 'Donna',
  });
  console.log(`  Created tenant: ${vybekoderz.name} (${vybekoderz.id})`);

  // 2. Create demo client tenants
  const empireTitle = await createTenant({
    name: 'Empire Title Company',
    slug: 'empire-title',
    plan: 'pro',
    primaryColor: '#7B2FFF',
  });
  console.log(`  Created tenant: ${empireTitle.name}`);

  const acmeDigital = await createTenant({
    name: 'Acme Digital Agency',
    slug: 'acme-digital',
    plan: 'pro',
  });
  console.log(`  Created tenant: ${acmeDigital.name}`);

  // 3. Create Super Admin user
  const superAdmin = await createUser({
    tenantId: vybekoderz.id,
    email: 'admin@vybekoderz.com',
    name: 'VybeKoderz Admin',
    role: 'super_admin',
  });
  console.log(`  Created super admin: ${superAdmin.email}`);

  // 4. Create team members
  const alex = await createUser({
    tenantId: vybekoderz.id,
    email: 'alex@vybekoderz.com',
    name: 'Alex Chen',
    role: 'agency_admin',
  });

  await createUser({
    tenantId: vybekoderz.id,
    email: 'sarah@vybekoderz.com',
    name: 'Sarah Kim',
    role: 'project_lead',
  });

  await createUser({
    tenantId: vybekoderz.id,
    email: 'dev@vybekoderz.com',
    name: 'Dev Patel',
    role: 'builder',
  });
  console.log('  Created 3 team members');

  // 5. Create client viewer
  await createUser({
    tenantId: empireTitle.id,
    email: 'john@empiretitle.com',
    name: 'John Martinez',
    role: 'client_viewer',
  });
  console.log('  Created client viewer for Empire Title');

  // 6. Seed agent definitions for VybeKoderz
  const agentDefs = [
    { agentId: 'donna', name: 'Donna', tier: 'org' as const, color: '#00D4FF', department: null },
    { agentId: 'sales-agent', name: 'Sales Agent', tier: 'department' as const, color: '#7B2FFF', department: 'sales' as const },
    { agentId: 'ops-agent', name: 'Ops Agent', tier: 'department' as const, color: '#7B2FFF', department: 'ops' as const },
    { agentId: 'marketing-agent', name: 'Marketing Agent', tier: 'department' as const, color: '#7B2FFF', department: 'marketing' as const },
    { agentId: 'dev-agent', name: 'Dev Agent', tier: 'department' as const, color: '#7B2FFF', department: 'dev' as const },
  ];

  for (const def of agentDefs) {
    await db.insert(schema.agentDefinitions).values({
      tenantId: vybekoderz.id,
      agentId: def.agentId,
      name: def.name,
      tier: def.tier,
      department: def.department,
      color: def.color,
    });
  }
  console.log('  Created 5 agent definitions');

  // 7. Seed demo memories
  const memorySeeds = [
    { type: 'episodic' as const, content: 'Client prefers Loom video walkthroughs over written documentation', confidence: 0.95, sourceType: 'conversation' },
    { type: 'episodic' as const, content: 'Weekly standup moved from Monday 9am to Tuesday 10am per client request', confidence: 0.95, sourceType: 'conversation' },
    { type: 'semantic' as const, content: 'Acme Corp primary contact: Sarah Chen, VP Operations', confidence: 0.85, sourceType: 'observation' },
    { type: 'semantic' as const, content: 'Client billing cycle: net-30, invoice on 1st of month', confidence: 0.85, sourceType: 'observation' },
    { type: 'procedural' as const, content: 'Empire Title Weekly SOP: 1) Login to SoftPro 2) Pull closing schedule 3) Export to CSV 4) Generate Monday briefing', confidence: 0.9, sourceType: 'sop' },
    { type: 'relational' as const, content: 'Invoice delays correlate with board meeting weeks — CFO unavailable for approvals', confidence: 0.75, sourceType: 'observation' },
    { type: 'predictive' as const, content: 'Client likely to request Q2 planning session in next 2 weeks based on previous year pattern', confidence: 0.7, sourceType: 'analysis' },
  ];

  for (const mem of memorySeeds) {
    await db.insert(schema.memories).values({
      tenantId: vybekoderz.id,
      type: mem.type,
      content: mem.content,
      confidence: mem.confidence,
      sourceType: mem.sourceType,
      scope: 'tenant',
    });
  }
  console.log('  Created 7 demo memories');

  console.log('\nSeed complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
