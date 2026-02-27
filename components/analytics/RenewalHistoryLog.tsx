"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Search, Filter, Download } from "lucide-react"

const mockRenewals = [
  { id: 201, date: "Today, 9:00 AM", name: "John Santos", type: "Monthly", prevEnd: "Dec 31, 2025", newEnd: "Jan 31, 2026", amount: "$45.00" },
  { id: 202, date: "Yesterday, 2:30 PM", name: "Emma Wilson", type: "Monthly", prevEnd: "Feb 15, 2026", newEnd: "Mar 15, 2026", amount: "$45.00" },
  { id: 203, date: "Feb 24, 2026, 11:15 AM", name: "Luke Harris", type: "Weekly", prevEnd: "Feb 20, 2026", newEnd: "Feb 27, 2026", amount: "$15.00" },
  { id: 204, date: "Feb 22, 2026, 4:00 PM", name: "Oliver Brown", type: "Monthly", prevEnd: "Feb 1, 2026", newEnd: "Mar 1, 2026", amount: "$45.00" },
]

export function RenewalHistoryLog() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <Card className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-white/[0.05] gap-4">
        <div>
           <h3 className="text-lg font-semibold text-white">Renewal Log</h3>
           <p className="text-sm text-gray-400 mt-1">History of all membership renewals</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search by name..." 
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
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Date</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Member Name</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Type</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Previous End Date</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">New End Date</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Amount Paid</th>
            </tr>
          </thead>
          <tbody>
            {mockRenewals.map((log) => (
              <tr key={log.id} className="cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                <td className="p-4 text-sm text-gray-300">{log.date}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {log.name.charAt(0)}
                    </div>
                    <span className="font-medium text-white">{log.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <Badge variant={log.type === '1 Day' ? 'neutral' : log.type === 'Weekly' ? 'weekly' : 'secondary' as any}>
                    {log.type}
                  </Badge>
                </td>
                <td className="p-4 text-sm text-gray-400">{log.prevEnd}</td>
                <td className="p-4 text-sm text-blue-400 font-medium">{log.newEnd}</td>
                <td className="p-4 font-bold text-white">{log.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 flex items-center justify-between text-sm text-gray-400">
        <div>Showing 1 to 4 of 342 entries</div>
        <div className="flex gap-1">
          <button className="px-3 py-1 rounded border border-white/10 hover:bg-white/5 disabled:opacity-50" disabled>Prev</button>
          <button className="px-3 py-1 rounded bg-[#3B82F6] text-white">1</button>
          <button className="px-3 py-1 rounded border border-white/10 hover:bg-white/5">2</button>
          <button className="px-3 py-1 rounded border border-white/10 hover:bg-white/5">Next</button>
        </div>
      </div>
    </Card>
  )
}
