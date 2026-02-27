"use client"

import React, { useState } from "react"
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Card } from "@/components/ui/Card"

const mockAttendanceData = [
  { name: 'Mon', '1 Day': 12, 'Weekly': 45, 'Monthly': 100, total: 157 },
  { name: 'Tue', '1 Day': 18, 'Weekly': 50, 'Monthly': 110, total: 178 },
  { name: 'Wed', '1 Day': 20, 'Weekly': 48, 'Monthly': 105, total: 173 },
  { name: 'Thu', '1 Day': 15, 'Weekly': 55, 'Monthly': 115, total: 185 },
  { name: 'Fri', '1 Day': 25, 'Weekly': 60, 'Monthly': 120, total: 205 },
  { name: 'Sat', '1 Day': 40, 'Weekly': 35, 'Monthly': 80, total: 155 },
  { name: 'Sun', '1 Day': 30, 'Weekly': 30, 'Monthly': 75, total: 135 },
]

const mockSalesData = [
  { name: 'Mon', '1 Day': 60, 'Weekly': 675, 'Monthly': 5000, total: 5735 },
  { name: 'Tue', '1 Day': 90, 'Weekly': 750, 'Monthly': 5500, total: 6340 },
  { name: 'Wed', '1 Day': 100, 'Weekly': 720, 'Monthly': 5250, total: 6070 },
  { name: 'Thu', '1 Day': 75, 'Weekly': 825, 'Monthly': 5750, total: 6650 },
  { name: 'Fri', '1 Day': 125, 'Weekly': 900, 'Monthly': 6000, total: 7025 },
  { name: 'Sat', '1 Day': 200, 'Weekly': 525, 'Monthly': 4000, total: 4725 },
  { name: 'Sun', '1 Day': 150, 'Weekly': 450, 'Monthly': 3750, total: 4350 },
]

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


export function WeeklyAttendanceChart() {
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
        {mounted && <StackedBarChartHover data={mockAttendanceData} />}
      </div>
    </Card>
  )
}

export function WeeklySalesChart() {
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
        {mounted && <StackedBarChartHover data={mockSalesData} prefix="₱" />}
      </div>
    </Card>
  )
}

