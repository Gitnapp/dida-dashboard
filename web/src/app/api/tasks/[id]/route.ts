import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedClient } from "@/lib/auth"
import { DidaClientError } from "@/lib/dida-client"
import type { TaskUpdate } from "@/lib/types"

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const client = await getAuthenticatedClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as Partial<TaskUpdate>
  const { id } = await context.params

  if (!body.projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 })
  }

  try {
    const task = await client.updateTask(id, body as TaskUpdate)
    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof DidaClientError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to update task." }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const client = await getAuthenticatedClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { projectId } = (await request.json()) as { projectId?: string }
  const { id } = await context.params

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 })
  }

  try {
    await client.deleteTask(projectId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof DidaClientError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to delete task." }, { status: 500 })
  }
}
