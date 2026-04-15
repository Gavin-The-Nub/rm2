-- Run this in Supabase SQL Editor (or merge into a migration) if the table does not exist yet.
-- Logs transactional emails (e.g. expiry reminders) for audit and profile display.

CREATE TABLE IF NOT EXISTS public.member_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'expiry_reminder',
    recipient_email TEXT NOT NULL,
    subject TEXT,
    body_html TEXT,
    body_text TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- queued | sent | delivered | bounced | failed | skipped
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'bounced', 'failed', 'skipped')),
    provider_message_id TEXT,
    error_message TEXT,
    delivered_at TIMESTAMPTZ,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_member_notification_logs_member
    ON public.member_notification_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_member_notification_logs_sent
    ON public.member_notification_logs(sent_at DESC);

ALTER TABLE public.member_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write access to member_notification_logs"
    ON public.member_notification_logs FOR ALL USING (true);

ALTER TABLE public.member_notification_logs
    ADD COLUMN IF NOT EXISTS recipient_email TEXT,
    ADD COLUMN IF NOT EXISTS subject TEXT,
    ADD COLUMN IF NOT EXISTS body_html TEXT,
    ADD COLUMN IF NOT EXISTS body_text TEXT;
