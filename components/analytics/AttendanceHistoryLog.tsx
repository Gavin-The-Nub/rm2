"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { Search, Filter, Download } from "lucide-react"

const mockAttendance = [
  { id: 101, dateTime: "Today, 8:45 AM", name: "John Santos", type: "Monthly", status: "Success" },
  { id: 102, dateTime: "Today, 8:30 AM", name: "David Kim", type: "Monthly", status: "Success" },
  { id: 103, dateTime: "Today, 7:15 AM", name: "Alex Chen", type: "1 Day", status: "Expired" },
  { id: 104, dateTime: "Yesterday, 6:00 PM", name: "Sarah Jenkins", type: "Monthly", status: "Suspended" },
  { id: 105, dateTime: "Yesterday, 5:30 PM", name: "Maria Garcia", type: "Weekly", status: "Success" },
  { id: 106, dateTime: "Yesterday, 5:15 PM", name: "John Santos", type: "Monthly", status: "Already Checked In" },
]

export function AttendanceHistoryLog() {
  const [searchTerm, setSearchTerm] = useState("")

  return (
    <Card className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-white/[0.05] gap-4">
        <div>
           <h3 className="text-lg font-semibold text-white">Attendance Log</h3>
           <p className="text-sm text-gray-400 mt-1">Detailed history of all check-in attempts</p>
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
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Date & Time</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Member Name</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Membership Type</th>
              <th className="font-medium p-4 border-b border-white/[0.05] text-xs text-gray-400 uppercase tracking-wider">Status at Scan</th>
            </tr>
          </thead>
          <tbody>
            {mockAttendance.map((log) => (
              <tr key={log.id} className="cursor-pointer hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                <td className="p-4 text-sm text-gray-300">{log.dateTime}</td>
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
                <td className="p-4">
                  <Badge 
                    variant={
                      log.status === 'Success' ? 'positive' : 
                      log.status === 'Suspended' || log.status === 'Already Checked In' ? 'suspended' : 'negative'
                    }
                  >
                    {log.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 flex items-center justify-between text-sm text-gray-400 auto">
        <div>Showing 1 to 6 of 8,450 entries</div>
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
