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
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { useAuth } from './hooks/useAuth';
import { useTaskStore } from './hooks/useTaskStore';

function ProtectedLayout() {
  const { tasks: liveTasks, isConnected, activeRouting } = useTaskStore();
  const showLive = isConnected && liveTasks.length > 0;

  return (
    <div className="flex h-screen w-screen">
      <RoutingAnimation steps={activeRouting} />
      <LeftRail />
      <main className="flex-1 flex flex-col overflow-hidden bg-bg-base">
        <TopBar isConnected={isConnected} taskCount={showLive ? liveTasks.length : 14} />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/sops" element={<SOPLibraryPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <VoiceBar />
      </main>
      <MemoryPanel isConnected={isConnected} />
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
