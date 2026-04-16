import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/utils/supabase/server"
import { EXPIRING_SOON_DAYS } from "@/lib/memberSubscription"
import { addDaysISOInPH, parseISODateAtPHMidnight, phTodayISO } from "@/lib/phTime"

type MemberRecord = {
  id: string
  name: string | null
  email: string | null
  start_date: string
  end_date: string
  membership_type: string | null
  status: string
}

type ExistingReminderLog = {
  member_id: string
  status: string
  metadata: {
    membershipStartDate?: string
    membershipEndDate?: string
  } | null
}

function daysUntilInPH(endDateISO: string): number {
  const end = parseISODateAtPHMidnight(endDateISO)
  const today = parseISODateAtPHMidnight(phTodayISO())
  return Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

async function handleSend(req: Request) {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@familialibericagym.com"
  const logoUrl = process.env.RESEND_LOGO_URL ?? "https://familialibericagym.com/rmlogo.png"

  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY environment variable" },
      { status: 500 }
    )
  }

  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const todayISO = phTodayISO()
  const thresholdISO = addDaysISOInPH(todayISO, EXPIRING_SOON_DAYS)

  const supabase = await createClient()
  const { data: candidates, error: candidatesError } = await supabase
    .from("members")
    .select("id, name, email, start_date, end_date, membership_type, status")
    .eq("status", "active")
    .gte("end_date", todayISO)
    .lte("end_date", thresholdISO)
    .not("email", "is", null)
    .neq("email", "")
    .returns<MemberRecord[]>()

  if (candidatesError) {
    return NextResponse.json({ error: candidatesError.message }, { status: 500 })
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({
      ok: true,
      today: todayISO,
      expiringSoonWindowDays: EXPIRING_SOON_DAYS,
      scanned: 0,
      sent: 0,
      skippedAlreadySentThisMembership: 0,
      failed: 0,
    })
  }

  const candidateIds = candidates.map((m) => m.id)
  const { data: existingLogs, error: logsError } = await supabase
    .from("member_notification_logs")
    .select("member_id, status, metadata")
    .eq("kind", "expiry_reminder")
    .in("member_id", candidateIds)
    .in("status", ["queued", "sent", "delivered"])
    .returns<ExistingReminderLog[]>()

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 })
  }

  const sentByMembershipCycle = new Set(
    (existingLogs ?? [])
      .map((row) => {
        const cycleStart = row.metadata?.membershipStartDate
        const cycleEnd = row.metadata?.membershipEndDate
        if (!cycleStart || !cycleEnd) return null
        return `${row.member_id}:${cycleStart}:${cycleEnd}`
      })
      .filter((value): value is string => Boolean(value))
  )
  const resend = new Resend(resendApiKey)

  let sent = 0
  let failed = 0
  let skippedAlreadySentThisMembership = 0

  for (const member of candidates) {
    const cycleKey = `${member.id}:${member.start_date}:${member.end_date}`
    if (sentByMembershipCycle.has(cycleKey)) {
      skippedAlreadySentThisMembership += 1
      continue
    }

    const remainingDays = daysUntilInPH(member.end_date)
    const displayName = member.name?.trim() || "Member"
    const subject =
      remainingDays === 0
        ? "Your RM Gym membership expires today"
        : `Your RM Gym membership expires in ${remainingDays} day${remainingDays === 1 ? "" : "s"}`

    const text = [
      `Hi ${displayName},`,
      "",
      `This is a reminder that your ${member.membership_type ?? "gym"} membership end date is ${member.end_date}.`,
      "Please renew on or before your end date to keep uninterrupted access.",
      "",
      "Thank you,",
      "RM Gym",
    ].join("\n")

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #f3f4f6; background: #0b1220; padding: 16px; border-radius: 12px;">
        ${
          logoUrl
            ? `<div style="margin-bottom: 16px;">
                <img
                  src="${logoUrl}"
                  alt="Familia Liberica Gym"
                  width="140"
                  style="display: block; max-width: 140px; height: auto;"
                />
              </div>`
            : ""
        }
        <p style="margin: 0 0 12px 0;">Hi ${displayName},</p>
        <p>
          This is a reminder that your <strong>${member.membership_type ?? "gym"}</strong> membership
          end date is <strong>${member.end_date}</strong>.
        </p>
        <p>Please renew on or before your end date to keep uninterrupted access.</p>
        <p style="margin: 0;">Thank you,<br />RM Gym</p>
      </div>
    `

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: [member.email!],
      subject,
      html,
      text,
    })

    const status = sendError ? "failed" : "sent"
    const providerMessageId = sendData?.id ?? null
    const errorMessage = sendError?.message ?? null

    const { error: logError } = await supabase.from("member_notification_logs").insert({
      member_id: member.id,
      recipient_email: member.email,
      kind: "expiry_reminder",
      subject,
      body_html: html,
      body_text: text,
      status,
      provider_message_id: providerMessageId,
      error_message: errorMessage,
      metadata: {
        remainingDays,
        provider: "resend",
        trigger: "auto_expiring_soon_daily",
        reminderDatePH: todayISO,
        membershipStartDate: member.start_date,
        membershipEndDate: member.end_date,
      },
    })

    if (logError) {
      failed += 1
      continue
    }

    if (sendError) {
      failed += 1
    } else {
      sent += 1
    }
  }

  return NextResponse.json({
    ok: true,
    today: todayISO,
    expiringSoonWindowDays: EXPIRING_SOON_DAYS,
    scanned: candidates.length,
    sent,
    skippedAlreadySentThisMembership,
    failed,
  })
}

export async function GET(req: Request) {
  return handleSend(req)
}

export async function POST(req: Request) {
  return handleSend(req)
}
