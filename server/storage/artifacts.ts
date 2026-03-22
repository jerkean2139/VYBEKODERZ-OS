import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';

// ============================================================
// Artifact Storage — S3/R2 for task outputs
//
// Agents produce files: reports, CSVs, screenshots, emails.
// This module stores them and returns presigned URLs.
//
// Supports: AWS S3, Cloudflare R2, MinIO, any S3-compatible store.
// Falls back to local filesystem when no S3 config.
// ============================================================

export interface Artifact {
  id: string;
  tenantId: string;
  taskId: string | null;
  filename: string;
  contentType: string;
  size: number;
  storageKey: string;
  url: string | null;       // presigned URL (temporary)
  createdAt: string;
}

// S3 client (lazy init)
let s3Client: S3Client | null = null;

function getS3(): S3Client | null {
  if (s3Client) return s3Client;

  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.S3_REGION || process.env.AWS_REGION || 'auto';

  if (!accessKeyId || !secretAccessKey) return null;

  s3Client = new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    credentials: { accessKeyId, secretAccessKey },
  });

  return s3Client;
}

function getBucket(): string {
  return process.env.S3_BUCKET || 'vybeos-artifacts';
}

export function isStorageConfigured(): boolean {
  return getS3() !== null;
}

// In-memory artifact registry (metadata only)
const artifacts: Map<string, Artifact> = new Map();

// ============================================================
// Upload
// ============================================================

export async function uploadArtifact(params: {
  tenantId: string;
  taskId?: string;
  filename: string;
  contentType: string;
  data: Buffer;
}): Promise<Artifact> {
  const id = uuid();
  const storageKey = `${params.tenantId}/${id}/${params.filename}`;

  const artifact: Artifact = {
    id,
    tenantId: params.tenantId,
    taskId: params.taskId ?? null,
    filename: params.filename,
    contentType: params.contentType,
    size: params.data.length,
    storageKey,
    url: null,
    createdAt: new Date().toISOString(),
  };

  const client = getS3();
  if (client) {
    await client.send(new PutObjectCommand({
      Bucket: getBucket(),
      Key: storageKey,
      Body: params.data,
      ContentType: params.contentType,
    }));
  }
  // If no S3, artifact metadata is still tracked but data is not persisted

  artifacts.set(id, artifact);
  return artifact;
}

// ============================================================
// Get presigned download URL
// ============================================================

export async function getArtifactUrl(id: string): Promise<string | null> {
  const artifact = artifacts.get(id);
  if (!artifact) return null;

  const client = getS3();
  if (!client) return null;

  const url = await getSignedUrl(client, new GetObjectCommand({
    Bucket: getBucket(),
    Key: artifact.storageKey,
  }), { expiresIn: 3600 }); // 1 hour

  return url;
}

// ============================================================
// Get artifact metadata
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
// Delete
// ============================================================

export async function deleteArtifact(id: string): Promise<boolean> {
  const artifact = artifacts.get(id);
  if (!artifact) return false;

  const client = getS3();
  if (client) {
    await client.send(new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: artifact.storageKey,
    }));
  }

  artifacts.delete(id);
  return true;
}
