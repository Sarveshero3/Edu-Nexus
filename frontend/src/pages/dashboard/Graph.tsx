import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut, X, Loader2, AlertCircle, Share2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import { getGraphNodes, getGraphEdges, getGraphNodeDetail, type GraphNode, type GraphEdge, type NodeDetail } from '@/lib/api'

/**
 * Obsidian-style dynamic force-directed graph using Canvas API.
 * Nodes are force-simulated for natural, living layout that scales
 * with many nodes instead of collapsing into a static mess.
 */

interface SimNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

function useForceSimulation(rawNodes: GraphNode[], rawEdges: GraphEdge[], width: number, height: number) {
  const [nodes, setNodes] = useState<SimNode[]>([])
  const nodesRef = useRef<SimNode[]>([])
  const rafRef = useRef<number>(0)
  const tickRef = useRef(0)

  useEffect(() => {
    if (rawNodes.length === 0) return

    // Initialize nodes with random positions
    const simNodes: SimNode[] = rawNodes.map((n) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * width * 0.6,
      y: height / 2 + (Math.random() - 0.5) * height * 0.6,
      vx: 0,
      vy: 0,
      radius: Math.max(12, Math.min(30, 12 + n.name.length * 0.6)),
    }))
    nodesRef.current = simNodes
    tickRef.current = 0

    const edgeIndex = rawEdges.map((e) => ({
      source: simNodes.findIndex((n) => n.id === e.source),
      target: simNodes.findIndex((n) => n.id === e.target),
    })).filter((e) => e.source >= 0 && e.target >= 0)

    const tick = () => {
      const alpha = Math.max(0.001, 1 - tickRef.current / 300)
      tickRef.current++

      for (const node of nodesRef.current) {
        // Center gravity
        node.vx += (width / 2 - node.x) * 0.002 * alpha
        node.vy += (height / 2 - node.y) * 0.002 * alpha
      }

      // Repulsion between all nodes
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const a = nodesRef.current[i], b = nodesRef.current[j]
          let dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (150 * alpha) / (dist * dist)
          dx *= force; dy *= force
          a.vx -= dx; a.vy -= dy
          b.vx += dx; b.vy += dy
        }
      }

      // Attraction along edges
      for (const { source, target } of edgeIndex) {
        const a = nodesRef.current[source], b = nodesRef.current[target]
        if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - 100) * 0.005 * alpha
        const fx = (dx / dist) * force, fy = (dy / dist) * force
        a.vx += fx; a.vy += fy
        b.vx -= fx; b.vy -= fy
      }

      // Apply velocity with damping
      for (const node of nodesRef.current) {
        node.vx *= 0.8
        node.vy *= 0.8
        node.x += node.vx
        node.y += node.vy
        // Keep in bounds
        node.x = Math.max(node.radius, Math.min(width - node.radius, node.x))
        node.y = Math.max(node.radius, Math.min(height - node.radius, node.y))
      }

      setNodes([...nodesRef.current])
      if (alpha > 0.002) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [rawNodes, rawEdges, width, height])

  return nodes
}

