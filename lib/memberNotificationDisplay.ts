import type { BadgeProps } from "@/components/ui/Badge"

export type NotificationLogRow = {
  id: string
  kind: string
  recipient_email: string
  sent_at: string
  status: string
  delivered_at?: string | null
  error_message?: string | null
  provider_message_id?: string | null
}

export function notificationKindLabel(kind: string): string {
  if (kind === "expiry_reminder") return "Expiry reminder"
  return kind.replace(/_/g, " ")
}

export function notificationStatusLabel(status: string): string {
  switch (status) {
    case "queued":
      return "Queued"
    case "sent":
      return "Sent"
    case "delivered":
      return "Delivered"
    case "bounced":
      return "Bounced"
    case "failed":
      return "Failed"
    case "skipped":
      return "Skipped"
    default:
      return status
  }
}

export function notificationStatusBadgeVariant(status: string): BadgeProps["variant"] {
  switch (status) {
    case "delivered":
      return "positive"
    case "sent":
    case "queued":
      return "weekly"
    case "bounced":
    case "failed":
      return "negative"
    case "skipped":
      return "neutral"
    default:
      return "neutral"
  }
}
