import { startOfDay, addDays, isAfter } from "date-fns"
import { phTodayISO, parseISODateAtPHMidnight, addDaysISOInPH } from "@/lib/phTime"

/** Days from today (inclusive) treated as “expiring soon” for active memberships. */
export const EXPIRING_SOON_DAYS = 3

export type MemberSubscriptionInput = {
  end_date: string
  status: string
  membership_type?: string | null
}

export type SubscriptionCategory = "active" | "expiring_soon" | "expired" | "other"

/**
 * For weekly memberships, the system historically/currently saves the end_date as start_date + 7 days (e.g. next Monday).
 * To make it expire on Sunday (giving exactly 7 active days, inclusive), we adjust the end_date by subtracting 1 day for business logic and UI display.
 */
export function getAdjustedEndDate(endDateISO: string, membershipType?: string | null): string {
  if (membershipType === "weekly" && endDateISO) {
    return addDaysISOInPH(endDateISO, -1)
  }
  return endDateISO
}

export function memberSubscriptionCategory(m: MemberSubscriptionInput): SubscriptionCategory {
  const adjustedEndDate = getAdjustedEndDate(m.end_date, m.membership_type)
  if (!adjustedEndDate) return "expired"
  
  // Use Philippines time for all “today / end date” comparisons.
  const todayISO = phTodayISO()
  if (adjustedEndDate < todayISO) return "expired"

  // For expiring-soon threshold, do date math at PH midnight.
  const todayPH = parseISODateAtPHMidnight(todayISO)
  if (m.status !== "active") return "other"
  const threshold = startOfDay(addDays(todayPH, EXPIRING_SOON_DAYS))
  let end: Date
  try {
    end = startOfDay(parseISODateAtPHMidnight(adjustedEndDate))
  } catch {
    return "expired"
  }
  if (isAfter(end, threshold)) return "active"
  return "expiring_soon"
}

/** Treat truly active and expiring-soon memberships as active for totals/analytics. */
export function isSubscriptionCountedActive(m: MemberSubscriptionInput): boolean {
  const cat = memberSubscriptionCategory(m)
  return cat === "active" || cat === "expiring_soon"
}

export type MemberStatusLabel = "Suspended" | "Cancelled" | "Expired" | "Expiring soon" | "Active"

export function memberStatusLabel(m: MemberSubscriptionInput): MemberStatusLabel {
  if (m.status === "suspended") return "Suspended"
  if (m.status === "cancelled") return "Cancelled"
  const cat = memberSubscriptionCategory(m)
  if (cat === "expired") return "Expired"
  if (cat === "expiring_soon") return "Expiring soon"
  return "Active"
}

export type MemberBadgeVariant = "suspended" | "negative" | "expired" | "expiring_soon" | "active"

export function memberStatusBadgeVariant(m: MemberSubscriptionInput): MemberBadgeVariant {
  if (m.status === "suspended") return "suspended"
  if (m.status === "cancelled") return "negative"
  const cat = memberSubscriptionCategory(m)
  if (cat === "expired") return "expired"
  if (cat === "expiring_soon") return "expiring_soon"
  return "active"
}
