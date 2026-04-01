/**
 * PublicLayout — shared wrapper for all public routes.
 * Renders ONE Spline 3D background that persists across Home/SignIn/SignUp/ForgotPassword.
 * Child routes swap via <Outlet> — zero Spline reload between pages.
 */
import { useState, useCallback, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import SplineScene from '@/components/common/SplineScene'
import { useTheme, applyTheme } from '@/stores/themeStore'

export default function PublicLayout() {
  const [splineReady, setSplineReady] = useState(false)
  const handleSplineLoad = useCallback(() => setSplineReady(true), [])
  const accentColor = useTheme((s) => s.accentColor)

  useEffect(() => {
    // Force dark theme for all public pages
    applyTheme('dark', accentColor)
  }, [accentColor])

  return (
    <div className="relative min-h-screen" style={{ background: '#06080f' }} data-theme="dark">
      {/* Single persistent Spline background — brighter */}
      <SplineScene onLoad={handleSplineLoad} brightness={1.6} />

      {/* Very light overlay — Spline shines through */}
      <div className="fixed inset-0 bg-[#06080f]/25 z-[1] pointer-events-none" />

      {/* Loading screen — shows until Spline is ready */}
      <AnimatePresence>
        {!splineReady && (
          <motion.div
            key="spline-loader"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[100] bg-[#06080f] flex flex-col items-center justify-center gap-4"
          >
            <Loader2 className="text-cyan-400 animate-spin" size={36} />
            <p className="text-text-muted text-sm font-medium tracking-wider">Loading Edu Nexus</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content — above Spline + overlay */}
      <div className="relative z-[2]">
        <Outlet />
      </div>
    </div>
  )
}
