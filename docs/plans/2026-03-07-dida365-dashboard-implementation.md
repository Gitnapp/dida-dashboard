# Dida365 Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a black-and-white minimalist Dida365 dashboard with OAuth auth, 6 dashboard widgets, and 5 dedicated views (calendar, todo, kanban, project detail, completed history), deployed on Vercel.

**Architecture:** Next.js 15 App Router with server-side OAuth proxy. API routes forward requests to Dida365 Open API with Bearer token from encrypted iron-session cookie. Client uses SWR for data fetching and caching.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, iron-session, SWR

**Design doc:** `docs/plans/2026-03-07-dida365-dashboard-design.md`

---

## Task 1: Project Scaffolding

**Goal:** Create Next.js project with shadcn/ui and B&W theme configured.

**Step 1: Create Next.js app**

```bash
cd /Users/admin/Explore/dida-dashboard
pnpm create next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Select defaults when prompted. This creates `/Users/admin/Explore/dida-dashboard/web/`.

**Step 2: Install dependencies**

```bash
cd /Users/admin/Explore/dida-dashboard/web
pnpm add iron-session swr
pnpm add -D @types/node
```

**Step 3: Initialize shadcn/ui**

```bash
cd /Users/admin/Explore/dida-dashboard/web
pnpm dlx shadcn@latest init
```

When prompted:
- Style: New York
- Base color: Zinc
- CSS variables: yes

**Step 4: Install required shadcn components**

```bash
cd /Users/admin/Explore/dida-dashboard/web
pnpm dlx shadcn@latest add button card checkbox input select table tabs badge calendar popover separator progress dropdown-menu sheet dialog scroll-area
```

**Step 5: Configure B&W minimal theme**

Edit `src/app/globals.css` — override shadcn CSS variables for a stark black-and-white theme:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 72.2% 50.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}
```

**Step 6: Verify dev server runs**

```bash
cd /Users/admin/Explore/dida-dashboard/web
pnpm dev
```

Expected: dev server starts on localhost:3000 without errors.

**Step 7: Commit**

```bash
cd /Users/admin/Explore/dida-dashboard/web
git init
echo "node_modules/\n.next/\n.env.local\n.env" > .gitignore
git add -A
git commit -m "feat: scaffold Next.js app with shadcn/ui and B&W theme"
```

---

## Task 2: Core Library — Types, Session, API Client

**Goal:** Create the shared TypeScript types, iron-session config, and server-side Dida365 API client.

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/session.ts`
- Create: `src/lib/dida-client.ts`

**Step 1: Create TypeScript types**

Create `src/lib/types.ts`:

```ts
export interface Task {
  id: string
  projectId: string
  title: string
  content: string
  status: number        // 0=active, 2=completed
  priority: number      // 0=none, 1=low, 3=medium, 5=high
  dueDate?: string      // ISO 8601
  completedTime?: string
  sortOrder: number
  columnId?: string
}

export interface TaskCreate {
  title: string
  projectId: string
  content?: string
}

export interface Project {
  id: string
  name: string
  color?: string
  sortOrder: number
  closed: boolean
  kind: string          // "TASK" | "NOTE"
}

export interface Column {
  id: string
  projectId: string
  name: string
  sortOrder: number
}

export interface ProjectData {
  project: Project
  tasks: Task[]
  columns: Column[]
}
```

**Step 2: Create session config**

Create `src/lib/session.ts`:

```ts
import { SessionOptions } from "iron-session"

export interface SessionData {
  accessToken: string
  tokenExpiry: number   // Unix timestamp (seconds)
  baseUrl: string       // "https://dida365.com"
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "dida-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180, // 180 days (match token lifetime)
  },
}
```

**Step 3: Create Dida365 API client**

Create `src/lib/dida-client.ts`:

```ts
import { Task, TaskCreate, Project, ProjectData } from "./types"

