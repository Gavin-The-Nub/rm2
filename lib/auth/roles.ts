export type AppRole = "admin" | "staff"

export function isAppRole(value: unknown): value is AppRole {
  return value === "admin" || value === "staff"
}

export function staffAllowedPath(pathname: string): boolean {
  return (
    pathname === "/members" ||
    pathname.startsWith("/members/") ||
    pathname === "/kiosk-checkin" ||
    pathname === "/pos" ||
    pathname.startsWith("/pos/")
  )
}
