export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired")
    this.name = "SessionExpiredError"
  }
}

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    credentials: "include",
    ...init,
  })

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login?error=session"
    }

    throw new SessionExpiredError()
  }

  if (!response.ok) {
    let message: string
    try {
      const payload = (await response.json()) as { error?: string }
      message = payload.error || response.statusText || "Request failed"
    } catch {
      message = response.statusText || "Request failed"
    }
    throw new Error(message)
  }

  return response
}
