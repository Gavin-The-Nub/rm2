import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "danger" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    
    const getVariantClasses = () => {
      switch (variant) {
        case "default":
          return "bg-[#0A84FF] text-white shadow-[0_4px_14px_rgba(10,132,255,0.4)] hover:brightness-110"
        case "secondary":
          return "bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:bg-white/15"
        case "danger":
          return "bg-[#FF453A] text-white shadow-[0_4px_14px_rgba(255,69,58,0.4)] hover:brightness-110"
        case "ghost":
          return "bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
        default:
          return "bg-[#0A84FF] text-white shadow-[0_4px_14px_rgba(10,132,255,0.4)] hover:brightness-110"
      }
    }

    const getSizeClasses = () => {
      switch (size) {
        case "default":
          return "h-10 px-4 py-2"
        case "sm":
          return "h-9 rounded-md px-3"
        case "lg":
          return "h-11 rounded-md px-8"
        case "icon":
          return "h-10 w-10"
        default:
          return "h-10 px-4 py-2"
      }
    }

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          getVariantClasses(),
          getSizeClasses(),
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
