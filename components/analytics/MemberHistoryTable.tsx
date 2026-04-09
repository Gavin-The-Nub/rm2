import React from "react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { createClient } from "@supabase/supabase-js"

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]

async function getMemberHistory(month: number | null, year: number | null) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const filterMonth = month ?? now.getMonth() + 1
  const filterYear  = year  ?? (month ? now.getFullYear() : null)

  let query = supabase
    .from("members")
    .select(
      "id, name, membership_type, status, start_date, end_date, payment_amount, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .limit(50)

  if (filterYear && month) {
    const startDate = `${filterYear}-${String(filterMonth).padStart(2, "0")}-01`
    const endDay    = new Date(filterYear, filterMonth, 0).getDate()
    const endDate   = `${filterYear}-${String(filterMonth).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`
    query = query.gte("created_at", startDate + "T00:00:00").lte("created_at", endDate + "T23:59:59")
  } else if (filterYear && !month) {
    query = query
      .gte("created_at", `${filterYear}-01-01T00:00:00`)
      .lte("created_at", `${filterYear}-12-31T23:59:59`)
  }

  const { data: members, count } = await query

  // Get attendance counts per member
  const memberIds = (members || []).map((m) => m.id)
  const { data: attendance } = memberIds.length
    ? await supabase.from("attendance").select("member_id").in("member_id", memberIds)
    : { data: [] }

  const visitCounts: Record<string, number> = {}
  ;(attendance || []).forEach((a) => {
    visitCounts[a.member_id] = (visitCounts[a.member_id] || 0) + 1
  })

  // Last check-in per member
  const { data: lastCheckins } = memberIds.length
    ? await supabase
        .from("attendance")
        .select("member_id, check_in_date")
        .in("member_id", memberIds)
        .order("check_in_date", { ascending: false })
    : { data: [] }

  const lastSeenMap: Record<string, string> = {}
  ;(lastCheckins || []).forEach((a) => {
    if (!lastSeenMap[a.member_id]) lastSeenMap[a.member_id] = a.check_in_date
  })

  const typeLabels: Record<string, string> = {
    "1_day": "1 Day", "1_week": "Weekly",
    "1_month": "Monthly", "student_1_month": "Student",
  }
  const statusLabels: Record<string, string> = {
    active: "Active", expired: "Expired",
    suspended: "Suspended", cancelled: "Cancelled",
  }

  const today     = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

  const rows = (members || []).map((m) => {
    const lastSeenDate = lastSeenMap[m.id]
    let lastSeen = "Never"
    if (lastSeenDate) {
      if (lastSeenDate === today)     lastSeen = "Today"
      else if (lastSeenDate === yesterday) lastSeen = "Yesterday"
      else {
        const d = new Date(lastSeenDate + "T00:00:00")
        lastSeen = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
      }
    }

    const formatDate = (d: string | null) => {
      if (!d) return "—"
      return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      })
    }

    return {
      id: m.id,
      name: m.name,
      type: typeLabels[m.membership_type] || m.membership_type,
      status: statusLabels[m.status] || m.status,
      start: formatDate(m.start_date),
      end: formatDate(m.end_date),
      visits: visitCounts[m.id] || 0,
      lastSeen,
      paid: m.payment_amount != null ? `₱${Number(m.payment_amount).toFixed(2)}` : "—",
    }
  })

  return { rows, total: count ?? 0 }
}

export async function MemberHistoryTable({
  month,
  year,
}: {
  month: number | null
  year: number | null
}) {
  const { rows, total } = await getMemberHistory(month, year)

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
          <h3 className="text-lg font-semibold text-white">Member History</h3>
          <p className="text-sm text-gray-400 mt-1">
            Members joined — <span className="text-gray-300">{periodLabel}</span>
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
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Name</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Type</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Status</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Start Date</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">End Date</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Visits</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Last Seen</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Total Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((member) => (
              <tr key={member.id} className="cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-medium text-white">{member.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant={member.type === "1 Day" ? "neutral" : member.type === "Weekly" ? "weekly" : "secondary" as any}>
                    {member.type}
                  </Badge>
                </td>
                <td className="p-4">
                  <Badge variant={member.status === "Active" ? "positive" : member.status === "Suspended" ? "suspended" : "negative"}>
                    {member.status}
                  </Badge>
                </td>
                <td className="p-4 text-gray-400 text-sm">{member.start}</td>
                <td className="p-4 text-gray-400 text-sm">{member.end}</td>
                <td className="p-4 font-medium text-white">{member.visits}</td>
                <td className="p-4 text-gray-400 text-sm">{member.lastSeen}</td>
                <td className="p-4 font-medium text-white">{member.paid}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No members found for <span className="text-gray-400">{periodLabel}</span>.
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/[0.05] flex items-center justify-between text-sm text-gray-400">
        <div>Showing {rows.length} of {total.toLocaleString()} entries</div>
      </div>
    </Card>
  )
}