export class DidaClient {
  constructor(
    private baseUrl: string,
    private accessToken: string
  ) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized")
      if (res.status === 403) throw new Error("Forbidden")
      if (res.status === 404) throw new Error("Not found")
      throw new Error(`API error: ${res.status}`)
    }

    const text = await res.text()
    return text ? JSON.parse(text) : (undefined as T)
  }

  async listProjects(): Promise<Project[]> {
    return this.request<Project[]>("GET", "/open/v1/project")
  }

  async getProjectData(projectId: string): Promise<ProjectData> {
    return this.request<ProjectData>("GET", `/open/v1/project/${projectId}/data`)
  }

  async createTask(task: TaskCreate): Promise<Task> {
    return this.request<Task>("POST", "/open/v1/task", task)
  }

  async completeTask(projectId: string, taskId: string): Promise<void> {
    await this.request<void>("POST", `/open/v1/project/${projectId}/task/${taskId}/complete`)
  }
}
```

**Step 4: Create `.env.local` template**

Create `src/lib/env.ts` (not a file, just add `.env.local` to project root):

```bash
# .env.local (DO NOT commit)
DIDA_CLIENT_ID=your_client_id
DIDA_CLIENT_SECRET=your_client_secret
DIDA_REDIRECT_URI=http://localhost:3000/api/auth/callback
SESSION_SECRET=at-least-32-characters-long-random-string
```

**Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/session.ts src/lib/dida-client.ts
git commit -m "feat: add core lib — types, session config, Dida365 API client"
```

---

## Task 3: Authentication — OAuth Routes & Middleware

**Goal:** Implement the full OAuth 2.0 login flow with 3 API routes and auth middleware.

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/callback/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/middleware.ts`
- Create: `src/lib/auth.ts` (helper to get session + create DidaClient)

**Step 1: Create auth helper**

Create `src/lib/auth.ts`:

```ts
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { SessionData, sessionOptions } from "./session"
import { DidaClient } from "./dida-client"

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}

export async function getAuthenticatedClient(): Promise<DidaClient | null> {
  const session = await getSession()
  if (!session.accessToken) return null
  if (session.tokenExpiry && Date.now() / 1000 > session.tokenExpiry) return null
  return new DidaClient(session.baseUrl, session.accessToken)
}
```

**Step 2: Create login route**

Create `src/app/api/auth/login/route.ts`:

```ts
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { sessionOptions } from "@/lib/session"

export async function GET() {
  const state = randomBytes(32).toString("hex")

  // Store state in a temporary cookie for CSRF validation
  const cookieStore = await cookies()
  const session = await getIronSession<{ oauthState: string }>(cookieStore, {
    ...sessionOptions,
    cookieName: "dida-oauth-state",
    cookieOptions: { ...sessionOptions.cookieOptions, maxAge: 600 },
  })
  session.oauthState = state
  await session.save()

  const params = new URLSearchParams({
    client_id: process.env.DIDA_CLIENT_ID!,
    redirect_uri: process.env.DIDA_REDIRECT_URI!,
    response_type: "code",
    scope: "tasks:read tasks:write",
    state,
  })

  return NextResponse.redirect(
    `https://dida365.com/oauth/authorize?${params.toString()}`
  )
}
```

**Step 3: Create callback route**

Create `src/app/api/auth/callback/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { SessionData, sessionOptions } from "@/lib/session"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_params", req.url))
  }

  // Validate state
  const cookieStore = await cookies()
  const oauthSession = await getIronSession<{ oauthState: string }>(cookieStore, {
    ...sessionOptions,
    cookieName: "dida-oauth-state",
    cookieOptions: { ...sessionOptions.cookieOptions, maxAge: 600 },
  })

  if (oauthSession.oauthState !== state) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", req.url))
  }
  oauthSession.destroy()

  // Exchange code for token
  const tokenRes = await fetch("https://dida365.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.DIDA_CLIENT_ID!,
      client_secret: process.env.DIDA_CLIENT_SECRET!,
      redirect_uri: process.env.DIDA_REDIRECT_URI!,
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/login?error=token_exchange_failed", req.url))
  }

  const { access_token, expires_in } = await tokenRes.json()

  // Save to session
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  session.accessToken = access_token
  session.tokenExpiry = Math.floor(Date.now() / 1000) + expires_in
  session.baseUrl = "https://dida365.com"
  await session.save()

  return NextResponse.redirect(new URL("/", req.url))
}
```

**Step 4: Create logout route**

Create `src/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function POST() {
  const session = await getSession()
  session.destroy()
  return NextResponse.redirect(new URL("/login", process.env.DIDA_REDIRECT_URI!))
}
```

**Step 5: Create middleware**

Create `src/middleware.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { SessionData, sessionOptions } from "./lib/session"

