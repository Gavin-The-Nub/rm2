"use client"

import React, { useState } from "react"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card } from "@/components/ui/Card"


const CustomTooltip = ({ active, payload, label, prefix = "" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1E1E2E] border border-white/10 p-3 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex justify-between items-center gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-400 capitalize">{entry.name}</span>
            </div>
            <span className="text-white font-medium">
              {prefix}{entry.value}
            </span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center font-bold">
          <span className="text-white">Total</span>
          <span className="text-[#3B82F6]">
            {prefix}{payload.reduce((sum: number, entry: any) => sum + entry.value, 0)}
          </span>
        </div>
      </div>
    )
  }
  return null
}

interface ChartProps {
  data: any[]
  prefix?: string
}

function StackedBarChartHover({ data, prefix = "" }: ChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
        onMouseMove={(state: any) => {
          if (state?.activeTooltipIndex !== undefined) {
            setHoverIndex(state.activeTooltipIndex)
          }
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#9CA3AF', fontSize: 12 }} 
          dy={10}
        />
        <Tooltip
          content={<CustomTooltip prefix={prefix} />}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        
        {/* Colors based on PRD: 1 Day = gray, Weekly = blue, Monthly = purple */}
        <Bar dataKey="Monthly" stackId="a" fill="#8B5CF6">
          {data.map((_, index) => (
            <Cell 
              key={`cell-m-${index}`} 
              fill="#8B5CF6"
              fillOpacity={hoverIndex === null || hoverIndex === index ? 1 : 0.3}
            />
          ))}
        </Bar>
        <Bar dataKey="Weekly" stackId="a" fill="#3B82F6">
          {data.map((_, index) => (
            <Cell 
              key={`cell-w-${index}`} 
              fill="#3B82F6"
              fillOpacity={hoverIndex === null || hoverIndex === index ? 1 : 0.3}
            />
          ))}
        </Bar>
        <Bar dataKey="1 Day" stackId="a" fill="#9CA3AF" radius={[6, 6, 0, 0]}>
          {data.map((_, index) => (
            <Cell 
              key={`cell-d-${index}`} 
              fill="#9CA3AF"
              fillOpacity={hoverIndex === null || hoverIndex === index ? 1 : 0.3}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}


export function WeeklyAttendanceChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Card className="h-[350px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Weekly Attendance</h3>
      </div>
      <div className="flex-1 w-full relative -mx-2 min-h-[250px] chart-wrapper">
        {mounted && <StackedBarChartHover data={data} />}
      </div>
    </Card>
  )
}

export function WeeklySalesChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Card className="h-[350px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Weekly Sales</h3>
      </div>
      <div className="flex-1 w-full relative -mx-2 min-h-[250px] chart-wrapper">
        {mounted && <StackedBarChartHover data={data} prefix="₱" />}
      </div>
    </Card>
  )
}

