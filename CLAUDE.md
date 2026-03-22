# VybeKoderz AI Agent OS — CLAUDE.md
# Read this file at the start of every session. This is the persistent brain of the project.

## What This Is
A multi-tenant, white-label AI operations platform called **VybeKoderz AI Agent OS**.
- VybeKoderz runs at the top as Super Admin
- Team members use it for Done-For-You (DFY) client agency work
- Clients get their own isolated, branded portals
- All powered by Claude API + MCP stack

This is not a chatbot. It is a **living AI organization** — agents that delegate, remember, learn, and operate 24/7 like real employees.

---

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS (utility classes only)
- Framer Motion (animations)
- Google Fonts: Chakra Petch, DM Mono, Syne

### Backend
- Node.js + Express OR Next.js API routes
- PostgreSQL with Row-Level Security (multi-tenant isolation)
- Drizzle ORM
- Railway for deployment

### Auth
- SSO via Google OAuth + Microsoft OAuth
- Role matrix: Super Admin → Agency Admin → Project Lead → Builder → Client Viewer
- JWT tokens, invite system per workspace

### AI Layer
- Claude API: claude-sonnet-4-6 (primary model)
- MCP servers for all integrations
- Anthropic API key via environment variable

### Browser Agent
- Playwright + Stagehand (AI-native browser control)
- Browserbase (cloud managed browser sessions)
- noVNC dashboard for visual monitoring
- Encrypted session storage per tenant

### Voice Layer
- OpenAI Whisper API (speech-to-text)
- ElevenLabs TTS (text-to-speech output)
- Push-to-talk + always-listening modes

### Memory Engine (5 Layers)
1. Episodic — conversation + session logs
2. Semantic — facts, preferences, client details
3. Procedural — learned SOPs (versioned)
4. Relational — relationship graph inside/outside business
5. Predictive — pattern-based forecasting

### Integrations (MCP-connected)
- Google: Gmail, Calendar, Drive, Sheets, Meet, Contacts
- Microsoft: Outlook, Teams, OneDrive, SharePoint, Excel
- CRM/Ops: GoHighLevel, Stripe, PayPal, HubSpot
- PM Tools: Slack, Asana, Notion, ClickUp
- Automation: Zapier, Make

---

## Agent Architecture (3 Layers)