const publicPaths = ["/login", "/api/auth"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const session = await getIronSession<SessionData>(req, res, sessionOptions)

  if (!session.accessToken) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (session.tokenExpiry && Date.now() / 1000 > session.tokenExpiry) {
    session.destroy()
    return NextResponse.redirect(new URL("/login?error=expired", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

**Step 6: Commit**

```bash
git add src/app/api/auth/ src/middleware.ts src/lib/auth.ts
git commit -m "feat: add OAuth 2.0 auth flow with iron-session and middleware"
```

---

## Task 4: Login Page

**Goal:** A minimal login page with a single "Login with Dida365" button.

**Files:**
- Create: `src/app/login/page.tsx`

**Step 1: Create login page**

Create `src/app/login/page.tsx`:

```tsx
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-light tracking-tight">Dida Dashboard</h1>
        <p className="text-muted-foreground">Minimalist task management view</p>
        <Button asChild size="lg" variant="default">
          <Link href="/api/auth/login">Login with Dida365</Link>
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Verify flow**

Run dev server, visit `/login`, click button. Should redirect to Dida365 OAuth page (will fail without valid credentials, but verify the redirect URL is correct).

**Step 3: Commit**

```bash
git add src/app/login/
git commit -m "feat: add login page"
```

---

## Task 5: API Proxy Routes

**Goal:** Create proxy routes that forward requests to the Dida365 API.

**Files:**
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/app/api/tasks/route.ts`
- Create: `src/app/api/tasks/[id]/complete/route.ts`

**Step 1: List projects route**

Create `src/app/api/projects/route.ts`:

```ts
import { NextResponse } from "next/server"
import { getAuthenticatedClient } from "@/lib/auth"

export async function GET() {
  const client = await getAuthenticatedClient()
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const projects = await client.listProjects()
    return NextResponse.json(projects)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

**Step 2: Project data route**

Create `src/app/api/projects/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedClient } from "@/lib/auth"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const client = await getAuthenticatedClient()
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const data = await client.getProjectData(id)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

**Step 3: Create task route**

Create `src/app/api/tasks/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedClient } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const client = await getAuthenticatedClient()
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const task = await client.createTask(body)
    return NextResponse.json(task)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

**Step 4: Complete task route**

Create `src/app/api/tasks/[id]/complete/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedClient } from "@/lib/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const client = await getAuthenticatedClient()
  if (!client) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId } = await req.json()
  try {
    await client.completeTask(projectId, id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

**Step 5: Commit**

```bash
git add src/app/api/projects/ src/app/api/tasks/
git commit -m "feat: add API proxy routes for projects and tasks"
```

---

## Task 6: SWR Data Hooks

**Goal:** Create client-side SWR hooks for data fetching, plus a shared fetcher.

**Files:**
- Create: `src/lib/hooks.ts`

**Step 1: Create SWR hooks**

Create `src/lib/hooks.ts`:

```ts
import useSWR from "swr"
import { Project, ProjectData } from "./types"

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Fetch error: ${res.status}`)
    return res.json()
  })

export function useProjects() {
  return useSWR<Project[]>("/api/projects", fetcher)
}

export function useProjectData(projectId: string | null) {
  return useSWR<ProjectData>(
    projectId ? `/api/projects/${projectId}` : null,
    fetcher
  )
}

