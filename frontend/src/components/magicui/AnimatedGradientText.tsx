import { type ComponentPropsWithoutRef } from "react"
import { cn } from "@/lib/utils"

export interface AnimatedGradientTextProps extends ComponentPropsWithoutRef<"span"> {
  speed?: number
  colorFrom?: string
  colorVia?: string
  colorTo?: string
}

export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "#22d3ee",
  colorVia = "#a78bfa",
  colorTo = "#22d3ee",
  ...props
}: AnimatedGradientTextProps) {
  return (
    <span
      style={{
        backgroundSize: `${speed * 300}% 100%`,
        backgroundImage: `linear-gradient(to right, ${colorFrom}, ${colorVia}, ${colorTo}, ${colorVia}, ${colorFrom})`,
      }}
      className={cn(
        "animate-gradient inline bg-clip-text text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default AnimatedGradientText
