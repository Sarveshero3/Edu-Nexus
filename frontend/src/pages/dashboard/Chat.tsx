import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, ChevronDown, RefreshCw, Lightbulb } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import PageTransition from '@/components/common/PageTransition'
import EngineBadge from '@/components/common/EngineBadge'
import MarkdownMessage from '@/components/common/MarkdownMessage'
import { sendChat, getStatus, refreshStatus, getSuggestions, type ChatResponse, type ChainOfThoughtStep, type EngineStatus } from '@/lib/api'
import { useWorkspace, type Message } from '@/stores/workspaceStore'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export default function Chat() {
  const activeWorkspaceId = useWorkspace((s) => s.activeWorkspaceId)
  const activeChatSessionId = useWorkspace((s) => s.activeChatSessionId)
  const addMessage = useWorkspace((s) => s.addMessage)
  const getChatMessages = useWorkspace((s) => s.getChatMessages)
  const getActiveChatSession = useWorkspace((s) => s.getActiveChatSession)
  const getActiveWorkspace = useWorkspace((s) => s.getActiveWorkspace)

  const session = getActiveChatSession()
  const messages = activeWorkspaceId && activeChatSessionId
    ? getChatMessages(activeWorkspaceId, activeChatSessionId)
    : []

  const [input, setInput] = useState('')
  const [expandedCoT, setExpandedCoT] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  // Engine status
  const { data: status, refetch: refetchStatus } = useQuery<EngineStatus>({
    queryKey: ['engineStatus', activeWorkspaceId],
    queryFn: () => getStatus(activeWorkspaceId || 'default'),
    refetchInterval: 30000,
  })

  // Suggested questions
  const { data: suggestions } = useQuery<string[]>({
    queryKey: ['suggestions', activeWorkspaceId],
    queryFn: () => getSuggestions(activeWorkspaceId || 'default'),
    staleTime: 60000,
  })

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const chatMutation = useMutation({
    mutationFn: (query: string) => {
      const ws = getActiveWorkspace()
      const sourceFilter = ws?.sourceNames.length ? ws.sourceNames : undefined
      return sendChat(query, activeWorkspaceId || 'default', sourceFilter)
    },
    onSuccess: (data: ChatResponse) => {
      if (!activeWorkspaceId || !activeChatSessionId) return
      const aiMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.answer,
        engine_used: data.engine_used,
        chain_of_thought: data.chain_of_thought,
        confidence: data.confidence,
        timestamp: new Date().toISOString(),
      }
      addMessage(activeWorkspaceId, activeChatSessionId, aiMsg)
    },
    onError: (err: Error) => {
      if (!activeWorkspaceId || !activeChatSessionId) return
      const errMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: err.message?.includes('Network')
          ? 'Cannot connect to Edu Nexus backend. Is the server running?'
          : err.message || 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      }
      addMessage(activeWorkspaceId, activeChatSessionId, errMsg)
    },
  })

  const sendMessage = (text?: string) => {
    const query = text || input.trim()
    if (!query || chatMutation.isPending || !activeWorkspaceId || !activeChatSessionId) return

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }
    addMessage(activeWorkspaceId, activeChatSessionId, userMsg)
    chatMutation.mutate(query)
    setInput('')
  }

  const handleRefreshStatus = async () => {
    try {
      await refreshStatus()
      refetchStatus()
    } catch (e) {
      // silently fail
    }
  }

  // No workspace selected
  if (!activeWorkspaceId || !activeChatSessionId) {
    return (
      <PageTransition className="h-[calc(100vh)] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="text-accent-cyan mx-auto mb-4" size={40} />
          <h2 className="text-xl text-text-primary font-semibold mb-2">Select a Workspace</h2>
          <p className="text-text-muted text-sm">
            Create or select a workspace from the sidebar to start chatting
          </p>
        </div>
      </PageTransition>
    )
  }

  const EngineStatusDot = ({ label, ready }: { label: string; ready?: boolean }) => (
    <div className="flex items-center gap-1.5" title={`${label}: ${ready ? 'Online' : 'Offline'}`}>
      <span className={`w-2 h-2 rounded-full ${ready ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
    </div>
  )

  return (
    <PageTransition className="h-[calc(100vh)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle">
        <div>
          <h1 className="text-lg font-bold text-text-primary">{session?.title || 'Chat'}</h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Engine status indicators */}
          <div className="flex items-center gap-3">
            <EngineStatusDot label="BM25" ready={status?.bm25?.online} />
            <EngineStatusDot label="Qdrant" ready={status?.qdrant?.online} />
            <EngineStatusDot label="NetworkX" ready={status?.graph?.online} />
          </div>
          <button
            onClick={handleRefreshStatus}
            className="text-text-muted hover:text-accent-cyan transition-colors p-1"
            title="Refresh engine status"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        {/* Welcome + Suggestions if empty */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-border-default">
                <Sparkles className="text-accent-cyan" size={28} />
              </div>
              <h2 className="text-xl text-text-primary font-semibold mb-2">How can I help?</h2>
              <p className="text-text-muted text-sm max-w-md">
                Ask questions about your uploaded documents. I'll search through BM25, Qdrant, and the Knowledge Graph to find the best answers.
              </p>
            </div>
            {/* Suggested questions */}
            {suggestions && suggestions.length > 0 && (
              <div className="flex flex-col gap-2 w-full max-w-lg">
                <div className="flex items-center gap-2 text-text-muted text-xs">
                  <Lightbulb size={12} />
                  <span>Suggested questions</span>
                </div>
                {suggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-left px-4 py-3 rounded-xl text-sm text-text-secondary bg-bg-card border border-border-subtle hover:border-accent-cyan/30 hover:bg-bg-card-hover transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-bg-sidebar flex items-center justify-center mr-3 shrink-0 mt-1">
                <Sparkles className="text-accent-cyan" size={14} />
              </div>
            )}
            <div className="max-w-2xl">
              {msg.role === 'user' ? (
                <div className="bg-gradient-to-br from-accent-cyan to-accent-purple text-text-inverse px-5 py-3 rounded-[16px] rounded-br-[4px] text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="glass-card px-5 py-4 rounded-[16px] rounded-bl-[4px]">
                  <MarkdownMessage content={msg.content} />
                </div>
              )}

              {/* Engine badge + confidence */}
              {msg.role === 'assistant' && msg.engine_used && (
                <div className="flex items-center gap-2 mt-2">
                  <EngineBadge engine={msg.engine_used} />
                  {msg.confidence !== undefined && (
                    <span className="text-text-muted text-[11px]">
                      {Math.round(msg.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
              )}

              {/* Chain-of-thought expandable */}
              {msg.role === 'assistant' && msg.chain_of_thought && msg.chain_of_thought.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedCoT(expandedCoT === msg.id ? null : msg.id)}
                    className="flex items-center gap-1.5 text-text-muted text-[11px] hover:text-accent-cyan transition-colors"
                  >
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${expandedCoT === msg.id ? 'rotate-180' : ''}`}
                    />
                    How I found this answer
                  </button>
                  <AnimatePresence>
                    {expandedCoT === msg.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 pl-3 border-l-2 border-accent-cyan/30 flex flex-col gap-1.5">
                          {msg.chain_of_thought.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-green-400 text-[10px] mt-0.5">✓</span>
                              <div>
                                <span className="text-text-secondary text-[11px] font-medium">{step.step}</span>
                                <span className="text-text-muted text-[11px] ml-1.5">{step.detail}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {chatMutation.isPending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-bg-sidebar flex items-center justify-center shrink-0">
              <Sparkles className="text-accent-cyan" size={14} />
            </div>
            <div className="glass-card px-5 py-3 rounded-[16px]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
                <span className="text-text-muted text-[11px] ml-2">Analyzing your query...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-3 pt-2 border-t border-border-subtle">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
            }}
            placeholder="Ask about your documents..."
            rows={1}
            className="input-field resize-none text-sm flex-1"
            style={{ maxHeight: '96px' }}
            disabled={chatMutation.isPending}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || chatMutation.isPending}
            className="btn-gradient p-3 rounded-full shrink-0 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-text-muted text-[11px] text-center mt-2">
          Edu Nexus AI can make mistakes. Always cross-reference critical academic claims.
        </p>
      </div>
    </PageTransition>
  )
}
