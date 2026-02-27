import { Suspense } from "react"
import { RevenueAnalytics } from "@/components/analytics/RevenueAnalytics"
import { MembershipAnalytics } from "@/components/analytics/MembershipAnalytics"
import { AttendanceAnalytics } from "@/components/analytics/AttendanceAnalytics"
import { MemberHistoryTable } from "@/components/analytics/MemberHistoryTable"
import { AttendanceHistoryLog } from "@/components/analytics/AttendanceHistoryLog"
import { RenewalHistoryLog } from "@/components/analytics/RenewalHistoryLog"

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Detailed insights into revenue, memberships, and attendance.
          </p>
        </div>
        
        <div className="flex bg-[var(--color-bg-input)] rounded-lg p-1">
          {/* Note: This is a placeholder for a real date range picker component if we added one */}
          <select className="bg-transparent border-none text-sm text-[var(--color-text-primary)] outline-none px-2 py-1">
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
            <option value="365d">Last 12 Months</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        <section id="revenue">
          <h2 className="text-xl font-semibold mb-4 text-white">Revenue Analytics</h2>
          <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--color-bg-card)] rounded-xl"></div>}>
            <RevenueAnalytics />
          </Suspense>
        </section>

        <section id="memberships">
          <h2 className="text-xl font-semibold mb-4 text-white">Membership Analytics</h2>
          <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--color-bg-card)] rounded-xl"></div>}>
            <MembershipAnalytics />
          </Suspense>
        </section>

        <section id="attendance" className="mb-4">
          <h2 className="text-xl font-semibold mb-4 text-white">Attendance Analytics</h2>
          <Suspense fallback={<div className="h-64 animate-pulse bg-[var(--color-bg-card)] rounded-xl"></div>}>
            <AttendanceAnalytics />
          </Suspense>
        </section>

        <section id="member-history" className="mb-4">
          <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl"></div>}>
            <MemberHistoryTable />
          </Suspense>
        </section>

        <section id="attendance-log" className="mb-4">
          <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl"></div>}>
            <AttendanceHistoryLog />
          </Suspense>
        </section>

        <section id="renewal-log">
          <Suspense fallback={<div className="h-[400px] animate-pulse bg-[var(--color-bg-card)] rounded-xl"></div>}>
            <RenewalHistoryLog />
          </Suspense>
        </section>
      </div>
    </div>
  )
}
