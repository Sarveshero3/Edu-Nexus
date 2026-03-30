"use client"

import { useRef, useState, useCallback, type MouseEvent, type ComponentPropsWithoutRef } from "react"
import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import { cn } from "@/lib/utils"

interface MagicCardProps extends ComponentPropsWithoutRef<"div"> {
  gradientSize?: number
  gradientColor?: string
  gradientOpacity?: number
  gradientFrom?: string
  gradientTo?: string
}

export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "#262626",
  gradientOpacity = 0.8,
  ...props
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(-gradientSize)
  const mouseY = useMotionValue(-gradientSize)
  const [, setVisible] = useState(false)

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (cardRef.current) {
        const { left, top } = cardRef.current.getBoundingClientRect()
        mouseX.set(e.clientX - left)
        mouseY.set(e.clientY - top)
      }
    },
    [mouseX, mouseY]
  )

  const handleMouseEnter = useCallback(() => setVisible(true), [])
  const handleMouseLeave = useCallback(() => {
    setVisible(false)
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [mouseX, mouseY, gradientSize])

  const background = useMotionTemplate`
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px,
      ${gradientColor}, transparent 80%)
  `

  return (
    <div
      ref={cardRef}
      className={cn("group relative rounded-2xl overflow-hidden", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <div className="relative z-10">{children}</div>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background,
          opacity: gradientOpacity,
        }}
      />
    </div>
  )
}

export default MagicCard
