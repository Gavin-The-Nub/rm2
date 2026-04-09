"use client"

import React from "react"
import { Card } from "@/components/ui/Card"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
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
  newMembersOverTime: { date: string; value: number }[]
  membershipTypeDist: { name: string; value: number; color: string }[]
  totalActiveNow: number
  statusByWeek: { week: string; Active: number; Expired: number; Suspended: number }[]
}

export default function MembershipCharts({
  newMembersOverTime,
  membershipTypeDist,
  totalActiveNow,
  statusByWeek,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="h-[350px] flex flex-col">
        <div className="mb-6">
          <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">New Members Over Time</h3>
        </div>
        <div className="flex-1 w-full relative -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={newMembersOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" name="New Members" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="h-[350px] flex flex-col">
        <div className="mb-6">
          <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Membership Type Dist.</h3>
        </div>
        <div className="flex-1 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={membershipTypeDist}
                cx="50%"
                cy="45%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {membershipTypeDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1E1E2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
            <span className="text-sm text-gray-400">Total Active</span>
            <span className="text-xl font-bold text-white">{totalActiveNow.toLocaleString()}</span>
          </div>

          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4">
            {membershipTypeDist.map((entry, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-xs text-gray-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="h-[350px] flex flex-col">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Status Breakdown</h3>
          <div className="flex items-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#10B981]"></div><span className="text-gray-400 hidden sm:inline">Active</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#EF4444]"></div><span className="text-gray-400 hidden sm:inline">Expired</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div><span className="text-gray-400 hidden sm:inline">Suspended</span></div>
          </div>
        </div>
        <div className="flex-1 w-full relative -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusByWeek} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="Active" stackId="a" fill="#10B981" />
              <Bar dataKey="Expired" stackId="a" fill="#EF4444" />
              <Bar dataKey="Suspended" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
