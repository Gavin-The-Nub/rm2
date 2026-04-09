"use client"

import React from "react"
import { Card } from "@/components/ui/Card"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1E1E2E] border border-white/10 p-3 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-400 capitalize">{entry.name}</span>
            </div>
            <span className="text-white font-medium ml-auto">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

interface Props {
  dailyCheckIns: { date: string; value: number }[]
  checkInsByDayOfWeek: { day: string; value: number }[]
  hourlyDistribution: { hour: string; value: number }[]
  heatmapData: { count: number; isEmpty: boolean }[]
}

export default function AttendanceCharts({
  dailyCheckIns,
  checkInsByDayOfWeek,
  hourlyDistribution,
  heatmapData,
}: Props) {
  const maxCount = Math.max(...heatmapData.map((d) => d.count), 1)

  return (
    <>
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="h-[350px] flex flex-col">
          <div className="mb-6">
            <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Daily Check-Ins Over Time</h3>
          </div>
          <div className="flex-1 w-full relative -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyCheckIns} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <BarChart data={checkInsByDayOfWeek} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name="Check-Ins" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Heatmap */}
        <Card className="h-[350px] flex flex-col">
          <div className="mb-6">
            <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Check-In Heatmap (This Month)</h3>
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
            <div className="grid grid-cols-7 gap-2 w-full max-w-sm">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-500 font-medium mb-1">{d}</div>
              ))}
              {heatmapData.map((cell, i) => {
                const intensity = cell.isEmpty ? 0 : cell.count === 0 ? 0.08 : Math.min(cell.count / maxCount, 1)
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-md transition-all hover:scale-110 cursor-pointer"
                    style={{
                      backgroundColor: cell.isEmpty
                        ? 'transparent'
                        : cell.count === 0
                          ? 'rgba(255,255,255,0.05)'
                          : `rgba(59, 130, 246, ${intensity})`
                    }}
                    title={cell.isEmpty ? '' : `${cell.count} check-ins`}
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
              <BarChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name="Avg Check-Ins" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  )
}
