# Dida365 Dashboard — Design Document

**Date**: 2026-03-07
**Status**: Approved

## Overview

A custom Dida365 (TickTick) dashboard web app with a black-and-white minimalist aesthetic. Deployed on Vercel. Provides a dashboard overview plus dedicated views for calendar, todo list, kanban board, project detail, and completed task history.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Runtime | Vercel (serverless) |
| UI | shadcn/ui + Tailwind CSS |
| Auth | Server-side OAuth 2.0, iron-session encrypted cookie |
| Data fetching | SWR (client-side caching + revalidation) |
| Calendar | Custom-built on shadcn primitives |
| External deps | Zero DB, zero Redis — Dida365 API only |

## Architecture

### Data Flow

```
Browser (SWR) → Next.js API Routes (proxy) → Dida365 Open API
                     ↑
              iron-session cookie
              (encrypted access token)
```

Token never exposed to the browser. API routes inject Bearer token server-side.

### Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, global nav
│   ├── page.tsx                      # Dashboard
│   ├── calendar/page.tsx             # Calendar view
│   ├── todos/page.tsx                # Todo list view
│   ├── kanban/page.tsx               # Kanban board
│   ├── projects/[id]/page.tsx        # Project detail
│   ├── completed/page.tsx            # Completed history
│   ├── login/page.tsx                # Login page
│   └── api/
│       ├── auth/callback/route.ts    # OAuth callback
│       ├── auth/login/route.ts       # Initiate OAuth
│       ├── auth/logout/route.ts      # Clear session
│       ├── projects/route.ts         # Proxy: list projects
│       ├── projects/[id]/route.ts    # Proxy: project data
│       ├── tasks/route.ts            # Proxy: create task
│       └── tasks/[id]/
│           └── complete/route.ts     # Proxy: complete task
├── components/
│   ├── dashboard/                    # Dashboard widgets
│   ├── calendar/                     # Calendar components
│   ├── kanban/                       # Kanban board components
│   ├── tasks/                        # Shared task components
│   └── layout/                       # Nav, sidebar, theme
└── lib/
    ├── dida-client.ts                # Server-side Dida365 API client
    ├── session.ts                    # iron-session config
    └── types.ts                      # TypeScript types
```

## Authentication

### OAuth 2.0 Flow

1. User visits `/login` → clicks "Login with Dida365"
2. `GET /api/auth/login` → generates random `state`, stores in cookie, redirects to:
   ```
   https://dida365.com/oauth/authorize
     ?client_id=XXX
     &redirect_uri=XXX/api/auth/callback
     &response_type=code
     &scope=tasks:read tasks:write
     &state=XXX
   ```
3. User authorizes → Dida365 redirects to `/api/auth/callback?code=XXX&state=XXX`
4. Callback validates `state`, exchanges code for token via `POST https://dida365.com/oauth/token`
5. Token encrypted into iron-session cookie, redirect to `/`

### Session Structure

```ts
interface SessionData {
  accessToken: string
  tokenExpiry: number   // Unix timestamp
  baseUrl: string       // "https://dida365.com"
}
```

### Environment Variables

```
DIDA_CLIENT_ID=xxx
DIDA_CLIENT_SECRET=xxx
DIDA_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
SESSION_SECRET=32-char-random-string
```

### Middleware

Next.js middleware checks for valid session on all routes except `/login` and `/api/auth/*`. Expired token → redirect to `/login`.

## Data Models

```ts
interface Task {
  id: string
  projectId: string
  title: string
  content: string
  status: number         // 0=active, 2=completed
  priority: number       // 0=none, 1=low, 3=medium, 5=high
  dueDate?: string       // ISO 8601
  completedTime?: string
  sortOrder: number
  columnId?: string
}

interface Project {
  id: string
  name: string
  color?: string
  closed: boolean
  kind: string           // "TASK" | "NOTE"
}

interface Column {
  id: string
  projectId: string
  name: string
  sortOrder: number
}
```

## API Proxy Routes

| Route | Method | Dida365 Endpoint | Purpose |
|-------|--------|------------------|---------|
| `/api/projects` | GET | `GET /open/v1/project` | List all projects |
| `/api/projects/[id]` | GET | `GET /open/v1/project/{id}/data` | Project data (tasks + columns) |
| `/api/tasks` | POST | `POST /open/v1/task` | Create task |
| `/api/tasks/[id]/complete` | POST | `POST /open/v1/project/{projId}/task/{id}/complete` | Complete task |

## Views

### Dashboard

Six widgets in a responsive grid:

```
Desktop (lg):
+-------------------+-------------------+
|  Today's Tasks    |  Overdue Tasks    |
|  (card list)      |  (card list)      |
+-------------------+-------------------+
|         Upcoming 7 Days               |
|  (grouped by date, compact list)      |
+-------------------+-------------------+
| Project Summary   |  Calendar Mini    |
| (progress bars)   |  (month + dots)   |
+-------------------+-------------------+
|       Recent Completions              |
|  (strikethrough + timestamp)          |
+---------------------------------------+

Mobile: single column, stacked.
```

**Widget details:**
- **Today's Tasks** — `dueDate === today`, sorted by priority. Checkbox to quick-complete.
- **Overdue Tasks** — `dueDate < today && status === 0`. Red dot accent.
- **Upcoming 7 Days** — grouped by date headers, compact rows.
- **Project Summary** — each project: name, progress bar (completed/total), count.
- **Calendar Mini** — shadcn Calendar with dots on dates that have tasks. Click → navigate to calendar view.
- **Recent Completions** — last 10 completed tasks, strikethrough, timestamp.

### Calendar View

- Custom month grid on shadcn Calendar primitives
- Each date cell: up to 3 task titles, "+N more" overflow
- Click date → side panel with full task list
- Month/week toggle
- Week view: 7 columns with time slots, tasks as blocks
- Quick-complete checkbox inline

### Todo List View

- shadcn DataTable with columns: checkbox, title, project, priority, due date
- Filter bar: project dropdown, priority toggle, status filter
- Sort by: due date, priority, project
- Inline "Add task" row at top — title + project select + enter to create

### Kanban Board

- Project selector dropdown at top
- Columns from API as vertical lanes
- Task cards: title, priority badge, due date
- Read-only layout (no drag-and-drop)
- Click card → slide-over with details + complete button

### Project Detail

- Header: project name, task count, progress
- Tabs: "Tasks" (list) | "Board" (kanban if columns exist)
- Reuses task components from Todo/Kanban views

### Completed History

- Date range picker (shadcn DateRangePicker)
- Tasks grouped by completion date, newest first
- Each entry: title, project name, completed timestamp
- Client-side filter from project data (`status === 2`)

## Visual Design

- **Background**: white / zinc-950 (dark mode)
- **Text**: zinc-900 / zinc-100
- **Borders**: zinc-200 / zinc-800
- **Accents**: subtle red for overdue, muted green for completed checkmarks
- **Typography**: Inter or system font, generous whitespace, thin borders
- **Style**: Black-and-white minimalist, premium feel

## Mutations (Light)

- **Complete task**: checkbox toggle → `POST /api/tasks/[id]/complete`
- **Create task**: inline form → `POST /api/tasks` with title + projectId
- No edit, delete, move, or project management

## Known Constraints

- Dida365 Open API has no endpoint for querying completed tasks by date range — filter client-side
- No tag endpoints in the open API — tags unavailable
- Access token lasts ~6 months, no refresh token — user re-auths when expired
- API rate limits unknown — SWR caching helps minimize calls
