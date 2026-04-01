/**
 * SplineScene — full-screen Spline 3D background.
 * Uses the <spline-viewer> web component loaded in index.html.
 * Renders behind page content via position: fixed + z-index: 0.
 */
import { useEffect, useRef } from 'react'

interface SplineSceneProps {
  onLoad?: () => void
  brightness?: number
}

export default function SplineScene({ onLoad, brightness = 1.6 }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const viewer = containerRef.current.querySelector('spline-viewer')
    if (!viewer) return

    const handleLoad = () => onLoad?.()
    viewer.addEventListener('load', handleLoad)

    const timeout = setTimeout(() => onLoad?.(), 3000)

    return () => {
      viewer.removeEventListener('load', handleLoad)
      clearTimeout(timeout)
    }
  }, [onLoad])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        filter: `brightness(${brightness})`,
      }}
    >
      <div style={{ width: '100%', height: '100%', pointerEvents: 'auto' }}>
        {/* @ts-ignore — spline-viewer is a web component loaded externally */}
        <spline-viewer
          url="https://prod.spline.design/REOKFZryNUM53Nwy/scene.splinecode"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Attempt to hide Spline watermark via CSS — may not work on all versions */}
      <style>{`
        spline-viewer #logo,
        spline-viewer::part(logo) {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
    </div>
  )
}