### Layer 1 — Org Level
**Donna** — Chief AI Agent
- Routes all requests to correct department
- Holds global memory + cross-client anonymized insights
- Generates daily Memory Intelligence Reports
- Runs Memory IQ scoring weekly
- Color: Cyan (#00D4FF) — always pulsing when active

### Layer 2 — Department Agents
| Agent | Color | Responsibility |
|---|---|---|
| Sales Agent | #7B2FFF violet | Lead gen, pipeline, outreach |
| Ops Agent | #7B2FFF violet | Scheduling, SOPs, workflows |
| Marketing Agent | #7B2FFF violet | Content, campaigns, social |
| Dev Agent | #7B2FFF violet | Client builds, code, deploys |

### Layer 3 — Specialist Agents
Each department has 2-4 specialists. Color: #FF6B35 (orange).

### Self-Managing Dev Squad (Meta Layer)
| Agent | Role |
|---|---|
| Patch | Hot fix — monitors errors, writes fixes, submits PRs |
| Scout | Research — tracks AI tools, APIs, frameworks daily |
| Version | Release manager — versioning, changelogs, deploys |
| Sentinel | QA — regression tests before any deploy |
| Archivist | Memory librarian — manages what gets stored/pruned |

---

## Design System — "Midnight Command"

### Color Palette
```
--bg-base:        #0A0C10   /* main background */
--bg-surface-1:   #0F1218   /* card backgrounds */
--bg-surface-2:   #151A24   /* elevated panels */
--bg-surface-3:   #1C2333   /* hover / selected */
--border:         #1E2A3A   /* structural borders */

--cyan:           #00D4FF   /* Donna / Org level / thinking */
--violet:         #7B2FFF   /* Department level */
--orange:         #FF6B35   /* Specialist level / alerts */
--mint:           #00FF9C   /* success / memory gained */
--amber:          #FFD93D   /* warning / human override needed */
--red:            #FF3860   /* danger / agent stopped */

--text-primary:   #F0F4FF
--text-secondary: #8896B0
--text-muted:     #4A5568
```

### Typography
```
--font-display:  'Chakra Petch', sans-serif;  /* headers, agent names, IQ scores */
--font-body:     'DM Mono', monospace;         /* logs, memory reports, data */
--font-ui:       'Syne', sans-serif;           /* nav, labels, metadata */
```

### Layout — Three Zone
```
[LEFT RAIL 72px] [MAIN CANVAS flex-1] [RIGHT PANEL 320px]
Left: Agent nav icons + pulsing status dots
Main: Mission Control bento-box task cards + agent feed
Right: Context inspector — memory report, IQ score, quick log
```

### Animation Rules
- Donna thinking: cyan ring slowly rotates + pulses
- Task spawning: slide in from right, blur-to-sharp reveal
- Memory stored: particle floats from card to memory panel
- Agent handoff: line traces from Donna to dept agent (500ms)
- IQ Score increase: number ticks up with green flash
- Human override: orange overlay on task card + screen vignette
- Voice input: animated cyan waveform
- Status changes: smooth color transitions 300ms ease
- MAX animation duration: 1.5s (except Donna loop)
- Always respect: prefers-reduced-motion

### Component Rules
- Task cards: 3px color-coded left border, status chip top-right, animated progress bar
- Agent avatars: geometric symbols, never photos
- Borders carry meaning: color = dept, width = hierarchy
- Scanline texture on dark backgrounds: 3% opacity horizontal lines
- Empty states have personality — Donna pulses with message, never generic placeholder

---

## Multi-Tenant Architecture

### Tenant Tiers
- Tier 1: VybeKoderz (Super Admin) — sees all tenants
- Tier 2: Team Members — assigned to specific client workspaces
- Tier 3: Clients — see only their portal

### Data Isolation
- Row-Level Security on ALL tables
- Tenant ID on every database row
- Agent memory scoped: Global (VybeKoderz only) → Tenant → Agent
- Browser sessions isolated per tenant container
- No cross-tenant data bleed under any circumstance

---

## Human Override System (4 Levels)
1. **Soft Nudge** — human adds note mid-task, agent adjusts and continues
2. **Session Takeover** — human clicks "Take Control", agent pauses and LEARNS from what human does
3. **Hard Stop** — kills task, logs state, human edits SOP, task restarts
4. **Rollback** — reverts agent memory to previous checkpoint

---

## Current Build Phase
**Phase 1 — Mission Control Dashboard** (COMPLETE)
Built the React UI shell:
1. Three-zone layout (left rail, main canvas, right panel)
2. Design system CSS variables + fonts via Tailwind v4
3. Donna agent card with pulse animation (Framer Motion)
4. Task cards with status, progress, color borders
5. Department agent cards grid
6. Memory panel (right side) with IQ score, memory report, health stats
7. Voice input bar with animated waveform
8. Scanline texture overlay
9. Mock data for 4 tasks, 4 departments, memory items

**Phase 2 — Claude API + Agent Routing** (COMPLETE)
Wired real Claude API integration and agent routing:
1. Express backend server (server/) with TypeScript
2. Anthropic SDK integration — Donna uses claude-sonnet-4-6 to classify and route tasks
3. Full agent registry: 1 org agent (Donna), 4 dept agents, 12 specialist agents
4. Donna routing engine with system prompt for task classification → dept → specialist
5. Keyword-based fallback routing when Claude API unavailable
6. Task store with in-memory state management + progress simulation
7. SSE (Server-Sent Events) for real-time task updates to frontend
8. React hooks (useTaskStore) for live task state + SSE subscription
9. TaskInput component — "Tell Donna what to do..." text input
10. LiveTaskCard component — renders server tasks with routing trace
11. RoutingAnimation overlay — animated Donna → Dept → Specialist visualization
12. Graceful degradation: shows mock data in DEMO mode when backend offline, switches to LIVE when connected
13. API routes: GET /api/tasks, POST /api/tasks, PATCH /api/tasks/:id/status, GET /api/events (SSE)

**Phase 3 — Next: Database, Auth, Memory Engine**

## Rules for Claude Code Sessions
- Always read this CLAUDE.md first
- Use the exact color values defined above — never approximate
- Chakra Petch for all display text, DM Mono for all data/logs, Syne for UI
- Every component must be typed (TypeScript)
- Framer Motion for all animations — no CSS-only transitions on interactive elements
- Dark theme is primary — never default to light
- Agent colors are sacred: Donna=cyan, Dept=violet, Specialist=orange
- All tenant data must have RLS — never skip this
