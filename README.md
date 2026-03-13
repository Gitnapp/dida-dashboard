# Dida365 Dashboard

A personal productivity workspace for [Dida365](https://dida365.com) (滴答清单 / TickTick), built in two parts:

- **`web/`** — Next.js web dashboard with project task list, calendar views, and full task editing
- **`dida365-cli/`** — Go CLI for scripting and automation

---

## Web Dashboard

A restrained, black-and-white interface for managing your Dida365 tasks.

**Views:**
- Project task list with inline task creation and completion
- Month and week calendar views across all projects
- Full task editing (title, content, due date, priority)
- Project management (create, rename, delete)

**Stack:** Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui · SWR · iron-session

### Setup

**1. Register an OAuth app**

Go to the [Dida365 Developer Portal](https://developer.dida365.com), create an app, and set the redirect URI to:

```
http://localhost:3000/api/auth/callback
```

**2. Configure environment variables**

```bash
cd web
cp .env.example .env.local
```

Edit `.env.local`:

```env
DIDA_CLIENT_ID=your_client_id
DIDA_CLIENT_SECRET=your_client_secret
DIDA_REDIRECT_URI=http://localhost:3000/api/auth/callback
SESSION_SECRET=at-least-32-characters-random-string
```

**3. Install and run**

```bash
cd web
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your Dida365 account.

### Production Build

```bash
pnpm build
pnpm start
```

---

## CLI (`dida365-cli`)

A Go CLI for Dida365 designed for scripting and automation. All commands output JSON.

### Install

```bash
cd dida365-cli
go build -o dida365 .
sudo mv dida365 /usr/local/bin/
```

Or via Go:

```bash
go install github.com/bearzk/dida365-cli@latest
```

### Authenticate

```bash
dida365 auth login \
  --client-id "your_client_id" \
  --client-secret "your_client_secret" \
  --service dida365   # or "ticktick" for international
```

### Common Commands

```bash
# Projects
dida365 project list
dida365 project get <id>
dida365 project columns <id>

# Tasks
dida365 task list <project-id>
dida365 task create --title "Deploy" --project-id <id>
dida365 task complete <task-id> --project-id <id>
dida365 task delete <task-id> --project-id <id>
```

See [`dida365-cli/README.md`](./dida365-cli/README.md) for the full reference.

---

## Project Structure

```
dida-dashboard/
├── web/                  # Next.js web dashboard
│   ├── src/app/          # Pages and API routes
│   ├── src/components/   # UI components
│   └── src/lib/          # API client, hooks, utilities
└── dida365-cli/          # Go CLI
    ├── cmd/              # Commands (auth, project, task)
    └── internal/         # Client, config, models
```

## License

MIT
