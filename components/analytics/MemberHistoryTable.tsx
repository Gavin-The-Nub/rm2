"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Search, Filter, Download } from "lucide-react"

const mockMembers = [
  { id: 1, name: "John Santos", type: "Monthly", status: "Active", start: "Jan 1, 2026", end: "Jan 31, 2026", visits: 14, lastSeen: "Today, 8:45 AM", paid: "₱45.00", renewals: 2, joined: "Nov 15, 2025" },
  { id: 2, name: "Maria Garcia", type: "Weekly", status: "Active", start: "Feb 20, 2026", end: "Feb 27, 2026", visits: 4, lastSeen: "Yesterday", paid: "₱15.00", renewals: 0, joined: "Feb 20, 2026" },
  { id: 3, name: "Alex Chen", type: "1 Day", status: "Expired", start: "Feb 14, 2026", end: "Feb 14, 2026", visits: 1, lastSeen: "Feb 14, 2026", paid: "₱5.00", renewals: 0, joined: "Feb 14, 2026" },
  { id: 4, name: "Sarah Jenkins", type: "Monthly", status: "Suspended", start: "Jan 15, 2026", end: "Feb 15, 2026", visits: 22, lastSeen: "Feb 10, 2026", paid: "₱90.00", renewals: 1, joined: "Dec 15, 2025" },
  { id: 5, name: "David Kim", type: "Monthly", status: "Active", start: "Feb 1, 2026", end: "Mar 1, 2026", visits: 18, lastSeen: "Today, 6:30 AM", paid: "₱45.00", renewals: 0, joined: "Feb 1, 2026" },
]

export function MemberHistoryTable() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <Card className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-white/[0.05] gap-4">
        <div>
           <h3 className="text-lg font-semibold text-white">Member History</h3>
           <p className="text-sm text-gray-400 mt-1">View and filter all members</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search members..." 
              className="pl-9 bg-[#1E1E2E] border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 rounded-lg bg-[#1E1E2E] border border-white/10 text-gray-400 hover:text-white transition-colors">
            <Filter size={18} />
          </button>
          <button className="p-2.5 rounded-lg bg-[#1E1E2E] border border-white/10 text-gray-400 hover:text-white transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="font-medium">Name</th>
              <th className="font-medium">Type</th>
              <th className="font-medium">Status</th>
              <th className="font-medium">Start Date</th>
              <th className="font-medium">End Date</th>
              <th className="font-medium">Visits</th>
              <th className="font-medium">Last Seen</th>
              <th className="font-medium">Total Paid</th>
            </tr>
          </thead>
          <tbody>
            {mockMembers.map((member) => (
              <tr key={member.id} className="cursor-pointer">
                <td>
                  <div className="member-cell">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-medium text-white">{member.name}</span>
                  </div>
                </td>
                <td>
                  <Badge variant={member.type === '1 Day' ? 'neutral' : member.type === 'Weekly' ? 'weekly' : 'secondary' as any}>
                    {member.type}
                  </Badge>
                </td>
                <td>
                  <Badge variant={member.status === 'Active' ? 'positive' : member.status === 'Suspended' ? 'suspended' : 'negative'}>
                    {member.status}
                  </Badge>
                </td>
                <td className="text-gray-400 text-sm">{member.start}</td>
                <td className="text-gray-400 text-sm">{member.end}</td>
                <td className="font-medium">{member.visits}</td>
                <td className="text-gray-400 text-sm">{member.lastSeen}</td>
                <td className="font-medium text-white">{member.paid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-white/[0.05] flex items-center justify-between text-sm text-gray-400">
        <div>Showing 1 to 5 of 4,365 entries</div>
        <div className="flex gap-1">
          <button className="px-3 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50" disabled>Prev</button>
          <button className="px-3 py-1 rounded bg-[#3B82F6] text-white">1</button>
          <button className="px-3 py-1 rounded border border-white/10 hover:bg-white/5">2</button>
          <button className="px-3 py-1 rounded border border-white/10 hover:bg-white/5">3</button>
          <button className="px-3 py-1 rounded border border-white/10 hover:bg-white/5">Next</button>
        </div>
      </div>
    </Card>
  )
}
