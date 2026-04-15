import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { normalizeNotificationStatus } from "@/lib/memberNotificationTracker"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const memberId = typeof body?.memberId === "string" ? body.memberId : ""
    const recipientEmail = typeof body?.recipientEmail === "string" ? body.recipientEmail : ""

    if (!memberId || !recipientEmail) {
      return NextResponse.json(
        { error: "memberId and recipientEmail are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("member_notification_logs")
      .insert({
        member_id: memberId,
        recipient_email: recipientEmail,
        kind: typeof body?.kind === "string" ? body.kind : "expiry_reminder",
        subject: typeof body?.subject === "string" ? body.subject : null,
        body_html: typeof body?.bodyHtml === "string" ? body.bodyHtml : null,
        body_text: typeof body?.bodyText === "string" ? body.bodyText : null,
        status: normalizeNotificationStatus(typeof body?.status === "string" ? body.status : "sent"),
        provider_message_id:
          typeof body?.providerMessageId === "string" ? body.providerMessageId : null,
        error_message: typeof body?.errorMessage === "string" ? body.errorMessage : null,
        delivered_at: typeof body?.deliveredAt === "string" ? body.deliveredAt : null,
        metadata:
          body?.metadata && typeof body.metadata === "object"
            ? (body.metadata as Record<string, unknown>)
            : null,
      })
      .select("id, member_id, recipient_email, kind, subject, sent_at, status, provider_message_id")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}
