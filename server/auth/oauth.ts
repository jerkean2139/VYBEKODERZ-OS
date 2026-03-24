// ============================================================
// OAuth Configuration for Google + Microsoft SSO
// ============================================================

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface OAuthUserProfile {
  provider: 'google' | 'microsoft';
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

// Google OAuth
export function getGoogleConfig(): OAuthConfig {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.API_URL || 'http://localhost:3001'}/api/auth/google/callback`,
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
  };
}

// Microsoft OAuth
export function getMicrosoftConfig(): OAuthConfig {
  return {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    redirectUri: `${process.env.API_URL || 'http://localhost:3001'}/api/auth/microsoft/callback`,
    scope: [
      'openid',
      'email',
      'profile',
      'Mail.Read',
      'Calendars.Read',
      'Files.Read',
      'User.Read',
    ],
  };
}

/**
 * Build Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state: string): string {
  const config = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Build Microsoft OAuth authorization URL
 */
export function getMicrosoftAuthUrl(state: string): string {
  const config = getMicrosoftConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope.join(' '),
    state,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
}

/**
 * Exchange Google auth code for user profile
 */
export async function exchangeGoogleCode(code: string): Promise<OAuthUserProfile> {
  const config = getGoogleConfig();

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();

  // Get user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json();

  return {
    provider: 'google',
    providerId: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.picture,
  };
}

/**
 * Exchange Microsoft auth code for user profile
 */
export async function exchangeMicrosoftCode(code: string): Promise<OAuthUserProfile> {
  const config = getMicrosoftConfig();

  const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();

  const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = await userRes.json();

  return {
    provider: 'microsoft',
    providerId: user.id,
    email: user.mail || user.userPrincipalName,
    name: user.displayName,
  };
}
