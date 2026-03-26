import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, X, Loader2, AlertCircle, Share2, LayoutGrid } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import { getGraphNodes, getGraphEdges, getGraphNodeDetail, type GraphNode, type GraphEdge, type NodeDetail } from '@/lib/api'

/**
 * Graph explorer with improved labeling and meaningful connections.
 * Layouts: Force (default), Radial, Hierarchical, Grid
 */

interface SimNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

type LayoutType = 'force' | 'radial' | 'hierarchical' | 'grid'

const LAYOUTS: { key: LayoutType; label: string }[] = [
  { key: 'force', label: 'Force' },
  { key: 'radial', label: 'Radial' },
  { key: 'hierarchical', label: 'Hierarchy' },
  { key: 'grid', label: 'Grid' },
]

const AURA_PALETTE = [
  '#5BC8F5', '#A78BFA', '#FF6B6B', '#2DD4BF', '#F59E0B',
  '#EC4899', '#10B981', '#6366F1', '#F472B6', '#34D399',
  '#FBBF24', '#818CF8', '#FB923C', '#A3E635', '#38BDF8',
  '#C084FC', '#FB7185', '#4ADE80', '#FDE68A', '#67E8F9',
]

// ── Layout algorithms ────────────────────────────────────────────
function applyLayout(
  layout: LayoutType,
  rawNodes: GraphNode[],
  rawEdges: GraphEdge[],
  width: number,
  height: number
): SimNode[] {
  const cx = width / 2
  const cy = height / 2

  if (layout === 'grid') {
    const cols = Math.ceil(Math.sqrt(rawNodes.length))
    const spacing = Math.min(width / (cols + 1), height / (Math.ceil(rawNodes.length / cols) + 1), 90)
    const startX = cx - (cols * spacing) / 2
    const startY = cy - (Math.ceil(rawNodes.length / cols) * spacing) / 2
    return rawNodes.map((n, i) => ({
      ...n,
      x: startX + (i % cols) * spacing + spacing / 2,
      y: startY + Math.floor(i / cols) * spacing + spacing / 2,
      vx: 0, vy: 0,
      radius: Math.max(6, Math.min(16, 6 + n.name.length * 0.4)),
    }))
  }

  if (layout === 'radial') {
    // Group nodes by group, place groups in concentric rings
    const groups: Record<string, GraphNode[]> = {}
    rawNodes.forEach((n) => {
      if (!groups[n.group]) groups[n.group] = []
      groups[n.group].push(n)
    })
    const groupKeys = Object.keys(groups)
    const result: SimNode[] = []
    const ringGap = Math.min(width, height) * 0.12

    groupKeys.forEach((g, gi) => {
      const ring = ringGap * (gi + 1)
      const nodes = groups[g]
      nodes.forEach((n, ni) => {
        const angle = (2 * Math.PI * ni) / nodes.length - Math.PI / 2
        result.push({
          ...n,
          x: cx + ring * Math.cos(angle),
          y: cy + ring * Math.sin(angle),
          vx: 0, vy: 0,
          radius: Math.max(6, Math.min(16, 6 + n.name.length * 0.4)),
        })
      })
    })
    return result
  }

  if (layout === 'hierarchical') {
    // Build adjacency and find roots (nodes with no incoming edges)
    const incoming = new Set<string>()
    rawEdges.forEach((e) => incoming.add(e.target))
    const roots = rawNodes.filter((n) => !incoming.has(n.id))
    if (roots.length === 0 && rawNodes.length > 0) roots.push(rawNodes[0])

    // BFS to assign levels
    const levels: Record<string, number> = {}
    const queue = [...roots.map((r) => r.id)]
    roots.forEach((r) => (levels[r.id] = 0))
    const adj: Record<string, string[]> = {}
    rawEdges.forEach((e) => { if (!adj[e.source]) adj[e.source] = []; adj[e.source].push(e.target) })

    while (queue.length > 0) {
      const curr = queue.shift()!
      const children = adj[curr] || []
      children.forEach((c) => {
        if (levels[c] === undefined) {
          levels[c] = (levels[curr] || 0) + 1
          queue.push(c)
        }
      })
    }

    // Assign unvisited nodes
    rawNodes.forEach((n) => { if (levels[n.id] === undefined) levels[n.id] = 0 })

    // Group by level
    const byLevel: Record<number, GraphNode[]> = {}
    rawNodes.forEach((n) => {
      const lvl = levels[n.id]
      if (!byLevel[lvl]) byLevel[lvl] = []
      byLevel[lvl].push(n)
    })

    const maxLevel = Math.max(...Object.keys(byLevel).map(Number))
    const levelHeight = height / (maxLevel + 2)

    return rawNodes.map((n) => {
      const lvl = levels[n.id]
      const siblings = byLevel[lvl]
      const idx = siblings.indexOf(n)
      const levelWidth = width / (siblings.length + 1)
      return {
        ...n,
        x: levelWidth * (idx + 1),
        y: levelHeight * (lvl + 1),
        vx: 0, vy: 0,
        radius: Math.max(6, Math.min(16, 6 + n.name.length * 0.4)),
      }
    })
  }

  // Force layout — random initial positions, simulation will settle them
  const spread = Math.max(width, height) * 0.8
  return rawNodes.map((n) => ({
    ...n,
    x: cx + (Math.random() - 0.5) * spread,
    y: cy + (Math.random() - 0.5) * spread,
    vx: 0, vy: 0,
    radius: Math.max(6, Math.min(18, 6 + n.name.length * 0.4)),
  }))
}

