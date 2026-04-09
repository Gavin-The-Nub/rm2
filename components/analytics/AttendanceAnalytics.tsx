import React from "react"
import { StatCard } from "@/components/dashboard/StatCard"
import { createClient } from "@supabase/supabase-js"
import AttendanceCharts from "@/components/analytics/AttendanceCharts"
import { getRangeDates } from "@/utils/date-filters"

async function getAttendanceData(range: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const { startDate, endDate } = getRangeDates(range)

  // All attendance in period
  const { data: attendance } = await supabase
    .from("attendance")
    .select("id, member_id, check_in_date, created_at")
    .gte("check_in_date", startDate)
    .lte("check_in_date", endDate)

  const records = attendance || []

  const days = Math.round((now.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1

  // --- Summary stats ---
  const totalCheckIns = records.length
  const avgDaily = days > 0 ? Math.round(totalCheckIns / days) : 0

  // Day of week counts
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayShortNamesOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const dayCount: Record<string, number> = {}
  dayNames.forEach((d) => (dayCount[d] = 0))
  records.forEach((r) => {
    const d = dayNames[new Date(r.check_in_date).getDay()]
    dayCount[d]++
  })
  const checkInsByDayOfWeek = dayShortNamesOrder.map((day) => ({ day, value: dayCount[day] }))

  // Busiest day of week
  const busiestDayEntry = checkInsByDayOfWeek.reduce(
    (max, d) => (d.value > max.value ? d : max),
    { day: "N/A", value: 0 }
  )

  // --- Daily/Weekly Check-Ins Over Time ---
  const useWeekBuckets = days > 14
  const dayBuckets: Record<string, number> = {}

  if (useWeekBuckets) {
    const numWeeks = Math.ceil(days / 7)
    for (let i = 0; i < numWeeks; i++) dayBuckets[`Wk ${i + 1}`] = 0
    const rangeStart = new Date(startDate)
    records.forEach((r) => {
      const d = new Date(r.check_in_date)
      const wk = Math.min(Math.floor((d.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24 * 7)), numWeeks - 1)
      dayBuckets[`Wk ${wk + 1}`] = (dayBuckets[`Wk ${wk + 1}`] || 0) + 1
    })
  } else {
    // Daily with real dates: "Apr 7"
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      dayBuckets[key] = 0
    }
    records.forEach((r) => {
      const key = new Date(r.check_in_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      if (key in dayBuckets) dayBuckets[key]++
    })
  }

  const dailyCheckIns = Object.entries(dayBuckets).map(([date, value]) => ({ date, value }))

  // Busiest actual day
  const dayActualCount: Record<string, number> = {}
  records.forEach((r) => {
    dayActualCount[r.check_in_date] = (dayActualCount[r.check_in_date] || 0) + 1
  })
  const busiestActualEntry = Object.entries(dayActualCount).reduce(
    (max, [d, v]) => (v > max.value ? { day: d, value: v } : max),
    { day: "N/A", value: 0 }
  )

  // Hourly distribution
  const hourBuckets: Record<string, number> = {
    "6AM": 0, "9AM": 0, "12PM": 0, "3PM": 0, "6PM": 0, "9PM": 0,
  }
  records.forEach((r) => {
    if (!r.created_at) return
    const hour = new Date(r.created_at).getHours()
    if (hour >= 6 && hour < 9)   hourBuckets["6AM"]++
    else if (hour >= 9 && hour < 12)  hourBuckets["9AM"]++
    else if (hour >= 12 && hour < 15) hourBuckets["12PM"]++
    else if (hour >= 15 && hour < 18) hourBuckets["3PM"]++
    else if (hour >= 18 && hour < 21) hourBuckets["6PM"]++
    else if (hour >= 21)  hourBuckets["9PM"]++
  })
  const hourlyDistribution = Object.entries(hourBuckets).map(([hour, value]) => ({ hour, value }))
  const peakHourEntry = hourlyDistribution.reduce(
    (max, h) => (h.value > max.value ? h : max),
    { hour: "N/A", value: 0 }
  )

  // Heatmap: for the period, grouped by month/week grid of the START date's month
  const refDate = new Date(startDate)
  const heatmapYear  = refDate.getFullYear()
  const heatmapMonth = refDate.getMonth()
  const firstDayOfMonth = new Date(heatmapYear, heatmapMonth, 1).getDay()
  const daysInMonth     = new Date(heatmapYear, heatmapMonth + 1, 0).getDate()

  const heatmapData = Array.from({ length: 35 }, (_, i) => {
    const dayNum = i - firstDayOfMonth + 1
    if (dayNum < 1 || dayNum > daysInMonth) return { count: 0, isEmpty: true }
    const dateStr = `${heatmapYear}-${String(heatmapMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
    return { count: dayActualCount[dateStr] || 0, isEmpty: false }
  })

  return {
    totalCheckIns,
    avgDaily,
    busiestActualDay: busiestActualEntry,
    busiestDayOfWeek: busiestDayEntry.day,
    peakHour: peakHourEntry.hour,
    dailyCheckIns,
    checkInsByDayOfWeek,
    hourlyDistribution,
    heatmapData,
  }
}

export async function AttendanceAnalytics({ range = "30d" }: { range?: string }) {
  const data = await getAttendanceData(range)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Total Check-Ins" value={data.totalCheckIns.toLocaleString()} />
        <StatCard title="Avg Daily" value={String(data.avgDaily)} />
        <StatCard
          title="Busiest Day"
          value={String(data.busiestActualDay.value)}
          deltaLabel={data.busiestActualDay.day !== "N/A"
            ? new Date(data.busiestActualDay.day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            : "N/A"}
        />
        <StatCard title="Busiest Day of Week" value={data.busiestDayOfWeek} />
        <StatCard title="Peak Hour" value={data.peakHour} />
      </div>

      <AttendanceCharts
        dailyCheckIns={data.dailyCheckIns}
        checkInsByDayOfWeek={data.checkInsByDayOfWeek}
        hourlyDistribution={data.hourlyDistribution}
        heatmapData={data.heatmapData}
      />
    </div>
  )
}
