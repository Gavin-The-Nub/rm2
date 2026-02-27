import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "active" | "expired" | "suspended" | "1day" | "weekly" | "monthly" | "neutral" | "positive" | "negative";
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "active":
        return "bg-[#10B981]/15 text-[#10B981]"
      case "expired":
        return "bg-[#EF4444]/15 text-[#EF4444]"
      case "suspended":
        return "bg-[#F59E0B]/15 text-[#F59E0B]"
      case "1day":
      case "neutral":
        return "bg-[#9CA3AF]/15 text-[#9CA3AF]"
      case "weekly":
        return "bg-[#3B82F6]/15 text-[#3B82F6]"
      case "monthly":
        return "bg-[#8B5CF6]/15 text-[#8B5CF6]"
      case "positive":
        return "bg-[#10B981] text-white" // Solid variants for stat badges if needed
      case "negative":
        return "bg-[#EF4444] text-white"
      default:
        return "bg-[#9CA3AF]/15 text-[#9CA3AF]"
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-[10px] py-[3px] text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        getVariantClasses(),
        className
      )}
      {...props}
    />
  )
}
