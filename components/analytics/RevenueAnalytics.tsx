import React from "react"
import { StatCard } from "@/components/dashboard/StatCard"
import { Card } from "@/components/ui/Card"
import { createClient } from "@supabase/supabase-js"
import RevenueCharts from "@/components/analytics/RevenueCharts"
import { getRangeDates } from "@/utils/date-filters"

async function getRevenueData(range: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const { startDate, endDate } = getRangeDates(range)

  // Previous period = same number of days just before startDate
  const rangeMs = now.getTime() - new Date(startDate).getTime()
  const prevEnd  = new Date(new Date(startDate).getTime() - 1).toISOString().split("T")[0]
  const prevStart = new Date(new Date(startDate).getTime() - rangeMs - 1).toISOString().split("T")[0]

  // Fetch new member payments (current period)
  const { data: newMembersThis } = await supabase
    .from("members")
    .select("payment_amount, membership_type, created_at")
    .gte("created_at", startDate + "T00:00:00")
    .lte("created_at", endDate + "T23:59:59")

  // Fetch renewals (current period) — use amount field
  const { data: renewalsThis } = await supabase
    .from("renewals")
    .select("amount, membership_type, created_at")
    .gte("created_at", startDate + "T00:00:00")
    .lte("created_at", endDate + "T23:59:59")

  // Fetch prev period
  const { data: newMembersPrev } = await supabase
    .from("members")
    .select("payment_amount, created_at")
    .gte("created_at", prevStart + "T00:00:00")
    .lte("created_at", prevEnd + "T23:59:59")

  const { data: renewalsPrev } = await supabase
    .from("renewals")
    .select("amount, created_at")
    .gte("created_at", prevStart + "T00:00:00")
    .lte("created_at", prevEnd + "T23:59:59")

  // --- Compute summary stats ---
  const totalRevenue =
    (newMembersThis || []).reduce((s, m) => s + Number(m.payment_amount || 0), 0) +
    (renewalsThis   || []).reduce((s, r) => s + Number(r.amount || 0), 0)

  const newMemberRevenue = (newMembersThis || []).reduce((s, m) => s + Number(m.payment_amount || 0), 0)
  const renewalRevenue   = (renewalsThis   || []).reduce((s, r) => s + Number(r.amount || 0), 0)

  const prevTotalRevenue =
    (newMembersPrev || []).reduce((s, m) => s + Number(m.payment_amount || 0), 0) +
    (renewalsPrev   || []).reduce((s, r) => s + Number(r.amount || 0), 0)

  const revDelta = prevTotalRevenue > 0
    ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
    : 0

  const totalMembers =
    (newMembersThis || []).length + (renewalsThis || []).length
  const avgRevPerMember = totalMembers > 0 ? totalRevenue / totalMembers : 0

  // --- Revenue Over Time (daily buckets across the period) ---
  // Show up to last 14 days of the range for readability; bucket into weeks for longer ranges
  const days = Math.round((now.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
  const useWeekBuckets = days > 14

  const revenueByDay: Record<string, { newMembers: number; renewals: number }> = {}

  if (useWeekBuckets) {
    // Week buckets: Week 1, Week 2, …
    for (let i = 0; i < Math.ceil(days / 7); i++) {
      revenueByDay[`Wk ${i + 1}`] = { newMembers: 0, renewals: 0 }
    }
    const rangeStart = new Date(startDate)
    ;(newMembersThis || []).forEach((m) => {
      const d = new Date(m.created_at)
      const wk = Math.floor((d.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24 * 7))
      const key = `Wk ${Math.min(wk + 1, Math.ceil(days / 7))}`
      if (revenueByDay[key]) revenueByDay[key].newMembers += Number(m.payment_amount || 0)
    })
    ;(renewalsThis || []).forEach((r) => {
      const d = new Date(r.created_at)
      const wk = Math.floor((d.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24 * 7))
      const key = `Wk ${Math.min(wk + 1, Math.ceil(days / 7))}`
      if (revenueByDay[key]) revenueByDay[key].renewals += Number(r.amount || 0)
    })
  } else {
    // Daily: show each day label as "Apr 7"
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      revenueByDay[key] = { newMembers: 0, renewals: 0 }
    }
    ;(newMembersThis || []).forEach((m) => {
      const key = new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      if (revenueByDay[key]) revenueByDay[key].newMembers += Number(m.payment_amount || 0)
    })
    ;(renewalsThis || []).forEach((r) => {
      const key = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      if (revenueByDay[key]) revenueByDay[key].renewals += Number(r.amount || 0)
    })
  }

  const revenueOverTime = Object.entries(revenueByDay).map(([date, vals]) => ({
    date,
    ...vals,
  }))

  // Highest revenue day
  let highestRevDay = { day: "N/A", amount: 0 }
  revenueOverTime.forEach((d) => {
    const total = d.newMembers + d.renewals
    if (total > highestRevDay.amount) highestRevDay = { day: d.date, amount: total }
  })

  // --- Revenue by Membership Type ---
  const typeColors: Record<string, string> = {
    "1_day": "#9CA3AF", "1_week": "#3B82F6",
    "1_month": "#8B5CF6", "student_1_month": "#A855F7",
  }
  const typeLabels: Record<string, string> = {
    "1_day": "1 Day", "1_week": "Weekly",
    "1_month": "Monthly", "student_1_month": "Student",
  }
  const typeRevMap: Record<string, number> = { "1_day": 0, "1_week": 0, "1_month": 0, "student_1_month": 0 }
  ;(newMembersThis || []).forEach((m) => {
    if (m.membership_type in typeRevMap)
      typeRevMap[m.membership_type] += Number(m.payment_amount || 0)
  })
  ;(renewalsThis || []).forEach((r) => {
    if (r.membership_type in typeRevMap)
      typeRevMap[r.membership_type] += Number(r.amount || 0)
  })

  const membershipTypeRev = Object.entries(typeRevMap).map(([type, value]) => ({
    name: typeLabels[type] || type,
    value,
    color: typeColors[type] || "#6B7280",
  }))
  const totalTypeRev = membershipTypeRev.reduce((s, e) => s + e.value, 0)

  // --- Period Comparison (week buckets of the current period vs previous) ---
  const numWeeks = Math.min(Math.ceil(days / 7), 4)
  const weekBuckets = Array.from({ length: numWeeks }, (_, i) => `Wk ${i + 1}`)
  const currentWeeks = new Array(numWeeks).fill(0)
  const previousWeeks = new Array(numWeeks).fill(0)

  const rangeStart = new Date(startDate)
  ;(newMembersThis || []).forEach((m) => {
    const d = new Date(m.created_at)
    const wi = Math.min(Math.floor((d.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24 * 7)), numWeeks - 1)
    currentWeeks[wi] += Number(m.payment_amount || 0)
  })
  ;(renewalsThis || []).forEach((r) => {
    const d = new Date(r.created_at)
    const wi = Math.min(Math.floor((d.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24 * 7)), numWeeks - 1)
    currentWeeks[wi] += Number(r.amount || 0)
  })
  const prevStart2 = new Date(prevStart)
  ;(newMembersPrev || []).forEach((m) => {
    const d = new Date(m.created_at)
    const wi = Math.min(Math.floor((d.getTime() - prevStart2.getTime()) / (1000 * 60 * 60 * 24 * 7)), numWeeks - 1)
    previousWeeks[wi] += Number(m.payment_amount || 0)
  })
  ;(renewalsPrev || []).forEach((r) => {
    const d = new Date(r.created_at)
    const wi = Math.min(Math.floor((d.getTime() - prevStart2.getTime()) / (1000 * 60 * 60 * 24 * 7)), numWeeks - 1)
    previousWeeks[wi] += Number(r.amount || 0)
  })

  const monthlyComparison = weekBuckets.map((week, i) => ({
    week,
    current: currentWeeks[i],
    previous: previousWeeks[i],
  }))

  return {
    totalRevenue,
    newMemberRevenue,
    renewalRevenue,
    avgRevPerMember,
    revDelta,
    highestRevDay,
    revenueOverTime,
    membershipTypeRev,
    totalTypeRev,
    monthlyComparison,
  }
}

export async function RevenueAnalytics({ range = "30d" }: { range?: string }) {
  const data = await getRevenueData(range)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={`₱${data.totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          delta={parseFloat(data.revDelta.toFixed(1))}
          deltaLabel="vs prev period"
        />
        <StatCard
          title="New Member Revenue"
          value={`₱${data.newMemberRevenue.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        />
        <StatCard
          title="Renewal Revenue"
          value={`₱${data.renewalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        />
        <StatCard
          title="Avg Rev / Member"
          value={`₱${data.avgRevPerMember.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        />
        <StatCard
          title="Highest Rev Day"
          value={`₱${data.highestRevDay.amount.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          deltaLabel={data.highestRevDay.day}
        />
      </div>

      <RevenueCharts
        revenueOverTime={data.revenueOverTime}
        membershipTypeRev={data.membershipTypeRev}
        totalTypeRev={data.totalTypeRev}
        monthlyComparison={data.monthlyComparison}
      />
    </div>
  )
}
