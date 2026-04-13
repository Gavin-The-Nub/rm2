"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { ChevronDown } from "lucide-react"
import { RANGES } from "@/utils/date-filters"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function getYearsRange(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y)
  return years
}

function isPresetValue(v: string | null): v is string {
  return v != null && RANGES.some((r) => r.value === v)
}

export function HistoryDateFilter() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const currentMonth = parseInt(searchParams.get("month") || String(now.getMonth() + 1))
  const currentYear = parseInt(searchParams.get("year") || String(now.getFullYear()))

  const activePreset =
    (isPresetValue(searchParams.get("preset")) ? searchParams.get("preset") : null) ||
    (isPresetValue(searchParams.get("range")) ? searchParams.get("range") : null)

  const isAllTime =
    !searchParams.get("month") && !searchParams.get("year") && !activePreset

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
    params.delete("preset")
    params.delete("range")
    pushParams(params)
  }

  function handlePreset(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("month")
    params.delete("year")
    params.delete("range")
    params.set("preset", value)
    pushParams(params)
  }

  function handleMonth(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("preset")
    params.delete("range")
    params.set("month", value)
    if (!params.get("year")) params.set("year", String(now.getFullYear()))
    pushParams(params)
  }

  function handleYear(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("preset")
    params.delete("range")
    params.set("year", value)
    if (!params.get("month")) params.set("month", String(now.getMonth() + 1))
    pushParams(params)
  }

  const years = getYearsRange()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 w-full sm:w-auto">Calendar</span>
        <button
          type="button"
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

        <div className="relative">
          <select
            id="history-month-select"
            value={currentMonth}
            onChange={(e) => handleMonth(e.target.value)}
            disabled={isPending}
            className="
              appearance-none bg-[var(--color-bg-input)] border border-white/10
              text-sm text-[var(--color-text-primary)] outline-none
              pl-3 pr-7 py-1.5 rounded-lg cursor-pointer
              hover:border-white/20 transition-colors disabled:opacity-50
            "
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
        </div>

        <div className="relative">
          <select
            id="history-year-select"
            value={currentYear}
            onChange={(e) => handleYear(e.target.value)}
            disabled={isPending}
            className="
              appearance-none bg-[var(--color-bg-input)] border border-white/10
              text-sm text-[var(--color-text-primary)] outline-none
              pl-3 pr-7 py-1.5 rounded-lg cursor-pointer
              hover:border-white/20 transition-colors disabled:opacity-50
            "
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="hidden sm:block h-6 w-px bg-white/10 self-center" aria-hidden />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 w-full sm:w-auto">Quick range</span>
        {RANGES.map((r) => (
          <button
            key={r.value}
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
