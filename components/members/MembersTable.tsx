"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase/client"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Search, Filter, Plus, User, MoreVertical } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

type MemberRow = {
  id: string
  name: string
  email: string | null
  photo_url: string | null
  membership_type: "1_day" | "weekly" | "monthly"
  status: "active" | "suspended" | "cancelled"
  start_date: string
  end_date: string
  created_at: string
  total_paid: number
  total_visits: number
  last_seen: string | null
}

export function MembersTable() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      // Query members and manually calculate the lifetime stats 
      // since Supabase JS doesn't support complex aggregate joins well without a view.
      // For MVP, we'll fetch members and a lightweight version of stats.
      
      const { data, error } = await supabase
        .from('members')
        .select(`
          id, name, email, photo_url, membership_type, status, start_date, end_date, created_at, payment_amount,
          attendance ( check_in_date ),
          renewals ( payment_amount )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error fetching members:", error)
        setLoading(false)
        return
      }

      // Map and aggregate
      const formattedData: MemberRow[] = data.map(m => {
        // Calculate total visits and last seen
        const visits = m.attendance || []
        const totalVisits = visits.length
        
        let lastSeen = null
        if (visits.length > 0) {
           const dates = visits.map((v: any) => new Date(v.check_in_date).getTime())
           lastSeen = new Date(Math.max(...dates)).toISOString()
        }

        // Calculate total paid
        const basePayment = Number(m.payment_amount) || 0
        const renewals = m.renewals || []
        const totalRenewals = renewals.reduce((sum: number, r: any) => sum + (Number(r.payment_amount) || 0), 0)

        return {
          id: m.id,
          name: m.name,
          email: m.email,
          photo_url: m.photo_url,
          membership_type: m.membership_type,
          status: m.status,
          start_date: m.start_date,
          end_date: m.end_date,
          created_at: m.created_at,
          total_paid: basePayment + totalRenewals,
          total_visits: totalVisits,
          last_seen: lastSeen
        }
      })

      setMembers(formattedData)
      setLoading(false)
    }

    fetchMembers()
  }, [])

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatMembershipType = (type: string) => {
    switch(type) {
      case '1_day': return '1 Day'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      default: return type
    }
  }

  const getStatusColor = (status: string, endDate: string) => {
    if (status === 'suspended') return 'warning'
    if (status === 'cancelled') return 'danger'
    
    // Check if expired
    if (new Date(endDate) < new Date(new Date().setHours(0,0,0,0))) {
      return 'danger'
    }
    
    return 'success'
  }

  const getDisplayStatus = (status: string, endDate: string) => {
    if (status === 'suspended') return 'Suspended'
    if (status === 'cancelled') return 'Cancelled'
    
    if (new Date(endDate) < new Date(new Date().setHours(0,0,0,0))) {
      return 'Expired'
    }
    
    return 'Active'
  }

  return (
    <Card className="flex flex-col h-full overflow-hidden p-0 border border-white/5">
      <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input 
            placeholder="Search members..." 
            className="pl-9 h-10 w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="secondary" className="flex-1 sm:flex-none">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Link href="/members/add" className="flex-1 sm:flex-none">
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-card/50 text-muted uppercase text-[11px] font-medium tracking-wider border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">End Date</th>
              <th className="px-6 py-4 text-right">Total Visits</th>
              <th className="px-6 py-4 text-right">Total Paid</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted">Loading members...</td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted">No members found.</td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-card-hover transition-colors group">
                  <td className="px-6 py-4">
                    <Link href={`/members/${member.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-input flexItems-center justify-center overflow-hidden shrink-0">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-muted mx-auto my-2" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-primary group-hover:text-accent-primary transition-colors">{member.name}</div>
                        {member.email && <div className="text-xs text-muted">{member.email}</div>}
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getStatusColor(member.status, member.end_date) as any}>
                      {getDisplayStatus(member.status, member.end_date)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-secondary">{formatMembershipType(member.membership_type)}</td>
                  <td className="px-6 py-4 text-secondary">{format(new Date(member.end_date), 'MMM d, yyyy')}</td>
                  <td className="px-6 py-4 text-right font-medium">{member.total_visits}</td>
                  <td className="px-6 py-4 text-right text-secondary">${member.total_paid.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/members/${member.id}`}>
                      <Button variant="secondary" className="px-3 py-1.5 h-auto text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
