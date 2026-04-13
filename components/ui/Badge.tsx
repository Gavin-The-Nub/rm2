import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "active" | "expired" | "expiring_soon" | "suspended" | "1day" | "weekly" | "monthly" | "neutral" | "positive" | "negative";
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "active":
      case "positive":
        return "bg-[#30D158]/20 text-[#30D158] border-[#30D158]/20 shadow-[0_0_12px_rgba(48,209,88,0.2)]"
      case "expired":
      case "negative":
        return "bg-[#FF453A]/20 text-[#FF453A] border-[#FF453A]/20 shadow-[0_0_12px_rgba(255,69,58,0.2)]"
      case "expiring_soon":
        return "bg-[#F97316]/20 text-[#F97316] border-[#F97316]/25 shadow-[0_0_12px_rgba(249,115,22,0.22)]"
      case "suspended":
        return "bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/20 shadow-[0_0_12px_rgba(255,159,10,0.2)]"
      case "1day":
      case "neutral":
        return "bg-white/10 text-white/70 border-white/10"
      case "weekly":
        return "bg-[#0A84FF]/20 text-[#0A84FF] border-[#0A84FF]/20 shadow-[0_0_12px_rgba(10,132,255,0.2)]"
      case "monthly":
        return "bg-[#BF5AF2]/20 text-[#BF5AF2] border-[#BF5AF2]/20 shadow-[0_0_12px_rgba(191,90,242,0.2)]"
      default:
        return "bg-white/10 text-white/70 border-white/10"
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
        getVariantClasses(),
        className
      )}
      {...props}
    />
  )
}
