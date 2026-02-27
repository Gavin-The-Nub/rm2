"use client"

import { useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { X, Loader2 } from "lucide-react"

type RenewModalProps = {
  isOpen: boolean
  onClose: () => void
  member: any
  onUpdate: () => void
}

export function RenewModal({ isOpen, onClose, member, onUpdate }: RenewModalProps) {
  const [loading, setLoading] = useState(false)
  
  // Default to their current type
  const [type, setType] = useState<"1_day" | "weekly" | "monthly">(member?.membership_type || "weekly")
  
  // Set default payment based on type
  const [payment, setPayment] = useState(() => {
    const t = member?.membership_type || "weekly"
    if (t === "1_day") return "10"
    if (t === "weekly") return "45"
    if (t === "monthly") return "120"
    return ""
  })

  if (!isOpen || !member) return null

  const handleTypeChange = (newType: "1_day" | "weekly" | "monthly") => {
    setType(newType)
    if (newType === "1_day") setPayment("10")
    if (newType === "weekly") setPayment("45")
    if (newType === "monthly") setPayment("120")
  }

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const today = new Date().setHours(0,0,0,0)
      const currentEnd = new Date(member.end_date).getTime()
      
      // Calculate new end date
      let baseDate = new Date() // Default to today if expired
      
      // If currently active, extend from their current end date
      if (currentEnd > today && member.status === 'active') {
        baseDate = new Date(member.end_date)
      }

      const newEndDate = new Date(baseDate)
      
      if (type === "1_day") {
        newEndDate.setDate(baseDate.getDate()) // End of the same day
      } else if (type === "weekly") {
        newEndDate.setDate(baseDate.getDate() + 7)
      } else if (type === "monthly") {
        newEndDate.setDate(baseDate.getDate() + 30)
      }

      // 1. Update the member record
      const updatePromise = supabase
        .from('members')
        .update({ 
          end_date: newEndDate.toISOString().split('T')[0],
          membership_type: type, // Support upgrading/downgrading
          status: 'active'       // Ensure they are active if they were expired
        })
        .eq('id', member.id)

      // 2. Add log to renewals
      const insertPromise = supabase
        .from('renewals')
        .insert({
          member_id: member.id,
          membership_type: type,
          previous_end_date: member.end_date,
          new_end_date: newEndDate.toISOString().split('T')[0],
          payment_amount: Number(payment)
        })

      const [updateResult, insertResult] = await Promise.all([updatePromise, insertPromise])

      if (updateResult.error) throw updateResult.error
      if (insertResult.error) throw insertResult.error

      onUpdate() // Refresh data
      onClose()
      
    } catch (err: any) {
      alert("Failed to renew membership: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 min-h-screen animate-in fade-in duration-200">
      <Card className="w-full max-w-md bg-bg-base border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-card/30">
          <div>
            <h2 className="text-xl font-bold text-primary font-primary">Renew Membership</h2>
            <p className="text-xs text-secondary mt-1 tracking-wide uppercase">For {member.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-muted hover:text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRenew} className="p-6 flex flex-col gap-6">
          
          <div className="space-y-3">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Select New Duration</label>
            <div className="grid grid-cols-3 gap-2">
              <div 
                onClick={() => handleTypeChange("1_day")}
                className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                  type === "1_day" ? "border-accent-primary bg-accent-primary/10 text-accent-primary" : "border-white/10 hover:border-white/20 text-primary"
                }`}
              >
                <div className="font-semibold text-sm">1 Day</div>
              </div>
              <div 
                onClick={() => handleTypeChange("weekly")}
                className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                  type === "weekly" ? "border-accent-primary bg-accent-primary/10 text-accent-primary" : "border-white/10 hover:border-white/20 text-primary"
                }`}
              >
                <div className="font-semibold text-sm">Weekly</div>
              </div>
              <div 
                onClick={() => handleTypeChange("monthly")}
                className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                  type === "monthly" ? "border-accent-primary bg-accent-primary/10 text-accent-primary" : "border-white/10 hover:border-white/20 text-primary"
                }`}
              >
                <div className="font-semibold text-sm">Monthly</div>
              </div>
            </div>
          </div>

          <div>
             <label className="text-xs font-semibold text-secondary uppercase tracking-wider block mb-2">Payment Amount (₱)</label>
             <Input 
                type="number" 
                step="0.01"
                min="0"
                value={payment} 
                onChange={(e) => setPayment(e.target.value)} 
                required 
              />
          </div>

          <div className="bg-input/50 p-4 rounded-xl border border-white/5 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Current End Date:</span>
              <span className="text-secondary font-medium">{member.end_date}</span>
            </div>
            <div className="text-xs text-accent-primary bg-accent-primary/10 p-2 rounded-lg mt-1 border border-accent-primary/20">
              Note: Renewing will extend the membership by the selected duration from the current end date (if active) or from today (if expired).
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Renewal"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
