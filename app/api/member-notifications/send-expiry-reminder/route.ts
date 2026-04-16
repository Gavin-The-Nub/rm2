import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/utils/supabase/server"

type MemberRecord = {
  id: string
  name: string | null
  email: string | null
  end_date: string
  membership_type: string | null
}

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function daysUntil(isoDate: string): number {
  const end = startOfDayUtc(new Date(`${isoDate}T00:00:00Z`))
  const today = startOfDayUtc(new Date())
  return Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export async function POST(req: Request) {
  const resendApiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@familialibericagym.com"
  const logoUrl = process.env.RESEND_LOGO_URL ?? "https://familialibericagym.com/rmlogo.png"

  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY environment variable" },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const memberId = typeof body?.memberId === "string" ? body.memberId : ""

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, name, email, end_date, membership_type")
      .eq("id", memberId)
      .single<MemberRecord>()

    if (memberError || !member) {
      return NextResponse.json(
        { error: memberError?.message ?? "Member not found" },
        { status: 404 }
      )
    }

    if (!member.email) {
      return NextResponse.json(
        { error: "Member has no email address", memberId: member.id },
        { status: 400 }
      )
    }

    const remainingDays = daysUntil(member.end_date)
    const displayName = member.name?.trim() || "Member"
    const subject =
      remainingDays < 0
        ? "Your RM Gym membership has expired"
        : remainingDays === 0
          ? "Your RM Gym membership expires today"
          : `Your RM Gym membership expires in ${remainingDays} day${remainingDays === 1 ? "" : "s"}`

    const text = [
      `Hi ${displayName},`,
      "",
      `This is a reminder that your ${member.membership_type ?? "gym"} membership end date is ${member.end_date}.`,
      remainingDays < 0
        ? "Your access may already be inactive. Please renew at the front desk."
        : "Please renew on or before your end date to keep uninterrupted access.",
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
        <p>
          ${
            remainingDays < 0
              ? "Your access may already be inactive. Please renew at the front desk."
              : "Please renew on or before your end date to keep uninterrupted access."
          }
        </p>
        <p style="margin: 0;">Thank you,<br />RM Gym</p>
      </div>
    `

    const resend = new Resend(resendApiKey)
    const { data: sendData, error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: [member.email],
      subject,
      html,
      text,
    })

    const status = sendError ? "failed" : "sent"
    const providerMessageId = sendData?.id ?? null
    const errorMessage = sendError?.message ?? null

    const { data: logData, error: logError } = await supabase
      .from("member_notification_logs")
      .insert({
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
        },
      })
      .select("id, status, provider_message_id")
      .single()

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    if (sendError) {
      return NextResponse.json(
        {
          error: sendError.message,
          log: logData,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      log: logData,
      resendId: sendData?.id ?? null,
    })
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
}
