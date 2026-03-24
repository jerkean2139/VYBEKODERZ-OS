import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuid } from 'uuid';

// ============================================================
// VybeKoderz Memory Engine — Simplified
//
// Two stores, not five:
//   1. Context Memory — vector-indexed, searchable facts/logs/relationships
//   2. SOPs — versioned procedure documents
//
// The old 5-layer model (episodic/semantic/procedural/relational/predictive)
// was overengineered. In practice you need searchable context and versioned SOPs.
// ============================================================

const client = new Anthropic();

export type MemoryType = 'context' | 'sop';

// Legacy type aliases for backward compatibility with existing API consumers
export type LegacyMemoryType = 'episodic' | 'semantic' | 'procedural' | 'relational' | 'predictive';

// Map legacy types to new types
export function normalizeLegacyType(type: string): MemoryType {
  if (type === 'sop' || type === 'procedural') return 'sop';
  return 'context'; // episodic, semantic, relational, predictive all collapse to context
}

export interface Memory {
  id: string;
  tenantId: string;
  type: MemoryType;
  agentId: string | null;
  scope: 'global' | 'tenant' | 'agent';
  content: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  sourceTaskId: string | null;
  sourceType: string | null; // 'conversation' | 'task' | 'override' | 'sop' | 'observation' | 'webhook'
  confidence: number;
  accessCount: number;
  connections: MemoryConnection[];
  version: number;
  isActive: boolean;
  tags: string[]; // searchable tags for filtering
  createdAt: string;
  updatedAt: string;
}

export interface MemoryConnection {
  memoryId: string;
  relationship: string;
  strength: number; // 0-1
}

export interface MemoryQuery {
  tenantId: string;
  type?: MemoryType;
  agentId?: string;
  tags?: string[];
  query?: string;
  limit?: number;
  minConfidence?: number;
}

// In-memory store (replaced by DB when DATABASE_URL is set)
const memoryStore: Map<string, Memory> = new Map();

// ============================================================
// MEMORY STORAGE
// ============================================================

