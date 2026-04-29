"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/client"
import { Card } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { toast } from "sonner"
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing"

type SettingsRow = {
  key: string
  value: string | number | null
}

export function PricingSettingsForm() {
  const [values, setValues] = useState<PricingConfig>(DEFAULT_PRICING)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadPricing = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key,value")
        .in("key", ["session_rate", "weekly_rate", "monthly_rate", "student_rate"])

      if (!error && data) {
        const next = { ...DEFAULT_PRICING }
        for (const row of data as SettingsRow[]) {
          const parsed = Number(row.value)
          if (Number.isNaN(parsed)) continue
          if (row.key === "session_rate") next.session = parsed
          if (row.key === "weekly_rate") next.weekly = parsed
          if (row.key === "monthly_rate") next.monthlyRegular = parsed
          if (row.key === "student_rate") next.monthlyStudent = parsed
        }
        setValues(next)
      }

      setLoading(false)
    }

    void loadPricing()
  }, [])

  const savePricing = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const payload = [
      { key: "session_rate", value: values.session },
      { key: "weekly_rate", value: values.weekly },
      { key: "monthly_rate", value: values.monthlyRegular },
      { key: "student_rate", value: values.monthlyStudent },
    ]

    const { error } = await supabase
      .from("app_settings")
      .upsert(payload, { onConflict: "key" })

    setSaving(false)

    if (error) {
      toast.error(error.message || "Failed to save pricing settings.")
      return
    }

    toast.success("Pricing settings saved.")
  }

  return (
    <Card className="max-w-2xl border border-white/10 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Pricing Settings</h1>
        <p className="text-[var(--color-text-muted)] text-sm">
          Admin-only pricing controls used in Add Member defaults.
        </p>
      </div>

      <form onSubmit={savePricing} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 block">
            Session Rate
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.session}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, session: Number(e.target.value) || 0 }))
            }
            disabled={loading || saving}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 block">
            Weekly Rate
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.weekly}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, weekly: Number(e.target.value) || 0 }))
            }
            disabled={loading || saving}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 block">
            Monthly Rate (Regular)
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.monthlyRegular}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, monthlyRegular: Number(e.target.value) || 0 }))
            }
            disabled={loading || saving}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 block">
            Student Rate (Monthly)
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.monthlyStudent}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, monthlyStudent: Number(e.target.value) || 0 }))
            }
            disabled={loading || saving}
            required
          />
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" disabled={loading || saving}>
            {saving ? "Saving..." : "Save Pricing"}
          </Button>
        </div>
      </form>
    </Card>
  )
}

