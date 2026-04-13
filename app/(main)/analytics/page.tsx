import { Suspense } from "react"
import { RevenueAnalytics } from "@/components/analytics/RevenueAnalytics"
import { MembershipAnalytics } from "@/components/analytics/MembershipAnalytics"
import { MemberHistoryTable } from "@/components/analytics/MemberHistoryTable"
import { RenewalHistoryLog } from "@/components/analytics/RenewalHistoryLog"
import { resolveAnalyticsPeriod } from "@/utils/date-filters"
import { HistoryDateFilter } from "@/components/analytics/HistoryDateFilter"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; range?: string; month?: string; year?: string }>
}) {
  const sp = await searchParams
  const month = sp.month ? parseInt(sp.month, 10) : null
  const year = sp.year ? parseInt(sp.year, 10) : null
  const resolved = resolveAnalyticsPeriod({
    preset: sp.preset ?? null,
    range: sp.range ?? null,
    month: Number.isFinite(month as number) ? month : null,
    year: Number.isFinite(year as number) ? year : null,
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Revenue, memberships, and history — one date control for the whole page.
          </p>
        </div>

        <Suspense fallback={<div className="h-20 bg-white/5 rounded-lg animate-pulse" />}>
          <div className="rounded-xl border border-white/10 bg-[var(--color-bg-card)]/50 p-4">
            <p className="text-sm text-gray-400 mb-3">
              Showing: <span className="text-gray-200 font-medium">{resolved.pageLabel}</span>
              {resolved.pageLabel !== resolved.chartBadge && (
                <span className="text-gray-500"> · Charts: {resolved.chartBadge}</span>
              )}
            </p>
            <HistoryDateFilter />
          </div>
        </Suspense>
      </div>

      <div className="flex flex-col gap-10">
        <section id="revenue">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Revenue Analytics</h2>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
              {resolved.chartBadge}
            </span>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
            <RevenueAnalytics period={resolved.chart} />
          </Suspense>
        </section>

        <section id="memberships">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Membership Analytics</h2>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
              {resolved.chartBadge}
            </span>
          </div>
          <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
            <MembershipAnalytics period={resolved.chart} />
          </Suspense>
        </section>

        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">History logs</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Same period as above: <span className="text-gray-300 font-medium">{resolved.pageLabel}</span>
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <section id="member-history">
              <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
                <MemberHistoryTable tables={resolved.tables} periodLabel={resolved.pageLabel} />
              </Suspense>
            </section>

            <section id="renewal-log">
              <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
                <RenewalHistoryLog tables={resolved.tables} periodLabel={resolved.pageLabel} />
              </Suspense>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
