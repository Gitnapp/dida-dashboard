import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedClient } from "@/lib/auth"
import { DidaClientError } from "@/lib/dida-client"
import type { TaskCreate } from "@/lib/types"

export async function POST(request: NextRequest) {
  const client = await getAuthenticatedClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as Partial<TaskCreate>

  if (!body.title?.trim() || !body.projectId?.trim()) {
    return NextResponse.json(
      { error: "Both title and projectId are required to create a task." },
      { status: 400 },
    )
  }

  try {
    const task = await client.createTask({
      content: body.content?.trim() || undefined,
      dueDate: body.dueDate || undefined,
      projectId: body.projectId,
      title: body.title.trim(),
    })
    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error instanceof DidaClientError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to create task." }, { status: 500 })
  }
}
