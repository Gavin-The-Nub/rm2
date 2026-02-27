"use client"

import React from "react"
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts"

interface MiniChartProps {
  data: number[]
  color?: string
}

export function MiniChart({ data, color = "#3B82F6" }: MiniChartProps) {
  const chartData = data.map((value, i) => ({ value, index: i }))
  const min = Math.min(...data)
  const max = Math.max(...data)
  
  // Create a unique ID for the gradient based on color
  const id = `gradient-${color.replace('#', '')}`

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={[min - (max - min) * 0.1, max + (max - min) * 0.1]} hide />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#${id})`}
          isAnimationActive={true}
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
