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
- React 19 + TypeScript
- React Router v7 (portal navigation)
- Tailwind CSS v4 (utility classes only)
- Framer Motion (animations)
- Google Fonts: Chakra Petch, DM Mono, Syne

### Backend
- Node.js + Express 5
- PostgreSQL with Row-Level Security (multi-tenant isolation)
- Drizzle ORM + drizzle-kit migrations
- pg-boss job queue (PostgreSQL-backed)
- express-rate-limit (per-IP + per-endpoint)
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

### Memory Engine (Simplified — 2 Stores)
1. Context Memory — searchable facts, logs, relationships, patterns (replaces episodic/semantic/relational/predictive)
2. SOPs — versioned procedure documents (replaces procedural)
- Legacy 5-layer types accepted via `normalizeLegacyType()` for backward compat

### Storage
- Railway Volume for artifact storage (task outputs: reports, CSVs, screenshots)
- Mount path: `STORAGE_PATH` env var (default: `/data/artifacts`)
- Direct file serving via Express — no external storage service needed

### Billing
- Plan tiers: starter (100 tasks/mo), pro (1000), enterprise (unlimited)
- Per-tenant usage metering and limit enforcement
- Feature gating: browser sessions, voice, custom domains

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

### Specialist Agents
Specialists emerge from usage patterns. Start with the 4 department agents.
When a department consistently gets a specific task type, spawn a specialist.
Color: #FF6B35 (orange).

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

## Current State — All Systems Built

### What's Running
- **Dashboard** — 3-zone layout, live task cards, agent grid, memory panel
- **Agent Routing** — Donna uses Claude API to classify → department → specialist
- **Database** — Full Drizzle schema with RLS, repository layer, migration scripts
- **Auth** — JWT + OAuth (Google/Microsoft) with CSRF protection, invite system
- **Memory** — Simplified 2-store engine (context + SOPs), Claude-powered analysis
- **Browser Agent** — SOP executor + Browserbase cloud browser integration
- **Voice** — Whisper STT + ElevenLabs TTS + meeting intelligence
- **Integrations** — 18 MCP-connected services across 6 categories
- **Job Queue** — pg-boss for reliable task processing with retry
- **Autonomy Engine** — 5 scheduled jobs (memory consolidation, daily report, weekly IQ, SOP optimization, specialist detection)
- **Event Triggers** — Real-time reactions to task_completed, task_error, and human overrides
- **Insight Graduation** — Confirmed patterns auto-promote to permanent agent instincts
- **Task Decomposition** — Donna splits complex multi-dept tasks into parallel subtasks
- **Cost Metering** — Per-tenant, per-job Claude API token tracking with daily budgets
- **Kill Switch** — Auto-halt autonomy when health score drops critical, manual override
- **Notifications** — Real-time activity feed via SSE
- **Artifacts** — Railway Volume storage for task outputs (reports, CSVs, screenshots)
- **Billing** — Plan limits enforcement (starter/pro/enterprise)
- **Security** — Rate limiting, OAuth CSRF nonces, role-guarded routes
- **Mobile** — Responsive layout with collapsible panels
- **Onboarding** — Guided setup flow for new tenants

### API Routes (Complete)
**Tasks**: GET/POST `/api/tasks`, PATCH `/api/tasks/:id/status`
**Auth**: GET `/api/auth/providers`, POST `/api/auth/demo`, GET `/api/auth/me`, GET `/api/auth/{google|microsoft}/callback`
**Invites**: GET/POST `/api/invites`, POST `/api/invites/:token/accept`
**Team**: GET `/api/team`
**Tenants**: GET/PATCH `/api/tenants`
**Memory**: GET/POST `/api/memory`, GET `/api/memory/stats`, GET `/api/memory/report`
**Metrics**: GET `/api/metrics`, GET `/api/iq`
**SOPs**: GET/POST `/api/sops`
**Browser**: GET/POST `/api/browser/sessions`, POST `.../execute`, `.../override`, `.../learn`
**Browserbase**: GET `/api/browserbase/status`, POST/GET `/api/browserbase/sessions`
**Voice**: POST `/api/voice/sessions`, POST `.../transcribe`, `.../speak`, POST `/api/voice/meeting-actions`
**Integrations**: GET `/api/integrations`, GET `.../stats`, `.../connected`, POST `.../:id/connect`, `.../:id/disconnect`
**Webhooks**: POST `/api/webhooks/:source`
**Notifications**: GET `/api/notifications`, GET `.../count`, POST `.../:id/read`, POST `.../read-all`
**Artifacts**: GET/POST `/api/artifacts`, GET/DELETE `/api/artifacts/:id`, GET `.../download`
**Autonomy**: POST `/api/autonomy/consolidate`, `.../report`, `.../assessment`, `.../optimize-sops`, `.../detect-specialists`, `.../graduate`
**Kill Switch**: GET `/api/autonomy/kill-switch`, POST `.../kill`, POST `.../resume`
**Cost Meter**: GET `/api/autonomy/cost`, GET/PATCH `/api/autonomy/budget`
**Instincts**: GET `/api/autonomy/instincts`, GET `.../instincts/:agentId`
**Decomposition**: POST `/api/tasks/decompose`, GET `/api/tasks/:id/subtasks`
**Override**: POST `/api/override`
**Billing**: GET `/api/billing/usage`, GET `/api/billing/limits`
**SSE**: GET `/api/events`

### Frontend Pages
- `/` — Dashboard (Mission Control)
- `/sops` — SOP Library (role: project_lead+)
- `/integrations` — Integration Hub (role: project_lead+)
- `/admin` — Admin Panel (role: agency_admin+)
- `/onboarding` — Tenant Setup Wizard (role: agency_admin+)
- Login page with OAuth + demo role picker
- Auth callback page for OAuth redirect handling

### Scripts
```bash
npm run dev          # Frontend dev server (:5173)
npm run dev:server   # Backend dev server (:3001)
npm run build        # TypeScript compile + Vite build
npm run start        # Production server
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:seed      # Seed demo data
npm run db:push      # Push schema (dev shortcut)
npm run db:studio    # Drizzle Studio GUI
```

## Rules for Claude Code Sessions
- Always read this CLAUDE.md first
- Use the exact color values defined above — never approximate
- Chakra Petch for all display text, DM Mono for all data/logs, Syne for UI
- Every component must be typed (TypeScript)
- Framer Motion for all animations — no CSS-only transitions on interactive elements
- Dark theme is primary — never default to light
- Agent colors are sacred: Donna=cyan, Dept=violet, Specialist=orange
- All tenant data must have RLS — never skip this
