import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedClient } from "@/lib/auth"
import { DidaClientError } from "@/lib/dida-client"

export async function POST(
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
    await client.completeTask(projectId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof DidaClientError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Unable to complete task." }, { status: 500 })
  }
}
