import { useEffect, useRef, useCallback } from 'react'

/* ═══════════════════════════════════════════════════════
   Canvas Neural Network — High-fidelity GPU-like viz
   60fps particle system with:
   • 6-layer architecture with labeled clusters
   • Animated "signal" particles flowing between layers
   • Depth-based sizing and opacity (parallax feel)
   • Glowing nodes with halo pulsation
   • Gradient connection beams with wave modulation
   • Background micro-particles for depth
   ═══════════════════════════════════════════════════════ */

interface Node {
  x: number
  y: number
  layer: number
  baseRadius: number
  phase: number   // animation phase offset
  depth: number   // 0–1, for parallax
}

interface Particle {
  fromNode: number
  toNode: number
  progress: number
  speed: number
  size: number
  opacity: number
}

interface FloatingDot {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  depth: number
}

const LAYER_COLORS = [
  [34, 211, 238],   // cyan    - Input
  [96, 165, 250],   // blue    - Embed
  [129, 140, 248],  // indigo  - Attention
  [167, 139, 250],  // purple  - FFN
  [192, 132, 252],  // violet  - Decode
  [232, 121, 249],  // pink    - Output
]

const LAYER_LABELS = ['Input', 'Embed', 'Attention', 'FFN', 'Decode', 'Output']
const LAYER_COUNTS = [6, 5, 8, 7, 5, 3]

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function rgb(c: number[], a: number) { return `rgba(${c[0]},${c[1]},${c[2]},${a})` }

