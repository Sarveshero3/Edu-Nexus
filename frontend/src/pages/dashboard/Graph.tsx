import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut, X } from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'

const nodes = [
  { id: 1, label: 'Neural Networks', x: 350, y: 200, r: 35 },
  { id: 2, label: 'Backpropagation', x: 550, y: 120, r: 28 },
  { id: 3, label: 'Loss Functions', x: 220, y: 340, r: 24 },
  { id: 4, label: 'Gradient Descent', x: 500, y: 300, r: 30 },
  { id: 5, label: 'Activation Functions', x: 150, y: 180, r: 22 },
  { id: 6, label: 'Deep Learning', x: 650, y: 250, r: 32 },
  { id: 7, label: 'Transformers', x: 400, y: 400, r: 26 },
  { id: 8, label: 'Attention', x: 280, y: 100, r: 20 },
]

const edges = [
  [1, 2], [1, 3], [1, 5], [2, 4], [4, 3], [1, 6], [6, 7], [7, 8], [8, 1], [6, 2],
]

export default function Graph() {
  const [zoom, setZoom] = useState(1)
  const [selectedNode, setSelectedNode] = useState<typeof nodes[0] | null>(null)

  return (
    <PageTransition className="h-[calc(100vh)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <h1 className="text-xl font-bold text-white">Graph Explorer</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.min(z + 0.1, 2))} className="glass-card p-2 hover:scale-105">
            <ZoomIn size={16} className="text-text-muted" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))} className="glass-card p-2 hover:scale-105">
            <ZoomOut size={16} className="text-text-muted" />
          </button>
          <select className="input-field text-sm py-1.5 w-48">
            <option>All Documents</option>
            <option>machine_learning_fundamentals.pdf</option>
            <option>deep_learning_notes.docx</option>
          </select>
        </div>
      </div>

      {/* Canvas + Panel */}
      <div className="flex-1 flex relative overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <svg
            width="800"
            height="500"
            viewBox="0 0 800 500"
            style={{ transform: `scale(${zoom})` }}
            className="transition-transform"
          >
            {/* Edges */}
            {edges.map(([a, b], i) => {
              const na = nodes.find((n) => n.id === a)!
              const nb = nodes.find((n) => n.id === b)!
              return (
                <line
                  key={i}
                  x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1}
                />
              )
            })}
            {/* Nodes */}
            {nodes.map((node) => (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x} cy={node.y} r={node.r}
                  fill="rgba(91,200,245,0.15)"
                  stroke="#5BC8F5"
                  strokeWidth={1.5}
                />
                <circle cx={node.x} cy={node.y} r={node.r} fill="transparent">
                  <animate attributeName="r" values={`${node.r};${node.r + 3};${node.r}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0.1;0.3" dur="3s" repeatCount="indefinite" />
                </circle>
                <text
                  x={node.x} y={node.y + node.r + 16}
                  textAnchor="middle" fill="#8BA3B8" fontSize="11" fontFamily="Inter"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 h-full w-80"
            >
              <GlassCard hover={false} className="h-full p-6 rounded-none rounded-l-[16px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">{selectedNode.label}</h3>
                  <button onClick={() => setSelectedNode(null)} className="text-text-muted hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <div className="mb-6">
                  <h4 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Connected Nodes</h4>
                  <div className="flex flex-col gap-2">
                    {edges
                      .filter(([a, b]) => a === selectedNode.id || b === selectedNode.id)
                      .map(([a, b]) => {
                        const other = nodes.find((n) => n.id === (a === selectedNode.id ? b : a))!
                        return (
                          <button
                            key={other.id}
                            onClick={() => setSelectedNode(other)}
                            className="text-left text-sm text-accent-cyan hover:underline"
                          >
                            {other.label}
                          </button>
                        )
                      })}
                  </div>
                </div>
                <div>
                  <h4 className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Related Documents</h4>
                  <p className="text-sm text-text-muted">machine_learning_fundamentals.pdf</p>
                  <p className="text-sm text-text-muted">deep_learning_notes.docx</p>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
