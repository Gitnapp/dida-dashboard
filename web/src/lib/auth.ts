import { cookies } from "next/headers"
import { getIronSession } from "iron-session"

import { DidaClient } from "@/lib/dida-client"
import { DIDA_BASE_URL, getSessionOptions } from "@/lib/session"
import type { SessionData } from "@/lib/types"

export function isSessionExpired(session: Pick<SessionData, "tokenExpiry"> | null | undefined) {
  if (!session?.tokenExpiry) {
    return true
  }

  return Date.now() / 1000 >= session.tokenExpiry
}

export async function getSession() {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, getSessionOptions())
}

export async function getAuthenticatedClient() {
  const session = await getSession()

  if (!session.accessToken || isSessionExpired(session)) {
    session.destroy()
    return null
  }

  return new DidaClient(session.accessToken, session.baseUrl || DIDA_BASE_URL)
}

export function getAuthConfig() {
  const clientId = process.env.DIDA_CLIENT_ID
  const clientSecret = process.env.DIDA_CLIENT_SECRET
  const redirectUri = process.env.DIDA_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("DIDA_CLIENT_ID, DIDA_CLIENT_SECRET and DIDA_REDIRECT_URI must be configured.")
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  }
}
