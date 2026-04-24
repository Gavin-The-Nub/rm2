import { phDateISOFromDate, phTodayISO, parseISODateAtPHMidnight } from "@/lib/phTime"

export const RANGES = [
  { value: "7d",   label: "Last 7 Days" },
  { value: "30d",  label: "Last 30 Days" },
  { value: "90d",  label: "Last 3 Months" },
  { value: "365d", label: "Last 12 Months" },
]

const PRESET_VALUES = new Set(RANGES.map((r) => r.value))

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** Derives startDate / endDate ISO strings from a range code */
export function getRangeDates(range: string): { startDate: string; endDate: string } {
  const endDate = phTodayISO()
  let days = 30
  if (range === "7d")   days = 7
  if (range === "30d")  days = 30
  if (range === "90d")  days = 90
  if (range === "365d") days = 365
  const endPH = parseISODateAtPHMidnight(endDate)
  const start = new Date(endPH.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  const startDate = phDateISOFromDate(start)
  return { startDate, endDate }
}

/** Returns a human-readable label for the current range */
export function getRangeLabel(range: string): string {
  return RANGES.find((r) => r.value === range)?.label ?? "Last 30 Days"
}

export type AnalyticsTablesFilter =
  | { mode: "all" }
  | { mode: "range"; startDate: string; endDate: string }

export type ChartPeriodBounds = {
  startDate: string
  endDate: string
  prevStart: string
  prevEnd: string
  /** Inclusive end instant for bucket labels (end of selected period) */
  chartEnd: Date
}

export type ResolvedAnalyticsPeriod = {
  pageLabel: string
  chartBadge: string
  chart: ChartPeriodBounds
  tables: AnalyticsTablesFilter
}

// ─── Monthly Period Helpers ───────────────────────────────────────────────────

/**
 * Short period label: "Jan 16 - Feb 15"
 */
export function monthlyPeriodLabel(month: number, year: number): string {
  const startMon = MONTH_SHORT[month - 1]
  let endMonth = month + 1
  if (endMonth > 12) endMonth = 1
  const endMon = MONTH_SHORT[endMonth - 1]
  return `${startMon} 16 - ${endMon} 15`
}

/**
 * Builds ISO startDate / endDate strings for a given monthly period.
 * Starts on the 16th of the given month, ends on the 15th of the next month.
 */
export function monthlyPeriodBounds(
  month: number,
  year: number
): { startDate: string; endDate: string } {
  const mm = String(month).padStart(2, "0")
  const startDate = `${year}-${mm}-16`

  let endMonth = month + 1
  let endYear = year
  if (endMonth > 12) {
    endMonth = 1
    endYear++
  }
  const endMm = String(endMonth).padStart(2, "0")
  const endDate = `${endYear}-${endMm}-15`

  return { startDate, endDate }
}

/**
 * Returns the previous monthly period before the given one.
 */
export function prevMonthlyPeriod(
  month: number,
  year: number
): { month: number; year: number } {
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year
  return { month: prevMonth, year: prevYear }
}

// ─── Rolling prev period (for preset ranges) ─────────────────────────────────

function rollingPrevPeriod(startDate: string): { prevStart: string; prevEnd: string } {
  const nowPH   = parseISODateAtPHMidnight(phTodayISO())
  const startMs = parseISODateAtPHMidnight(startDate).getTime()
  const rangeMs = nowPH.getTime() - startMs
  const prevEnd   = phDateISOFromDate(new Date(startMs - 86400000))
  const prevStart = phDateISOFromDate(new Date(startMs - rangeMs - 86400000))
  return { prevStart, prevEnd }
}

// ─── What is "current" period? ───────────────────────────────────────────────

/**
 * Returns the { month, year } that represents the current active
 * analytics period based on today's PH date.
 */
export function currentAnalyticsPeriod(): { month: number; year: number } {
  const now = parseISODateAtPHMidnight(phTodayISO())
  let m = now.getMonth() + 1
  let y = now.getFullYear()
  
  // If it's before the 16th, we are in the previous month's period
  if (now.getDate() <= 15) {
    m -= 1
    if (m === 0) {
      m = 12
      y -= 1
    }
  }
  return { month: m, year: y }
}

// ─── Main resolver ────────────────────────────────────────────────────────────

/**
 * Resolves a unified analytics period from URL search params.
 *
 * Priority:
 *  1. Quick preset (rolling N days)
 *  2. Calendar monthly period (month + year)
 *  3. Default: current monthly period
 */
export function resolveAnalyticsPeriod(params: {
  preset?: string | null
  /** Legacy `range` query param — treated as preset */
  range?: string | null
  month?: number | null
  year?: number | null
}): ResolvedAnalyticsPeriod {
  const legacy = params.range && PRESET_VALUES.has(params.range) ? params.range : null
  const preset =
    (params.preset && PRESET_VALUES.has(params.preset) ? params.preset : null) || legacy

  // ── 1. Quick preset (rolling range) ──────────────────────────────────────
  if (preset) {
    const { startDate, endDate } = getRangeDates(preset)
    const { prevStart, prevEnd } = rollingPrevPeriod(startDate)
    const label = getRangeLabel(preset)
    return {
      pageLabel:  label,
      chartBadge: label,
      chart: { startDate, endDate, prevStart, prevEnd, chartEnd: new Date(endDate + "T23:59:59") },
      tables: { mode: "range", startDate, endDate },
    }
  }

  // ── 2. Monthly Period selection ──────────────────────────────────────────
  const hasPeriod = params.month != null && params.year != null

  if (hasPeriod) {
    const m = params.month!
    const y = params.year!

    const { startDate, endDate } = monthlyPeriodBounds(m, y)
    const prev = prevMonthlyPeriod(m, y)
    const { startDate: prevStart, endDate: prevEnd } = monthlyPeriodBounds(prev.month, prev.year)
    const label = `${monthlyPeriodLabel(m, y)} ${y}`

    return {
      pageLabel:  label,
      chartBadge: label,
      chart: { startDate, endDate, prevStart, prevEnd, chartEnd: new Date(endDate + "T23:59:59") },
      tables: { mode: "range", startDate, endDate },
    }
  }

  // ── 3. Default: current monthly period ────────────────────────────────────
  const cur = currentAnalyticsPeriod()
  const { startDate, endDate } = monthlyPeriodBounds(cur.month, cur.year)
  const prev = prevMonthlyPeriod(cur.month, cur.year)
  const { startDate: prevStart, endDate: prevEnd } = monthlyPeriodBounds(prev.month, prev.year)
  const label = `${monthlyPeriodLabel(cur.month, cur.year)} ${cur.year}`

  return {
    pageLabel:  label,
    chartBadge: label,
    chart: { startDate, endDate, prevStart, prevEnd, chartEnd: new Date(endDate + "T23:59:59") },
    tables: { mode: "range", startDate, endDate },
  }
}
