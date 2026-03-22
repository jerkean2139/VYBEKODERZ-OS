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

**Phase 3 — Database, Auth, Memory Engine** (COMPLETE)

### Database (Drizzle ORM + PostgreSQL)
- Full schema: tenants, users, invites, agent_definitions, tasks, memories, iq_scores, memory_reports, overrides, browser_sessions
- Row-Level Security on ALL tenant-scoped tables
- `set_config('app.current_tenant_id')` pattern for RLS
- Super Admin bypass policies
- Global memory read policy (org-level memories visible to all)
- Indexes on tenant_id + common query patterns
- RLS SQL script ready for deployment (server/db/rls.sql)
- Drizzle config for migrations (drizzle.config.ts)

### Auth Layer
- JWT token signing/verification (server/auth/jwt.ts)
- 5-tier role matrix: Super Admin → Agency Admin → Project Lead → Builder → Client Viewer
- Permission system with `hasPermission()` and `isRoleAtLeast()` checks
- Express middleware: `authenticate()`, `authorize()`, `requireRole()`
- Google OAuth + Microsoft OAuth configuration and code exchange
- Demo login endpoint for development (`POST /api/auth/demo`)
- .env.example with all required environment variables

### 5-Layer Memory Engine
1. **Episodic** — conversation + session logs (high confidence 0.95)
2. **Semantic** — facts, preferences, client details (0.85)
3. **Procedural** — learned SOPs with version chaining (0.9)
4. **Relational** — bidirectional relationship graph (0.75)
5. **Predictive** — pattern-based forecasting (0.7)

### Memory Intelligence
- IQ Scoring: weighted formula (Client Knowledge 25%, Process Mastery 25%, Relational Intel 20%, Predictive Accuracy 20%, Error Learning 10%)
- IQ Levels: Apprentice (0-39) → Practitioner (40-59) → Expert (60-74) → Master (75-89) → Genius (90+)
- Daily Memory Report: Claude-generated summary, new memories, connections discovered, flagged items
- Connection analysis via Claude API
- Demo memories seeded on startup
- Live IQ + memory stats in dashboard (falls back to mock when offline)

### API Routes Added
- `POST /api/auth/demo` — demo login
- `GET /api/auth/me` — verify token
- `GET /api/auth/providers` — OAuth URLs
- `POST /api/memory` — store memory (any layer)
- `GET /api/memory` — query memories (filterable by type, agent, confidence)
- `GET /api/memory/stats` — memory health stats
- `GET /api/memory/report` — daily intelligence report
- `GET /api/iq` — current IQ score

**Phase 4 — Browser Agent + Voice Layer + Integration Hub** (COMPLETE)

### Browser Agent Layer (`server/browser/`)
- SOP Definition system: typed steps (navigate, click, type, wait, screenshot, extract, scroll, select, assert)
- SOP Executor: simulated Playwright execution with step logging + progress tracking
- Browser session management with Browserbase session IDs
- Screenshot capture at key steps
- Human Override → Co-Pilot Learning: capture human actions → offer to save as new SOP
- `learnFromOverride()`: auto-generates new SOP from human takeover session
- Demo SOPs: Empire Title Weekly Report (9 steps), GHL Contact Onboarding (7 steps)
- SSE broadcast of browser session updates to frontend

### Voice Layer (`server/voice/`)
- OpenAI Whisper API integration for speech-to-text (STT)
- ElevenLabs API integration for text-to-speech (TTS)
- Voice session management with transcript history
- Meeting Intelligence: extract actions, decisions, follow-ups from meeting transcripts
- Modes: push-to-talk, voice walkthrough, meeting assistant

### Integration Hub (`server/integrations/`)
- 18 integrations registered across 6 categories:
  - Google (5): Gmail, Calendar, Drive, Sheets, Meet
  - Microsoft (4): Outlook, Teams, OneDrive, SharePoint
  - CRM (3): GoHighLevel, Stripe, HubSpot
  - PM (3): Asana, Notion, ClickUp
  - Communication (1): Slack
  - Automation (2): Zapier, Make
- MCP endpoint configuration per integration
- Connect/disconnect/health-check API
- Hub stats dashboard

### Frontend Components
- `BrowserMonitor`: live SOP execution viewer with step-by-step log, progress bar, Take Control button
- `IntegrationStatus`: 5x2 grid showing all integrations with connected/disconnected states

### API Routes Added
- SOPs: `GET/POST /api/sops`, `GET /api/sops/:id`
- Browser: `GET/POST /api/browser/sessions`, `POST .../execute`, `POST .../override`, `POST .../learn`
- Voice: `POST /api/voice/sessions`, `POST .../transcribe`, `POST .../speak`, `POST /api/voice/meeting-actions`
- Integrations: `GET /api/integrations`, `GET .../stats`, `GET .../connected`, `POST .../:id/connect`, `POST .../:id/disconnect`, `GET .../:id/health`

**Phase 5 — Production Deployment, Multi-Tenant UI, Portal Routes** (COMPLETE)

### React Router + Portal Navigation
- React Router v7 with `BrowserRouter`
- Routes: `/` (Dashboard), `/sops` (SOP Library), `/integrations` (Integration Hub), `/admin` (Admin Panel)
- SPA fallback in Express server for production
- LeftRail updated with route-aware navigation + active state highlighting

