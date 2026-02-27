"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabase/client"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { ArrowLeft, Upload, Loader2, ImagePlus } from "lucide-react"

export function AddMemberForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [type, setType] = useState<"1_day" | "weekly" | "monthly">("weekly")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [payment, setPayment] = useState("")
  const [photoUrl, setPhotoUrl] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Basic validation based on type
      if (!name || !payment) throw new Error("Name and Payment amount are required.")
      if (type !== "1_day" && (!email || !photoUrl)) {
        throw new Error(`Email and Photo are required for ${type} memberships.`)
      }

      // Calculate dates
      const startDate = new Date()
      let endDate = new Date()
      
      if (type === "weekly") {
        endDate.setDate(startDate.getDate() + 7)
      } else if (type === "monthly") {
        endDate.setDate(startDate.getDate() + 30)
      }

      // Generate immutable QR code value (using a random UUID)
      const qrCode = crypto.randomUUID()

      // Insert member
      const { data, error } = await supabase
        .from('members')
        .insert({
          name,
          email: email || null,
          photo_url: photoUrl || null,
          membership_type: type,
          status: 'active',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          payment_amount: Number(payment),
          qr_code: qrCode
        })
        .select()
        .single()

      if (error) throw error

      // Redirect back to members list on success
      router.push("/members")
      
    } catch (err: any) {
      alert(err.message || "Failed to create member. Please try again.")
      setLoading(false)
    }
  }

  // Preset payment values depending on membership type (for convenience)
  const handleTypeChange = (newType: "1_day" | "weekly" | "monthly") => {
    setType(newType)
    if (newType === "1_day") setPayment("10")
    if (newType === "weekly") setPayment("45")
    if (newType === "monthly") setPayment("120")
  }

  return (
    <Card className="max-w-3xl mx-auto w-full border border-white/5">
      <div className="p-6 border-b border-white/5 flex items-center gap-4">
        <Button variant="secondary" className="px-3" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-bold font-primary text-primary tracking-tight">Add New Member</h2>
          <p className="text-sm text-secondary">Register a new client to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-8">
        
        {/* Membership Type Picker */}
        <div className="space-y-3 p-4 bg-input/50 rounded-xl border border-white/5">
          <label className="text-sm font-semibold text-primary uppercase tracking-wider block">Membership Duration</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div 
              onClick={() => handleTypeChange("1_day")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                type === "1_day" 
                ? "border-accent-primary bg-accent-primary/10" 
                : "border-white/10 hover:border-white/20 bg-card"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-semibold ${type === "1_day" ? "text-accent-primary" : "text-primary"}`}>1 Day Pass</span>
                {type === "1_day" && <div className="w-2 h-2 rounded-full bg-accent-primary" />}
              </div>
              <p className="text-xs text-muted">Walk-in. No photo required.</p>
            </div>
            
            <div 
              onClick={() => handleTypeChange("weekly")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                type === "weekly" 
                ? "border-accent-primary bg-accent-primary/10" 
                : "border-white/10 hover:border-white/20 bg-card"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-semibold ${type === "weekly" ? "text-accent-primary" : "text-primary"}`}>Weekly</span>
                {type === "weekly" && <div className="w-2 h-2 rounded-full bg-accent-primary" />}
              </div>
              <p className="text-xs text-muted">7 days access.</p>
            </div>
            
            <div 
              onClick={() => handleTypeChange("monthly")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                type === "monthly" 
                ? "border-accent-primary bg-accent-primary/10" 
                : "border-white/10 hover:border-white/20 bg-card"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-semibold ${type === "monthly" ? "text-accent-primary" : "text-primary"}`}>Monthly</span>
                {type === "monthly" && <div className="w-2 h-2 rounded-full bg-accent-primary" />}
              </div>
              <p className="text-xs text-muted">Full 30 days access.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Main Info */}
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 block">Full Name <span className="text-accent-danger">*</span></label>
              <Input 
                placeholder="E.g. John Doe" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex justify-between">
                <span>Email Address</span>
                {type !== "1_day" && <span className="text-accent-danger font-normal normal-case">* Required</span>}
              </label>
              <Input 
                type="email" 
                placeholder="E.g. john@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required={type !== "1_day"}
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 block">Payment Amount ($) <span className="text-accent-danger">*</span></label>
              <Input 
                type="number" 
                step="0.01"
                min="0"
                placeholder="45.00" 
                value={payment} 
                onChange={(e) => setPayment(e.target.value)} 
                required 
              />
            </div>
          </div>

          {/* Photo Section */}
          <div>
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex justify-between">
              <span>Profile Photo</span>
              {type !== "1_day" && <span className="text-accent-danger font-normal normal-case">* Required</span>}
            </label>
            
            <div className="mt-2 border-2 border-dashed border-white/10 rounded-2xl bg-input hover:bg-white/[0.02] hover:border-white/20 transition-all flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
              {photoUrl ? (
                <div className="relative group w-32 h-32 rounded-full overflow-hidden mb-4 ring-4 ring-card">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" onClick={() => setPhotoUrl("")}>
                    <span className="text-xs cursor-pointer hover:text-white text-gray-300 font-semibold">Remove</span>
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                  <ImagePlus className="w-6 h-6 text-muted" />
                </div>
              )}
              
              {!photoUrl ? (
                <>
                  <p className="text-sm text-primary font-medium mb-1">Add member photo</p>
                  <p className="text-xs text-muted mb-4 px-4">Provide a valid image URL. (Direct upload MVP placeholder)</p>
                  
                  <div className="w-full max-w-[200px]">
                    <Input 
                      placeholder="Paste image URL here" 
                      className="text-xs h-9 text-center"
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      required={type !== "1_day"}
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-accent-secondary mt-2">✓ Photo attached</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => router.back()} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Saving...</span> : "Create Member"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