export default function NeuralCanvas({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const nodesRef = useRef<Node[]>([])
  const particlesRef = useRef<Particle[]>([])
  const dotsRef = useRef<FloatingDot[]>([])
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const timeRef = useRef(0)
  const dprRef = useRef(1)

  const initNodes = useCallback((w: number, h: number) => {
    const nodes: Node[] = []
    const padX = w * 0.08
    const usableW = w - padX * 2
    const padY = h * 0.1
    const usableH = h - padY * 2 - 20 // leave room for labels

    LAYER_COUNTS.forEach((count, li) => {
      const x = padX + (usableW * li) / (LAYER_COUNTS.length - 1)
      const spacing = usableH / (count + 1)
      for (let i = 0; i < count; i++) {
        nodes.push({
          x, y: padY + spacing * (i + 1),
          layer: li,
          baseRadius: 3 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          depth: 0.5 + Math.random() * 0.5,
        })
      }
    })
    nodesRef.current = nodes
  }, [])

  const initParticles = useCallback(() => {
    const nodes = nodesRef.current
    const particles: Particle[] = []
    // Create flowing particles between adjacent layers
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (nodes[j].layer === nodes[i].layer + 1) {
          // Only create particle for ~30% of connections
          if (Math.random() < 0.3) {
            particles.push({
              fromNode: i, toNode: j,
              progress: Math.random(),
              speed: 0.003 + Math.random() * 0.004,
              size: 1.5 + Math.random() * 2,
              opacity: 0.4 + Math.random() * 0.5,
            })
          }
        }
      }
    }
    particlesRef.current = particles
  }, [])

  const initFloatingDots = useCallback((w: number, h: number) => {
    const dots: FloatingDot[] = []
    for (let i = 0; i < 50; i++) {
      dots.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: 0.5 + Math.random() * 1.5,
        opacity: 0.05 + Math.random() * 0.15,
        depth: Math.random(),
      })
    }
    dotsRef.current = dots
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      dprRef.current = dpr
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const w = rect.width, h = rect.height
      initNodes(w, h)
      initParticles()
      initFloatingDots(w, h)
    }

    resize()
    window.addEventListener('resize', resize)

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      }
    }
    canvas.addEventListener('mousemove', onMouse)

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width, h = rect.height
      const t = timeRef.current
      timeRef.current += 0.016 // ~60fps

      ctx.clearRect(0, 0, w, h)

      const nodes = nodesRef.current
      const particles = particlesRef.current
      const dots = dotsRef.current
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      // ─── Background floating dots ───
      dots.forEach(d => {
        // Parallax drift based on mouse
        const px = d.x + (mx - 0.5) * 8 * d.depth
        const py = d.y + (my - 0.5) * 8 * d.depth
        d.x += d.vx
        d.y += d.vy
        if (d.x < 0) d.x = w; if (d.x > w) d.x = 0
        if (d.y < 0) d.y = h; if (d.y > h) d.y = 0

        ctx.beginPath()
        ctx.arc(px, py, d.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(129, 140, 248, ${d.opacity * (0.5 + 0.5 * Math.sin(t * 0.8 + d.depth * 5))})`
        ctx.fill()
      })

      // ─── Connection lines ───
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[j].layer !== nodes[i].layer + 1) continue
          const a = nodes[i], b = nodes[j]
          const color = LAYER_COLORS[a.layer]
          const color2 = LAYER_COLORS[b.layer]

          // Wave-modulated opacity
          const wave = 0.03 + 0.04 * Math.sin(t * 0.5 + i * 0.2 + j * 0.1)

          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
          grad.addColorStop(0, rgb(color, wave * 1.2))
          grad.addColorStop(1, rgb(color2, wave * 0.8))

          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = grad
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // ─── Brighter "active" connections (subset) ───
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[j].layer !== nodes[i].layer + 1) continue
          if ((i + j) % 11 !== 0) continue
          const a = nodes[i], b = nodes[j]
          const color = LAYER_COLORS[a.layer]

          const pulse = 0.15 + 0.25 * Math.sin(t * 1.5 + i * 0.5)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = rgb(color, pulse)
          ctx.lineWidth = 1.2
          ctx.stroke()
        }
      }

      // ─── Nodes ───
      nodes.forEach((n, i) => {
        const color = LAYER_COLORS[n.layer]
        const pulse = Math.sin(t * 1.2 + n.phase)
        const radius = n.baseRadius + pulse * 0.8

        // Mouse proximity glow
        const dx = mx - n.x / w
        const dy = my - n.y / h
        const dist = Math.sqrt(dx * dx + dy * dy)
        const proximity = Math.max(0, 1 - dist * 4) // stronger when closer

        // Outer halo
        const haloR = radius * (4 + pulse * 1.5 + proximity * 3)
        const haloGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, haloR)
        haloGrad.addColorStop(0, rgb(color, 0.12 + proximity * 0.15))
        haloGrad.addColorStop(0.5, rgb(color, 0.04 + proximity * 0.06))
        haloGrad.addColorStop(1, rgb(color, 0))
        ctx.beginPath()
        ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2)
        ctx.fillStyle = haloGrad
        ctx.fill()

        // Core glow ring
        ctx.beginPath()
        ctx.arc(n.x, n.y, radius * 1.8, 0, Math.PI * 2)
        ctx.strokeStyle = rgb(color, 0.12 + pulse * 0.06)
        ctx.lineWidth = 0.6
        ctx.stroke()

        // Core dot
        const coreGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius)
        coreGrad.addColorStop(0, rgb(color, 0.95))
        coreGrad.addColorStop(0.6, rgb(color, 0.6))
        coreGrad.addColorStop(1, rgb(color, 0.15))
        ctx.beginPath()
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = coreGrad
        ctx.fill()

        // Bright center spark
        ctx.beginPath()
        ctx.arc(n.x, n.y, radius * 0.35, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.2})`
        ctx.fill()
      })

      // ─── Travelling particles ───
      particles.forEach(p => {
        p.progress += p.speed
        if (p.progress > 1) {
          p.progress = 0
          // Occasionally re-route
          if (Math.random() < 0.1) {
            const fromLayer = nodes[p.fromNode].layer
            const candidates = nodes.map((n, i) => ({ n, i }))
              .filter(({ n }) => n.layer === fromLayer)
            if (candidates.length > 0) {
              p.fromNode = candidates[Math.floor(Math.random() * candidates.length)].i
            }
            const toCandidates = nodes.map((n, i) => ({ n, i }))
              .filter(({ n }) => n.layer === fromLayer + 1)
            if (toCandidates.length > 0) {
              p.toNode = toCandidates[Math.floor(Math.random() * toCandidates.length)].i
            }
          }
        }

        const a = nodes[p.fromNode], b = nodes[p.toNode]
        if (!a || !b) return
        const px = lerp(a.x, b.x, p.progress)
        const py = lerp(a.y, b.y, p.progress)
        const color = LAYER_COLORS[a.layer]

        // Fade in/out at edges
        const fade = Math.sin(p.progress * Math.PI)

        // Trail
        const trailGrad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 4)
        trailGrad.addColorStop(0, rgb(color, fade * p.opacity * 0.3))
        trailGrad.addColorStop(1, rgb(color, 0))
        ctx.beginPath()
        ctx.arc(px, py, p.size * 4, 0, Math.PI * 2)
        ctx.fillStyle = trailGrad
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(px, py, p.size * fade, 0, Math.PI * 2)
        ctx.fillStyle = rgb(color, fade * p.opacity)
        ctx.fill()

        // White spark
        ctx.beginPath()
        ctx.arc(px, py, p.size * 0.4 * fade, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${fade * 0.7})`
        ctx.fill()
      })

      // ─── Signal flow beam (horizontal) ───
      const beamProgress = (t * 0.2) % 1
      const beamX = w * 0.06 + beamProgress * w * 0.88
      const beamW = w * 0.15
      const beamGrad = ctx.createLinearGradient(beamX - beamW / 2, 0, beamX + beamW / 2, 0)
      beamGrad.addColorStop(0, 'rgba(34, 211, 238, 0)')
      beamGrad.addColorStop(0.4, 'rgba(167, 139, 250, 0.06)')
      beamGrad.addColorStop(0.6, 'rgba(232, 121, 249, 0.06)')
      beamGrad.addColorStop(1, 'rgba(232, 121, 249, 0)')
      ctx.fillStyle = beamGrad
      ctx.fillRect(beamX - beamW / 2, h * 0.92, beamW, 2)

      // ─── Layer labels ───
      ctx.textAlign = 'center'
      ctx.font = '600 10px Inter, system-ui, sans-serif'
      LAYER_LABELS.forEach((label, i) => {
        const x = w * 0.08 + ((w - w * 0.16) * i) / (LAYER_LABELS.length - 1)
        const opacity = 0.2 + 0.12 * Math.sin(t * 0.6 + i * 0.5)
        const c = LAYER_COLORS[i]
        ctx.fillStyle = rgb(c, opacity)
        ctx.fillText(label, x, h - 8)
      })

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMouse)
    }
  }, [initNodes, initParticles, initFloatingDots])

  return (
    <canvas ref={canvasRef} className={`w-full h-full ${className}`}
      style={{ display: 'block' }} />
  )
}