export function useAllProjectsData(projects: Project[] | undefined) {
  // Fetch data for all projects in parallel
  // Returns a map of projectId -> ProjectData
  const keys = projects?.map((p) => `/api/projects/${p.id}`) ?? []
  const results = useSWR<Map<string, ProjectData>>(
    keys.length > 0 ? ["all-projects-data", ...keys] : null,
    async () => {
      const entries = await Promise.all(
        keys.map(async (url) => {
          const data: ProjectData = await fetcher(url)
          return [data.project.id, data] as const
        })
      )
      return new Map(entries)
    },
    { revalidateOnFocus: false }
  )
  return results
}
```

**Step 2: Commit**

```bash
git add src/lib/hooks.ts
git commit -m "feat: add SWR data fetching hooks"
```

---

## Task 7: Root Layout & Navigation

**Goal:** Create the app shell with top navbar and responsive navigation.

**Files:**
- Create: `src/components/layout/navbar.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create navbar**

Create `src/components/layout/navbar.tsx`:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/todos", label: "Todos" },
  { href: "/kanban", label: "Kanban" },
  { href: "/completed", label: "Completed" },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Dida
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" size="sm" type="submit">
            Logout
          </Button>
        </form>
      </div>
    </header>
  )
}
```

**Step 2: Update root layout**

Modify `src/app/layout.tsx` to include the navbar (only on non-login pages). Use a conditional layout approach:

```tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Dida Dashboard",
  description: "Minimalist Dida365 task dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

Create `src/app/(dashboard)/layout.tsx` for the authenticated layout with navbar:

```tsx
import { Navbar } from "@/components/layout/navbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </>
  )
}
```

Move the dashboard page route to use the group layout:
- `src/app/(dashboard)/page.tsx` — Dashboard
- `src/app/(dashboard)/calendar/page.tsx` — Calendar
- `src/app/(dashboard)/todos/page.tsx` — Todo list
- `src/app/(dashboard)/kanban/page.tsx` — Kanban
- `src/app/(dashboard)/projects/[id]/page.tsx` — Project detail
- `src/app/(dashboard)/completed/page.tsx` — Completed history

**Step 3: Create placeholder pages**

Create placeholder for each route (e.g., `src/app/(dashboard)/page.tsx`):

```tsx
export default function DashboardPage() {
  return <div>Dashboard — coming soon</div>
}
```

Repeat for: `calendar/page.tsx`, `todos/page.tsx`, `kanban/page.tsx`, `projects/[id]/page.tsx`, `completed/page.tsx`.

**Step 4: Verify navigation works**

Run dev server, check all nav links render and route correctly.

**Step 5: Commit**

```bash
git add src/components/layout/ src/app/layout.tsx src/app/\(dashboard\)/
git commit -m "feat: add root layout with navbar and route group for authenticated pages"
```

---

## Task 8: Dashboard — Data Loading & Task Utilities

**Goal:** Create the dashboard page that loads all project data and utility functions for filtering tasks.

**Files:**
- Create: `src/lib/task-utils.ts`
- Create: `src/app/(dashboard)/page.tsx`

**Step 1: Create task utility functions**

Create `src/lib/task-utils.ts`:

```ts
import { Task, ProjectData } from "./types"

export function getAllTasks(projectsData: Map<string, ProjectData>): Task[] {
  const tasks: Task[] = []
  for (const data of projectsData.values()) {
    tasks.push(...data.tasks)
  }
  return tasks
}

export function getActiveTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 0)
}

export function getCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 2)
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getTodayTasks(tasks: Task[]): Task[] {
  const today = startOfDay(new Date()).getTime()
  const tomorrow = today + 86400000
  return getActiveTasks(tasks)
    .filter((t) => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate).getTime()
      return due >= today && due < tomorrow
    })
    .sort((a, b) => b.priority - a.priority)
}

export function getOverdueTasks(tasks: Task[]): Task[] {
  const today = startOfDay(new Date()).getTime()
  return getActiveTasks(tasks)
    .filter((t) => {
      if (!t.dueDate) return false
      return new Date(t.dueDate).getTime() < today
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
}

export function getUpcomingTasks(tasks: Task[], days: number = 7): Task[] {
  const today = startOfDay(new Date()).getTime()
  const tomorrow = today + 86400000
  const endDate = today + days * 86400000
  return getActiveTasks(tasks)
    .filter((t) => {
      if (!t.dueDate) return false
      const due = new Date(t.dueDate).getTime()
      return due >= tomorrow && due < endDate
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
}

export function getRecentCompletions(tasks: Task[], limit: number = 10): Task[] {
  return getCompletedTasks(tasks)
    .filter((t) => t.completedTime)
    .sort((a, b) =>
      new Date(b.completedTime!).getTime() - new Date(a.completedTime!).getTime()
    )
    .slice(0, limit)
}

export function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const groups = new Map<string, Task[]>()
  for (const task of tasks) {
    const dateKey = task.dueDate
      ? startOfDay(new Date(task.dueDate)).toISOString().split("T")[0]
      : "no-date"
    const group = groups.get(dateKey) ?? []
    group.push(task)
    groups.set(dateKey, group)
  }
  return groups
}

export function priorityLabel(priority: number): string {
  switch (priority) {
    case 5: return "High"
    case 3: return "Medium"
    case 1: return "Low"
    default: return "None"
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/task-utils.ts
git commit -m "feat: add task utility functions for filtering and grouping"
```

