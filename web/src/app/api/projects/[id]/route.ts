import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedClient } from "@/lib/auth"
import { DidaClientError } from "@/lib/dida-client"
import type { ProjectUpdate } from "@/lib/types"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const client = await getAuthenticatedClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const projectData = await client.getProjectData(id)

    if (!projectData.project && id.startsWith("inbox")) {
      projectData.project = {
        id,
        name: "收集箱",
        sortOrder: -1,
        closed: false,
        kind: "TASK",
      }
    }

    return NextResponse.json(projectData)
  } catch (error) {
    if (error instanceof DidaClientError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to load project data." }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const client = await getAuthenticatedClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const body = (await request.json()) as Partial<ProjectUpdate>

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 })
  }

  try {
    const project = await client.updateProject(id, { name: body.name.trim() })
    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof DidaClientError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to update project." }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const client = await getAuthenticatedClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params

  try {
    const projectData = await client.getProjectData(id)

    if (projectData.tasks.length > 0) {
      return NextResponse.json(
        { error: "Only empty projects can be deleted." },
        { status: 400 },
      )
    }

    await client.deleteProject(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof DidaClientError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to delete project." }, { status: 500 })
  }
}
