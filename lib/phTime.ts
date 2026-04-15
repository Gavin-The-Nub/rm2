export const PH_TIME_ZONE = "Asia/Manila"

/**
 * Returns YYYY-MM-DD for "today" in Philippines time.
 * Uses Intl so it works consistently in browser + Node.
 */
export function phTodayISO(): string {
  return phDateISOFromDate(new Date())
}

/**
 * Formats a JS Date into YYYY-MM-DD as observed in Philippines time.
 */
export function phDateISOFromDate(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)

  const y = parts.find((p) => p.type === "year")?.value
  const m = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value

  if (!y || !m || !day) {
    // Fallback: still return a stable ISO-ish string.
    return d.toISOString().slice(0, 10)
  }

  return `${y}-${m}-${day}`
}

/**
 * Parses a YYYY-MM-DD string into a Date anchored at midnight Philippines time.
 * Philippines does not observe DST, so +08:00 is stable.
 */
export function parseISODateAtPHMidnight(dateISO: string): Date {
  // Accept either YYYY-MM-DD or full ISO; normalize to date part.
  const d = dateISO.includes("T") ? dateISO.split("T")[0] : dateISO
  return new Date(`${d}T00:00:00+08:00`)
}

/**
 * Adds days to a YYYY-MM-DD date in a PH-safe way and returns YYYY-MM-DD.
 */
export function addDaysISOInPH(dateISO: string, days: number): string {
  const base = parseISODateAtPHMidnight(dateISO)
  const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000)
  return phDateISOFromDate(next)
}

