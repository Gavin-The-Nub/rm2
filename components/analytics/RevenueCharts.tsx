"use client"

import React from "react"
import { Card } from "@/components/ui/Card"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts"

const CustomTooltip = ({ active, payload, label }: any) => {
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
              ₱{Number(entry.value).toLocaleString("en-PH")}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

interface Props {
  revenueOverTime: { date: string; newMembers: number; renewals: number }[]
  membershipTypeRev: { name: string; value: number; color: string }[]
  totalTypeRev: number
  monthlyComparison: { week: string; current: number; previous: number }[]
}

export default function RevenueCharts({
  revenueOverTime,
  membershipTypeRev,
  totalTypeRev,
  monthlyComparison,
}: Props) {
  return (
    <>
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 h-[350px] flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Revenue Over Time</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div><span className="text-gray-400">New Members</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10B981]"></div><span className="text-gray-400">Renewals</span></div>
            </div>
          </div>
          <div className="flex-1 w-full relative -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dx={-10} tickFormatter={(val) => `₱${val}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Line type="monotone" dataKey="newMembers" name="New Members" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#3B82F6' }} />
                <Line type="monotone" dataKey="renewals" name="Renewals" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-[350px] flex flex-col">
          <div className="mb-6">
            <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Revenue by Membership</h3>
          </div>
          <div className="flex-1 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={membershipTypeRev}
                  cx="50%"
                  cy="45%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {membershipTypeRev.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(val: any) => `₱${Number(val).toLocaleString("en-PH")}`}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
              <span className="text-sm text-gray-400">Total</span>
              <span className="text-xl font-bold text-white">₱{totalTypeRev.toLocaleString("en-PH")}</span>
            </div>

            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4">
              {membershipTypeRev.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-xs text-gray-400">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="h-[350px] flex flex-col">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Monthly Revenue Comparison</h3>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div><span className="text-gray-400">Current Month</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#1E1E2E] border border-white/20"></div><span className="text-gray-400">Previous Month</span></div>
            </div>
          </div>
          <div className="flex-1 w-full relative -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dx={-10} tickFormatter={(val) => `₱${val}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="current" name="Current Month" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous" name="Previous Month" fill="#1E1E2E" stroke="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  )
}
