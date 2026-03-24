import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Role } from '../../server/auth/roles';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AuthUser {
  userId: string;
  tenantId: string;
  email: string;
  role: Role;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (role?: Role) => Promise<void>;
  loginWithProvider: (provider: 'google' | 'microsoft') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored token on mount
  useEffect(() => {
    const stored = localStorage.getItem('vybekoderz_token');
    if (stored) {
      setToken(stored);
      verifyToken(stored);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function verifyToken(jwt: string) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        localStorage.removeItem('vybekoderz_token');
        setToken(null);
      }
    } catch {
      // Backend offline — use demo mode with stored token info
      setUser({
        userId: 'demo-user-001',
        tenantId: 'vybekoderz-demo',
        email: 'demo@vybekoderz.com',
        role: 'agency_admin',
        name: 'Demo User',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function login(role: Role = 'agency_admin') {
    try {
      const res = await fetch(`${API_BASE}/api/auth/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      setToken(data.token);
      setUser({ ...data.user, name: data.user.name || 'Demo User' });
      localStorage.setItem('vybekoderz_token', data.token);
    } catch {
      // Fallback: demo mode without backend
      const demoUser: AuthUser = {
        userId: 'demo-user-001',
        tenantId: 'vybekoderz-demo',
        email: 'demo@vybekoderz.com',
        role,
        name: role === 'super_admin' ? 'VybeKoderz Admin' : 'Demo User',
      };
      setUser(demoUser);
      setToken('demo-token');
      localStorage.setItem('vybekoderz_token', 'demo-token');
    }
  }

  function loginWithProvider(provider: 'google' | 'microsoft') {
    // In production: redirect to OAuth flow
    window.location.href = `${API_BASE}/api/auth/${provider}`;
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vybekoderz_token');
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithProvider, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
