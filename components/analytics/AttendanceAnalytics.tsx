"use client"

import React from "react"
import { StatCard } from "@/components/dashboard/StatCard"
import { Card } from "@/components/ui/Card"
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from "recharts"

const mockDailyCheckIns = [
  { date: '1st', value: 240 },
  { date: '5th', value: 300 },
  { date: '10th', value: 280 },
  { date: '15th', value: 350 },
  { date: '20th', value: 310 },
  { date: '25th', value: 400 },
  { date: '30th', value: 380 },
]

const mockDayOfWeek = [
  { day: 'Mon', value: 320 },
  { day: 'Tue', value: 350 },
  { day: 'Wed', value: 330 },
  { day: 'Thu', value: 340 },
  { day: 'Fri', value: 410 },
  { day: 'Sat', value: 220 },
  { day: 'Sun', value: 180 },
]

const mockHourlyDistribution = [
  { hour: '6AM', value: 45 },
  { hour: '9AM', value: 80 },
  { hour: '12PM', value: 65 },
  { hour: '3PM', value: 50 },
  { hour: '6PM', value: 120 },
  { hour: '9PM', value: 40 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1E1E2E] border border-white/10 p-3 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-400 capitalize">{entry.name}</span>
            </div>
            <span className="text-white font-medium ml-auto">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function AttendanceAnalytics() {
  return (
    <div className="flex flex-col gap-6">
      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard title="Total Check-Ins" value="8,450" delta={10.5} />
        <StatCard title="Avg Daily" value="281" delta={4.2} />
        <StatCard title="Busiest Day" value="412" deltaLabel="Friday" />
        <StatCard title="Busiest Day of Week" value="Friday" />
        <StatCard title="Peak Hour" value="6:00 PM" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-[350px] flex flex-col">
          <div className="mb-6">
            <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Daily Check-Ins Over Time</h3>
          </div>
          <div className="flex-1 w-full relative -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockDailyCheckIns} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Line type="monotone" dataKey="value" name="Check-Ins" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-[350px] flex flex-col">
          <div className="mb-6">
            <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Check-Ins by Day of Week</h3>
          </div>
          <div className="flex-1 w-full relative -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDayOfWeek} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name="Avg Check-Ins" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Heatmap Placeholder */}
        <Card className="h-[350px] flex flex-col">
          <div className="mb-6">
            <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Check-In Heatmap</h3>
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
            {/* Simple Grid to mimic heatmap */}
            <div className="grid grid-cols-7 gap-2 w-full max-w-sm">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-500 font-medium mb-1">{d}</div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                // Randomize intensity for visual effect
                const intensity = [0.2, 0.5, 1][Math.floor(Math.random() * 3)];
                const isEmpty = Math.random() < 0.2;
                return (
                  <div 
                    key={i} 
                    className="aspect-square rounded-md transition-all hover:scale-110 cursor-pointer"
                    style={{ 
                      backgroundColor: isEmpty ? 'var(--bg-input)' : `rgba(59, 130, 246, ${intensity})` 
                    }}
                    title={`${Math.floor(Math.random() * 100)} check-ins`}
                  />
                )
              })}
            </div>
          </div>
        </Card>

        <Card className="h-[350px] flex flex-col">
          <div className="mb-6">
            <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Hourly Distribution</h3>
          </div>
          <div className="flex-1 w-full relative -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockHourlyDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name="Avg Check-Ins" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
