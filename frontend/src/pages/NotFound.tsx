import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PublicNavbar from '@/components/layout/PublicNavbar'
import PageTransition from '@/components/common/PageTransition'
import PillButton from '@/components/common/PillButton'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-primary flex flex-col">
        <PublicNavbar />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.h1
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="text-[120px] md:text-[160px] font-extrabold text-white leading-none tracking-tight"
          >
            404
          </motion.h1>
          <h2 className="text-2xl md:text-3xl font-bold text-white mt-4 mb-3">
            This page doesn't exist — yet.
          </h2>
          <p className="text-text-muted text-lg mb-10 max-w-md">
            Looks like you wandered into uncharted academic territory.
          </p>
          <div className="flex items-center gap-4">
            <PillButton onClick={() => navigate('/')}>Go back home →</PillButton>
            <PillButton variant="ghost" onClick={() => navigate('/docs')}>View Documentation</PillButton>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
