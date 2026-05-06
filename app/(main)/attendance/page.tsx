import { Suspense } from "react"
import { AttendanceCalendar } from "@/components/attendance/AttendanceCalendar"

export const dynamic = "force-dynamic"

export default function AttendancePage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10 lg:h-[calc(100vh-120px)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Attendance Calendar</h1>
        <p className="text-[var(--color-text-secondary)]">
          Select a date to see the list of members who checked in.
        </p>
      </div>

      <Suspense fallback={<div className="flex-1 bg-white/5 rounded-xl animate-pulse" />}>
        <AttendanceCalendar />
      </Suspense>
    </div>
  )
}
