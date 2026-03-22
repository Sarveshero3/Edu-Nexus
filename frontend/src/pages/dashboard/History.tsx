import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MessageSquare, Trash2, AlertCircle } from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import EngineBadge from '@/components/common/EngineBadge'
import { cn } from '@/lib/utils'
import { useWorkspace, type Message } from '@/stores/workspaceStore'

/**
 * History — Workspace-Scoped
 * Shows all messages from the active workspace's chat sessions,
 * ordered by most recent. Each entry is expandable.
 */

const tabs = ['All', 'BM25', 'FAISS', 'Neo4j', 'Hybrid'] as const

interface FlatEntry {
  id: string
  query: string
  answer: string
  engine_used: string
  timestamp: string
  chatTitle: string
  chatId: string
}

export default function History() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const activeWorkspaceId = useWorkspace((s) => s.activeWorkspaceId)
  const getActiveWorkspace = useWorkspace((s) => s.getActiveWorkspace)
  const setActiveChatSession = useWorkspace((s) => s.setActiveChatSession)
  const deleteChatSession = useWorkspace((s) => s.deleteChatSession)

  const ws = getActiveWorkspace()

  // Flatten all Q/A pairs from the active workspace's chat sessions
  const entries: FlatEntry[] = []
  if (ws) {
    for (const session of ws.chatSessions) {
      const msgs = session.messages
      for (let i = 0; i < msgs.length; i++) {
        const m = msgs[i]
        if (m.role === 'user') {
          // Find next assistant message
          const next: Message | undefined = msgs[i + 1]
          entries.push({
            id: m.id,
            query: m.content,
            answer: next?.role === 'assistant' ? next.content : '(no response)',
            engine_used: next?.engine_used || 'none',
            timestamp: m.timestamp,
            chatTitle: session.title,
            chatId: session.id,
          })
        }
      }
    }
  }

  // Sort newest first
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const filtered = activeTab === 'All'
    ? entries
    : entries.filter((q) => q.engine_used === activeTab.toLowerCase())

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (!ws) {
    return (
      <PageTransition className="p-6 lg:p-8">
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-text-muted" size={20} />
            <p className="text-text-muted text-sm">Select a workspace to see history.</p>
          </div>
        </GlassCard>
      </PageTransition>
    )
  }

  return (
    <PageTransition className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Query History</h1>
        <span className="text-text-muted text-xs">· {ws.name}</span>
      </div>

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

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <MessageSquare className="text-text-muted mx-auto mb-4" size={40} />
          <p className="text-text-muted text-lg">No query history yet. Start a conversation in Chat.</p>
        </div>
      )}

      {/* Query list */}
      <div className="flex flex-col gap-3">
        {filtered.map((q) => (
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
                  <span className="text-text-muted text-xs">· {q.chatTitle}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
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
                      onClick={() => {
                        setActiveChatSession(q.chatId)
                        navigate('/dashboard/chat')
                      }}
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
