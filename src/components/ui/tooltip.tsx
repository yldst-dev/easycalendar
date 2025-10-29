"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TooltipProvider = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative inline-block", className)} {...props} />
))
TooltipProvider.displayName = "TooltipProvider"

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("cursor-pointer", className)} {...props} />
))
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = "top", align = "center", sideOffset = 4, children, ...props }, ref) => {

    const sideClasses = {
      top: "bottom-full mb-1",
      bottom: "top-full mt-1",
      left: "right-full mr-1",
      right: "left-full ml-1"
    }

    const alignClasses = {
      start: side === "top" || side === "bottom" ? "left-0" : "top-0",
      center: side === "top" || side === "bottom" ? "left-1/2 -translate-x-1/2" : "top-1/2 -translate-y-1/2",
      end: side === "top" || side === "bottom" ? "right-0" : "bottom-0"
    }

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg pointer-events-none whitespace-nowrap transition-opacity duration-200 opacity-100",
          sideClasses[side],
          alignClasses[align],
          className
        )}
        style={{ marginTop: side === "bottom" ? sideOffset : undefined, marginBottom: side === "top" ? sideOffset : undefined }}
        {...props}
      >
        {children}
        {/* Arrow */}
        <div
          className={cn(
            "absolute w-2 h-2 bg-gray-900 rotate-45",
            side === "top" && "top-full left-1/2 -translate-x-1/2 -translate-y-1/2",
            side === "bottom" && "bottom-full left-1/2 -translate-x-1/2 translate-y-1/2",
            side === "left" && "left-full top-1/2 -translate-y-1/2 -translate-x-1/2",
            side === "right" && "right-full top-1/2 -translate-y-1/2 translate-x-1/2"
          )}
        />
      </div>
    )
  }
)
TooltipContent.displayName = "TooltipContent"

interface TooltipProps {
  children: [React.ReactElement, React.ReactElement]
  delayDuration?: number
}

const Tooltip = ({ children, delayDuration = 200 }: TooltipProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true)
    }, delayDuration)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(false)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const [trigger, content] = children

  return (
    <TooltipProvider
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <TooltipTrigger>
        {trigger}
      </TooltipTrigger>
      {isOpen && content}
    </TooltipProvider>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }