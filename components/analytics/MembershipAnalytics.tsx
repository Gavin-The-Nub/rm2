import React from "react"
import { StatCard } from "@/components/dashboard/StatCard"
import { createClient } from "@supabase/supabase-js"
import MembershipCharts from "@/components/analytics/MembershipCharts"
import type { ChartPeriodBounds } from "@/utils/date-filters"

async function getMembershipData(period: ChartPeriodBounds) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { startDate, endDate, prevStart, prevEnd } = period
  const rangeStartMs = new Date(startDate + "T00:00:00").getTime()
  const rangeEndMs = new Date(endDate + "T00:00:00").getTime()
  const rangeMs = rangeEndMs - rangeStartMs

  // All members (for status breakdown & type distribution)
  const { data: allMembers } = await supabase
    .from("members")
    .select("id, status, membership_type, created_at")

  // New members this period
  const { data: newThisPeriod } = await supabase
    .from("members")
    .select("id, membership_type, created_at")
    .gte("created_at", startDate + "T00:00:00")
    .lte("created_at", endDate + "T23:59:59")

  // New members prev period
  const { data: newPrevPeriod } = await supabase
    .from("members")
    .select("id, created_at")
    .gte("created_at", prevStart + "T00:00:00")
    .lte("created_at", prevEnd + "T23:59:59")

  // Renewals this period
  const { data: renewalsThisPeriod } = await supabase
    .from("renewals")
    .select("id, member_id, created_at")
    .gte("created_at", startDate + "T00:00:00")
    .lte("created_at", endDate + "T23:59:59")

  // Renewals prev period
  const { data: renewalsPrevPeriod } = await supabase
    .from("renewals")
    .select("id, created_at")
    .gte("created_at", prevStart + "T00:00:00")
    .lte("created_at", prevEnd + "T23:59:59")

  // --- Summary stats ---
  const newMembersCount  = newThisPeriod?.length ?? 0
  const renewalsCount    = renewalsThisPeriod?.length ?? 0
  const prevNewCount     = newPrevPeriod?.length ?? 0
  const prevRenewalsCount = renewalsPrevPeriod?.length ?? 0

  const newDelta     = prevNewCount > 0 ? ((newMembersCount - prevNewCount) / prevNewCount) * 100 : 0
  const renewalDelta = prevRenewalsCount > 0 ? ((renewalsCount - prevRenewalsCount) / prevRenewalsCount) * 100 : 0

  const churnedCount = (allMembers || []).filter(
    (m) => (m.status === "expired" || m.status === "cancelled") &&
      m.created_at >= startDate + "T00:00:00" &&
      m.created_at <= endDate + "T23:59:59"
  ).length

  const netGrowth  = newMembersCount - churnedCount
  const renewalRate = newMembersCount > 0
    ? ((renewalsCount / (newMembersCount + renewalsCount)) * 100).toFixed(1)
    : "0.0"

  // --- New Members Over Time ---
  const days = Math.round(rangeMs / (1000 * 60 * 60 * 24)) + 1
  const useWeekBuckets = days > 14

  const newByPeriod: Record<string, number> = {}

  if (useWeekBuckets) {
    const numWeeks = Math.ceil(days / 7)
    for (let i = 0; i < numWeeks; i++) newByPeriod[`Wk ${i + 1}`] = 0
    const rangeStart = new Date(startDate + "T00:00:00")
    ;(newThisPeriod || []).forEach((m) => {
      const d = new Date(m.created_at)
      const wk = Math.min(Math.floor((d.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24 * 7)), numWeeks - 1)
      newByPeriod[`Wk ${wk + 1}`]++
    })
  } else {
    const dayMs = 24 * 60 * 60 * 1000
    for (let i = 0; i < days; i++) {
      const d = new Date(rangeStartMs + i * dayMs)
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      newByPeriod[key] = 0
    }
    ;(newThisPeriod || []).forEach((m) => {
      const key = new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      if (key in newByPeriod) newByPeriod[key]++
    })
  }

  const newMembersOverTime = Object.entries(newByPeriod).map(([date, value]) => ({ date, value }))

  // --- Membership Type Distribution (active members) ---
  const typeColors: Record<string, string> = {
    "1_day": "#9CA3AF", "1_week": "#3B82F6",
    "1_month": "#8B5CF6", "student_1_month": "#A855F7",
  }
  const typeLabels: Record<string, string> = {
    "1_day": "1 Day", "1_week": "Weekly",
    "1_month": "Monthly", "student_1_month": "Student",
  }
  const typeCounts: Record<string, number> = { "1_day": 0, "1_week": 0, "1_month": 0, "student_1_month": 0 }
  ;(allMembers || []).filter((m) => m.status === "active").forEach((m) => {
    if (m.membership_type in typeCounts) typeCounts[m.membership_type]++
  })
  const membershipTypeDist = Object.entries(typeCounts).map(([type, value]) => ({
    name: typeLabels[type] || type,
    value,
    color: typeColors[type] || "#6B7280",
  }))

  // --- Status Breakdown by Week ---
  const numWeeks = Math.min(Math.ceil(days / 7), 4)
  const weekBuckets = Array.from({ length: numWeeks }, (_, i) => `Wk ${i + 1}`)
  const statusByWeek = weekBuckets.map((week) => ({ week, Active: 0, Expired: 0, Suspended: 0 }))
  const rangeStart = new Date(startDate + "T00:00:00")
  ;(allMembers || []).forEach((m) => {
    if (m.created_at >= startDate + "T00:00:00" && m.created_at <= endDate + "T23:59:59") {
      const d = new Date(m.created_at)
      const wi = Math.min(Math.floor((d.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24 * 7)), numWeeks - 1)
      if (m.status === "active")    statusByWeek[wi].Active++
      else if (m.status === "expired")   statusByWeek[wi].Expired++
      else if (m.status === "suspended") statusByWeek[wi].Suspended++
    }
  })

  const totalActiveNow = (allMembers || []).filter((m) => m.status === "active").length

  return {
    newMembersCount,
    renewalsCount,
    churnedCount,
    netGrowth,
    renewalRate,
    newDelta,
    renewalDelta,
    newMembersOverTime,
    membershipTypeDist,
    totalActiveNow,
    statusByWeek,
  }
}

export async function MembershipAnalytics({ period }: { period: ChartPeriodBounds }) {
  const data = await getMembershipData(period)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="New Members"    value={String(data.newMembersCount)} delta={parseFloat(data.newDelta.toFixed(1))} deltaLabel="vs prev period" />
        <StatCard title="Renewals"       value={String(data.renewalsCount)}   delta={parseFloat(data.renewalDelta.toFixed(1))} deltaLabel="vs prev period" />
        <StatCard title="Churned Members" value={String(data.churnedCount)} />
        <StatCard title="Net Growth"     value={`${data.netGrowth >= 0 ? "+" : ""}${data.netGrowth}`} />
        <StatCard title="Renewal Rate"   value={`${data.renewalRate}%`} />
      </div>

      <MembershipCharts
        newMembersOverTime={data.newMembersOverTime}
        membershipTypeDist={data.membershipTypeDist}
        totalActiveNow={data.totalActiveNow}
        statusByWeek={data.statusByWeek}
      />
    </div>
  )
}
