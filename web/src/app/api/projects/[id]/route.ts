import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedClient } from "@/lib/auth"
import { DidaClientError } from "@/lib/dida-client"

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
