import { Sidebar } from "@/components/layout/Sidebar"
import { createClient } from "@/utils/supabase/server"
import { isAppRole, type AppRole } from "@/lib/auth/roles"

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: AppRole = "staff"
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    if (isAppRole(profile?.role)) {
      role = profile.role
    }
  }

  return (
    <Sidebar userEmail={user?.email ?? null} role={role}>
      {children}
    </Sidebar>
  )
}
