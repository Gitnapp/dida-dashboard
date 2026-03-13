"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const errorMap: Record<string, string> = {
  expired: "The Dida365 session expired. Please authenticate again.",
  invalid_state: "The login handshake could not be verified. Please retry the sign-in flow.",
  missing_config: "The required Dida365 OAuth environment variables are missing.",
  missing_params: "Dida365 did not return the required authorization parameters.",
  session: "Your session is unavailable or invalid. Sign in again to continue.",
  token_exchange_failed: "Dida365 did not issue an access token. Check your app credentials and redirect URI.",
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const errorMessage = error ? errorMap[error] ?? "Sign in failed." : null

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.25fr_0.95fr]">
      <section className="grid-hairline relative hidden overflow-hidden border-r border-border/70 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.06),transparent_30rem)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Dida365 Dashboard
            </p>
            <div className="max-w-xl space-y-4">
              <h1 className="text-6xl leading-[0.9]">
                See the week,
                <br />
                not the noise.
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground">
                Dashboard, calendar, project drill-down, and lightweight task actions,
                wrapped in a restrained black-and-white interface.
              </p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              Included views
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
              <p>Dashboard overview</p>
              <p>Month + week calendar</p>
              <p>Todo table filters</p>
              <p>Project kanban lanes</p>
              <p>Project detail tabs</p>
              <p>Completed history</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <Card className="surface w-full max-w-xl">
          <CardContent className="space-y-8 px-8 py-10">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Sign in
              </p>
              <div className="space-y-2">
                <h2 className="text-4xl leading-tight">Connect your Dida365 workspace.</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Authentication happens directly against Dida365. Access tokens stay on the
                  server inside an encrypted cookie.
                </p>
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="space-y-4">
              <Link
                className={cn(buttonVariants({ size: "lg" }), "w-full justify-center rounded-full")}
                href="/api/auth/login"
              >
                Login with Dida365
              </Link>
              <p className="text-xs leading-5 text-muted-foreground">
                Make sure your OAuth app uses the exact callback URL from{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                  DIDA_REDIRECT_URI
                </code>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
