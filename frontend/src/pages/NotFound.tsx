import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'

/**
 * 404 Page — Spline mounts immediately, fades in fast.
 * Text starts centered, slides left after 1.5s.
 */
export default function NotFound() {
  const navigate = useNavigate()
  const [slideLeft, setSlideLeft] = useState(false)
  const [splineLoaded, setSplineLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Slide text left after 1.5s
  useEffect(() => {
    const t = setTimeout(() => setSlideLeft(true), 1500)
    return () => clearTimeout(t)
  }, [])

  // Listen for Spline load — show it fast
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const viewer = container.querySelector('spline-viewer')
    if (!viewer) return

    const reveal = () => setSplineLoaded(true)
    viewer.addEventListener('load', reveal)
    // Short fallback — 4s max wait
    const fallback = setTimeout(reveal, 4000)

    return () => {
      viewer.removeEventListener('load', reveal)
      clearTimeout(fallback)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#f5f5f7' }}>

      {/* Spline — mounted immediately, fast 0.6s fade when loaded */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          opacity: splineLoaded ? 1 : 0,
          transition: 'opacity 0.6s ease',
          pointerEvents: splineLoaded ? 'auto' : 'none',
        }}
      >
        {/* @ts-ignore */}
        <spline-viewer
          url="https://prod.spline.design/GH8ZlaAgDB5Z3jTI/scene.splinecode"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Text — starts centered, slides left */}
      <motion.div
        style={{ position: 'absolute', zIndex: 10, top: '50%', maxWidth: 440, pointerEvents: 'none' }}
        initial={{ left: '50%', x: '-50%', y: '-50%' }}
        animate={
          slideLeft
            ? { left: '7%', x: '0%', y: '-50%' }
            : { left: '50%', x: '-50%', y: '-50%' }
        }
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <span style={{
          display: 'block', fontSize: 12, fontWeight: 800,
          letterSpacing: '0.35em', textTransform: 'uppercase' as const,
          color: '#7c3aed', marginBottom: 16,
        }}>
          Edu Nexus
        </span>

        <h1 style={{
          fontSize: 'clamp(120px, 18vw, 200px)', fontWeight: 900,
          lineHeight: 0.85, letterSpacing: '-0.04em',
          color: '#0f0f23', margin: 0,
        }}>
          404
        </h1>

        <h2 style={{
          fontSize: 'clamp(20px, 2.5vw, 30px)', fontWeight: 700,
          color: '#1e1b4b', marginTop: 20, marginBottom: 0,
        }}>
          Page not found
        </h2>

        <p style={{
          fontSize: 15, color: '#64748b',
          marginTop: 12, lineHeight: 1.6, maxWidth: 320,
        }}>
          Looks like you wandered into uncharted territory.
        </p>

        <button
          onClick={() => navigate('/')}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(124,58,237,0.35)' }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.25)' }}
          style={{
            pointerEvents: 'auto', marginTop: 32,
            padding: '14px 32px', borderRadius: 999, border: 'none',
            fontSize: 14, fontWeight: 600, color: '#fff',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(124,58,237,0.25)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
        >
          ← Go back home
        </button>
      </motion.div>

      {/* Bottom accent */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 3, zIndex: 10,
        background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc, transparent)',
      }} />
    </div>
  )
}