// ── Hooks ────────────────────────────────────────────────────────
function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 900, height: 600 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

function useForceSimulation(
  initial: SimNode[],
  rawEdges: GraphEdge[],
  width: number,
  height: number,
  enabled: boolean
) {
  const [nodes, setNodes] = useState<SimNode[]>([])
  const nodesRef = useRef<SimNode[]>([])
  const rafRef = useRef<number>(0)
  const tickRef = useRef(0)

  useEffect(() => {
    if (initial.length === 0) { setNodes([]); return }
    nodesRef.current = initial.map((n) => ({ ...n }))
    tickRef.current = 0
    setNodes([...nodesRef.current])

    if (!enabled) return // Static layouts don't need simulation

    const edgeIndex = rawEdges.map((e) => ({
      source: nodesRef.current.findIndex((n) => n.id === e.source),
      target: nodesRef.current.findIndex((n) => n.id === e.target),
    })).filter((e) => e.source >= 0 && e.target >= 0)

    const idealDist = Math.max(60, Math.min(200, 3000 / Math.sqrt(initial.length)))
    const repulsionCutoff = idealDist * 3
    let frameCount = 0

    const tick = () => {
      const alpha = Math.max(0.001, 1 - tickRef.current / 300)
      tickRef.current++
      const ns = nodesRef.current

      for (const node of ns) {
        node.vx += (width / 2 - node.x) * 0.0008 * alpha
        node.vy += (height / 2 - node.y) * 0.0008 * alpha
      }

      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const a = ns[i], b = ns[j]
          let dx = b.x - a.x, dy = b.y - a.y
          const distSq = dx * dx + dy * dy
          if (distSq > repulsionCutoff * repulsionCutoff) continue
          const dist = Math.sqrt(distSq) || 1
          const force = (120 * alpha) / (dist * dist)
          dx *= force; dy *= force
          a.vx -= dx; a.vy -= dy
          b.vx += dx; b.vy += dy
        }
      }

      for (const { source, target } of edgeIndex) {
        const a = ns[source], b = ns[target]
        if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - idealDist) * 0.004 * alpha
        const fx = (dx / dist) * force, fy = (dy / dist) * force
        a.vx += fx; a.vy += fy
        b.vx -= fx; b.vy -= fy
      }

      for (const node of ns) {
        node.vx *= 0.82
        node.vy *= 0.82
        node.x += node.vx
        node.y += node.vy
        const margin = 30
        node.x = Math.max(margin, Math.min(width - margin, node.x))
        node.y = Math.max(margin, Math.min(height - margin, node.y))
      }

      frameCount++
      if (frameCount % 3 === 0) setNodes([...ns])

      if (alpha > 0.002) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setNodes([...ns])
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [initial, rawEdges, width, height, enabled])

  return nodes
}

