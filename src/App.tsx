import { Routes, Route, Navigate } from 'react-router-dom';
import LeftRail from './components/LeftRail';
import TopBar from './components/TopBar';
import VoiceBar from './components/VoiceBar';
import MemoryPanel from './components/MemoryPanel';
import RoutingAnimation from './components/RoutingAnimation';
import DashboardPage from './pages/DashboardPage';
import SOPLibraryPage from './pages/SOPLibraryPage';
import IntegrationsPage from './pages/IntegrationsPage';
import AdminPage from './pages/AdminPage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { useAuth } from './hooks/useAuth';
import { useTaskStore } from './hooks/useTaskStore';

// Role guard — redirects to dashboard if user lacks permission
function RoleGuard({ children, minRole }: { children: React.ReactNode; minRole: string }) {
  const { user } = useAuth();
  const hierarchy = ['super_admin', 'agency_admin', 'project_lead', 'builder', 'client_viewer'];
  const userIndex = hierarchy.indexOf(user?.role ?? 'client_viewer');
  const minIndex = hierarchy.indexOf(minRole);
  if (userIndex > minIndex) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ProtectedLayout() {
  const { tasks: liveTasks, isConnected, activeRouting } = useTaskStore();
  const { user } = useAuth();
  const showLive = isConnected && liveTasks.length > 0;

  // Client viewers get a simplified view — no left rail nav, no voice bar
  const isViewer = user?.role === 'client_viewer';

  return (
    <div className="flex h-screen w-screen">
      <RoutingAnimation steps={activeRouting} />

      {/* Left rail hidden on mobile, always visible on desktop */}
      <div className="hidden md:block">
        <LeftRail />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden bg-bg-base">
        <TopBar isConnected={isConnected} taskCount={showLive ? liveTasks.length : 14} />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/onboarding" element={
            <RoleGuard minRole="agency_admin"><OnboardingPage /></RoleGuard>
          } />
          <Route path="/sops" element={
            <RoleGuard minRole="project_lead"><SOPLibraryPage /></RoleGuard>
          } />
          <Route path="/integrations" element={
            <RoleGuard minRole="project_lead"><IntegrationsPage /></RoleGuard>
          } />
          <Route path="/admin" element={
            <RoleGuard minRole="agency_admin"><AdminPage /></RoleGuard>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {!isViewer && <VoiceBar />}
      </main>

      {/* Right panel hidden on mobile and for viewers */}
      {!isViewer && (
        <div className="hidden lg:block">
          <MemoryPanel isConnected={isConnected} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return <ProtectedLayout />;
}
