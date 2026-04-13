export const RANGES = [
  { value: "7d",   label: "Last 7 Days" },
  { value: "30d",  label: "Last 30 Days" },
  { value: "90d",  label: "Last 3 Months" },
  { value: "365d", label: "Last 12 Months" },
]

const PRESET_VALUES = new Set(RANGES.map((r) => r.value))

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

/** Derives startDate / endDate ISO strings from a range code */
export function getRangeDates(range: string): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString().split("T")[0]
  let days = 30
  if (range === "7d")   days = 7
  if (range === "30d")  days = 30
  if (range === "90d")  days = 90
  if (range === "365d") days = 365
  const start = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)
  const startDate = start.toISOString().split("T")[0]
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

function rollingPrevPeriod(startDate: string): { prevStart: string; prevEnd: string } {
  const now = new Date()
  const startMs = new Date(startDate + "T00:00:00").getTime()
  const rangeMs = now.getTime() - startMs
  const prevEnd = new Date(startMs - 86400000).toISOString().split("T")[0]
  const prevStart = new Date(startMs - rangeMs - 86400000).toISOString().split("T")[0]
  return { prevStart, prevEnd }
}

/**
 * One period for the whole analytics page: optional quick preset (rolling),
 * else calendar month+year (like history tables), else all-time lists with
 * last-12-month charts.
 */
export function resolveAnalyticsPeriod(params: {
  preset?: string | null
  /** Legacy `range` query param — treated as preset */
  range?: string | null
  month: number | null
  year: number | null
}): ResolvedAnalyticsPeriod {
  const now = new Date()
  const legacy = params.range && PRESET_VALUES.has(params.range) ? params.range : null
  const preset =
    (params.preset && PRESET_VALUES.has(params.preset) ? params.preset : null) || legacy

  if (preset) {
    const { startDate, endDate } = getRangeDates(preset)
    const { prevStart, prevEnd } = rollingPrevPeriod(startDate)
    const label = getRangeLabel(preset)
    return {
      pageLabel: label,
      chartBadge: label,
      chart: {
        startDate,
        endDate,
        prevStart,
        prevEnd,
        chartEnd: new Date(endDate + "T23:59:59"),
      },
      tables: { mode: "range", startDate, endDate },
    }
  }

  if (!preset && params.month != null && params.year != null) {
    const m = params.month
    const y = params.year
    const startDate = `${y}-${String(m).padStart(2, "0")}-01`
    const endDay = new Date(y, m, 0).getDate()
    const endDate = `${y}-${String(m).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`
    const prev = m === 1 ? { pm: 12, py: y - 1 } : { pm: m - 1, py: y }
    const prevEndDay = new Date(prev.py, prev.pm, 0).getDate()
    const prevStartDate = `${prev.py}-${String(prev.pm).padStart(2, "0")}-01`
    const prevEndDate = `${prev.py}-${String(prev.pm).padStart(2, "0")}-${String(prevEndDay).padStart(2, "0")}`
    const label = `${MONTH_NAMES[m - 1]} ${y}`
    return {
      pageLabel: label,
      chartBadge: label,
      chart: {
        startDate,
        endDate,
        prevStart: prevStartDate,
        prevEnd: prevEndDate,
        chartEnd: new Date(endDate + "T23:59:59"),
      },
      tables: { mode: "range", startDate, endDate },
    }
  }

  if (!preset && params.year != null && params.month == null) {
    const y = params.year
    const startDate = `${y}-01-01`
    const endDate = `${y}-12-31`
    const prevY = y - 1
    const prevStartDate = `${prevY}-01-01`
    const prevEndDate = `${prevY}-12-31`
    const label = `${y}`
    return {
      pageLabel: label,
      chartBadge: label,
      chart: {
        startDate,
        endDate,
        prevStart: prevStartDate,
        prevEnd: prevEndDate,
        chartEnd: new Date(endDate + "T23:59:59"),
      },
      tables: { mode: "range", startDate, endDate },
    }
  }

  if (!preset && params.month != null && params.year == null) {
    const m = params.month
    const y = now.getFullYear()
    const startDate = `${y}-${String(m).padStart(2, "0")}-01`
    const endDay = new Date(y, m, 0).getDate()
    const endDate = `${y}-${String(m).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`
    const prev = m === 1 ? { pm: 12, py: y - 1 } : { pm: m - 1, py: y }
    const prevEndDay = new Date(prev.py, prev.pm, 0).getDate()
    const prevStartDate = `${prev.py}-${String(prev.pm).padStart(2, "0")}-01`
    const prevEndDate = `${prev.py}-${String(prev.pm).padStart(2, "0")}-${String(prevEndDay).padStart(2, "0")}`
    const label = `${MONTH_NAMES[m - 1]} ${y}`
    return {
      pageLabel: label,
      chartBadge: label,
      chart: {
        startDate,
        endDate,
        prevStart: prevStartDate,
        prevEnd: prevEndDate,
        chartEnd: new Date(endDate + "T23:59:59"),
      },
      tables: { mode: "range", startDate, endDate },
    }
  }

  const { startDate, endDate } = getRangeDates("365d")
  const { prevStart, prevEnd } = rollingPrevPeriod(startDate)
  return {
    pageLabel: "All time",
    chartBadge: getRangeLabel("365d"),
    chart: {
      startDate,
      endDate,
      prevStart,
      prevEnd,
      chartEnd: new Date(endDate + "T23:59:59"),
    },
    tables: { mode: "all" },
  }
}
