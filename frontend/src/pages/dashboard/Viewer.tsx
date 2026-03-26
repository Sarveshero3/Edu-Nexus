import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Send, Sparkles, FileText, Loader2, AlertCircle, MessageSquareText, GripVertical } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import MarkdownMessage from '@/components/common/MarkdownMessage'
import { getSourceContent, getSourceFileUrl, sendChat, type ChunkData, type ChatResponse } from '@/lib/api'

export default function Viewer() {
  const { id } = useParams()
  const docName = decodeURIComponent(id || '')
  const ext = docName.split('.').pop()?.toLowerCase() || ''
  const isPdf = ext === 'pdf'

  // Get workspace id from persisted store
  const activeWorkspaceId = (() => {
    try {
      const stored = localStorage.getItem('edu-nexus-workspaces')
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed?.state?.activeWorkspaceId || 'default'
      }
    } catch {}
    return 'default'
  })()

  const [chatInput, setChatInput] = useState('')
  const [page, setPage] = useState(0)
  const [selectedText, setSelectedText] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: `I can answer questions about **${docName}**. ${isPdf ? 'Select text from the PDF to ask about it, or type a question below.' : 'Ask a question below.'}` },
  ])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ── Resizable panel ──────────────────────────────────────────────────
  const [chatWidthPct, setChatWidthPct] = useState(35) // percentage of container
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((rect.right - e.clientX) / rect.width) * 100
      setChatWidthPct(Math.max(20, Math.min(60, pct)))
    }
    const handleUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [])
  // ────────────────────────────────────────────────────────────────────

  const CHUNKS_PER_PAGE = 5

  // For non-PDFs: fetch chunks
  const { data, isLoading, error } = useQuery<{ chunks: ChunkData[], name: string, total: number }>({
    queryKey: ['source-content', docName, activeWorkspaceId],
    queryFn: () => getSourceContent(docName, activeWorkspaceId) as any,
    enabled: !!docName && !isPdf,
  })

  const chatMutation = useMutation({
    mutationFn: (query: string) => sendChat(query, activeWorkspaceId, [docName]),
    onSuccess: (data: ChatResponse) => {
      setChatMessages((prev) => [...prev, { role: 'ai', text: data.answer }])
    },
    onError: (err: Error) => {
      setChatMessages((prev) => [...prev, { role: 'ai', text: `Error: ${err.message}` }])
    },
  })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Listen for text selection (for non-PDF content)
  useEffect(() => {
    const handleSelection = () => {
      const sel = window.getSelection()?.toString().trim()
      if (sel && sel.length > 5) {
        setSelectedText(sel)
      }
    }
    document.addEventListener('mouseup', handleSelection)
    return () => document.removeEventListener('mouseup', handleSelection)
  }, [])

  const chunks = data?.chunks || []
  const totalPages = Math.ceil(chunks.length / CHUNKS_PER_PAGE)
  const pageChunks = chunks.slice(page * CHUNKS_PER_PAGE, (page + 1) * CHUNKS_PER_PAGE)

  const handleSendChat = (text?: string) => {
    const query = text || chatInput.trim()
    if (!query || chatMutation.isPending) return
    setChatMessages((prev) => [...prev, { role: 'user', text: query }])
    chatMutation.mutate(query)
    setChatInput('')
    setSelectedText('')
  }

  const handleAskAboutSelection = () => {
    if (selectedText) {
      const query = `Regarding this text from ${docName}: "${selectedText.slice(0, 200)}..." — explain this in detail.`
      handleSendChat(query)
    }
  }

  return (
    <PageTransition className="h-[calc(100vh)] flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-[rgba(255,255,255,0.06)] text-sm">
        <Link to="/dashboard/sources" className="text-text-muted hover:text-white">Sources</Link>
        <ChevronRight size={14} className="text-text-muted" />
        <span className="text-white truncate">{docName || 'Document'}</span>
        <span className="ml-auto text-text-muted text-xs">{ext.toUpperCase()}</span>
      </div>

      {/* Selected text floating bar */}
      {selectedText && (
        <div className="mx-6 mt-2 flex items-center gap-3 px-4 py-2 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
          <MessageSquareText size={14} className="text-accent-cyan shrink-0" />
          <p className="text-white text-xs flex-1 truncate">"{selectedText.slice(0, 80)}..."</p>
          <button
            onClick={handleAskAboutSelection}
            className="text-accent-cyan text-xs font-semibold hover:underline shrink-0"
          >
            Ask about this →
          </button>
        </div>
      )}

      {/* Split layout with resizable panels */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Left: Document */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ width: `${100 - chatWidthPct}%` }}>
          {isPdf ? (
            /* PDF Viewer — native browser PDF rendering */
            <iframe
              src={`${getSourceFileUrl(docName, activeWorkspaceId)}&token=${localStorage.getItem('edu-nexus-session-token') || ''}`}
              className="flex-1 w-full bg-[#1a1a2e]"
              title={docName}
              style={{ border: 'none' }}
            />
          ) : (
            /* Non-PDF: chunk view */
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={16} className="text-accent-cyan" />
                <span className="text-text-muted text-xs">Parsed text chunks</span>
                {chunks.length > 0 && (
                  <span className="text-text-muted text-xs ml-auto">{chunks.length} total chunks</span>
                )}
              </div>

              {isLoading && (
                <div className="flex-1 flex items-center justify-center py-16">
                  <Loader2 className="text-accent-cyan animate-spin" size={32} />
                </div>
              )}

              {error && (
                <GlassCard hover={false} className="p-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-red-400" size={20} />
                    <p className="text-red-400 text-sm">Could not load document content.</p>
                  </div>
                </GlassCard>
              )}

              {!isLoading && !error && chunks.length === 0 && (
                <div className="flex items-center justify-center py-16">
                  <p className="text-text-muted">No content available for this document.</p>
                </div>
              )}

              {!isLoading && pageChunks.length > 0 && (
                <div className="flex flex-col gap-3">
                  {pageChunks.map((chunk: ChunkData, i: number) => (
                    <GlassCard key={`chunk-${page * CHUNKS_PER_PAGE + i}`} hover={false} className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-accent-cyan text-[11px] font-semibold">Chunk {page * CHUNKS_PER_PAGE + i + 1}</span>
                      </div>
                      <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">{chunk.text}</p>
                    </GlassCard>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-30"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="text-text-muted text-sm">Page {page + 1} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-30"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={handleDragStart}
          className="hidden lg:flex w-2 cursor-col-resize items-center justify-center hover:bg-accent-cyan/10 transition-colors group"
        >
          <GripVertical size={14} className="text-text-muted group-hover:text-accent-cyan" />
        </div>

        {/* Right: Chat */}
        <div
          className="hidden lg:flex flex-col border-l border-[rgba(255,255,255,0.06)]"
          style={{ width: `${chatWidthPct}%` }}
        >
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-white font-bold text-sm">Ask about this document</h3>
            <p className="text-text-muted text-[11px] italic mt-1">{docName}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-bg-sidebar flex items-center justify-center shrink-0">
                    <Sparkles className="text-accent-cyan" size={12} />
                  </div>
                )}
                {msg.role === 'user' ? (
                  <div className="bg-gradient-to-br from-accent-cyan to-accent-purple text-white px-4 py-2.5 rounded-[12px] rounded-br-[4px] text-xs max-w-[80%]">
                    {msg.text}
                  </div>
                ) : (
                  <div className="glass-card px-4 py-3 rounded-[12px] rounded-bl-[4px] max-w-[85%]">
                    <MarkdownMessage content={msg.text} className="text-xs" />
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-bg-sidebar flex items-center justify-center shrink-0">
                  <Sparkles className="text-accent-cyan" size={12} />
                </div>
                <div className="glass-card px-4 py-2.5 rounded-[12px]">
                  <div className="flex gap-1.5">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-5 pb-4 pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-end gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat() }}
                placeholder="Ask a question..."
                className="input-field text-sm flex-1"
                disabled={chatMutation.isPending}
              />
              <button
                onClick={() => handleSendChat()}
                disabled={!chatInput.trim() || chatMutation.isPending}
                className="btn-gradient p-2.5 rounded-full shrink-0 disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
