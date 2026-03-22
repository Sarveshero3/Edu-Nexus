import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, RotateCw, MessageSquare, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import EngineBadge from '@/components/common/EngineBadge'
import PillButton from '@/components/common/PillButton'
import { cn } from '@/lib/utils'
import { getHistory, deleteHistory, type HistoryEntry } from '@/lib/api'

const tabs = ['All', 'BM25', 'FAISS', 'Neo4j', 'Hybrid'] as const

export default function History() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<string>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: history = [], isLoading, error } = useQuery({
    queryKey: ['history'],
    queryFn: getHistory,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const filtered = activeTab === 'All'
    ? history
    : history.filter((q: HistoryEntry) => q.engine_used === activeTab.toLowerCase())

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (error) {
    return (
      <PageTransition className="p-6 lg:p-8">
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400 text-sm">Cannot connect to backend. Is the server running?</p>
          </div>
        </GlassCard>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Query History</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-accent-cyan/20 text-accent-cyan'
                : 'text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-accent-cyan animate-spin" size={32} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <MessageSquare className="text-text-muted mx-auto mb-4" size={40} />
          <p className="text-text-muted text-lg">No query history yet. Start a conversation in Chat.</p>
        </div>
      )}

      {/* Query list */}
      <div className="flex flex-col gap-3">
        {filtered.map((q: HistoryEntry) => (
          <GlassCard key={q.id} hover={false} className="p-5">
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
            >
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-white text-sm font-medium truncate">{q.query}</p>
                <div className="flex items-center gap-3 mt-2">
                  <EngineBadge engine={q.engine_used} />
                  <span className="text-text-muted text-xs">{timeAgo(q.timestamp)}</span>
                  <span className="text-text-muted text-xs">· {q.sources_count} sources</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(q.id) }}
                  className="text-text-muted hover:text-red-400 p-1.5 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
                <ChevronDown
                  size={16}
                  className={cn('text-text-muted transition-transform', expandedId === q.id && 'rotate-180')}
                />
              </div>
            </div>

            <AnimatePresence>
              {expandedId === q.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                    <p className="text-text-muted text-sm leading-relaxed whitespace-pre-line">{q.answer}</p>
                    <button
                      onClick={() => navigate('/dashboard/chat')}
                      className="inline-flex items-center gap-2 text-accent-cyan text-sm mt-3 hover:underline"
                    >
                      <MessageSquare size={14} /> Open in Chat →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        ))}
      </div>
    </PageTransition>
  )
}
