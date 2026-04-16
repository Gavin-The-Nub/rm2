import React from "react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { createClient } from "@supabase/supabase-js"
import type { AnalyticsTablesFilter } from "@/utils/date-filters"

async function getRenewalLogs(tables: AnalyticsTablesFilter) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = supabase
    .from("renewals")
    .select(
      "id, member_id, created_at, membership_type, previous_end_date, new_end_date, payment_amount",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })

  if (tables.mode === "range") {
    const startTs = tables.startDate + "T00:00:00"
    const endTs = tables.endDate + "T23:59:59"
    query = query.gte("created_at", startTs).lte("created_at", endTs)
  }

  const { data: renewals, count, error } = await query.limit(50)
  if (error) {
    console.error("Failed to load renewal logs:", error)
    return { rows: [], total: 0 }
  }
  const memberIds = Array.from(new Set((renewals || []).map((r: any) => r.member_id).filter(Boolean)))
  const { data: members } = memberIds.length
    ? await supabase.from("members").select("id,name").in("id", memberIds)
    : { data: [] }
  const memberNames = new Map((members || []).map((m) => [m.id, m.name]))

  const typeLabels: Record<string, string> = {
    "1_day": "1 Day",
    "1_week": "Weekly",
    "weekly": "Weekly",
    "1_month": "Monthly",
    "monthly": "Monthly",
    "student_1_month": "Student",
    "student_monthly": "Student Monthly",
  }

  const today     = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  const rows = (renewals || []).map((r) => {
    const name = memberNames.get((r as any).member_id) ?? "Unknown"

    const renewalTimestamp = (r as any).created_at
    const dateObj = new Date(renewalTimestamp)
    const dateStr = dateObj.toISOString().split("T")[0]
    const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })

    let dateLabel = ""
    if (dateStr === today) dateLabel = `Today, ${timeStr}`
    else if (dateStr === yesterday) dateLabel = `Yesterday, ${timeStr}`
    else {
      dateLabel = `${dateObj.toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      })}, ${timeStr}`
    }

    const formatDate = (d: string) =>
      d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      }) : "—"

    return {
      id: r.id,
      date: dateLabel,
      name,
      type: typeLabels[r.membership_type] || r.membership_type,
      prevEnd: formatDate(r.previous_end_date),
      newEnd: formatDate(r.new_end_date),
      amount:
        (r as any).payment_amount != null
          ? `₱${Number((r as any).payment_amount).toFixed(2)}`
          : "—",
    }
  })

  return { rows, total: count ?? 0 }
}

export async function RenewalHistoryLog({
  tables,
  periodLabel,
}: {
  tables: AnalyticsTablesFilter
  periodLabel: string
}) {
  const { rows, total } = await getRenewalLogs(tables)

  return (
    <Card className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-white/[0.05] gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Renewal Log</h3>
          <p className="text-sm text-gray-400 mt-1">
            History of all membership renewals — <span className="text-gray-300">{periodLabel}</span>
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          {total.toLocaleString()} total renewals
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Date</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Member Name</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Type</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Previous End Date</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">New End Date</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr key={log.id} className="cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                <td className="p-4 text-sm text-gray-300">{log.date}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {log.name.charAt(0)}
                    </div>
                    <span className="font-medium text-white">{log.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant={log.type === '1 Day' ? 'neutral' : log.type === 'Weekly' ? 'weekly' : 'secondary' as any}>
                    {log.type}
                  </Badge>
                </td>
                <td className="p-4 text-sm text-gray-400">{log.prevEnd}</td>
                <td className="p-4 text-sm text-blue-400 font-medium">{log.newEnd}</td>
                <td className="p-4 font-bold text-white">{log.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No renewals found for <span className="text-gray-400">{periodLabel}</span>.
          </div>
        )}
      </div>

      <div className="p-4 flex items-center justify-between text-sm text-gray-400">
        <div>Showing {rows.length} of {total.toLocaleString()} entries</div>
      </div>
    </Card>
  )
}
