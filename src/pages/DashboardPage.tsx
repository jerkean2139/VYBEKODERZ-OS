import DonnaHero from '../components/DonnaHero';
import DeptAgents from '../components/DeptAgents';
import TaskCard from '../components/TaskCard';
import LiveTaskCard from '../components/LiveTaskCard';
import TaskInput from '../components/TaskInput';
import BrowserMonitor from '../components/BrowserMonitor';
import IntegrationStatus from '../components/IntegrationStatus';
import { useTaskStore } from '../hooks/useTaskStore';
import { tasks as mockTasks } from '../data/mockData';

export default function DashboardPage() {
  const { tasks: liveTasks, isConnected, createTask, isCreating } = useTaskStore();
  const showLive = isConnected && liveTasks.length > 0;

  return (
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

        {showLive ? (
          <div className="grid grid-cols-2 gap-3">
            {liveTasks.map((task, i) => (
              <LiveTaskCard key={task.id} task={task} index={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {mockTasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Browser Agent + Integrations row */}
      <div className="grid grid-cols-2 gap-3">
        <BrowserMonitor />
        <IntegrationStatus />
      </div>
    </div>
  );
}
