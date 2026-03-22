import LeftRail from './components/LeftRail';
import TopBar from './components/TopBar';
import DonnaHero from './components/DonnaHero';
import DeptAgents from './components/DeptAgents';
import TaskCard from './components/TaskCard';
import LiveTaskCard from './components/LiveTaskCard';
import VoiceBar from './components/VoiceBar';
import MemoryPanel from './components/MemoryPanel';
import TaskInput from './components/TaskInput';
import RoutingAnimation from './components/RoutingAnimation';
import { useTaskStore } from './hooks/useTaskStore';
import { tasks as mockTasks } from './data/mockData';

function App() {
  const { tasks: liveTasks, isConnected, activeRouting, createTask, isCreating } = useTaskStore();

  // Show live tasks if backend is connected, otherwise show mock data
  const showLive = isConnected && liveTasks.length > 0;

  return (
    <div className="flex h-screen w-screen">
      {/* Routing animation overlay */}
      <RoutingAnimation steps={activeRouting} />

      {/* Left Rail */}
      <LeftRail />

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col overflow-hidden bg-bg-base">
        <TopBar isConnected={isConnected} taskCount={showLive ? liveTasks.length : 14} />

        {/* Scrollable canvas */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          <DonnaHero />
          <DeptAgents />

          {/* Task Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-[11px] font-semibold tracking-widest uppercase text-text-muted">
                New Task
              </div>
              <div className="font-body text-[10px] text-text-muted">
                Donna will route to the right agent
              </div>
            </div>
            <TaskInput onSubmit={createTask} isCreating={isCreating} />
          </div>

          {/* Active Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-display text-[11px] font-semibold tracking-widest uppercase text-text-muted">
                Active Tasks
              </div>
              <div className="font-body text-[11px] text-text-muted bg-bg-surface-2 border border-border-default rounded-full px-2 py-0.5">
                {showLive ? `${liveTasks.length} live` : '14 total'}
              </div>
            </div>

            {/* Live tasks from backend */}
            {showLive && (
              <div className="grid grid-cols-2 gap-3 mb-3">
                {liveTasks.map((task, i) => (
                  <LiveTaskCard key={task.id} task={task} index={i} />
                ))}
              </div>
            )}

            {/* Mock tasks (always shown as demo) */}
            {!showLive && (
              <div className="grid grid-cols-2 gap-3">
                {mockTasks.map((task, i) => (
                  <TaskCard key={task.id} task={task} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        <VoiceBar />
      </main>

      {/* Right Panel */}
      <MemoryPanel />
    </div>
  );
}

export default App;
