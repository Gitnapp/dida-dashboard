import { NextResponse } from "next/server"
import { format, subDays } from "date-fns"

import { getAuthenticatedClient } from "@/lib/auth"

export async function GET() {
  const client = await getAuthenticatedClient()

  if (!client) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const from = format(subDays(now, 30), "yyyy-MM-dd 00:00:00")
    const to = format(now, "yyyy-MM-dd 23:59:59")

    const tasks = await client.getCompletedTasks(from, to)
    return NextResponse.json(tasks)
  } catch {
    return NextResponse.json({ error: "Unable to load completed tasks." }, { status: 500 })
  }
}