// ── Component ────────────────────────────────────────────────────
export default function Graph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [nodeDetail, setNodeDetail] = useState<NodeDetail | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [layout, setLayout] = useState<LayoutType>('force')
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height } = useContainerSize(containerRef)

  const { data: nodesData, isLoading: nodesLoading, error: nodesError } = useQuery({
    queryKey: ['graph-nodes'],
    queryFn: getGraphNodes,
  })

  const { data: edgesData, isLoading: edgesLoading } = useQuery({
    queryKey: ['graph-edges'],
    queryFn: getGraphEdges,
  })

  const rawNodes = nodesData?.nodes || []
  const rawEdges = edgesData?.edges || []

  // Compute initial positions based on selected layout
  const initialNodes = useMemo(
    () => applyLayout(layout, rawNodes, rawEdges, width, height),
    [layout, rawNodes, rawEdges, width, height]
  )

  // Only run force simulation for 'force' layout
  const simNodes = useForceSimulation(initialNodes, rawEdges, width, height, layout === 'force')

  // Auto-zoom
  const autoZoomApplied = useRef(false)
  useEffect(() => {
    if (simNodes.length > 0 && !autoZoomApplied.current) {
      autoZoomApplied.current = true
      const count = simNodes.length
      let z = 1.0
      if (count > 200) z = 0.4
      else if (count > 100) z = 0.55
      else if (count > 50) z = 0.7
      else if (count > 20) z = 0.85
      else if (count <= 10) z = 1.2
      setZoom(z)
    }
  }, [simNodes.length])

  const handleNodeClick = useCallback(async (node: SimNode) => {
    setSelectedNode(node.name)
    try {
      const detail = await getGraphNodeDetail(node.name)
      setNodeDetail(detail)
    } catch {
      setNodeDetail({ name: node.name, labels: [node.group], connections: [] })
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'circle' || (e.target as HTMLElement).tagName === 'text') return
    setDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setDragging(false)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.08 : 0.08
    setZoom((z) => Math.max(0.15, Math.min(4, z + delta)))
  }, [])

  const handleFitView = () => {
    const count = simNodes.length
    let z = 1.0
    if (count > 200) z = 0.4
    else if (count > 100) z = 0.55
    else if (count > 50) z = 0.7
    else if (count > 20) z = 0.85
    else if (count <= 10) z = 1.2
    setZoom(z)
    setPan({ x: 0, y: 0 })
  }

  const isLoading = nodesLoading || edgesLoading

  const edgeLines = useMemo(() => rawEdges.map((e) => {
    const sn = simNodes.find((n) => n.id === e.source)
    const tn = simNodes.find((n) => n.id === e.target)
    return sn && tn ? { ...e, sx: sn.x, sy: sn.y, tx: tn.x, ty: tn.y } : null
  }).filter(Boolean), [rawEdges, simNodes])

  const groupColors = useMemo(() => {
    const colors: Record<string, string> = {}
    rawNodes.forEach((n) => {
      if (!colors[n.group]) colors[n.group] = AURA_PALETTE[Object.keys(colors).length % AURA_PALETTE.length]
    })
    return colors
  }, [rawNodes])

  const showLabel = simNodes.length <= 150

  return (
    <PageTransition className="h-screen flex flex-col" style={{ background: '#1a1b26' }}>
      {/* ── Floating controls — top-right ── */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
        {simNodes.length > 0 && (
          <span className="text-white/50 text-sm font-medium px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.08]">
            {simNodes.length} nodes · {rawEdges.length} edges
          </span>
        )}

        {/* Layout Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="h-11 px-5 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center gap-3 hover:bg-white/[0.14] transition-colors text-white/80 text-sm font-semibold shadow-lg"
          >
            <LayoutGrid size={18} />
            {LAYOUTS.find((l) => l.key === layout)?.label}
          </button>
          {showLayoutMenu && (
            <div className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-[#1e2030] border border-white/[0.12] shadow-2xl overflow-hidden z-50">
              {LAYOUTS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => {
                    setLayout(l.key)
                    setShowLayoutMenu(false)
                    autoZoomApplied.current = false
                    setPan({ x: 0, y: 0 })
                  }}
                  className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors ${
                    layout === l.key
                      ? 'bg-cyan-500/15 text-cyan-400'
                      : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleFitView}
          className="w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center hover:bg-white/[0.14] transition-colors shadow-lg"
          title="Fit to view"
        >
          <Maximize2 size={18} className="text-white/70" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 4))}
          className="w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center hover:bg-white/[0.14] transition-colors shadow-lg"
        >
          <ZoomIn size={18} className="text-white/70" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.15))}
          className="w-11 h-11 rounded-xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center hover:bg-white/[0.14] transition-colors shadow-lg"
        >
          <ZoomOut size={18} className="text-white/70" />
        </button>
      </div>

      {/* ── Full-screen canvas ── */}
      <div
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="text-cyan-400 animate-spin" size={36} />
          </div>
        )}

        {nodesError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <AlertCircle className="text-white/30 mx-auto mb-4" size={44} />
              <p className="text-white/50 text-lg font-medium">Knowledge graph unavailable.</p>
              <p className="text-white/30 text-sm mt-1">Upload documents to build it.</p>
            </div>
          </div>
        )}

        {!isLoading && !nodesError && simNodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-center">
              <Share2 className="text-white/30 mx-auto mb-4" size={44} />
              <p className="text-white/50 text-lg font-medium">No graph data yet.</p>
              <p className="text-white/30 text-sm mt-1">Upload documents to build the knowledge graph.</p>
            </div>
          </div>
        )}

        {!isLoading && simNodes.length > 0 && (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
            }}
          >
            <defs>
              {Object.entries(groupColors).map(([group, color]) => (
                <filter key={group} id={`glow-${group}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feFlood floodColor={color} floodOpacity="0.4" result="color" />
                  <feComposite in="color" in2="blur" operator="in" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
            </defs>

            {/* Edges */}
            {edgeLines.map((e: any, i: number) => (
              <line
                key={i}
                x1={e.sx} y1={e.sy} x2={e.tx} y2={e.ty}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1 + (e.weight || 0) * 1.5}
                strokeOpacity={0.3 + (e.weight || 0) * 0.5}
              />
            ))}

            {/* Nodes */}
            {simNodes.map((node) => {
              const color = groupColors[node.group] || '#5BC8F5'
              const isSelected = selectedNode === node.name
              return (
                <g key={node.id} onClick={() => handleNodeClick(node)} className="cursor-pointer">
                  <circle cx={node.x} cy={node.y} r={node.radius * 2.5} fill={color} opacity={isSelected ? 0.18 : 0.08} />
                  <circle
                    cx={node.x} cy={node.y} r={node.radius}
                    fill={color} opacity={isSelected ? 1 : 0.7}
                    stroke={isSelected ? '#ffffff' : 'transparent'} strokeWidth={isSelected ? 2 : 0}
                    filter={`url(#glow-${node.group})`}
                  />
                  <circle
                    cx={node.x - node.radius * 0.25} cy={node.y - node.radius * 0.25}
                    r={node.radius * 0.25} fill="rgba(255,255,255,0.3)"
                  />
                  {showLabel && (
                    <text
                      x={node.x} y={node.y + node.radius + 14}
                      textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10"
                      fontFamily="'Inter', sans-serif" fontWeight="600"
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.name.length > 20 ? node.name.slice(0, 18) + '…' : node.name}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {/* ── Detail Panel ── */}
      <AnimatePresence>
        {selectedNode && nodeDetail && (
          <motion.div
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 h-full w-[340px] z-20"
          >
            <GlassCard hover={false} className="h-full p-6 rounded-none rounded-l-2xl border-l border-white/[0.08]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white truncate mr-2">{nodeDetail.name}</h3>
                <button onClick={() => { setSelectedNode(null); setNodeDetail(null) }} className="text-white/40 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {nodeDetail.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {nodeDetail.labels.map((label) => (
                    <span key={label} className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                      {label}
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <h4 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">
                  Connections ({nodeDetail.connections.length})
                </h4>
                <div className="flex flex-col gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  {nodeDetail.connections.map((conn, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const node = simNodes.find((n) => n.name === conn.connected)
                        if (node) handleNodeClick(node)
                      }}
                      className="text-left text-sm group p-3 rounded-xl hover:bg-white/[0.06] transition-colors border border-transparent hover:border-white/[0.08]"
                    >
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-accent-cyan/10 text-accent-cyan/80 border border-accent-cyan/20">
                        {conn.relation}
                      </span>
                      <span className="text-white group-hover:text-cyan-300 font-medium block mt-1.5 text-sm">{conn.connected}</span>
                    </button>
                  ))}
                  {nodeDetail.connections.length === 0 && (
                    <p className="text-white/30 text-sm">No connections found.</p>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