---

## Task 9: Dashboard Widgets

**Goal:** Build the 6 dashboard widgets and compose them on the dashboard page.

**Files:**
- Create: `src/components/dashboard/today-tasks.tsx`
- Create: `src/components/dashboard/overdue-tasks.tsx`
- Create: `src/components/dashboard/upcoming-tasks.tsx`
- Create: `src/components/dashboard/project-summary.tsx`
- Create: `src/components/dashboard/calendar-mini.tsx`
- Create: `src/components/dashboard/recent-completions.tsx`
- Create: `src/components/tasks/task-item.tsx` (shared component)
- Modify: `src/app/(dashboard)/page.tsx`

**Step 1: Create shared TaskItem component**

Create `src/components/tasks/task-item.tsx`:

```tsx
"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Task } from "@/lib/types"
import { cn } from "@/lib/utils"

interface TaskItemProps {
  task: Task
  projectName?: string
  showProject?: boolean
  showDueDate?: boolean
  onComplete?: (task: Task) => void
}

export function TaskItem({
  task,
  projectName,
  showProject = false,
  showDueDate = true,
  onComplete,
}: TaskItemProps) {
  const isCompleted = task.status === 2

  return (
    <div className="flex items-center gap-3 py-2 px-1 group">
      {onComplete && !isCompleted && (
        <Checkbox
          checked={false}
          onCheckedChange={() => onComplete(task)}
          className="shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm truncate", isCompleted && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {showProject && projectName && (
            <span className="text-xs text-muted-foreground">{projectName}</span>
          )}
          {showDueDate && task.dueDate && (
            <span className="text-xs text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      {task.priority > 0 && (
        <Badge variant={task.priority === 5 ? "destructive" : "secondary"} className="text-xs shrink-0">
          {task.priority === 5 ? "H" : task.priority === 3 ? "M" : "L"}
        </Badge>
      )}
    </div>
  )
}
```

**Step 2: Create each dashboard widget**

Each widget is a client component that receives data as props. Example for TodayTasks:

Create `src/components/dashboard/today-tasks.tsx`:

```tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TaskItem } from "@/components/tasks/task-item"
import { Task } from "@/lib/types"

interface TodayTasksProps {
  tasks: Task[]
  projectNames: Map<string, string>
  onComplete: (task: Task) => void
}

export function TodayTasks({ tasks, projectNames, onComplete }: TodayTasksProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Today</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks due today</p>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                projectName={projectNames.get(task.projectId)}
                showProject
                showDueDate={false}
                onComplete={onComplete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

Follow the same pattern for:
- `overdue-tasks.tsx` — same as TodayTasks but with a red dot indicator for overdue count
- `upcoming-tasks.tsx` — groups tasks by date using `groupTasksByDate`, renders date headers
- `project-summary.tsx` — receives `ProjectData[]`, shows progress bar per project
- `calendar-mini.tsx` — uses shadcn `<Calendar>` with modifiers to show dots on dates with tasks; onClick navigates to `/calendar?date=YYYY-MM-DD`
- `recent-completions.tsx` — completed tasks list with strikethrough and completedTime

**Step 3: Compose dashboard page**

Modify `src/app/(dashboard)/page.tsx`:

```tsx
"use client"

