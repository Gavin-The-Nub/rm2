"use client"

import React, { useState, useEffect } from "react"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from "date-fns"
import { 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Calendar as CalendarIcon,
  Search,
  Clock,
  ArrowRight
} from "lucide-react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { cn } from "@/lib/utils"
import { supabase } from "@/utils/supabase/client"
import { phDateISOFromDate } from "@/lib/phTime"
import { memberStatusLabel, memberStatusBadgeVariant } from "@/lib/memberSubscription"

interface AttendanceRecord {
  id: string
  check_in_date: string
  created_at: string
  member_id: string
  members: {
    name: string
    membership_type: string
    status: string
    end_date: string
  }
}

export function AttendanceCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [monthAttendanceCounts, setMonthAttendanceCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch month summary (counts per day)
  useEffect(() => {
    const fetchMonthSummary = async () => {
      const start = phDateISOFromDate(startOfMonth(currentMonth))
      const end = phDateISOFromDate(endOfMonth(currentMonth))

      let allRows: { check_in_date: string }[] = []
      let page = 0
      const pageSize = 1000
      const maxPages = 15 // safety cap

      while (page < maxPages) {
        const { data, error } = await supabase
          .from("attendance")
          .select("check_in_date")
          .gte("check_in_date", start)
          .lte("check_in_date", end)
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
          console.error("Error fetching month summary:", error)
          return
        }

        if (!data || data.length === 0) break
        allRows = allRows.concat(data)
        if (data.length < pageSize) break
        page++
      }

      const counts: Record<string, number> = {}
      allRows.forEach((row) => {
        counts[row.check_in_date] = (counts[row.check_in_date] || 0) + 1
      })
      setMonthAttendanceCounts(counts)
    }

    fetchMonthSummary()
  }, [currentMonth])

  // Fetch daily attendance
  useEffect(() => {
    const fetchDailyAttendance = async () => {
      setIsLoading(true)
      const dateStr = phDateISOFromDate(selectedDate)

      const { data, error } = await supabase
        .from("attendance")
        .select(`
          id, 
          check_in_date, 
          created_at, 
          member_id, 
          members(name, membership_type, status, end_date)
        `)
        .eq("check_in_date", dateStr)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching daily attendance:", error)
      } else {
        setAttendance(data as any || [])
      }
      setIsLoading(false)
    }

    fetchDailyAttendance()
  }, [selectedDate])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const filteredAttendance = attendance.filter((record) =>
    record.members.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const typeLabels: Record<string, string> = {
    "1_day": "1 Day",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "student_1_month": "Student",
  }

  const getTypeVariant = (type: string): any => {
    if (type === "1_day") return "1day"
    if (type === "weekly") return "weekly"
    if (type === "monthly" || type === "student_1_month") return "monthly"
    return "neutral"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full lg:overflow-hidden">
      {/* Calendar Section */}
      <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 lg:overflow-y-auto lg:pr-2 custom-scrollbar">
        <Card className="p-4 flex flex-col h-fit">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#0A84FF]" />
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dateISO = phDateISOFromDate(day)
              const hasAttendance = monthAttendanceCounts[dateISO] > 0
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, monthStart)
              const isTodayDay = isToday(day)

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-300 group",
                    !isCurrentMonth && "opacity-20",
                    isSelected 
                      ? "bg-[#0A84FF] text-white shadow-[0_0_15px_rgba(10,132,255,0.4)]" 
                      : "hover:bg-white/5 text-gray-300",
                    isTodayDay && !isSelected && "border border-[#0A84FF]/50"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    isSelected ? "font-bold" : ""
                  )}>
                    {format(day, "d")}
                  </span>
                  
                  {hasAttendance && (
                    <div className={cn(
                      "absolute bottom-2 w-1 h-1 rounded-full",
                      isSelected ? "bg-white" : "bg-[#0A84FF]"
                    )} />
                  )}

                  {/* Indicator for count */}
                  {hasAttendance && !isSelected && isCurrentMonth && (
                    <span className="absolute top-1 right-1 text-[8px] font-bold text-[#0A84FF] opacity-0 group-hover:opacity-100 transition-opacity">
                      {monthAttendanceCounts[dateISO]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#0A84FF]/10 to-transparent border-[#0A84FF]/20">
          <h3 className="text-sm font-semibold text-[#0A84FF] mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Selected Day Check-ins</span>
              <span className="text-white font-bold">{attendance.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Total this month</span>
              <span className="text-white font-bold">
                {Object.values(monthAttendanceCounts).reduce((a, b) => a + b, 0)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Details Section */}
      <Card className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[400px] lg:h-full overflow-hidden">
        <div className="p-6 border-b border-white/[0.05] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Attendance Log
              <span className="text-sm font-normal text-gray-500">
                — {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Who visited the gym on this day
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/50 transition-all"
            />
          </div>
        </div>
        
        <div className="flex-1 lg:overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-8 h-8 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading attendance data...</p>
            </div>
          ) : filteredAttendance.length > 0 ? (
            <div className="divide-y divide-white/[0.05]">
              {filteredAttendance.map((record) => (
                <div 
                  key={record.id} 
                  className="p-4 hover:bg-white/[0.02] transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A84FF] to-[#BF5AF2] flex items-center justify-center text-sm font-bold text-white shadow-lg">
                      {record.members.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-[#0A84FF] transition-colors">
                        {record.members.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getTypeVariant(record.members.membership_type)}>
                          {typeLabels[record.members.membership_type] || record.members.membership_type}
                        </Badge>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 uppercase tracking-wider">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(record.created_at), "h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={memberStatusBadgeVariant(record.members) as any}>
                      {memberStatusLabel(record.members)}
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-white font-semibold">No check-ins found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                {searchQuery 
                  ? `No members matching "${searchQuery}" checked in on this day.` 
                  : "Nobody checked in on this date. Maybe it was a holiday or the gym was closed?"}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Showing {filteredAttendance.length} check-ins
          </span>
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#30D158]" />
              <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FF453A]" />
              <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Expired</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
