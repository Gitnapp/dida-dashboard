import { NextResponse, type NextRequest } from "next/server"
import { unsealData } from "iron-session"

import { SESSION_COOKIE_NAME, getSessionOptions } from "@/lib/session"
import type { SessionData } from "@/lib/types"

const publicPaths = ["/login"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicPaths.some((publicPath) => pathname.startsWith(publicPath))) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const session = await unsealData<SessionData>(sessionCookie, {
      password: getSessionOptions().password,
    })

    if (!session?.accessToken || !session?.tokenExpiry || Date.now() / 1000 >= session.tokenExpiry) {
      const response = NextResponse.redirect(new URL("/login?error=expired", request.url))
      response.cookies.delete(SESSION_COOKIE_NAME)
      return response
    }
  } catch {
    const response = NextResponse.redirect(new URL("/login?error=session", request.url))
    response.cookies.delete(SESSION_COOKIE_NAME)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