export function storeMemory(params: {
  tenantId: string;
  type: MemoryType;
  content: string;
  agentId?: string;
  sourceTaskId?: string;
  sourceType?: string;
  metadata?: Record<string, unknown>;
  confidence?: number;
  tags?: string[];
}): Memory {
  const memory: Memory = {
    id: uuid(),
    tenantId: params.tenantId,
    type: params.type,
    agentId: params.agentId ?? null,
    scope: params.agentId ? 'agent' : 'tenant',
    content: params.content,
    summary: null,
    metadata: params.metadata ?? {},
    sourceTaskId: params.sourceTaskId ?? null,
    sourceType: params.sourceType ?? null,
    confidence: params.confidence ?? 0.85,
    accessCount: 0,
    connections: [],
    version: 1,
    isActive: true,
    tags: params.tags ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.set(memory.id, memory);
  return memory;
}

// ============================================================
// CONTEXT MEMORY — searchable facts, logs, relationships
// ============================================================

export function storeContext(
  tenantId: string,
  content: string,
  opts?: { agentId?: string; taskId?: string; sourceType?: string; tags?: string[]; confidence?: number }
): Memory {
  return storeMemory({
    tenantId,
    type: 'context',
    content,
    agentId: opts?.agentId,
    sourceTaskId: opts?.taskId,
    sourceType: opts?.sourceType ?? 'observation',
    confidence: opts?.confidence ?? 0.85,
    tags: opts?.tags ?? [],
  });
}

// ============================================================
// SOP MEMORY — versioned procedure documents
// ============================================================

export function storeSOP(
  tenantId: string,
  content: string,
  opts?: { agentId?: string; previousId?: string; tags?: string[] }
): Memory {
  const memory = storeMemory({
    tenantId,
    type: 'sop',
    content,
    agentId: opts?.agentId,
    sourceType: 'sop',
    confidence: 0.9,
    tags: opts?.tags ?? ['sop'],
  });

  // Version chain
  if (opts?.previousId) {
    const previous = memoryStore.get(opts.previousId);
    if (previous) {
      memory.version = previous.version + 1;
      previous.isActive = false;
    }
  }

  return memory;
}

// ============================================================
// LEGACY ALIASES — backward compatibility
// ============================================================

export function storeEpisodic(tenantId: string, content: string, agentId?: string, taskId?: string): Memory {
  return storeContext(tenantId, content, { agentId, taskId, sourceType: 'conversation', tags: ['log'], confidence: 0.95 });
}

export function storeSemantic(tenantId: string, content: string, metadata?: Record<string, unknown>): Memory {
  return storeContext(tenantId, content, { sourceType: 'observation', tags: ['fact'] });
}

export function storeProcedural(tenantId: string, content: string, agentId?: string, previousId?: string): Memory {
  return storeSOP(tenantId, content, { agentId, previousId });
}

export function storeRelational(tenantId: string, content: string, _connections?: MemoryConnection[]): Memory {
  return storeContext(tenantId, content, { sourceType: 'observation', tags: ['relationship'] });
}

export function storePredictive(tenantId: string, content: string, _metadata?: Record<string, unknown>): Memory {
  return storeContext(tenantId, content, { sourceType: 'analysis', tags: ['pattern'], confidence: 0.7 });
}

// ============================================================
// MEMORY RETRIEVAL
// ============================================================

export function queryMemories(params: MemoryQuery): Memory[] {
  let results = Array.from(memoryStore.values())
    .filter(m => m.tenantId === params.tenantId && m.isActive);

  if (params.type) {
    results = results.filter(m => m.type === params.type);
  }

  if (params.agentId) {
    results = results.filter(m => m.agentId === params.agentId || m.scope !== 'agent');
  }

  if (params.minConfidence) {
    results = results.filter(m => m.confidence >= params.minConfidence);
  }

  if (params.tags?.length) {
    results = results.filter(m => params.tags!.some(t => m.tags.includes(t)));
  }

  // Sort by relevance (confidence * recency)
  results.sort((a, b) => {
    const aScore = a.confidence * (1 / (Date.now() - new Date(a.updatedAt).getTime() + 1));
    const bScore = b.confidence * (1 / (Date.now() - new Date(b.updatedAt).getTime() + 1));
    return bScore - aScore;
  });

  if (params.limit) {
    results = results.slice(0, params.limit);
  }

  // Track access
  for (const m of results) {
    m.accessCount++;
  }

  return results;
}

export function getMemory(id: string): Memory | undefined {
  return memoryStore.get(id);
}

export function getMemoryStats(tenantId: string) {
  const all = Array.from(memoryStore.values()).filter(m => m.tenantId === tenantId && m.isActive);

  const byType: Record<string, number> = {};
  let totalConfidence = 0;
  let connectionCount = 0;

  for (const m of all) {
    byType[m.type] = (byType[m.type] || 0) + 1;
    totalConfidence += m.confidence;
    connectionCount += m.connections.length;
  }

  return {
    totalMemories: all.length,
    confidenceAvg: all.length > 0 ? Math.round((totalConfidence / all.length) * 100) : 0,
    connectionCount,
    byType,
  };
}

// ============================================================
// MEMORY ANALYSIS — Claude-powered connection discovery
// ============================================================

export async function analyzeConnections(tenantId: string): Promise<MemoryConnection[]> {
  const recent = queryMemories({ tenantId, limit: 20 });
  if (recent.length < 3) return [];

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6-20250514',
      max_tokens: 1024,
      system: `You analyze memory items and discover connections between them.
Return a JSON array of connections: [{"fromIndex": 0, "toIndex": 1, "relationship": "causes", "strength": 0.8}]
Only return strong, meaningful connections. Maximum 5 connections.`,
      messages: [{
        role: 'user',
        content: `Find connections between these memories:\n${recent.map((m, i) => `[${i}] (${m.type}) ${m.content}`).join('\n')}`,
      }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '[]';
    const rawConnections = JSON.parse(text);

    const connections: MemoryConnection[] = [];
    for (const conn of rawConnections) {
      const from = recent[conn.fromIndex];
      const to = recent[conn.toIndex];
      if (from && to) {
        const mc: MemoryConnection = {
          memoryId: to.id,
          relationship: conn.relationship,
          strength: conn.strength,
        };
        from.connections.push(mc);
        connections.push(mc);
      }
    }

    return connections;
  } catch {
    return [];
  }
}

// ============================================================
// SEED DEMO MEMORIES
// ============================================================

export function seedDemoMemories(tenantId: string) {
  // Context memories
  storeContext(tenantId, 'Client prefers Loom video walkthroughs over written documentation', { sourceType: 'conversation', tags: ['preference', 'client'] });
  storeContext(tenantId, 'Weekly standup moved from Monday 9am to Tuesday 10am per client request', { sourceType: 'conversation', tags: ['schedule', 'client'] });
  storeContext(tenantId, 'Acme Corp primary contact: Sarah Chen, VP Operations', { sourceType: 'observation', tags: ['contact', 'client'] });
  storeContext(tenantId, 'Client billing cycle: net-30, invoice on 1st of month', { sourceType: 'observation', tags: ['billing', 'client'] });
  storeContext(tenantId, 'Invoice delays correlate with board meeting weeks — CFO unavailable for approvals', { sourceType: 'observation', tags: ['relationship', 'billing'] });
  storeContext(tenantId, 'Support request volume spikes on Mondays — related to weekend system issues', { sourceType: 'observation', tags: ['pattern', 'support'] });

  // SOPs
  storeSOP(tenantId, 'Empire Title Weekly SOP: 1) Login to SoftPro 2) Pull closing schedule 3) Export to CSV 4) Generate Monday briefing 5) Send via Slack', { tags: ['empire-title', 'weekly'] });
  storeSOP(tenantId, 'GHL Follow-up Sequence: Check last contact → Wait 3 days → Send personalized email → Log in CRM → Set reminder for 7 days', { tags: ['ghl', 'follow-up'] });
}
