import { v4 as uuid } from 'uuid';

// ============================================================
// Notification / Activity Feed
//
// Tracks platform events: task routed, SOP completed, webhook
// received, memory stored, override triggered, errors.
// Broadcasts via SSE to dashboard in real time.
// ============================================================

export interface Notification {
  id: string;
  tenantId: string;
  type: string;       // 'task_routed' | 'task_error' | 'sop_completed' | 'sop_failed' | 'webhook_received' | 'memory_stored' | 'override' | etc
  title: string;
  message: string;
  agentId?: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
}

// In-memory store (capped ring buffer per tenant)
const MAX_PER_TENANT = 100;
const feeds: Map<string, Notification[]> = new Map();

// SSE listeners
const listeners: Set<(notification: Notification) => void> = new Set();

export function onNotification(listener: (notification: Notification) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addNotification(params: {
  tenantId: string;
  type: string;
  title: string;
  message: string;
  agentId?: string;
  taskId?: string;
}): Notification {
  const notification: Notification = {
    id: uuid(),
    tenantId: params.tenantId,
    type: params.type,
    title: params.title,
    message: params.message,
    agentId: params.agentId,
    taskId: params.taskId,
    read: false,
    createdAt: new Date().toISOString(),
  };

  // Store in ring buffer
  let feed = feeds.get(params.tenantId);
  if (!feed) {
    feed = [];
    feeds.set(params.tenantId, feed);
  }
  feed.unshift(notification);
  if (feed.length > MAX_PER_TENANT) {
    feed.pop();
  }

  // Broadcast
  for (const listener of listeners) {
    listener(notification);
  }

  return notification;
}

export function getNotifications(tenantId: string, opts?: { limit?: number; unreadOnly?: boolean }): Notification[] {
  let feed = feeds.get(tenantId) ?? [];
  if (opts?.unreadOnly) {
    feed = feed.filter(n => !n.read);
  }
  if (opts?.limit) {
    feed = feed.slice(0, opts.limit);
  }
  return feed;
}

export function markRead(tenantId: string, notificationId: string): boolean {
  const feed = feeds.get(tenantId);
  if (!feed) return false;
  const notification = feed.find(n => n.id === notificationId);
  if (!notification) return false;
  notification.read = true;
  return true;
}

export function markAllRead(tenantId: string): number {
  const feed = feeds.get(tenantId);
  if (!feed) return 0;
  let count = 0;
  for (const n of feed) {
    if (!n.read) { n.read = true; count++; }
  }
  return count;
}

export function getUnreadCount(tenantId: string): number {
  const feed = feeds.get(tenantId) ?? [];
  return feed.filter(n => !n.read).length;
}
