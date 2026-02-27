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
    <div className="flex h-screen w-full bg-[#0A0A0F] text-[#F9FAFB] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex flex-col bg-[#12121A] border-r border-white/5 transition-all duration-300 z-20",
          isCollapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
          {!isCollapsed && (
            <div className="flex items-center gap-2 font-bold text-lg text-white">
              <Dumbbell className="h-6 w-6 text-[#3B82F6]" />
              <span>Fitonist</span>
            </div>
          )}
          {isCollapsed && (
            <Dumbbell className="h-6 w-6 text-[#3B82F6] mx-auto" />
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-white/10 text-gray-400 absolute -right-3 top-5 bg-[#12121A] border border-white/10"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center h-12 relative transition-colors duration-200",
                  isActive 
                    ? "text-white bg-white/5" 
                    : "text-gray-400 hover:text-white hover:bg-white/5",
                  isCollapsed ? "justify-center px-0" : "px-4 gap-3"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#3B82F6]" />
                )}
                <item.icon size={20} className={cn(isActive && "text-[#3B82F6]")} />
                {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#12121A] border-t border-white/5 flex items-center justify-around z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full relative text-gray-400"
            >
              <item.icon size={24} className={cn(isActive && "text-[#3B82F6]")} />
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#3B82F6]" />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
