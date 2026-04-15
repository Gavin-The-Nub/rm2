import Link from "next/link"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { createClient } from "@/utils/supabase/server"
import { isAppRole } from "@/lib/auth/roles"
import { Badge } from "@/components/ui/Badge"
import { notificationStatusBadgeVariant, notificationStatusLabel } from "@/lib/memberNotificationDisplay"

type EmailLogDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function EmailLogDetailPage({ params }: EmailLogDetailPageProps) {
  const { id } = await params
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

  const { data: row, error } = await supabase
    .from("member_notification_logs")
    .select(
      "id, member_id, recipient_email, kind, subject, body_html, body_text, sent_at, delivered_at, status, provider_message_id, error_message, members(name)"
    )
    .eq("id", id)
    .single()

  if (error || !row) {
    redirect("/email-logs")
  }

  const memberName = Array.isArray((row as any).members)
    ? (row as any).members?.[0]?.name
    : (row as any).members?.name

  return (
    <div className="w-full max-w-5xl mx-auto py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Email Message</h1>
        <Link href="/email-logs" className="text-sm text-accent-primary hover:underline">
          Back to email logs
        </Link>
      </div>

      <div className="border border-white/5 rounded-2xl p-6 bg-card/30 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Recipient</p>
            <p className="text-primary">{row.recipient_email}</p>
          </div>
          <Badge variant={notificationStatusBadgeVariant(row.status)}>
            {notificationStatusLabel(row.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Member</p>
            <p className="text-secondary">{memberName ?? "Unknown member"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Sent at</p>
            <p className="text-secondary">{format(new Date(row.sent_at), "MMM d, yyyy h:mm a")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Delivered at</p>
            <p className="text-secondary">
              {row.delivered_at ? format(new Date(row.delivered_at), "MMM d, yyyy h:mm a") : "Not yet"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Message ID</p>
            <p className="text-secondary break-all">{row.provider_message_id || "Not available"}</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted mb-1">Subject</p>
          <p className="text-primary">{row.subject || "(No subject stored)"}</p>
        </div>

        {row.error_message ? (
          <div>
            <p className="text-xs uppercase tracking-wider text-muted mb-1">Error</p>
            <p className="text-red-400 text-sm break-words">{row.error_message}</p>
          </div>
        ) : null}
      </div>

      <div className="border border-white/5 rounded-2xl p-6 bg-card/20">
        <p className="text-xs uppercase tracking-wider text-muted mb-3">Message content</p>
        {row.body_html ? (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: row.body_html }}
          />
        ) : row.body_text ? (
          <pre className="whitespace-pre-wrap text-sm text-secondary font-sans">{row.body_text}</pre>
        ) : (
          <p className="text-sm text-muted">No email body snapshot was stored for this message.</p>
        )}
      </div>
    </div>
  )
}
