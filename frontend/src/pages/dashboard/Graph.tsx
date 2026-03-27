import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut, Maximize2, X, Loader2, AlertCircle, Share2, LayoutGrid, SlidersHorizontal } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import { getGraphNodes, getGraphEdges, getGraphNodeDetail, type GraphNode, type GraphEdge, type NodeDetail } from '@/lib/api'
import { useWorkspace } from '@/stores/workspaceStore'

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

  // Force layout — spread scales with node count
  const scaleFactor = Math.max(1, Math.sqrt(rawNodes.length / 50))
  const spread = Math.max(width, height) * scaleFactor
  return rawNodes.map((n) => ({
    ...n,
    x: cx + (Math.random() - 0.5) * spread,
    y: cy + (Math.random() - 0.5) * spread,
    vx: 0, vy: 0,
    radius: Math.max(6, Math.min(18, 6 + (n.frequency || 1) * 1.5)),
  }))
}

// ── Barnes-Hut Quadtree for O(n log n) repulsion ────────────────
interface QTNode {
  cx: number; cy: number; mass: number;
  minX: number; minY: number; maxX: number; maxY: number;
  children: (QTNode | null)[];
  nodeIdx: number; // -1 for internal nodes
}

function buildQuadtree(nodes: SimNode[]): QTNode | null {
  if (nodes.length === 0) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const n of nodes) {
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y
  }
  // Pad to square
  const size = Math.max(maxX - minX, maxY - minY, 1) * 1.01
  const midX = (minX + maxX) / 2, midY = (minY + maxY) / 2
  minX = midX - size / 2; maxX = midX + size / 2
  minY = midY - size / 2; maxY = midY + size / 2

  function insertNode(root: QTNode | null, idx: number, nx: number, ny: number,
    rMinX: number, rMinY: number, rMaxX: number, rMaxY: number, depth: number): QTNode {
    if (depth > 40) {
      return { cx: nx, cy: ny, mass: 1, minX: rMinX, minY: rMinY, maxX: rMaxX, maxY: rMaxY, children: [], nodeIdx: idx }
    }

    if (!root) {
      return { cx: nx, cy: ny, mass: 1, minX: rMinX, minY: rMinY, maxX: rMaxX, maxY: rMaxY, children: [], nodeIdx: idx }
    }

    const midXR = (rMinX + rMaxX) / 2, midYR = (rMinY + rMaxY) / 2

    if (root.nodeIdx >= 0) {
      // Leaf — split
      const oldIdx = root.nodeIdx
      const oldX = root.cx, oldY = root.cy
      root.nodeIdx = -1
      root.children = [null, null, null, null]
      root = reinsert(root, oldIdx, oldX, oldY, rMinX, rMinY, rMaxX, rMaxY, midXR, midYR, depth)
      root = reinsert(root, idx, nx, ny, rMinX, rMinY, rMaxX, rMaxY, midXR, midYR, depth)
    } else {
      if (root.children.length === 0) root.children = [null, null, null, null]
      root = reinsert(root, idx, nx, ny, rMinX, rMinY, rMaxX, rMaxY, midXR, midYR, depth)
    }

    root.cx = (root.cx * root.mass + nx) / (root.mass + 1)
    root.cy = (root.cy * root.mass + ny) / (root.mass + 1)
    root.mass += 1
    return root
  }

  function reinsert(root: QTNode, idx: number, nx: number, ny: number,
    rMinX: number, rMinY: number, rMaxX: number, rMaxY: number,
    midXR: number, midYR: number, depth: number): QTNode {
    const quadrant = (nx > midXR ? 1 : 0) + (ny > midYR ? 2 : 0)
    const qMinX = quadrant & 1 ? midXR : rMinX
    const qMaxX = quadrant & 1 ? rMaxX : midXR
    const qMinY = quadrant & 2 ? midYR : rMinY
    const qMaxY = quadrant & 2 ? rMaxY : midYR
    root.children[quadrant] = insertNode(root.children[quadrant], idx, nx, ny, qMinX, qMinY, qMaxX, qMaxY, depth + 1)
    return root
  }

  let tree: QTNode | null = null
  for (let i = 0; i < nodes.length; i++) {
    tree = insertNode(tree, i, nodes[i].x, nodes[i].y, minX, minY, maxX, maxY, 0)
  }
  return tree
}

