import { NextResponse } from "next/server"

import { DidaClientError } from "@/lib/dida-client"
import { getAuthenticatedClient } from "@/lib/auth"

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
