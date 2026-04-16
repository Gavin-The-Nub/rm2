const fs = require("fs")
const { createClient } = require("@supabase/supabase-js")
const { Resend } = require("resend")

function loadEnv(path) {
  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf("=")
        return [line.slice(0, idx), line.slice(idx + 1)]
      })
  )
}

function startOfDayUtc(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function getRemainingDays(endDateIso) {
  const end = startOfDayUtc(new Date(`${endDateIso}T00:00:00Z`))
  const today = startOfDayUtc(new Date())
  return Math.floor((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

async function main() {
  const memberId = process.argv[2]
  if (!memberId) {
    throw new Error("Usage: node scripts/manualSendReminder.js <memberId>")
  }

  const env = loadEnv(".env.local")
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
  const resend = new Resend(env.RESEND_API_KEY)

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id,name,email,end_date,status,membership_type")
    .eq("id", memberId)
    .single()

  if (memberError || !member) {
    throw new Error(`Member lookup failed: ${memberError?.message ?? "not found"}`)
  }
  if (!member.email) {
    throw new Error("Member has no email")
  }

  const remainingDays = getRemainingDays(member.end_date)
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

  const logoUrl = env.RESEND_LOGO_URL || "https://familialibericagym.com/rmlogo.png"
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <div style="margin-bottom: 16px;">
        <img
          src="${logoUrl}"
          alt="Familia Liberica Gym"
          width="140"
          style="display: block; max-width: 140px; height: auto;"
        />
      </div>
      <p>Hi ${displayName},</p>
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
      <p>Thank you,<br />RM Gym</p>
    </div>
  `

  const { data: sendData, error: sendError } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: [member.email],
    subject,
    html,
    text,
  })

  const status = sendError ? "failed" : "sent"
  const providerMessageId = sendData?.id ?? null
  const errorMessage = sendError?.message ?? null

  const { data: log, error: logError } = await supabase
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
        manualTest: true,
      },
    })
    .select("id,sent_at,status,provider_message_id,error_message,recipient_email,subject")
    .single()

  if (logError) {
    throw new Error(`Log insert failed: ${logError.message}`)
  }

  console.log(
    JSON.stringify(
      {
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
        },
        resend: {
          id: providerMessageId,
          error: sendError?.message ?? null,
        },
        log,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
