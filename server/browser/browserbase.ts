// ============================================================
// Browserbase Integration
//
// Cloud-managed browser sessions for SOP execution.
// Provides real Playwright-compatible browser instances
// with session recording, screenshots, and noVNC access.
//
// Requires: BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID
// ============================================================

const API_BASE = 'https://www.browserbase.com/v1';

export interface BrowserbaseConfig {
  apiKey: string;
  projectId: string;
}

export interface BrowserbaseSession {
  id: string;
  projectId: string;
  status: 'RUNNING' | 'COMPLETED' | 'ERROR' | 'TIMED_OUT';
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  expiresAt: string;
  region: string;
  proxyConfig: unknown | null;
  connectUrl: string;        // WebSocket URL for Playwright/Puppeteer
  debuggerFullscreenUrl: string; // noVNC live view URL
}

function getConfig(): BrowserbaseConfig {
  return {
    apiKey: process.env.BROWSERBASE_API_KEY || '',
    projectId: process.env.BROWSERBASE_PROJECT_ID || '',
  };
}

function isConfigured(): boolean {
  const config = getConfig();
  return Boolean(config.apiKey && config.projectId);
}

// ============================================================
// Session Management
// ============================================================

/**
 * Create a new Browserbase browser session.
 * Returns session with connectUrl for Playwright and debuggerFullscreenUrl for noVNC.
 */
export async function createBrowserbaseSession(): Promise<BrowserbaseSession | null> {
  if (!isConfigured()) return null;

  const config = getConfig();
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: {
      'x-bb-api-key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId: config.projectId,
      browserSettings: {
        fingerprint: { browserListQuery: 'last 1 Chrome version' },
      },
    }),
  });

  if (!res.ok) {
    console.error(`Browserbase session creation failed: ${res.status}`);
    return null;
  }

  return res.json();
}

/**
 * Get an existing session by ID.
 */
export async function getBrowserbaseSession(sessionId: string): Promise<BrowserbaseSession | null> {
  if (!isConfigured()) return null;

  const config = getConfig();
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    headers: { 'x-bb-api-key': config.apiKey },
  });

  if (!res.ok) return null;
  return res.json();
}

/**
 * Stop a running session.
 */
export async function stopBrowserbaseSession(sessionId: string): Promise<boolean> {
  if (!isConfigured()) return false;

  const config = getConfig();
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'PUT',
    headers: {
      'x-bb-api-key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'REQUEST_RELEASE' }),
  });

  return res.ok;
}

/**
 * List recent sessions.
 */
export async function listBrowserbaseSessions(limit = 10): Promise<BrowserbaseSession[]> {
  if (!isConfigured()) return [];

  const config = getConfig();
  const res = await fetch(`${API_BASE}/sessions?limit=${limit}`, {
    headers: { 'x-bb-api-key': config.apiKey },
  });

  if (!res.ok) return [];
  return res.json();
}

/**
 * Get the debug/live-view URLs for a session.
 * The debuggerFullscreenUrl provides a noVNC interface for the dashboard.
 */
export async function getDebugUrls(sessionId: string): Promise<{ debugUrl: string; liveUrl: string } | null> {
  if (!isConfigured()) return null;

  const config = getConfig();
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/debug`, {
    headers: { 'x-bb-api-key': config.apiKey },
  });

  if (!res.ok) return null;
  const data = await res.json();
  return {
    debugUrl: data.debuggerUrl,
    liveUrl: data.debuggerFullscreenUrl,
  };
}

/**
 * Get the Playwright WebSocket connect URL for a session.
 * Use with: playwright.chromium.connectOverCDP(connectUrl)
 */
export function getConnectUrl(session: BrowserbaseSession): string {
  return session.connectUrl;
}

export { isConfigured as isBrowserbaseConfigured };
