"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { format } from "date-fns"
import { ArrowLeft, User, Calendar, Clock, Loader2, AlertCircle, Mail } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { RenewModal } from "./RenewModal"
import { memberStatusBadgeVariant, memberStatusLabel } from "@/lib/memberSubscription"
import {
  notificationKindLabel,
  notificationStatusBadgeVariant,
  notificationStatusLabel,
} from "@/lib/memberNotificationDisplay"

type MemberProfileProps = {
  member: any
  onUpdate: () => void
}

export function MemberProfile({ member, onUpdate }: MemberProfileProps) {
  const [suspendLoading, setSuspendLoading] = useState(false)
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("renew") === "1") {
      setIsRenewModalOpen(true)
    }
  }, [searchParams])

  const handleToggleSuspend = async () => {
    setSuspendLoading(true)
    const newStatus = member.status === 'suspended' ? 'active' : 'suspended'
    
    // Simple alert for now - in production use a proper toast
    if (confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'reactivate'} this user?`)) {
      const { error } = await supabase
        .from('members')
        .update({ status: newStatus })
        .eq('id', member.id)

      if (error) {
        alert("Failed to update member status.")
        console.error(error)
      } else {
        onUpdate() // Refresh data
      }
    }
    setSuspendLoading(false)
  }

  const statusLabel = memberStatusLabel(member)
  const statusBadgeVariant = memberStatusBadgeVariant(member)

  const totalPaid = Number(member.payment_amount) + (member.renewals?.reduce((sum: number, r: any) => sum + Number(r.payment_amount), 0) || 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Link href="/members">
          <Button variant="secondary" className="px-3">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Members
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            className={member.status === 'suspended' ? "text-accent-secondary border-accent-secondary/50 hover:bg-accent-secondary/10" : "text-accent-warning border-accent-warning/50 hover:bg-accent-warning/10"}
            onClick={handleToggleSuspend}
            disabled={suspendLoading}
          >
            {suspendLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {member.status === 'suspended' ? "Reactivate" : "Suspend Account"}
          </Button>
          <Button onClick={() => setIsRenewModalOpen(true)}>
            Renew Membership
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & QR */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="flex flex-col items-center text-center p-8 border border-white/5 relative overflow-hidden">
            {/* Status indicator ring around photo */}
            <div
              className={`relative mb-6 rounded-full p-1 ring-2 ${
                statusLabel === "Active"
                  ? "ring-accent-secondary"
                  : statusLabel === "Suspended" || statusLabel === "Expiring soon"
                    ? "ring-accent-warning"
                    : "ring-accent-danger"
              }`}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden bg-input/50 flex items-center justify-center">
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted" />
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-primary mb-1">{member.name}</h2>
            {member.email && <p className="text-secondary text-sm mb-4">{member.email}</p>}
            
            <Badge variant={statusBadgeVariant} className="mb-6 px-3 py-1">
              <div className="flex items-center gap-1">
                {(statusLabel === "Expired" ||
                  statusLabel === "Cancelled" ||
                  statusLabel === "Expiring soon") && (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                {statusLabel}
              </div>
            </Badge>

            <div className="w-full border-t border-white/5 pt-6 mt-2">
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted uppercase tracking-wider mb-1">Total Paid</span>
                <span className="text-xl font-semibold text-primary">₱{totalPaid.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Details & History */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-0 border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">Membership Details</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-input border border-white/5 shrink-0">
                  <Calendar className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">Membership Type</p>
                  <p className="text-primary font-medium capitalize">{member.membership_type.replace('_', ' ')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-input border border-white/5 shrink-0">
                  <Clock className="w-5 h-5 text-accent-secondary" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-primary font-medium mb-1">
                    {format(new Date(member.start_date), 'MMM d, yyyy')} — {format(new Date(member.end_date), 'MMM d, yyyy')}
                  </p>
                  <p className="text-xs text-muted">
                    {Math.max(0, Math.ceil((new Date(member.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)))} days remaining
                  </p>
                </div>
              </div>

            </div>
          </Card>

          <Card className="p-0 border border-white/5 overflow-hidden flex-1 min-h-[300px]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-card/50">
              <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">
                Email notifications
              </h3>
              <Link
                href={`/email-logs?memberId=${member.id}`}
                className="text-xs text-accent-primary hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="p-0">
              {!member.member_notification_logs || member.member_notification_logs.length === 0 ? (
                <div className="p-8 text-center text-muted text-sm">
                  No reminder emails logged yet. They will appear here after expiry reminders are sent.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {member.member_notification_logs.slice(0, 20).map((row: any) => (
                    <div
                      key={row.id}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 p-4 hover:bg-card-hover transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-input border border-white/5 shrink-0 mt-0.5">
                          <Mail className="w-4 h-4 text-accent-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-primary text-sm font-medium">
                            {notificationKindLabel(row.kind)}
                          </p>
                          <p className="text-muted text-xs mt-0.5 break-all">
                            To: {row.recipient_email}
                          </p>
                          <p className="text-secondary text-xs mt-0.5">
                            Sent {format(new Date(row.sent_at), "MMM d, yyyy 'at' h:mm a")}
                            {row.delivered_at && (
                              <span className="text-muted">
                                {" "}
                                · Confirmed delivered{" "}
                                {format(new Date(row.delivered_at), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            )}
                          </p>
                          {row.error_message && (
                            <p className="text-red-400 text-xs mt-1 break-words">{row.error_message}</p>
                          )}
                          {row.provider_message_id && (
                            <p className="text-muted text-[11px] mt-1 break-all">
                              Message ID: {row.provider_message_id}
                            </p>
                          )}
                          <Link
                            href={`/email-logs/${row.id}`}
                            className="text-xs text-accent-primary hover:underline mt-1 inline-block"
                          >
                            View message
                          </Link>
                        </div>
                      </div>
                      <Badge variant={notificationStatusBadgeVariant(row.status)} className="shrink-0 self-start sm:self-center">
                        {notificationStatusLabel(row.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Renew Modal */}
      <RenewModal 
        isOpen={isRenewModalOpen} 
        onClose={() => setIsRenewModalOpen(false)} 
        member={member} 
        onUpdate={onUpdate}
      />
    </div>
  )
}