import { useProjects, useAllProjectsData } from "@/lib/hooks"
import { getAllTasks, getTodayTasks, getOverdueTasks, getUpcomingTasks, getRecentCompletions } from "@/lib/task-utils"
import { TodayTasks } from "@/components/dashboard/today-tasks"
import { OverdueTasks } from "@/components/dashboard/overdue-tasks"
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks"
import { ProjectSummary } from "@/components/dashboard/project-summary"
import { CalendarMini } from "@/components/dashboard/calendar-mini"
import { RecentCompletions } from "@/components/dashboard/recent-completions"
import { Task } from "@/lib/types"

export default function DashboardPage() {
  const { data: projects } = useProjects()
  const { data: projectsData } = useAllProjectsData(projects)

  const allTasks = projectsData ? getAllTasks(projectsData) : []
  const projectNames = new Map(projects?.map((p) => [p.id, p.name]) ?? [])

  const handleComplete = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: task.projectId }),
    })
    // SWR will revalidate automatically
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-light tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TodayTasks tasks={getTodayTasks(allTasks)} projectNames={projectNames} onComplete={handleComplete} />
        <OverdueTasks tasks={getOverdueTasks(allTasks)} projectNames={projectNames} onComplete={handleComplete} />
      </div>
      <UpcomingTasks tasks={getUpcomingTasks(allTasks)} projectNames={projectNames} onComplete={handleComplete} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProjectSummary projectsData={projectsData} />
        <CalendarMini tasks={allTasks} />
      </div>
      <RecentCompletions tasks={getRecentCompletions(allTasks)} projectNames={projectNames} />
    </div>
  )
}
```

**Step 4: Verify dashboard renders**

Run dev server with valid OAuth token. Verify all 6 widgets render with real data.

**Step 5: Commit**

```bash
git add src/components/dashboard/ src/components/tasks/ src/app/\(dashboard\)/page.tsx
git commit -m "feat: add dashboard with 6 widgets — today, overdue, upcoming, summary, calendar, completions"
```

---

## Task 10: Calendar View

**Goal:** Full calendar page with month grid, week view toggle, and date detail panel.

**Files:**
- Create: `src/components/calendar/month-grid.tsx`
- Create: `src/components/calendar/week-view.tsx`
- Create: `src/components/calendar/date-panel.tsx`
- Modify: `src/app/(dashboard)/calendar/page.tsx`

**Step 1: Build month grid component**

Create `src/components/calendar/month-grid.tsx`:

A custom month grid that renders a 7-column calendar. Each cell shows the date number and up to 3 task titles. If more tasks exist, shows "+N more". Clicking a cell calls `onDateSelect`.

Key implementation details:
- Use `date-fns` (install: `pnpm add date-fns`) for date math: `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `startOfWeek`, `endOfWeek`, `isSameMonth`, `isSameDay`, `format`
- Grid: 7 columns, header row with day names (Mon–Sun), then 5-6 rows of date cells
- Each cell: `min-h-24`, date number top-left, tasks below truncated
- Today highlighted with a bold ring border

**Step 2: Build week view component**

Create `src/components/calendar/week-view.tsx`:

A 7-column layout showing one week. Each column has the day header and a vertical list of tasks for that day. Simpler than month grid — no time slots, just task lists per day.

**Step 3: Build date detail panel**

Create `src/components/calendar/date-panel.tsx`:

Uses shadcn `<Sheet>` (side panel). When a date is selected, slides in from the right showing all tasks for that date with TaskItem components and a complete checkbox.

**Step 4: Compose calendar page**

