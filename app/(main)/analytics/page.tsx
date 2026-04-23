import { Suspense } from "react"
import Link from "next/link"
import { RevenueAnalytics } from "@/components/analytics/RevenueAnalytics"
import { MembershipAnalytics } from "@/components/analytics/MembershipAnalytics"
import { MemberHistoryTable } from "@/components/analytics/MemberHistoryTable"
import { RenewalHistoryLog } from "@/components/analytics/RenewalHistoryLog"
import { StoreSalesLog } from "@/components/analytics/StoreSalesLog"
import { resolveAnalyticsPeriod } from "@/utils/date-filters"
import { HistoryDateFilter } from "@/components/analytics/HistoryDateFilter"

export const dynamic = "force-dynamic"

type AnalyticsTab = "revenue" | "memberships" | "member-history" | "renewal-log" | "store-sales"

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; range?: string; month?: string; year?: string; half?: string; tab?: string }>
}) {
  const sp = await searchParams
  const month = sp.month ? parseInt(sp.month, 10) : null
  const year  = sp.year  ? parseInt(sp.year,  10) : null
  const rawHalf = sp.half ? parseInt(sp.half, 10) : null
  const half: 1 | 2 | null = rawHalf === 1 ? 1 : rawHalf === 2 ? 2 : null
  const tab = (sp.tab ?? "revenue") as AnalyticsTab
  const activeTab: AnalyticsTab =
    tab === "revenue" || tab === "memberships" || tab === "member-history" || tab === "renewal-log" || tab === "store-sales"
      ? tab
      : "revenue"
  const resolved = resolveAnalyticsPeriod({
    preset: sp.preset ?? null,
    range:  sp.range  ?? null,
    month:  Number.isFinite(month as number) ? month : null,
    year:   Number.isFinite(year  as number) ? year  : null,
    half,
  })

  const buildTabHref = (nextTab: AnalyticsTab) => {
    const query = new URLSearchParams()
    if (sp.preset) query.set("preset", sp.preset)
    if (sp.range)  query.set("range",  sp.range)
    if (sp.month)  query.set("month",  sp.month)
    if (sp.year)   query.set("year",   sp.year)
    if (sp.half)   query.set("half",   sp.half)
    query.set("tab", nextTab)
    return `?${query.toString()}`
  }

  const tabs: Array<{ id: AnalyticsTab; label: string }> = [
    { id: "revenue", label: "Revenue" },
    { id: "memberships", label: "Memberships" },
    { id: "member-history", label: "Member History" },
    { id: "renewal-log", label: "Renewal Log" },
    { id: "store-sales", label: "Store Sales" },
  ]

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

      <div className="flex flex-col gap-6">
        <nav className="rounded-xl border border-white/10 bg-[var(--color-bg-card)]/40 p-2">
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tabs.map((item) => {
              const isActive = activeTab === item.id
              return (
                <li key={item.id}>
                  <Link
                    href={buildTabHref(item.id)}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm text-center transition-colors",
                      isActive
                        ? "bg-white/15 text-white font-medium border border-white/15"
                        : "text-gray-300 bg-white/5 border border-transparent hover:bg-white/10",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {activeTab === "revenue" && (
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
        )}

        {activeTab === "memberships" && (
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
        )}

        {activeTab === "member-history" && (
          <section id="member-history">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Member History</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Showing period: <span className="text-gray-300 font-medium">{resolved.pageLabel}</span>
              </p>
            </div>
            <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
              <MemberHistoryTable tables={resolved.tables} periodLabel={resolved.pageLabel} />
            </Suspense>
          </section>
        )}

        {activeTab === "renewal-log" && (
          <section id="renewal-log">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Renewal History Log</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Showing period: <span className="text-gray-300 font-medium">{resolved.pageLabel}</span>
              </p>
            </div>
            <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
              <RenewalHistoryLog tables={resolved.tables} periodLabel={resolved.pageLabel} />
            </Suspense>
          </section>
        )}

        {activeTab === "store-sales" && (
          <section id="store-sales">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Store Sales Log</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Showing period: <span className="text-gray-300 font-medium">{resolved.pageLabel}</span>
              </p>
            </div>
            <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl" />}>
              <StoreSalesLog tables={resolved.tables} periodLabel={resolved.pageLabel} />
            </Suspense>
          </section>
        )}
      </div>
    </div>
  )
}
