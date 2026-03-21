import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PillButtonProps {
  variant?: 'primary' | 'ghost' | 'danger'
  children: React.ReactNode
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
  fullWidth?: boolean
}

export default function PillButton({
  variant = 'primary',
  children,
  className,
  disabled,
  type = 'button',
  onClick,
  fullWidth,
}: PillButtonProps) {
  const base = cn(
    variant === 'primary' && 'btn-gradient',
    variant === 'ghost' && 'btn-ghost',
    variant === 'danger' && 'btn-danger',
    fullWidth && 'w-full',
    'inline-flex items-center justify-center gap-2 text-sm',
    className
  )

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={base}
    >
      {children}
    </motion.button>
  )
}
