"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { ChevronDown } from "lucide-react"

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]

function getYearsRange(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y)
  return years
}

export function HistoryDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const now = new Date()
  const currentMonth = parseInt(searchParams.get("month") || String(now.getMonth() + 1))
  const currentYear  = parseInt(searchParams.get("year")  || String(now.getFullYear()))

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  function handleAll() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("month")
    params.delete("year")
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  const isAllTime = !searchParams.get("month") && !searchParams.get("year")
  const years = getYearsRange()

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* All Time toggle */}
      <button
        onClick={handleAll}
        disabled={isPending}
        className={`
          text-xs px-3 py-1.5 rounded-lg border transition-colors
          ${isAllTime
            ? "bg-blue-600 border-blue-500 text-white"
            : "bg-[var(--color-bg-input)] border-white/10 text-gray-400 hover:border-white/20 hover:text-white"}
        `}
      >
        All Time
      </button>

      {/* Month selector */}
      <div className="relative">
        <select
          id="history-month-select"
          value={currentMonth}
          onChange={(e) => update("month", e.target.value)}
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

      {/* Year selector */}
      <div className="relative">
        <select
          id="history-year-select"
          value={currentYear}
          onChange={(e) => update("year", e.target.value)}
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

      {isPending && (
        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  )
}
