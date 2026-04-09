"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"
import { RANGES } from "@/utils/date-filters"

export function DateRangeSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentRange = searchParams.get("range") || "30d"

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("range", value)
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="relative flex items-center gap-2">
      <CalendarDays className="w-4 h-4 text-gray-400 pointer-events-none absolute left-3 z-10" />
      <select
        id="date-range-select"
        value={currentRange}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="
          appearance-none bg-[var(--color-bg-input)] border border-white/10
          text-sm text-[var(--color-text-primary)] outline-none
          pl-9 pr-8 py-2 rounded-lg cursor-pointer
          hover:border-white/20 transition-colors
          disabled:opacity-50
        "
      >
        {RANGES.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none absolute right-2 z-10" />
      {isPending && (
        <div className="absolute -right-6 top-1/2 -translate-y-1/2">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