Modify `src/app/(dashboard)/calendar/page.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useProjects, useAllProjectsData } from "@/lib/hooks"
import { getAllTasks } from "@/lib/task-utils"
import { MonthGrid } from "@/components/calendar/month-grid"
import { WeekView } from "@/components/calendar/week-view"
import { DatePanel } from "@/components/calendar/date-panel"
import { Button } from "@/components/ui/button"

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "week">("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const { data: projects } = useProjects()
  const { data: projectsData } = useAllProjectsData(projects)
  const allTasks = projectsData ? getAllTasks(projectsData) : []
  const projectNames = new Map(projects?.map((p) => [p.id, p.name]) ?? [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-tight">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant={view === "month" ? "default" : "ghost"} size="sm" onClick={() => setView("month")}>
            Month
          </Button>
          <Button variant={view === "week" ? "default" : "ghost"} size="sm" onClick={() => setView("week")}>
            Week
          </Button>
        </div>
      </div>

      {view === "month" ? (
        <MonthGrid
          currentDate={currentDate}
          tasks={allTasks}
          onDateSelect={setSelectedDate}
          onMonthChange={setCurrentDate}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          tasks={allTasks}
          onDateSelect={setSelectedDate}
          onWeekChange={setCurrentDate}
        />
      )}

      <DatePanel
        date={selectedDate}
        tasks={allTasks}
        projectNames={projectNames}
        onClose={() => setSelectedDate(null)}
      />
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add src/components/calendar/ src/app/\(dashboard\)/calendar/
git commit -m "feat: add calendar view with month grid, week view, and date panel"
```

---

## Task 11: Todo List View

**Goal:** Filterable, sortable task table with inline task creation.

**Files:**
- Create: `src/components/tasks/task-table.tsx`
- Create: `src/components/tasks/task-filters.tsx`
- Create: `src/components/tasks/add-task-row.tsx`
- Modify: `src/app/(dashboard)/todos/page.tsx`

**Step 1: Build filter bar**

Create `src/components/tasks/task-filters.tsx`:

Uses shadcn `<Select>` for project filter, priority toggle buttons, status toggle (active/completed/all). Calls `onFilterChange` with updated filter state.

```ts
interface TaskFilters {
  projectId: string | null
  priority: number | null
  status: "active" | "completed" | "all"
  sortBy: "dueDate" | "priority" | "project"
}
```

**Step 2: Build task table**

Create `src/components/tasks/task-table.tsx`:

Uses shadcn `<Table>` with columns: checkbox (complete), title, project name, priority badge, due date. Receives filtered+sorted tasks and renders rows using TaskItem-like cells.

**Step 3: Build add task row**

Create `src/components/tasks/add-task-row.tsx`:

An inline form at the top of the table. Input for title, Select for project, press Enter to submit. Calls `POST /api/tasks`.

**Step 4: Compose todos page**

Similar pattern to calendar — load data with SWR, apply filters, render table.

**Step 5: Commit**

```bash
git add src/components/tasks/ src/app/\(dashboard\)/todos/
git commit -m "feat: add todo list view with filters, sorting, and inline task creation"
```

---

## Task 12: Kanban Board View

**Goal:** Project-scoped kanban board with column lanes and task cards.

**Files:**
- Create: `src/components/kanban/board.tsx`
- Create: `src/components/kanban/column-lane.tsx`
- Create: `src/components/kanban/task-card.tsx`
- Create: `src/components/kanban/task-detail-sheet.tsx`
- Modify: `src/app/(dashboard)/kanban/page.tsx`

**Step 1: Build task card**

Create `src/components/kanban/task-card.tsx`:

A compact card showing task title, priority badge, and due date. Clicking opens the detail sheet.

**Step 2: Build column lane**

Create `src/components/kanban/column-lane.tsx`:

A vertical lane with column name header, task count, and a list of TaskCards. Uses `min-w-72` for fixed column width with horizontal scroll on the board.

**Step 3: Build task detail sheet**

Create `src/components/kanban/task-detail-sheet.tsx`:

Uses shadcn `<Sheet>`. Shows full task details: title, content, project, priority, due date, status. Has a "Complete" button.

**Step 4: Build board**

Create `src/components/kanban/board.tsx`:

Horizontal scrolling container with column lanes. Tasks without a `columnId` go into an "Uncategorized" column.

**Step 5: Compose kanban page**

Project selector dropdown at top (shadcn `<Select>`). When a project is selected, fetch its data and render the board. If project has no columns, show a message suggesting the list view instead.

**Step 6: Commit**

```bash
git add src/components/kanban/ src/app/\(dashboard\)/kanban/
git commit -m "feat: add kanban board view with columns, task cards, and detail sheet"
```

---

## Task 13: Project Detail View

