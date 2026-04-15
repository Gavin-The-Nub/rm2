import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { isAppRole } from "@/lib/auth/roles"
import { PricingSettingsForm } from "@/components/settings/PricingSettingsForm"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!isAppRole(profile?.role) || profile.role !== "admin") {
    redirect("/members")
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6">
      <PricingSettingsForm />
    </div>
  )
}
