import Link from "next/link"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { createClient } from "@/utils/supabase/server"
import { isAppRole } from "@/lib/auth/roles"
import { Badge } from "@/components/ui/Badge"
import {
  notificationKindLabel,
  notificationStatusBadgeVariant,
  notificationStatusLabel,
} from "@/lib/memberNotificationDisplay"

type EmailLogsPageProps = {
  searchParams: Promise<{ memberId?: string }>
}

export default async function EmailLogsPage({ searchParams }: EmailLogsPageProps) {
  const { memberId } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!isAppRole(profile?.role) || profile.role !== "admin") {
    redirect("/members")
  }

  let query = supabase
    .from("member_notification_logs")
    .select("id, member_id, recipient_email, kind, subject, sent_at, status, delivered_at, members(name)")
    .order("sent_at", { ascending: false })
    .limit(200)

  if (memberId) {
    query = query.eq("member_id", memberId)
  }

  const { data: logs, error } = await query

  if (error) {
    console.error("Failed to load email logs:", error)
  }

  const memberName = (members: any) =>
    Array.isArray(members) ? members?.[0]?.name : members?.name

  return (
    <div className="w-full max-w-7xl mx-auto py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Email Logs</h1>
          <p className="text-sm text-secondary mt-1 tracking-wide">
            Delivery history for expiry reminders and other member notifications.
          </p>
        </div>
        {memberId ? (
          <Link href="/email-logs" className="text-sm text-accent-primary hover:underline">
            Clear member filter
          </Link>
        ) : null}
      </div>

      <div className="border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-card/50 text-muted uppercase text-[11px] font-medium tracking-wider border-b border-white/5">
            <tr>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4">Member</th>
              <th className="px-5 py-4">Recipient</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Sent</th>
              <th className="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {!logs || logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted">
                  No email logs found.
                </td>
              </tr>
            ) : (
              logs.map((row: any) => (
                <tr key={row.id} className="hover:bg-card-hover transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-primary">{notificationKindLabel(row.kind)}</p>
                    <p className="text-xs text-muted max-w-[320px] truncate">
                      {row.subject || "No subject captured"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-secondary">{memberName(row.members) ?? "Unknown member"}</td>
                  <td className="px-5 py-4 text-secondary">{row.recipient_email}</td>
                  <td className="px-5 py-4">
                    <Badge variant={notificationStatusBadgeVariant(row.status)}>
                      {notificationStatusLabel(row.status)}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-secondary">
                    {format(new Date(row.sent_at), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/email-logs/${row.id}`} className="text-sm text-accent-primary hover:underline">
                      View message
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
