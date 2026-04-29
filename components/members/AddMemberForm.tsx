"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/utils/supabase/client"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"
import { DEFAULT_PRICING, type MonthlyPlan, type PricingConfig } from "@/lib/pricing"

export function AddMemberForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form state
  const [type, setType] = useState<"1_day" | "weekly" | "monthly">("weekly")
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlan>("regular")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [payment, setPayment] = useState("")
  const [pricing, setPricing] = useState<PricingConfig>(DEFAULT_PRICING)

  useEffect(() => {
    const loadPricing = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key,value")
        .in("key", ["session_rate", "weekly_rate", "monthly_rate", "student_rate"])

      if (error || !data) {
        setPayment(String(DEFAULT_PRICING.weekly))
        return
      }

      const nextPricing: PricingConfig = { ...DEFAULT_PRICING }
      for (const row of data) {
        const value = Number(row.value)
        if (Number.isNaN(value)) continue
        if (row.key === "session_rate") nextPricing.session = value
        if (row.key === "weekly_rate") nextPricing.weekly = value
        if (row.key === "monthly_rate") nextPricing.monthlyRegular = value
        if (row.key === "student_rate") nextPricing.monthlyStudent = value
      }

      setPricing(nextPricing)
      setPayment(String(nextPricing.weekly))
    }

    void loadPricing()
  }, [])

  const getDefaultPayment = (
    membershipType: "1_day" | "weekly" | "monthly",
    plan: MonthlyPlan
  ) => {
    if (membershipType === "1_day") return String(pricing.session)
    if (membershipType === "weekly") return String(pricing.weekly)
    return String(plan === "student" ? pricing.monthlyStudent : pricing.monthlyRegular)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Basic validation based on type
      if (!name || !email || !payment) throw new Error("Name, email, and payment amount are required.")

      // Calculate dates
      const startDate = new Date()
      let endDate = new Date()

      if (type === "weekly") {
        endDate.setDate(startDate.getDate() + 7)
      } else if (type === "monthly") {
        endDate.setDate(startDate.getDate() + 30)
      }

      // Generate shorter, human-friendly Scan ID (e.g. RM1A2B)
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      let qrCode = 'RM'
      for (let i = 0; i < 4; i++) {
        qrCode += chars.charAt(Math.floor(Math.random() * chars.length))
      }

      // Insert member
      const { data, error } = await supabase
        .from('members')
        .insert({
          name,
          email,
          photo_url: null,
          membership_type: type,
          status: "active",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          payment_amount: Number(payment),
          qr_code: qrCode,
        })
        .select()
        .single()

      if (error) throw error

      // Redirect back to members list on success
      router.push("/members")
      
    } catch (err: any) {
      toast.error(err.message || "Failed to create member. Please try again.")
      setLoading(false)
    }
  }

  // Preset payment values depending on membership type (for convenience)
  const handleTypeChange = (newType: "1_day" | "weekly" | "monthly") => {
    setType(newType)
    setPayment(getDefaultPayment(newType, monthlyPlan))
  }

  const handleMonthlyPlanChange = (plan: MonthlyPlan) => {
    setMonthlyPlan(plan)
    if (type === "monthly") {
      setPayment(getDefaultPayment("monthly", plan))
    }
  }

  return (
    <Card className="max-w-3xl mx-auto w-full border border-white/10">
      <div className="p-6 border-b border-white/10 flex items-center gap-4">
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
        <div className="space-y-3 p-4 bg-input/50 rounded-xl border border-white/10">
          <label className="text-sm font-semibold text-primary uppercase tracking-wider block">Membership Duration</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div 
              onClick={() => handleTypeChange("1_day")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                type === "1_day" 
                ? "border-accent-primary bg-accent-primary/10" 
                : "border-white/20 hover:border-white/30 bg-card"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-semibold ${type === "1_day" ? "text-accent-primary" : "text-primary"}`}>Session Rate</span>
                {type === "1_day" && <div className="w-2 h-2 rounded-full bg-accent-primary" />}
              </div>
              <p className="text-xs text-muted">Per session access. Default: ₱{pricing.session.toFixed(2)}</p>
            </div>
            
            <div 
              onClick={() => handleTypeChange("weekly")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                type === "weekly" 
                ? "border-accent-primary bg-accent-primary/10" 
                : "border-white/20 hover:border-white/30 bg-card"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-semibold ${type === "weekly" ? "text-accent-primary" : "text-primary"}`}>Weekly</span>
                {type === "weekly" && <div className="w-2 h-2 rounded-full bg-accent-primary" />}
              </div>
              <p className="text-xs text-muted">7 days access. Default: ₱{pricing.weekly.toFixed(2)}</p>
            </div>
            
            <div 
              onClick={() => handleTypeChange("monthly")}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                type === "monthly" 
                ? "border-accent-primary bg-accent-primary/10" 
                : "border-white/20 hover:border-white/30 bg-card"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-semibold ${type === "monthly" ? "text-accent-primary" : "text-primary"}`}>Monthly</span>
                {type === "monthly" && <div className="w-2 h-2 rounded-full bg-accent-primary" />}
              </div>
              <p className="text-xs text-muted">30 days access. Regular/Student pricing.</p>
            </div>
          </div>
        </div>

        {type === "monthly" && (
          <div className="space-y-3 p-4 bg-input/50 rounded-xl border border-white/10">
            <label className="text-sm font-semibold text-primary uppercase tracking-wider block">Monthly Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleMonthlyPlanChange("regular")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  monthlyPlan === "regular"
                    ? "border-accent-primary bg-accent-primary/10"
                    : "border-white/20 hover:border-white/30 bg-card"
                }`}
              >
                <p className="font-semibold text-primary">Regular</p>
                <p className="text-xs text-muted">₱{pricing.monthlyRegular.toFixed(2)}</p>
              </button>
              <button
                type="button"
                onClick={() => handleMonthlyPlanChange("student")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  monthlyPlan === "student"
                    ? "border-accent-primary bg-accent-primary/10"
                    : "border-white/20 hover:border-white/30 bg-card"
                }`}
              >
                <p className="font-semibold text-primary">Student</p>
                <p className="text-xs text-muted">₱{pricing.monthlyStudent.toFixed(2)}</p>
              </button>
            </div>
          </div>
        )}

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
                <span className="text-accent-danger font-normal normal-case">* Required</span>
              </label>
              <Input 
                type="email" 
                placeholder="E.g. john@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
            </div>
            
            <div>
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 block">Payment Amount <span className="text-accent-danger">*</span></label>
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

        <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
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
