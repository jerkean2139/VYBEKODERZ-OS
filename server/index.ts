import express from 'express';
import cors from 'cors';
import { routeTask } from './donna';
import { createTask, routeTaskToAgent, getAllTasks, getTask, updateTaskStatus, subscribe } from './taskStore';
import { agents } from './agents';
import type { TaskEvent } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// SSE clients for real-time updates
const sseClients: Set<express.Response> = new Set();

subscribe((event: TaskEvent) => {
  const data = JSON.stringify(event);
  for (const client of sseClients) {
    client.write(`data: ${data}\n\n`);
  }
});

// SSE endpoint for real-time task events
app.get('/api/events', (_req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  sseClients.add(res);
  _req.on('close', () => sseClients.delete(res));
});

// Get all agents
app.get('/api/agents', (_req, res) => {
  res.json(agents);
});

// Get all tasks
app.get('/api/tasks', (_req, res) => {
  res.json(getAllTasks());
});

// Get single task
app.get('/api/tasks/:id', (req, res) => {
  const task = getTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// Create + route a new task (Donna routes it)
app.post('/api/tasks', async (req, res) => {
  const { input } = req.body;
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Missing input string' });
  }

  // Step 1: Create task in "routing" state
  const task = createTask(input);

  // Step 2: Donna routes it (async — Claude API call)
  try {
    const decision = await routeTask(input);
    const routed = routeTaskToAgent(task.id, decision);
    res.status(201).json({ task: routed, routing: decision });
  } catch (error) {
    updateTaskStatus(task.id, 'error');
    res.status(500).json({ error: 'Routing failed', taskId: task.id });
  }
});

// Update task status (pause, resume, stop)
app.patch('/api/tasks/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['running', 'waiting', 'error', 'done'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` });
  }
  const task = updateTaskStatus(req.params.id, status);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.listen(PORT, () => {
  console.log(`VybeKoderz Agent OS server running on port ${PORT}`);
});
