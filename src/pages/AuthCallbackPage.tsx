import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Handles OAuth redirect callback.
 * URL: /auth/callback?token=<jwt>
 * Stores token and redirects to dashboard.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('vybekoderz_token', token);
      // Force full reload to re-initialize AuthProvider with the new token
      window.location.href = '/';
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div className="h-screen w-screen bg-bg-base flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-4 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
        <div className="font-body text-xs text-text-muted">Completing authentication...</div>
      </div>
    </div>
  );
}
