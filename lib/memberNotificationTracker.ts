export const MEMBER_NOTIFICATION_STATUSES = [
  "queued",
  "sent",
  "delivered",
  "bounced",
  "failed",
  "skipped",
] as const

export type MemberNotificationStatus = (typeof MEMBER_NOTIFICATION_STATUSES)[number]

export type CreateMemberNotificationLogInput = {
  memberId: string
  recipientEmail: string
  kind?: string
  status?: MemberNotificationStatus
  providerMessageId?: string | null
  errorMessage?: string | null
  deliveredAt?: string | null
  metadata?: Record<string, unknown> | null
}

export function normalizeNotificationStatus(status: string): MemberNotificationStatus {
  if (MEMBER_NOTIFICATION_STATUSES.includes(status as MemberNotificationStatus)) {
    return status as MemberNotificationStatus
  }
  return "sent"
}
