
export const RANGES = [
  { value: "7d",   label: "Last 7 Days" },
  { value: "30d",  label: "Last 30 Days" },
  { value: "90d",  label: "Last 3 Months" },
  { value: "365d", label: "Last 12 Months" },
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