function applyBarnesHut(tree: QTNode | null, node: SimNode, idx: number, repulsion: number, theta: number): { fx: number; fy: number } {
  if (!tree || tree.mass === 0) return { fx: 0, fy: 0 }

  const dx = tree.cx - node.x, dy = tree.cy - node.y
  const distSq = dx * dx + dy * dy
  const size = tree.maxX - tree.minX

  // If leaf and it's this node, skip
  if (tree.nodeIdx === idx) return { fx: 0, fy: 0 }

  // If leaf or far enough away, treat as single body
  if (tree.nodeIdx >= 0 || (size * size < theta * theta * distSq)) {
    const dist = Math.sqrt(distSq) || 1
    const force = -(repulsion * tree.mass) / (dist * dist)
    return { fx: (dx / dist) * force, fy: (dy / dist) * force }
  }

  // Otherwise recurse into children
  let fx = 0, fy = 0
  for (const child of tree.children) {
    if (child) {
      const f = applyBarnesHut(child, node, idx, repulsion, theta)
      fx += f.fx; fy += f.fy
    }
  }
  return { fx, fy }
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

    const count = initial.length
    // Scale forces with node count
    const idealDist = Math.max(60, Math.min(400, 6000 / Math.sqrt(count)))
    const repulsion = Math.max(200, Math.min(5000, count * 3))
    const centerGravity = Math.max(0.00005, 0.0005 / Math.sqrt(count / 50))
    const useBH = count > 200 // Use Barnes-Hut for large graphs
    const theta = 0.7 // Barnes-Hut accuracy (lower = more accurate)

    const tick = () => {
      const alpha = Math.max(0.001, 1 - tickRef.current / 400)
      tickRef.current++
      const ns = nodesRef.current

      // Center gravity — very weak for large graphs
      for (const node of ns) {
        node.vx += (width / 2 - node.x) * centerGravity * alpha
        node.vy += (height / 2 - node.y) * centerGravity * alpha
      }

      // Repulsion — Barnes-Hut for large graphs, brute force for small
      if (useBH) {
        const tree = buildQuadtree(ns)
        for (let i = 0; i < ns.length; i++) {
          const f = applyBarnesHut(tree, ns[i], i, repulsion * alpha, theta)
          ns[i].vx += f.fx
          ns[i].vy += f.fy
        }
      } else {
        const repulsionCutoff = idealDist * 5
        for (let i = 0; i < ns.length; i++) {
          for (let j = i + 1; j < ns.length; j++) {
            const a = ns[i], b = ns[j]
            let dx = b.x - a.x, dy = b.y - a.y
            const distSq = dx * dx + dy * dy
            if (distSq > repulsionCutoff * repulsionCutoff) continue
            const dist = Math.sqrt(distSq) || 1
            const force = (repulsion * alpha) / (dist * dist)
            dx *= force; dy *= force
            a.vx -= dx; a.vy -= dy
            b.vx += dx; b.vy += dy
          }
        }
      }

      // Edge attraction
      for (const { source, target } of edgeIndex) {
        const a = ns[source], b = ns[target]
        if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = (dist - idealDist) * 0.003 * alpha
        const fx = (dx / dist) * force, fy = (dy / dist) * force
        a.vx += fx; a.vy += fy
        b.vx -= fx; b.vy -= fy
      }

      // Velocity decay
      const damping = count > 500 ? 0.75 : 0.82
      for (const node of ns) {
        node.vx *= damping
        node.vy *= damping
        node.x += node.vx
        node.y += node.vy
      }

      setNodes([...ns])

      if (alpha > 0.002) {
        rafRef.current = requestAnimationFrame(tick)
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
  const [minFrequency, setMinFrequency] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height } = useContainerSize(containerRef)

  // Get workspace id from Zustand store (consistent with other pages)
  const activeWorkspaceId = useWorkspace((s) => s.activeWorkspaceId) || 'default'

  const { data: nodesData, isLoading: nodesLoading, error: nodesError } = useQuery({
    queryKey: ['graph-nodes', minFrequency, activeWorkspaceId],
    queryFn: () => getGraphNodes(activeWorkspaceId, minFrequency),
  })

  const { data: edgesData, isLoading: edgesLoading } = useQuery({
    queryKey: ['graph-edges', minFrequency, activeWorkspaceId],
    queryFn: () => getGraphEdges(activeWorkspaceId, minFrequency),
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

  // WASD keyboard panning
  useEffect(() => {
    const PAN_SPEED = 40
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key.toLowerCase()) {
        case 'w': setPan((p) => ({ ...p, y: p.y + PAN_SPEED })); break
        case 'a': setPan((p) => ({ ...p, x: p.x + PAN_SPEED })); break
        case 's': setPan((p) => ({ ...p, y: p.y - PAN_SPEED })); break
        case 'd': setPan((p) => ({ ...p, x: p.x - PAN_SPEED })); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
    <PageTransition className="h-screen flex flex-col bg-[#1a1b26]">
      {/* ── Floating controls — bottom center ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#1e2030]/90 backdrop-blur-md rounded-2xl border border-white/[0.12] px-4 py-2 shadow-2xl">
        {simNodes.length > 0 && (
          <span className="text-white/50 text-xs font-medium px-2">
            {simNodes.length} nodes · {rawEdges.length} edges
          </span>
        )}

        {/* Layout Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="h-9 px-4 rounded-xl bg-white/[0.08] border border-white/[0.08] flex items-center gap-2 hover:bg-white/[0.14] transition-colors text-white/80 text-xs font-semibold"
          >
            <LayoutGrid size={14} />
            {LAYOUTS.find((l) => l.key === layout)?.label}
          </button>
          {showLayoutMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-44 rounded-xl bg-[#1e2030] border border-white/[0.12] shadow-2xl overflow-hidden z-50">
              {LAYOUTS.map((l) => (
                <button
                  key={l.key}
                  onClick={() => {
                    setLayout(l.key)
                    setShowLayoutMenu(false)
                    autoZoomApplied.current = false
                    setPan({ x: 0, y: 0 })
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
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
          className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.14] transition-colors"
          title="Fit to view"
        >
          <Maximize2 size={14} className="text-white/70" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 4))}
          className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.14] transition-colors"
        >
          <ZoomIn size={14} className="text-white/70" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.15))}
          className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.14] transition-colors"
        >
          <ZoomOut size={14} className="text-white/70" />
        </button>

        {/* Frequency filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-3 rounded-xl border flex items-center gap-2 transition-colors text-xs font-semibold ${
              minFrequency > 1
                ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                : 'bg-white/[0.08] border-white/[0.08] text-white/80 hover:bg-white/[0.14]'
            }`}
          >
            <SlidersHorizontal size={14} />
            {minFrequency > 1 ? `≥${minFrequency}` : 'Filter'}
          </button>
          {showFilters && (
            <div className="absolute bottom-full left-0 mb-2 w-60 rounded-xl bg-[#1e2030] border border-white/[0.12] shadow-2xl p-4 z-50">
              <label className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 block">Min Frequency</label>
              <input
                type="range"
                min={1}
                max={4}
                value={minFrequency}
                onChange={(e) => {
                  setMinFrequency(Number(e.target.value))
                  autoZoomApplied.current = false
                }}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-white/50 text-xs mt-1">
                <span>1 (all)</span>
                <span className="text-cyan-400 font-semibold">{minFrequency}</span>
                <span>4</span>
              </div>
              <p className="text-white/40 text-[10px] mt-2">Hide entities below {minFrequency} occurrence(s).</p>
            </div>
          )}
        </div>
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
