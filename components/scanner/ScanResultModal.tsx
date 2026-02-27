"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/Card"
import { User, CheckCircle2, XCircle, AlertTriangle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export type ScanResultStatus = "success" | "already_checked_in" | "expired" | "suspended" | "invalid_qr" | null

export interface ScanResultProps {
  member: any
  status: ScanResultStatus
  onClose: () => void
}

export function ScanResultModal({ member, status, onClose }: ScanResultProps) {
  const [progress, setProgress] = useState(100)
  const [isExiting, setIsExiting] = useState(false)
  
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!status) return

    const totalDuration = 4000
    const interval = 20 // update every 20ms for smoother progress
    const steps = totalDuration / interval
    const decrement = 100 / steps

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - decrement
      })
    }, interval)

    const dismissTimeout = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 400) // Match transition duration
    }, totalDuration)

    return () => {
      clearInterval(timer)
      clearTimeout(dismissTimeout)
    }
  }, [status, onClose])

  if (!status) return null

  // Config mapping for all result states


  const getConfig = () => {
    switch (status) {
      case "success":
        return {
          glow: "from-[#30D158]/40 via-[#30D158]/5 to-transparent",
          icon: <CheckCircle2 className="w-12 h-12 text-[#30D158]" />,
          title: "SUCCESSFUL CHECK-IN",
          ring: "border-[#30D158]/40",
          accentColor: "#30D158",
          shadow: "shadow-[0_0_60px_-10px_rgba(48,209,88,0.6)]",
        }
      case "already_checked_in":
        return {
          glow: "from-[#0A84FF]/40 via-[#0A84FF]/5 to-transparent",
          icon: <AlertTriangle className="w-12 h-12 text-[#0A84FF]" />,
          title: "ALREADY VISITED",
          ring: "border-[#0A84FF]/40",
          accentColor: "#0A84FF",
          shadow: "shadow-[0_0_60px_-10px_rgba(10,132,255,0.6)]",
        }
      case "expired":
        return {
          glow: "from-[#FF453A]/40 via-[#FF453A]/5 to-transparent",
          icon: <XCircle className="w-12 h-12 text-[#FF453A]" />,
          title: "MEMBERSHIP EXPIRED",
          ring: "border-[#FF453A]/40",
          accentColor: "#FF453A",
          shadow: "shadow-[0_0_60px_-10px_rgba(255,69,58,0.6)]",
        }
      case "suspended":
        return {
          glow: "from-[#FF453A]/40 via-[#FF453A]/5 to-transparent",
          icon: <AlertCircle className="w-12 h-12 text-[#FF453A]" />,
          title: "ACCOUNT SUSPENDED",
          ring: "border-[#FF453A]/40",
          accentColor: "#FF453A",
          shadow: "shadow-[0_0_60px_-10px_rgba(255,69,58,0.6)]",
        }
      case "invalid_qr":
      default:
        return {
          glow: "from-[#FF453A]/30 via-[#FF453A]/5 to-transparent",
          icon: <AlertCircle className="w-12 h-12 text-[#FF453A]" />,
          title: "UNKNOWN CODE",
          ring: "border-white/10",
          accentColor: "#FF453A",
          shadow: "shadow-[0_0_60px_-10px_rgba(255,69,58,0.4)]",
        }
    }
  }

  const config = getConfig()

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-400 ease-out",
      isExiting ? "opacity-0 backdrop-blur-0" : "opacity-100 backdrop-blur-md bg-black/60"
    )}>
      {/* Glossy Backdrop with Dynamic Flowing Gradients */}
      <div className={cn(
        "relative w-full max-w-[500px] overflow-hidden rounded-[40px] border border-white/10 bg-black/40 backdrop-blur-[60px] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
        config.shadow,
        isExiting ? "scale-90 opacity-0 translate-y-12" : "scale-100 opacity-100 translate-y-0"
      )}>
        
        {/* Dynamic Background Glow Layer */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-b opacity-40 pointer-events-none transition-all duration-500",
          config.glow
        )} />

        {/* Inner Glint Border */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="relative pt-16 pb-12 px-10 flex flex-col items-center">
          {/* Status Icon with pulsing aura */}
          <div className="relative mb-8">
             <div className={cn(
                "absolute inset-0 rounded-full animate-ping opacity-25",
                status === "success" ? "bg-[#30D158]" : status === "already_checked_in" ? "bg-[#0A84FF]" : "bg-[#FF453A]"
             )} style={{ animationDuration: '3s' }} />
             <div className="relative z-10 p-5 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md">
                {config.icon}
             </div>
          </div>

          <h3 className="text-[14px] font-bold tracking-[0.3em] text-white/50 uppercase mb-4">
            {config.title}
          </h3>

          {status === "invalid_qr" || !member ? (
            <div className="text-center flex flex-col items-center">
              <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Unknown Member</h2>
              <p className="text-white/40 text-lg max-w-[320px] leading-relaxed">
                This QR code was not recognized. Please scan a valid gym membership card.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              {/* Profile Photo with Glass Frame */}
              <div className={cn(
                "w-44 h-44 rounded-full mb-8 p-1.5 border-2 border-white/10 shadow-2xl relative",
                config.ring
              )}>
                <div className="w-full h-full rounded-full bg-white/5 backdrop-blur-3xl flex items-center justify-center overflow-hidden">
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-20 h-20 text-white/20" />
                  )}
                </div>
              </div>

              <h2 className="text-4xl font-bold text-white mb-2 tracking-tight text-center">{member.name}</h2>
              <p className="text-[#0A84FF] text-sm font-semibold uppercase tracking-[0.2em] mb-12">
                {member.membership_type.replace('_', ' ')} MEMBER
              </p>

              {/* Status Indicator (Minimal) */}
              <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">
                <div className={cn(
                  "w-3 h-3 rounded-full animate-pulse",
                  member.status === 'active' ? 'bg-[#30D158] shadow-[0_0_12px_#30D158]' : member.status === 'suspended' ? 'bg-[#FF9F0A] shadow-[0_0_12px_#FF9F0A]' : 'bg-[#FF453A] shadow-[0_0_12px_#FF453A]'
                )} />
                <span className="text-base font-bold text-white/90 uppercase tracking-widest">{member.status}</span>
              </div>
            </div>
          )}

          {/* Liquid Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden">
            <div className="absolute inset-0 bg-white/5" />
            <div 
              className="absolute h-full transition-all duration-[20ms] ease-linear rounded-r-full"
              style={{ 
                width: `${progress}%`,
                backgroundColor: config.accentColor,
                boxShadow: `0 0 20px ${config.accentColor}`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
