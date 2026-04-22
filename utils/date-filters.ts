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

// ─── Half-month helpers ───────────────────────────────────────────────────────

/**
 * Returns the half-month period number for today (PH time).
 * 1 = days 1–15, 2 = days 16–end.
 */
export function currentHalf(now: Date): 1 | 2 {
  return now.getDate() <= 15 ? 1 : 2
}

/**
 * Returns the last day of a half:
 *  half=1 always ends on day 15.
 *  half=2 ends on the last day of the month.
 */
export function halfEndDay(month: number, year: number, half: 1 | 2): number {
  if (half === 1) return 15
  return new Date(year, month, 0).getDate() // last day of the month
}

/**
 * Short period label: "Jan 1-15" or "Jan 16-31"
 */
export function halfMonthLabel(month: number, year: number, half: 1 | 2): string {
  const mon = MONTH_SHORT[month - 1]
  const endDay = halfEndDay(month, year, half)
  return half === 1 ? `${mon} 1-15` : `${mon} 16-${endDay}`
}

/**
 * Builds ISO startDate / endDate strings for a given half-month period.
 */
export function halfMonthBounds(
  month: number,
  year: number,
  half: 1 | 2
): { startDate: string; endDate: string } {
  const mm = String(month).padStart(2, "0")
  if (half === 1) {
    return {
      startDate: `${year}-${mm}-01`,
      endDate:   `${year}-${mm}-15`,
    }
  }
  const lastDay = new Date(year, month, 0).getDate()
  const dd = String(lastDay).padStart(2, "0")
  return {
    startDate: `${year}-${mm}-16`,
    endDate:   `${year}-${mm}-${dd}`,
  }
}

/**
 * Returns the previous half-period before the given one.
 * prev of Jan 1-15  → Dec 16-31 (prev year)
 * prev of Jan 16-31 → Jan 1-15
 */
export function prevHalfMonth(
  month: number,
  year: number,
  half: 1 | 2
): { month: number; year: number; half: 1 | 2 } {
  if (half === 2) {
    return { month, year, half: 1 }
  }
  // half === 1: go to month-1 half 2
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year
  return { month: prevMonth, year: prevYear, half: 2 }
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

// ─── What is "current" half-month? ───────────────────────────────────────────

/**
 * Returns the { month, year, half } that represents the current active
 * analytics period based on today's PH date.
 */
export function currentAnalyticsPeriod(): { month: number; year: number; half: 1 | 2 } {
  const now = parseISODateAtPHMidnight(phTodayISO())
  return {
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
    half:  currentHalf(now),
  }
}

// ─── Main resolver ────────────────────────────────────────────────────────────

/**
 * Resolves a unified analytics period from URL search params.
 *
 * Priority:
 *  1. Quick preset (rolling N days)
 *  2. Calendar half-month (month + year + half)
 *  3. Legacy full-month (month + year, no half) — treated as half=current
 *  4. Default: current half-month period
 */
export function resolveAnalyticsPeriod(params: {
  preset?: string | null
  /** Legacy `range` query param — treated as preset */
  range?: string | null
  month: number | null
  year: number | null
  half?: number | null
}): ResolvedAnalyticsPeriod {
  const now    = parseISODateAtPHMidnight(phTodayISO())
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

  // ── 2. Half-month selection ───────────────────────────────────────────────
  const rawHalf = params.half != null ? Number(params.half) : null
  const half: 1 | 2 | null = rawHalf === 1 ? 1 : rawHalf === 2 ? 2 : null

  const hasPeriod = params.month != null && params.year != null

  if (hasPeriod) {
    const m = params.month!
    const y = params.year!
    const h: 1 | 2 = half ?? currentHalf(now)

    const { startDate, endDate } = halfMonthBounds(m, y, h)
    const prev = prevHalfMonth(m, y, h)
    const { startDate: prevStart, endDate: prevEnd } = halfMonthBounds(prev.month, prev.year, prev.half)
    const label = `${halfMonthLabel(m, y, h)} ${y}`

    return {
      pageLabel:  label,
      chartBadge: label,
      chart: { startDate, endDate, prevStart, prevEnd, chartEnd: new Date(endDate + "T23:59:59") },
      tables: { mode: "range", startDate, endDate },
    }
  }

  // ── 3. Default: current half-month ────────────────────────────────────────
  const cur = currentAnalyticsPeriod()
  const { startDate, endDate } = halfMonthBounds(cur.month, cur.year, cur.half)
  const prev = prevHalfMonth(cur.month, cur.year, cur.half)
  const { startDate: prevStart, endDate: prevEnd } = halfMonthBounds(prev.month, prev.year, prev.half)
  const label = `${halfMonthLabel(cur.month, cur.year, cur.half)} ${cur.year}`

  return {
    pageLabel:  label,
    chartBadge: label,
    chart: { startDate, endDate, prevStart, prevEnd, chartEnd: new Date(endDate + "T23:59:59") },
    tables: { mode: "range", startDate, endDate },
  }
}
