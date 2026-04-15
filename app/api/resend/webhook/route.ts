import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { normalizeNotificationStatus } from "@/lib/memberNotificationTracker"

function mapResendTypeToStatus(eventType: string): string {
  if (eventType.includes("delivered")) return "delivered"
  if (eventType.includes("bounced")) return "bounced"
  if (eventType.includes("failed")) return "failed"
  if (eventType.includes("complained")) return "failed"
  return "sent"
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const eventType = String(payload?.type ?? "")
    const providerMessageId =
      typeof payload?.data?.email_id === "string"
        ? payload.data.email_id
        : typeof payload?.data?.id === "string"
          ? payload.data.id
          : ""

    if (!providerMessageId) {
      return NextResponse.json({ error: "Missing provider message id" }, { status: 400 })
    }

    const status = normalizeNotificationStatus(mapResendTypeToStatus(eventType))
    const deliveredAt = status === "delivered" ? new Date().toISOString() : null

    const supabase = await createClient()
    const { error } = await supabase
      .from("member_notification_logs")
      .update({
        status,
        delivered_at: deliveredAt,
        metadata: payload,
      })
      .eq("provider_message_id", providerMessageId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
  }
}
