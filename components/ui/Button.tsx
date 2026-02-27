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
          return "bg-[#3B82F6] text-white hover:opacity-80"
        case "secondary":
          return "bg-[#1E1E2E] text-white hover:opacity-80"
        case "danger":
          return "bg-[#EF4444] text-white hover:opacity-80"
        case "ghost":
          return "bg-transparent text-[#9CA3AF] hover:bg-[#1E1E2E] hover:text-white"
        default:
          return "bg-[#3B82F6] text-white hover:opacity-80"
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
