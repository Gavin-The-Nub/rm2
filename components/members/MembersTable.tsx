"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/utils/supabase/client"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Search, Filter, Plus, User, AlertCircle, MoreVertical } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  memberSubscriptionCategory,
  memberStatusBadgeVariant,
  memberStatusLabel,
} from "@/lib/memberSubscription"

type MemberRow = {
  id: string
  name: string
  email: string | null
  photo_url: string | null
  membership_type: "1_day" | "weekly" | "monthly"
  status: "active" | "suspended" | "cancelled"
  qr_code: string
  start_date: string
  end_date: string
  created_at: string
  total_paid: number
  total_visits: number
  last_seen: string | null
}

type MembersTab = "all" | "active" | "expiring_soon" | "expired"
type MembershipTypeFilter = "all" | MemberRow["membership_type"]
type MembershipStatusFilter = "all" | "active" | "expiring_soon" | "expired"

export function MembersTable() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [tab, setTab] = useState<MembersTab>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [membershipTypeFilter, setMembershipTypeFilter] = useState<MembershipTypeFilter>("all")
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<MembershipStatusFilter>("all")

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true)
      // Query members and manually calculate the lifetime stats 
      // since Supabase JS doesn't support complex aggregate joins well without a view.
      // For MVP, we'll fetch members and a lightweight version of stats.
      
      const { data, error } = await supabase
        .from('members')
        .select(`
          id, name, email, photo_url, membership_type, status, qr_code, start_date, end_date, created_at, payment_amount,
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
      const formattedData: MemberRow[] = data.map((m: any) => {
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
          qr_code: m.qr_code,
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

  const searchFiltered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const tabCounts = {
    all: members.length,
    active: members.filter((m) => memberSubscriptionCategory(m) === "active").length,
    expiring_soon: members.filter((m) => memberSubscriptionCategory(m) === "expiring_soon").length,
    expired: members.filter((m) => memberSubscriptionCategory(m) === "expired").length,
  }

  const filteredMembers = searchFiltered.filter((m) => {
    const matchesTab = tab === "all" ? true : memberSubscriptionCategory(m) === tab
    const matchesMembershipType = membershipTypeFilter === "all" ? true : m.membership_type === membershipTypeFilter
    const matchesStatus = membershipStatusFilter === "all" ? true : memberSubscriptionCategory(m) === membershipStatusFilter
    return matchesTab && matchesMembershipType && matchesStatus
  })

  const tabs: { id: MembersTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "expiring_soon", label: "Expiring soon" },
    { id: "expired", label: "Expired" },
  ]

  const formatMembershipType = (type: string) => {
    switch(type) {
      case '1_day': return '1 Day'
      case 'weekly': return 'Weekly'
      case 'monthly': return 'Monthly'
      default: return type
    }
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
          <Button
            variant="secondary"
            className="flex-1 sm:flex-none"
            onClick={() => setShowFilters((prev) => !prev)}
          >
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

      {showFilters && (
        <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-muted">Membership Type</label>
              <select
                value={membershipTypeFilter}
                onChange={(e) => setMembershipTypeFilter(e.target.value as MembershipTypeFilter)}
                className="h-9 min-w-[170px] rounded-md border border-white/10 bg-black/20 px-3 text-sm text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60"
              >
                <option value="all">All types</option>
                <option value="1_day">1 Day</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-muted">Account Status</label>
              <select
                value={membershipStatusFilter}
                onChange={(e) => setMembershipStatusFilter(e.target.value as MembershipStatusFilter)}
                className="h-9 min-w-[170px] rounded-md border border-white/10 bg-black/20 px-3 text-sm text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/60"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="expiring_soon">Expiring soon</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <Button
              variant="secondary"
              className="md:ml-auto"
              onClick={() => {
                setMembershipTypeFilter("all")
                setMembershipStatusFilter("all")
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="px-4 pb-3 border-b border-white/5 overflow-x-auto">
        <div className="flex flex-wrap gap-2 min-w-min">
          {tabs.map((t) => {
            const count = tabCounts[t.id]
            const isSelected = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all h-9 px-4 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0A84FF]/60 focus-visible:ring-offset-[#0a0a0f]",
                  isSelected
                    ? "bg-[#0A84FF] text-white border-[#0A84FF]/50 shadow-[0_4px_14px_rgba(10,132,255,0.4)] hover:brightness-110"
                    : "bg-white/10 text-white/90 border-white/10 shadow-[0_4px_14px_rgba(0,0,0,0.1)] backdrop-blur-md hover:bg-white/15"
                )}
              >
                {t.label}{" "}
                <span
                  className={cn(
                    "tabular-nums ml-0.5",
                    isSelected ? "text-white/85" : "text-white/55"
                  )}
                >
                  ({count})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-card/50 text-muted uppercase text-[11px] font-medium tracking-wider border-b border-white/5">
            <tr>
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Scan ID</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">End Date</th>
              <th className="px-6 py-4 text-right">Visits</th>
              <th className="px-6 py-4 text-right">Paid</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-muted">Loading members...</td>
              </tr>
            ) : filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-muted">No members found.</td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const cat = memberSubscriptionCategory(member)
                const isExpired = cat === "expired"
                const isCancelled = member.status === "cancelled"
                const isExpiring = cat === "expiring_soon"
                const isUrgentNegative = isExpired || isCancelled

                return (
                  <tr 
                    key={member.id} 
                    className={cn(
                      "hover:bg-card-hover transition-colors group",
                      isUrgentNegative && "bg-red-500/[0.03] text-red-100/80",
                      isExpiring && !isUrgentNegative && "bg-[#F97316]/[0.06] text-orange-50/95"
                    )}
                  >
                  <td className="px-6 py-4">
                    <Link href={`/members/${member.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-input flex items-center justify-center overflow-hidden shrink-0">
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
                    <Badge variant={memberStatusBadgeVariant(member)}>
                      <div className="flex items-center gap-1">
                        {(isExpired || isExpiring) && (
                          <AlertCircle className="w-3 h-3 shrink-0" />
                        )}
                        {memberStatusLabel(member)}
                      </div>
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded text-secondary/80 font-mono">
                      {member.qr_code}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-secondary">{formatMembershipType(member.membership_type)}</td>
                  <td className={cn(
                    "px-6 py-4 text-secondary",
                    isExpired && "text-red-400 font-medium",
                    isExpiring && !isExpired && "text-[#FB923C] font-medium"
                  )}>
                    {format(new Date(member.end_date), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{member.total_visits}</td>
                  <td className="px-6 py-4 text-right text-secondary">₱{member.total_paid.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/members/${member.id}`}>
                        <Button variant="secondary" className="px-3 py-1.5 h-auto text-[10px] uppercase tracking-wider">
                          View
                        </Button>
                      </Link>
                    </div>
                  </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
