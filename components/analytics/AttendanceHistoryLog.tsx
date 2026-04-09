import React from "react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { createClient } from "@supabase/supabase-js"

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]

async function getAttendanceLogs(month: number | null, year: number | null) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const filterMonth = month ?? now.getMonth() + 1
  const filterYear  = year  ?? (month ? now.getFullYear() : null)

  let query = supabase
    .from("attendance")
    .select(
      "id, check_in_date, created_at, member_id, members(name, membership_type, status)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(50)

  // Apply date filter only when month/year are set
  if (filterYear && month) {
    const startDate = `${filterYear}-${String(filterMonth).padStart(2, "0")}-01`
    const endDay    = new Date(filterYear, filterMonth, 0).getDate()
    const endDate   = `${filterYear}-${String(filterMonth).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`
    query = query.gte("check_in_date", startDate).lte("check_in_date", endDate)
  } else if (filterYear && !month) {
    const startDate = `${filterYear}-01-01`
    const endDate   = `${filterYear}-12-31`
    query = query.gte("check_in_date", startDate).lte("check_in_date", endDate)
  }

  const { data: logs, count } = await query

  const typeLabels: Record<string, string> = {
    "1_day": "1 Day", "1_week": "Weekly",
    "1_month": "Monthly", "student_1_month": "Student",
  }

  const today     = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  const rows = (logs || []).map((log) => {
    const member = (log as any).members
    const name        = member?.name ?? "Unknown"
    const memberType  = member?.membership_type ?? ""
    const memberStatus = member?.status ?? ""

    const checkInDate = log.check_in_date
    let dateLabel = ""
    if (checkInDate === today) {
      const time = new Date(log.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      dateLabel = `Today, ${time}`
    } else if (checkInDate === yesterday) {
      const time = new Date(log.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      dateLabel = `Yesterday, ${time}`
    } else {
      // Show full date with day of week
      const d = new Date(checkInDate + "T00:00:00")
      dateLabel = d.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      })
    }

    let scanStatus = "Success"
    if (memberStatus === "expired")   scanStatus = "Expired"
    else if (memberStatus === "suspended") scanStatus = "Suspended"
    else if (memberStatus === "cancelled") scanStatus = "Expired"

    return {
      id: log.id,
      dateTime: dateLabel,
      name,
      type: typeLabels[memberType] || memberType,
      status: scanStatus,
    }
  })

  return { rows, total: count ?? 0 }
}

export async function AttendanceHistoryLog({
  month,
  year,
}: {
  month: number | null
  year: number | null
}) {
  const { rows, total } = await getAttendanceLogs(month, year)

  const now = new Date()
  const filterMonth = month ?? now.getMonth() + 1
  const filterYear  = year  ?? now.getFullYear()
  const periodLabel = month
    ? `${MONTHS[filterMonth - 1]} ${filterYear}`
    : year
    ? `${filterYear}`
    : "All Time"

  return (
    <Card className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-white/[0.05] gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Attendance Log</h3>
          <p className="text-sm text-gray-400 mt-1">
            Detailed check-in history — <span className="text-gray-300">{periodLabel}</span>
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          {total.toLocaleString()} total records
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Date &amp; Time</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Member Name</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Membership Type</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Status at Scan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr key={log.id} className="cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                <td className="p-4 text-sm text-gray-300">{log.dateTime}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {log.name.charAt(0)}
                    </div>
                    <span className="font-medium text-white">{log.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant={log.type === "1 Day" ? "neutral" : log.type === "Weekly" ? "weekly" : "secondary" as any}>
                    {log.type}
                  </Badge>
                </td>
                <td className="p-4">
                  <Badge
                    variant={
                      log.status === "Success" ? "positive" :
                      log.status === "Suspended" ? "suspended" : "negative"
                    }
                  >
                    {log.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No attendance records found for <span className="text-gray-400">{periodLabel}</span>.
          </div>
        )}
      </div>

      <div className="p-4 flex items-center justify-between text-sm text-gray-400">
        <div>Showing {rows.length} of {total.toLocaleString()} entries</div>
      </div>
    </Card>
  )
}
