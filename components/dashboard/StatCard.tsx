"use client"

import React from "react"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  delta?: number
  deltaLabel?: string
  className?: string
  chart?: React.ReactNode
}

export function StatCard({ title, value, delta, deltaLabel, className, chart }: StatCardProps) {
  const isPositive = delta && delta > 0
  const isNegative = delta && delta < 0

  return (
    <Card className={`relative overflow-hidden flex flex-col justify-between ${className || ''}`}>
      <div className="flex justify-between items-start z-10 mb-4">
        <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          {title}
        </h3>
      </div>

      <div className="z-10 mt-auto">
        <div className="text-[48px] font-bold tracking-tight mb-2 leading-none">
          {value}
        </div>
        
        {delta !== undefined && (
          <div className="flex items-center gap-2">
            <Badge 
              variant={isPositive ? "positive" : isNegative ? "negative" : "neutral"}
              className="flex items-center gap-1"
            >
              {isPositive ? <ArrowUpRight size={14} /> : isNegative ? <ArrowDownRight size={14} /> : null}
              {Math.abs(delta)}%
            </Badge>
            {deltaLabel && <span className="text-sm text-[var(--color-text-muted)]">{deltaLabel}</span>}
          </div>
        )}
      </div>

      {chart && (
        <div className="absolute inset-0 z-0 opacity-50 flex items-end">
          <div className="w-full h-3/4 chart-wrapper">
            {chart}
          </div>
        </div>
      )}
    </Card>
  )
}