### Auth Flow + Login Page
- `AuthProvider` context with JWT token management
- Login page with Google/Microsoft OAuth buttons + demo role selector
- 5-tier role selector: Super Admin, Agency Admin, Project Lead, Builder, Client Viewer
- Token persistence via localStorage
- Graceful fallback when backend is offline (demo mode)
- Protected layout: redirects to login when unauthenticated

### Multi-Tenant Admin Panel (`/admin`)
- Tabs: Tenants (super admin only), Team, Settings
- Tenant management: plan tiers, user counts, agent counts, task stats
- Team management: member list, role badges, invite system, remove users
- Workspace settings: custom name, Donna name, brand color, custom domain

### SOP Library Page (`/sops`)
- Full SOP list with expandable step details
- Stats row: total SOPs, active, drafts, executions today
- Status badges (active/draft/disabled)
- Create new SOP button, Run SOP button per item

### Integration Management Page (`/integrations`)
- 18 integrations organized by category (Google, Microsoft, CRM, PM, Automation, Communication)
- Connect/disconnect state per integration
- Stats: total, connected, available
- Category-grouped grid layout

### Production Deployment
- Dockerfile: multi-stage build (Node 20 Alpine)
- Railway config (`railway.toml`): Dockerfile builder, health check, restart policy
- Express serves static frontend from `dist/` in production
- SPA fallback route for client-side routing

### Pages Added
- `src/pages/LoginPage.tsx` — OAuth + demo login
- `src/pages/DashboardPage.tsx` — Mission Control (extracted from App)
- `src/pages/SOPLibraryPage.tsx` — SOP management
- `src/pages/IntegrationsPage.tsx` — Integration hub detail view
- `src/pages/AdminPage.tsx` — Tenant & team management

**Phase 6 — Real Database Persistence, Live OAuth, Browserbase, Production Ready** (COMPLETE)

### Database Repository Layer (`server/db/repository.ts`)
- Full Drizzle ORM repository: tenants, users, invites, tasks, memories, IQ scores, browser sessions, overrides
- All queries use `withTenant()` for RLS context setting
- CRUD operations for every entity with proper typing

### Live OAuth Flows
- `GET /api/auth/google/callback` — Google code exchange → user upsert → JWT → redirect to frontend
- `GET /api/auth/microsoft/callback` — Microsoft code exchange → same flow
- `handleOAuthUser()`: finds user by provider ID or email, creates new user if needed, issues JWT
- OAuth redirect URIs point to API server (`API_URL/api/auth/{provider}/callback`)
- `src/pages/AuthCallbackPage.tsx` — frontend handler stores token from OAuth redirect

### Invite System
- `POST /api/invites` — create workspace invite (requires `canManageUsers`)
- `GET /api/invites` — list tenant invites
- `POST /api/invites/:token/accept` — accept invite, create user, return JWT
- 7-day invite expiry, single-use tokens

### Team & Tenant Management API
- `GET /api/team` — list team members (auth required, `canManageUsers`)
- `GET /api/tenants` — list all tenants (super admin only)
- `PATCH /api/tenants/:id` — update tenant settings (super admin only)

### Browserbase Integration (`server/browser/browserbase.ts`)
- `createBrowserbaseSession()` — create cloud browser instance
- `getBrowserbaseSession()` — get session status
- `stopBrowserbaseSession()` — stop running session
- `getDebugUrls()` — get noVNC live view + debugger URLs
- `GET /api/browserbase/status` — check if Browserbase is configured
- `POST /api/browserbase/sessions` — create session
- `GET /api/browserbase/sessions/:id` — get session
- `POST /api/browserbase/sessions/:id/stop` — stop session
- `GET /api/browserbase/sessions/:id/debug` — get live view URLs

### Database Scripts
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — run pending migrations
- `npm run db:seed` — seed demo data (tenants, users, agents, memories)
- `npm run db:push` — push schema directly (dev)
- `npm run db:studio` — open Drizzle Studio
- `npm run start` — production start

### Seed Data (`server/db/seed.ts`)
- VybeKoderz enterprise tenant + 2 client tenants (Empire Title, Acme Digital)
- Super admin + 3 team members + 1 client viewer
- 5 agent definitions (Donna + 4 dept agents)
- 7 demo memories across all 5 layers

### Updated .env.example
- Added: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- Added: `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID`
- Added: `API_URL` (separate from `APP_URL` for OAuth redirects)

### Production Dockerfile
- Multi-stage build (Node 20 Alpine)
- Copies `drizzle/` migration files
- Runs `db:migrate` before server start
- Auto-applies schema changes on deploy

**Phase 7 — Next: Real-time DB event streaming, Playwright SOP execution via Browserbase, production Railway deploy with PostgreSQL**

## Rules for Claude Code Sessions
- Always read this CLAUDE.md first
- Use the exact color values defined above — never approximate
- Chakra Petch for all display text, DM Mono for all data/logs, Syne for UI
- Every component must be typed (TypeScript)
- Framer Motion for all animations — no CSS-only transitions on interactive elements
- Dark theme is primary — never default to light
- Agent colors are sacred: Donna=cyan, Dept=violet, Specialist=orange
- All tenant data must have RLS — never skip this
