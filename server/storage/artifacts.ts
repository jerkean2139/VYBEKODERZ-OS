import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';

// ============================================================
// Artifact Storage — Railway Volume (local disk)
//
// Agents produce files: reports, CSVs, screenshots, emails.
// Stored on a Railway Volume mounted at STORAGE_PATH (default: /data/artifacts).
// Served directly via Express — no S3 needed.
// ============================================================

export interface Artifact {
  id: string;
  tenantId: string;
  taskId: string | null;
  filename: string;
  contentType: string;
  size: number;
  storagePath: string;       // absolute path on disk
  createdAt: string;
}

// Storage root — Railway Volume mount point or local fallback
const STORAGE_ROOT = process.env.STORAGE_PATH || path.join(process.cwd(), 'data', 'artifacts');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Initialize storage directory on import
ensureDir(STORAGE_ROOT);

export function isStorageConfigured(): boolean {
  return true; // Always configured — local disk is always available
}

export function getStorageRoot(): string {
  return STORAGE_ROOT;
}

// In-memory artifact registry (metadata)
const artifacts: Map<string, Artifact> = new Map();

// ============================================================
// Upload — write to disk
// ============================================================

export async function uploadArtifact(params: {
  tenantId: string;
  taskId?: string;
  filename: string;
  contentType: string;
  data: Buffer;
}): Promise<Artifact> {
  const id = uuid();

  // Tenant-scoped directory: /data/artifacts/<tenantId>/<artifactId>/
  const artifactDir = path.join(STORAGE_ROOT, params.tenantId, id);
  ensureDir(artifactDir);

  // Sanitize filename — strip path separators to prevent traversal
  const safeName = path.basename(params.filename);
  const filePath = path.join(artifactDir, safeName);

  // Write file to disk
  await fs.promises.writeFile(filePath, params.data);

  const artifact: Artifact = {
    id,
    tenantId: params.tenantId,
    taskId: params.taskId ?? null,
    filename: safeName,
    contentType: params.contentType,
    size: params.data.length,
    storagePath: filePath,
    createdAt: new Date().toISOString(),
  };

  artifacts.set(id, artifact);
  return artifact;
}

// ============================================================
// Download — stream from disk
// ============================================================

export function getArtifactPath(id: string): { filePath: string; contentType: string; filename: string } | null {
  const artifact = artifacts.get(id);
  if (!artifact) return null;
  if (!fs.existsSync(artifact.storagePath)) return null;
  return {
    filePath: artifact.storagePath,
    contentType: artifact.contentType,
    filename: artifact.filename,
  };
}

// ============================================================
// Metadata
// ============================================================

export function getArtifact(id: string): Artifact | undefined {
  return artifacts.get(id);
}

export function getArtifactsByTask(taskId: string): Artifact[] {
  return Array.from(artifacts.values()).filter(a => a.taskId === taskId);
}

export function getArtifactsByTenant(tenantId: string): Artifact[] {
  return Array.from(artifacts.values())
    .filter(a => a.tenantId === tenantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ============================================================
// Delete — remove from disk + registry
// ============================================================

export async function deleteArtifact(id: string): Promise<boolean> {
  const artifact = artifacts.get(id);
  if (!artifact) return false;

  // Remove file from disk
  if (fs.existsSync(artifact.storagePath)) {
    await fs.promises.unlink(artifact.storagePath);
  }

  // Clean up empty parent directory
  const parentDir = path.dirname(artifact.storagePath);
  try {
    const remaining = await fs.promises.readdir(parentDir);
    if (remaining.length === 0) {
      await fs.promises.rmdir(parentDir);
    }
  } catch {
    // Directory cleanup is best-effort
  }

  artifacts.delete(id);
  return true;
}
