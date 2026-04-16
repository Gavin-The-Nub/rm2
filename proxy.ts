import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { isAppRole, staffAllowedPath, type AppRole } from "@/lib/auth/roles"

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value)
  })
  return to
}

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null
  return next
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLogin = pathname === "/login"
  const isAuthCallback = pathname.startsWith("/auth/callback")
  const isCronReminderEndpoint = pathname === "/api/member-notifications/send-expiry-reminders"

  let role: AppRole = "staff"
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    if (isAppRole(profile?.role)) {
      role = profile.role
    }
  }

  const redirectWithSession = (url: URL) => {
    const redirect = NextResponse.redirect(url)
    return copyCookies(response, redirect)
  }

  if (isAuthCallback) {
    return response
  }

  if (isCronReminderEndpoint) {
    // Allow scheduler access; route enforces CRON_SECRET internally.
    return response
  }

  if (!user && !isLogin) {
    const loginUrl = new URL("/login", request.url)
    const next = safeNextPath(pathname === "/" ? null : pathname)
    if (next) loginUrl.searchParams.set("next", next)
    return redirectWithSession(loginUrl)
  }

  if (user && isLogin) {
    const nextRaw = request.nextUrl.searchParams.get("next")
    const next = safeNextPath(nextRaw)
    const dest =
      next && (role === "admin" || staffAllowedPath(next)) ? next : role === "admin" ? "/" : "/members"
    return redirectWithSession(new URL(dest, request.url))
  }

  if (user && role === "staff" && !staffAllowedPath(pathname)) {
    return redirectWithSession(new URL("/members", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
