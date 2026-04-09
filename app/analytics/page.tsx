import { Suspense } from "react"
import { RevenueAnalytics } from "@/components/analytics/RevenueAnalytics"
import { MembershipAnalytics } from "@/components/analytics/MembershipAnalytics"
import { AttendanceAnalytics } from "@/components/analytics/AttendanceAnalytics"
import { MemberHistoryTable } from "@/components/analytics/MemberHistoryTable"
import { AttendanceHistoryLog } from "@/components/analytics/AttendanceHistoryLog"
import { RenewalHistoryLog } from "@/components/analytics/RenewalHistoryLog"
import { DateRangeSelector } from "@/components/analytics/DateRangeSelector"
import { getRangeLabel } from "@/utils/date-filters"
import { HistoryDateFilter } from "@/components/analytics/HistoryDateFilter"

export const dynamic = "force-dynamic"

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string; month?: string; year?: string }
}) {
  const range  = (await searchParams).range  || "30d"
  const month  = (await searchParams).month  ? parseInt((await searchParams).month!) : null
  const year   = (await searchParams).year   ? parseInt((await searchParams).year!)  : null

  const rangeLabel = getRangeLabel(range)
  const now = new Date()

  // Build a readable period label for the history section
  let historyPeriodLabel = "All Time"
  if (month && year) {
    historyPeriodLabel = `${MONTHS[month - 1]} ${year}`
  } else if (year) {
    historyPeriodLabel = `${year}`
  } else if (month) {
    historyPeriodLabel = `${MONTHS[month - 1]} ${now.getFullYear()}`
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Detailed insights into revenue, memberships, and attendance.
          </p>
        </div>

        {/* Functional date range picker — updates URL → re-renders server components */}
        <Suspense fallback={<div className="w-44 h-9 bg-white/5 rounded-lg animate-pulse" />}>
          <DateRangeSelector />
        </Suspense>
      </div>

      <div className="flex flex-col gap-10">
        {/* ── Revenue ── */}
        <section id="revenue">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Revenue Analytics</h2>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">{rangeLabel}</span>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
            <RevenueAnalytics range={range} />
          </Suspense>
        </section>

        {/* ── Memberships ── */}
        <section id="memberships">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Membership Analytics</h2>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">{rangeLabel}</span>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
            <MembershipAnalytics range={range} />
          </Suspense>
        </section>

        {/* ── Attendance ── */}
        <section id="attendance" className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Attendance Analytics</h2>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">{rangeLabel}</span>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
            <AttendanceAnalytics range={range} />
          </Suspense>
        </section>

        {/* ── History Logs — shared month/year filter ── */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">History Logs</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Viewing: <span className="text-gray-300 font-medium">{historyPeriodLabel}</span>
              </p>
            </div>
            <Suspense fallback={<div className="w-64 h-9 bg-white/5 rounded-lg animate-pulse" />}>
              <HistoryDateFilter />
            </Suspense>
          </div>

          <div className="flex flex-col gap-6">
            <section id="member-history">
              <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
                <MemberHistoryTable month={month} year={year} />
              </Suspense>
            </section>

            <section id="attendance-log">
              <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
                <AttendanceHistoryLog month={month} year={year} />
              </Suspense>
            </section>

            <section id="renewal-log">
              <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
                <RenewalHistoryLog month={month} year={year} />
              </Suspense>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
