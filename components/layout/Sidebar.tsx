"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Home, 
  Users, 
  BarChart2, 
  ScanLine, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Dumbbell
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Members", href: "/members", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Scanner", href: "/scanner", icon: ScanLine },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-full bg-[var(--color-bg-base)] text-[var(--color-text-primary)] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-white/[0.02] backdrop-blur-[40px] border-r border-white/[0.04] transition-all duration-400 cubic-bezier(0.25, 1, 0.5, 1) z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]",
          isCollapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.04]">
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-bold text-lg text-white">
             
              <span className="tracking-tight">RM Fitness Gym</span>
            </div>
          )}
          {isCollapsed && (
            <Dumbbell className="h-6 w-6 text-[#0A84FF] mx-auto" />
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-full hover:bg-white/10 text-white/50 absolute -right-3 top-5 bg-[#000000] border border-white/10 shadow-lg backdrop-blur-md transition-transform hover:scale-105"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center h-12 relative transition-all duration-300 rounded-xl",
                  isActive 
                    ? "text-white bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                    : "text-[var(--color-text-secondary)] hover:text-white hover:bg-white/[0.04]",
                  isCollapsed ? "justify-center px-0" : "px-3 gap-3"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r-full bg-[#0A84FF] shadow-[0_0_8px_#0A84FF]" />
                )}
                <item.icon size={20} className={cn(isActive && "text-[#0A84FF]")} />
                {!isCollapsed && <span className="text-sm font-medium tracking-wide">{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-white/[0.05] border border-white/[0.05] backdrop-blur-[30px] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-around z-50 overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full relative text-white/50 transition-colors"
            >
              <item.icon size={24} className={cn(isActive && "text-[#0A84FF]", "transition-all", isActive && "-translate-y-1")} />
              {isActive && (
                <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-[#0A84FF] shadow-[0_0_8px_#0A84FF]" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
