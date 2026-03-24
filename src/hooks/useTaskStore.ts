import { useState, useEffect, useCallback } from 'react';
import { fetchTasks, createTask as apiCreateTask, subscribeToEvents } from '../api';
import type { ServerTask, TaskEvent, RoutingStep } from '../api';

interface TaskStore {
  tasks: ServerTask[];
  isLoading: boolean;
  isConnected: boolean;
  activeRouting: RoutingStep[] | null;
  createTask: (input: string) => Promise<void>;
  isCreating: boolean;
}

export function useTaskStore(): TaskStore {
  const [tasks, setTasks] = useState<ServerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeRouting, setActiveRouting] = useState<RoutingStep[] | null>(null);

  // Load initial tasks
  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch(() => {}) // Server may not be running
      .finally(() => setIsLoading(false));
  }, []);

  // Subscribe to SSE events
  useEffect(() => {
    const unsubscribe = subscribeToEvents((event: TaskEvent) => {
      if (event.type === 'connected') {
        setIsConnected(true);
        return;
      }

      if (!event.task) return;

      setTasks(prev => {
        const idx = prev.findIndex(t => t.id === event.task!.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = event.task!;
          return next;
        }
        return [event.task!, ...prev];
      });

      // Show routing animation when task is routed
      if (event.type === 'task_routed' && event.task.routingTrace.length > 0) {
        setActiveRouting(event.task.routingTrace);
        setTimeout(() => setActiveRouting(null), 2000);
      }
    });

    return unsubscribe;
  }, []);

  const createTask = useCallback(async (input: string) => {
    setIsCreating(true);
    try {
      const { task } = await apiCreateTask(input);
      // Task will arrive via SSE, but add immediately for responsiveness
      setTasks(prev => {
        if (prev.find(t => t.id === task.id)) return prev;
        return [task, ...prev];
      });
    } finally {
      setIsCreating(false);
    }
  }, []);

  return { tasks, isLoading, isConnected, activeRouting, createTask, isCreating };
}