**Goal:** Single project page with tabs for list and board views.

**Files:**
- Modify: `src/app/(dashboard)/projects/[id]/page.tsx`

**Step 1: Build project detail page**

Reuses components from Task 11 (task table) and Task 12 (kanban board). Header shows project name, total tasks, completed count, and a progress bar.

Uses shadcn `<Tabs>` with two tabs:
- "Tasks" — renders the task table filtered to this project
- "Board" — renders the kanban board for this project (only if columns exist)

**Step 2: Add project links**

Update `ProjectSummary` widget (Task 9) to make each project name a `<Link>` to `/projects/[id]`.

**Step 3: Commit**

```bash
git add src/app/\(dashboard\)/projects/
git commit -m "feat: add project detail view with list and board tabs"
```

---

## Task 14: Completed History View

**Goal:** Browse completed tasks with date range filtering.

**Files:**
- Create: `src/components/completed/date-range-filter.tsx`
- Create: `src/components/completed/completed-list.tsx`
- Modify: `src/app/(dashboard)/completed/page.tsx`

**Step 1: Build date range filter**

Create `src/components/completed/date-range-filter.tsx`:

Uses shadcn `<Popover>` + `<Calendar>` for a date range picker. Presets: "Last 7 days", "Last 30 days", "This month". Returns `{ from: Date, to: Date }`.

**Step 2: Build completed list**

Create `src/components/completed/completed-list.tsx`:

Groups completed tasks by completion date (newest first). Each group has a date header and a list of TaskItems with strikethrough styling and the completion timestamp.

**Step 3: Compose completed page**

Load all project data, extract completed tasks, apply date range filter, render grouped list.

**Step 4: Commit**

```bash
git add src/components/completed/ src/app/\(dashboard\)/completed/
git commit -m "feat: add completed history view with date range filtering"
```

---

## Task 15: Polish & Deploy

**Goal:** Final visual polish, responsive testing, and Vercel deployment.

**Step 1: Responsive testing**

Check all views at mobile (375px), tablet (768px), and desktop (1280px) widths. Fix any layout issues.

**Step 2: Loading states**

Add skeleton loaders (shadcn `<Skeleton>`) to dashboard widgets and data-heavy views while SWR is loading.

**Step 3: Error states**

Add error boundaries or inline error messages when API calls fail. Handle 401 by redirecting to login.

**Step 4: Empty states**

Ensure all views handle empty data gracefully with helpful messages.

**Step 5: Deploy to Vercel**

```bash
cd /Users/admin/Explore/dida-dashboard/web
# Push to GitHub first, then:
# 1. Connect repo to Vercel
# 2. Set environment variables:
#    - DIDA_CLIENT_ID
#    - DIDA_CLIENT_SECRET
#    - DIDA_REDIRECT_URI (use Vercel production URL)
#    - SESSION_SECRET (generate with: openssl rand -hex 32)
# 3. Deploy
```

**Step 6: Update Dida365 OAuth app**

Update the redirect URI in the Dida365 developer portal to match the Vercel production URL: `https://your-app.vercel.app/api/auth/callback`.

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: add loading/error/empty states and responsive polish"
```

---

## Task Summary

| # | Task | Scope |
|---|------|-------|
| 1 | Project Scaffolding | Next.js + shadcn + B&W theme |
| 2 | Core Library | Types, session, API client |
| 3 | Authentication | OAuth routes + middleware |
| 4 | Login Page | Login UI |
| 5 | API Proxy Routes | 4 proxy endpoints |
| 6 | SWR Data Hooks | Client-side fetching |
| 7 | Root Layout & Nav | Navbar + route groups |
| 8 | Task Utilities | Filter/group/sort functions |
| 9 | Dashboard Widgets | 6 widgets + dashboard page |
| 10 | Calendar View | Month grid + week view + panel |
| 11 | Todo List View | Table + filters + add task |
| 12 | Kanban Board | Columns + cards + detail sheet |
| 13 | Project Detail | Tabs reusing list + board |
| 14 | Completed History | Date range + grouped list |
| 15 | Polish & Deploy | Loading, errors, responsive, Vercel |
