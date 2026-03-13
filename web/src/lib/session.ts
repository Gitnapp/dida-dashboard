import type { SessionOptions } from "iron-session"

export const DIDA_BASE_URL = "https://dida365.com"
export const SESSION_COOKIE_NAME = "dida-dashboard-session"
export const OAUTH_STATE_COOKIE_NAME = "dida-dashboard-oauth-state"

function getSessionPassword() {
  const password = process.env.SESSION_SECRET

  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters long.")
  }

  return password
}

export function getSessionOptions(): SessionOptions {
  return {
    password: getSessionPassword(),
    cookieName: SESSION_COOKIE_NAME,
    cookieOptions: {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 180,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  }
}
