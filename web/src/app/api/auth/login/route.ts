import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { getAuthConfig } from "@/lib/auth"
import { DIDA_BASE_URL, OAUTH_STATE_COOKIE_NAME } from "@/lib/session"

export async function GET() {
  try {
    const { clientId, redirectUri } = getAuthConfig()
    const state = crypto.randomUUID()
    const cookieStore = await cookies()

    cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      maxAge: 60 * 10,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "tasks:read tasks:write",
      state,
    })

    return NextResponse.redirect(`${DIDA_BASE_URL}/oauth/authorize?${params.toString()}`)
  } catch {
    return NextResponse.redirect(new URL("/login?error=missing_config", process.env.DIDA_REDIRECT_URI ?? "http://localhost:3000"))
  }
}
