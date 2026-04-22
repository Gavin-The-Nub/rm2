"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useTransition } from "react"
import { ChevronDown } from "lucide-react"
import {
  RANGES,
  MONTH_SHORT,
  halfEndDay,
  currentAnalyticsPeriod,
} from "@/utils/date-filters"

// ─── Types ────────────────────────────────────────────────────────────────────

interface PeriodOption {
  /** URL-safe value: "m{month}-h{half}" e.g. "m1-h1" */
  value: string
  label: string
  month: number
  half: 1 | 2
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPeriodOptions(): PeriodOption[] {
  const options: PeriodOption[] = []
  // We build the list for a current year; we'll later suffix year if needed.
  // The year-select is separate, so labels don't include year here.
  for (let m = 1; m <= 12; m++) {
    const mon = MONTH_SHORT[m - 1]
    options.push({
      value: `m${m}-h1`,
      label: `${mon} 1-15`,
      month: m,
      half: 1,
    })
    // For half=2 the end-day depends on the selected year; we'll resolve it
    // on select — but for the label in the dropdown we use a placeholder year.
    // We display e.g. "Jan 16-31" using the current year's last day.
    const now = new Date()
    const endDay = halfEndDay(m, now.getFullYear(), 2)
    options.push({
      value: `m${m}-h2`,
      label: `${mon} 16-${endDay}`,
      month: m,
      half: 2,
    })
  }
  return options
}

const PERIOD_OPTIONS = buildPeriodOptions()

function getYearsRange(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y)
  return years
}

function isPresetValue(v: string | null): v is string {
  return v != null && RANGES.some((r) => r.value === v)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HistoryDateFilter() {
  const pathname     = usePathname()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const now = new Date()

  // Determine which preset (quick range) is active
  const activePreset =
    (isPresetValue(searchParams.get("preset")) ? searchParams.get("preset") : null) ||
    (isPresetValue(searchParams.get("range"))  ? searchParams.get("range")  : null)

  // Determine current calendar selection
  const paramMonth = searchParams.get("month")
  const paramYear  = searchParams.get("year")
  const paramHalf  = searchParams.get("half")

  const isAllTime =
    !paramMonth && !paramYear && !activePreset && !paramHalf

  // Resolve current period selection for the dropdowns
  const defaultPeriod = currentAnalyticsPeriod()

  const currentMonth = paramMonth ? parseInt(paramMonth, 10) : defaultPeriod.month
  const currentYear  = paramYear  ? parseInt(paramYear,  10) : defaultPeriod.year
  const currentHalf  = paramHalf  ? (parseInt(paramHalf, 10) as 1 | 2) : defaultPeriod.half

  // Current select value for the period dropdown
  const periodValue = `m${currentMonth}-h${currentHalf}`

  // ── Auto-default on first load (no params) ──────────────────────────────
  useEffect(() => {
    if (!searchParams.get("month") && !searchParams.get("year") &&
        !searchParams.get("half")  && !searchParams.get("preset") &&
        !searchParams.get("range")) {
      const p = currentAnalyticsPeriod()
      const params = new URLSearchParams(searchParams.toString())
      params.set("month", String(p.month))
      params.set("year",  String(p.year))
      params.set("half",  String(p.half))
      // Use replace so back-button doesn't loop
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── URL helpers ─────────────────────────────────────────────────────────

  function pushParams(params: URLSearchParams) {
    const q = params.toString()
    startTransition(() => {
      router.push(q ? `${pathname}?${q}` : pathname, { scroll: false })
    })
  }

  function handleAll() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("month")
    params.delete("year")
    params.delete("half")
    params.delete("preset")
    params.delete("range")
    pushParams(params)
  }

  function handlePreset(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("month")
    params.delete("year")
    params.delete("half")
    params.delete("range")
    params.set("preset", value)
    pushParams(params)
  }

  function handlePeriodChange(value: string) {
    // value is like "m4-h1" or "m12-h2"
    const match = value.match(/^m(\d+)-h([12])$/)
    if (!match) return
    const m = parseInt(match[1], 10)
    const h = parseInt(match[2], 10) as 1 | 2
    const params = new URLSearchParams(searchParams.toString())
    params.delete("preset")
    params.delete("range")
    params.set("month", String(m))
    params.set("half",  String(h))
    if (!params.get("year")) params.set("year", String(now.getFullYear()))
    pushParams(params)
  }

  function handleYear(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("preset")
    params.delete("range")
    params.set("year", value)
    // Keep current month+half or default to current period
    if (!params.get("month")) params.set("month", String(defaultPeriod.month))
    if (!params.get("half"))  params.set("half",  String(defaultPeriod.half))
    pushParams(params)
  }

  const years = getYearsRange()

  const selectClass = `
    appearance-none bg-[var(--color-bg-input)] border border-white/10
    text-sm text-[var(--color-text-primary)] outline-none
    pl-3 pr-7 py-1.5 rounded-lg cursor-pointer
    hover:border-white/20 transition-colors disabled:opacity-50
  `

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {/* ── Calendar period pickers ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 w-full sm:w-auto">Period</span>

        {/* All time */}
        <button
          type="button"
          id="filter-all-time"
          onClick={handleAll}
          disabled={isPending}
          className={`
            text-xs px-3 py-1.5 rounded-lg border transition-colors
            ${isAllTime
              ? "bg-blue-600 border-blue-500 text-white"
              : "bg-[var(--color-bg-input)] border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}
          `}
        >
          All time
        </button>

        {/* Period dropdown (half-month) */}
        <div className="relative">
          <select
            id="history-period-select"
            value={activePreset ? "" : periodValue}
            onChange={(e) => handlePeriodChange(e.target.value)}
            disabled={isPending}
            className={selectClass}
          >
            {activePreset && (
              <option value="" disabled>-- select period --</option>
            )}
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
        </div>

        {/* Year dropdown */}
        <div className="relative">
          <select
            id="history-year-select"
            value={activePreset ? now.getFullYear() : currentYear}
            onChange={(e) => handleYear(e.target.value)}
            disabled={isPending}
            className={selectClass}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="hidden sm:block h-6 w-px bg-white/10 self-center" aria-hidden />

      {/* ── Quick ranges ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 w-full sm:w-auto">Quick range</span>
        {RANGES.map((r) => (
          <button
            key={r.value}
            id={`filter-preset-${r.value}`}
            type="button"
            onClick={() => handlePreset(r.value)}
            disabled={isPending}
            className={`
              text-xs px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap
              ${activePreset === r.value
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-[var(--color-bg-input)] border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}
            `}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isPending && (
        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
      )}
    </div>
  )
}