export default function Graph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [nodeDetail, setNodeDetail] = useState<NodeDetail | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  const WIDTH = 900
  const HEIGHT = 600

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
  const simNodes = useForceSimulation(rawNodes, rawEdges, WIDTH, HEIGHT)

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

  const isLoading = nodesLoading || edgesLoading

  // Build edge lookup for rendering
  const edgeLines = rawEdges.map((e) => {
    const sn = simNodes.find((n) => n.id === e.source)
    const tn = simNodes.find((n) => n.id === e.target)
    return sn && tn ? { ...e, sx: sn.x, sy: sn.y, tx: tn.x, ty: tn.y } : null
  }).filter(Boolean)

  // Group colors (Obsidian-style)
  const groupColors: Record<string, string> = {}
  const palette = ['#5BC8F5', '#A78BFA', '#FF6B6B', '#2DD4BF', '#F59E0B', '#EC4899', '#10B981', '#6366F1']
  rawNodes.forEach((n, i) => {
    if (!groupColors[n.group]) groupColors[n.group] = palette[Object.keys(groupColors).length % palette.length]
  })

  return (
    <PageTransition className="h-[calc(100vh)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Graph Explorer</h1>
          {simNodes.length > 0 && (
            <span className="text-text-muted text-xs">{simNodes.length} nodes · {rawEdges.length} edges</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.min(z + 0.2, 3))} className="glass-card p-2 hover:scale-105">
            <ZoomIn size={16} className="text-text-muted" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))} className="glass-card p-2 hover:scale-105">
            <ZoomOut size={16} className="text-text-muted" />
          </button>
        </div>
      </div>

      {/* Canvas + Panel */}
      <div className="flex-1 flex relative overflow-hidden">
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="text-accent-cyan animate-spin" size={32} />
          </div>
        )}

        {nodesError && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="text-text-muted mx-auto mb-4" size={40} />
              <p className="text-text-muted text-lg">Knowledge graph unavailable.</p>
              <p className="text-text-muted text-sm mt-1">Upload documents to build it.</p>
            </div>
          </div>
        )}

        {!isLoading && !nodesError && simNodes.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Share2 className="text-text-muted mx-auto mb-4" size={40} />
              <p className="text-text-muted text-lg">No graph data yet.</p>
              <p className="text-text-muted text-sm mt-1">Upload documents to build the knowledge graph.</p>
            </div>
          </div>
        )}

        {!isLoading && simNodes.length > 0 && (
          <div className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
              className="transition-transform duration-100"
            >
              {/* Background glow */}
              <defs>
                {Object.entries(groupColors).map(([group, color]) => (
                  <radialGradient key={group} id={`glow-${group}`}>
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </radialGradient>
                ))}
              </defs>

              {/* Edges */}
              {edgeLines.map((e: any, i: number) => (
                <line
                  key={i}
                  x1={e.sx} y1={e.sy} x2={e.tx} y2={e.ty}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                />
              ))}

              {/* Nodes */}
              {simNodes.map((node) => {
                const color = groupColors[node.group] || '#5BC8F5'
                const isSelected = selectedNode === node.name
                return (
                  <g key={node.id} onClick={() => handleNodeClick(node)} className="cursor-pointer">
                    {/* Outer glow */}
                    <circle cx={node.x} cy={node.y} r={node.radius * 2} fill={`url(#glow-${node.group})`} opacity={0.4} />
                    {/* Node circle */}
                    <circle
                      cx={node.x} cy={node.y} r={node.radius}
                      fill={isSelected ? color : `${color}22`}
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      opacity={isSelected ? 1 : 0.85}
                    />
                    {/* Pulse animation */}
                    <circle cx={node.x} cy={node.y} r={node.radius} fill="transparent" stroke={color} strokeWidth={0.5} opacity={0.4}>
                      <animate attributeName="r" values={`${node.radius};${node.radius + 4};${node.radius}`} dur="4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.1;0.4" dur="4s" repeatCount="indefinite" />
                    </circle>
                    {/* Label */}
                    <text
                      x={node.x} y={node.y + node.radius + 14}
                      textAnchor="middle" fill="#8BA3B8" fontSize="10" fontFamily="Inter"
                      style={{ pointerEvents: 'none' }}
                    >
                      {node.name.length > 20 ? node.name.slice(0, 18) + '…' : node.name}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        )}

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedNode && nodeDetail && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 h-full w-80"
            >
              <GlassCard hover={false} className="h-full p-6 rounded-none rounded-l-[16px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white truncate mr-2">{nodeDetail.name}</h3>
                  <button onClick={() => { setSelectedNode(null); setNodeDetail(null) }} className="text-text-muted hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                {nodeDetail.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {nodeDetail.labels.map((label) => (
                      <span key={label} className="badge-cyan text-[10px]">{label}</span>
                    ))}
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
                    Connections ({nodeDetail.connections.length})
                  </h4>
                  <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                    {nodeDetail.connections.map((conn, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const node = simNodes.find((n) => n.name === conn.connected)
                          if (node) handleNodeClick(node)
                        }}
                        className="text-left text-sm group"
                      >
                        <span className="text-text-muted text-[11px]">{conn.relation}</span>
                        <span className="text-accent-cyan ml-1.5 group-hover:underline">{conn.connected}</span>
                      </button>
                    ))}
                    {nodeDetail.connections.length === 0 && (
                      <p className="text-text-muted text-sm">No connections found.</p>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
