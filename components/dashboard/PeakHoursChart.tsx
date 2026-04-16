"use client"

import React from "react"
import { Card } from "@/components/ui/Card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"

interface PeakHoursChartProps {
  data: Array<{ hour: string; value: number }>
  totalCheckIns: number
  windowLabel: string
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="bg-[#1E1E2E] border border-white/10 p-3 rounded-lg shadow-xl text-sm">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-gray-300">{payload[0].value} check-ins</p>
    </div>
  )
}

export function PeakHoursChart({ data, totalCheckIns, windowLabel }: PeakHoursChartProps) {
  return (
    <Card className="h-[340px] flex flex-col">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
            Peak Hours
          </h3>
          <p className="text-sm text-gray-400 mt-1">{windowLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Check-Ins</p>
          <p className="text-lg font-semibold text-white">{totalCheckIns.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex-1 w-full relative -mx-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} dx={-10} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="value" name="Check-Ins" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
