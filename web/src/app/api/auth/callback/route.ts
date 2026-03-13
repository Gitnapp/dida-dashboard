import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

import { getAuthConfig, getSession } from "@/lib/auth"
import { DIDA_BASE_URL, OAUTH_STATE_COOKIE_NAME } from "@/lib/session"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_params", request.url))
  }

  try {
    const { clientId, clientSecret, redirectUri } = getAuthConfig()
    const cookieStore = await cookies()
    const savedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value
    cookieStore.delete(OAUTH_STATE_COOKIE_NAME)

    if (!savedState || savedState !== state) {
      return NextResponse.redirect(new URL("/login?error=invalid_state", request.url))
    }

    const tokenResponse = await fetch(`${DIDA_BASE_URL}/oauth/token`, {
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url))
    }

    const payload = (await tokenResponse.json()) as {
      access_token: string
      expires_in?: number
    }

    const session = await getSession()
    session.accessToken = payload.access_token
    session.baseUrl = DIDA_BASE_URL
    session.tokenExpiry = Math.floor(Date.now() / 1000) + (payload.expires_in ?? 60 * 60 * 24 * 180)
    await session.save()

    return NextResponse.redirect(new URL("/", request.url))
  } catch {
    return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url))
  }
}
