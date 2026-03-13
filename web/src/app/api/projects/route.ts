import { NextRequest, NextResponse } from "next/server"

import { DidaClientError } from "@/lib/dida-client"
import { getAuthenticatedClient } from "@/lib/auth"
import type { ProjectCreate } from "@/lib/types"

export async function GET() {
  const client = await getAuthenticatedClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [projects, inboxId] = await Promise.all([
      client.listProjects(),
      client.getInboxId(),
    ])

    if (inboxId) {
      projects.unshift({
        id: inboxId,
        name: "收集箱",
        sortOrder: -1,
        closed: false,
        kind: "TASK",
      })
    }

    return NextResponse.json(projects)
  } catch (error) {
    if (error instanceof DidaClientError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to load projects." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const client = await getAuthenticatedClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as Partial<ProjectCreate>

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 })
  }

  try {
    const project = await client.createProject({
      kind: body.kind ?? "TASK",
      name: body.name.trim(),
      viewMode: body.viewMode ?? "list",
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof DidaClientError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to create project." }, { status: 500 })
  }
}
