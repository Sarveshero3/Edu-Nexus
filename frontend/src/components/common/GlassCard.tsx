import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  role?: string
}

export default function GlassCard({ children, className, hover = true, onClick, onDragOver, onDrop, role }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      // @ts-ignore — framer-motion types conflict with native HTML drag events
      onDragOver={onDragOver}
      onDrop={onDrop as any}
      role={role}
      className={cn(
        'bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.10)]',
        'backdrop-blur-[12px] rounded-[16px] transition-shadow duration-200',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
