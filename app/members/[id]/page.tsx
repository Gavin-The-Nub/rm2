"use client"

import { useEffect, useState, use } from "react"
import { supabase } from "@/utils/supabase/client"
import { MemberProfile } from "@/components/members/MemberProfile"
import { Loader2 } from "lucide-react"

export default function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchMember = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('members')
      .select(`
        *,
        attendance ( check_in_date, created_at ),
        renewals ( payment_amount, created_at )
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (error) {
      console.error("Error fetching member:", error)
    } else {
      // Sort attendance by date desc
      if (data.attendance) {
        data.attendance.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }
      setMember(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMember()
  }, [resolvedParams.id])

  if (loading) {
    return (
      <div className="flex bg-bg-base/50 items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-8 h-8 text-accent-primary animate-spin" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-8 text-center bg-bg-base/50">
        <h2 className="text-xl font-bold text-primary mb-2">Member Not Found</h2>
        <p className="text-muted">The member you are looking for does not exist.</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6">
      <MemberProfile member={member} onUpdate={fetchMember} />
    </div>
  )
}
