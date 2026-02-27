"use client"

import { useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { format } from "date-fns"
import { ArrowLeft, User, QrCode, Calendar, Clock, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { RenewModal } from "./RenewModal"

type MemberProfileProps = {
  member: any
  onUpdate: () => void
}

export function MemberProfile({ member, onUpdate }: MemberProfileProps) {
  const [suspendLoading, setSuspendLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false)

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

  const handleCheckIn = async () => {
    const todayStr = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('attendance')
      .insert({
        member_id: member.id,
        check_in_date: todayStr
      })
    
    if (error) {
      if (error.code === '23505') {
        alert("Member already checked in today.")
      } else {
        alert("Failed to record attendance.")
      }
    } else {
      onUpdate()
    }
  }

  const getStatusColor = (status: string, endDate: string) => {
    if (status === 'suspended') return 'suspended'
    if (status === 'cancelled') return 'negative'
    if (new Date(endDate) < new Date(new Date().setHours(0,0,0,0))) return 'expired'
    return 'active'
  }

  const getDisplayStatus = (status: string, endDate: string) => {
    if (status === 'suspended') return 'Suspended'
    if (status === 'cancelled') return 'Cancelled'
    if (new Date(endDate) < new Date(new Date().setHours(0,0,0,0))) return 'Expired'
    return 'Active'
  }

  // Derived stats mock (Since complex aggregation is handled in a broader component)
  const visits = member.attendance?.length || 0
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
          {getDisplayStatus(member.status, member.end_date) === 'Active' && (
            <Button 
              variant="secondary" 
              className="text-accent-secondary border-accent-secondary/50 hover:bg-accent-secondary/10"
              onClick={handleCheckIn}
            >
              Check In
            </Button>
          )}
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
            <div className={`relative mb-6 rounded-full p-1 ring-2 ${
              getDisplayStatus(member.status, member.end_date) === 'Active' ? 'ring-accent-secondary' : 
              getDisplayStatus(member.status, member.end_date) === 'Suspended' ? 'ring-accent-warning' : 'ring-accent-danger'
            }`}>
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
            
            <Badge variant={getStatusColor(member.status, member.end_date) as any} className="mb-6 px-3 py-1">
              <div className="flex items-center gap-1">
                {(getDisplayStatus(member.status, member.end_date) === 'Expired' || getDisplayStatus(member.status, member.end_date) === 'Cancelled') && <AlertCircle className="w-3.5 h-3.5" />}
                {getDisplayStatus(member.status, member.end_date)}
              </div>
            </Badge>

            <div className="grid grid-cols-2 gap-4 w-full border-t border-white/5 pt-6 mt-2">
              <div className="flex flex-col">
                <span className="text-xs text-muted uppercase tracking-wider mb-1">Total Visits</span>
                <span className="text-xl font-semibold text-primary">{visits}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted uppercase tracking-wider mb-1">Total Paid</span>
                <span className="text-xl font-semibold text-primary">₱{totalPaid.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center p-8 border border-white/5">
            {!showQR ? (
              <div className="text-center w-full">
                <div className="w-16 h-16 rounded-2xl bg-input border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-primary font-medium mb-2">Member QR Code</h3>
                <p className="text-sm text-muted mb-6">Unique identifier for walk-in scanning. Never expires.</p>
                <Button variant="secondary" className="w-full" onClick={() => setShowQR(true)}>
                  Reveal QR Code
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full animate-in fade-in duration-300">
                <div className="p-4 bg-white rounded-xl mb-6 shadow-xl">
                  {/* Using react-qrcode SVG for clean scaling */}
                  {member.qr_code ? (
                    <QRCodeSVG 
                      value={member.qr_code} 
                      size={200}
                      level={"H"}
                      includeMargin={false}
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm">No QR</div>
                  )}
                </div>
                <Button variant="secondary" className="w-full text-xs shadow-none" onClick={() => setShowQR(false)}>
                  Hide
                </Button>
              </div>
            )}
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

              <div className="flex items-start gap-3">
                 <div className="p-2.5 rounded-xl bg-input border border-white/5 shrink-0">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1 shrink-0">
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">Scan ID</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-secondary font-mono bg-black/40 px-2 py-1 rounded inline-block">
                      {member.qr_code}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-0 border border-white/5 overflow-hidden flex-1 min-h-[300px]">
             <div className="p-6 border-b border-white/5 flex justify-between items-center bg-card/50">
              <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">Recent Activity</h3>
            </div>
            
            <div className="p-0">
              {member.attendance?.length === 0 ? (
                <div className="p-8 text-center text-muted text-sm">No recorded visits yet.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {/* Just showing last 5 visits limit ideally, or full scroll */}
                  {member.attendance?.slice(0, 10).map((v: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 hover:bg-card-hover transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-accent-secondary shrink-0" />
                        <span className="text-primary text-sm font-medium">Checked in</span>
                      </div>
                      <span className="text-secondary text-sm">
                         {format(new Date(v.check_in_date), 'MMM d, yyyy')}
                      </span>
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
