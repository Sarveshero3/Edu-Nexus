import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles } from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'

interface Message {
  id: string
  role: 'user' | 'ai'
  text: string
}

const initialMessages: Message[] = [
  { id: '1', role: 'ai', text: "Hello! I'm your Edu Nexus Academic Assistant. I can answer questions about your uploaded documents using our tri-hybrid RAG engine. What would you like to know?" },
  { id: '2', role: 'user', text: 'What are the key differences between supervised and unsupervised learning?' },
  { id: '3', role: 'ai', text: 'Based on your uploaded documents, supervised learning uses labeled training data to learn a mapping function, while unsupervised learning discovers hidden patterns in unlabeled data. Key differences include:\n\n1. **Data requirements**: Supervised needs labeled data; unsupervised works with unlabeled data\n2. **Goal**: Supervised predicts outcomes; unsupervised finds structure\n3. **Examples**: Classification/regression vs. clustering/dimensionality reduction\n\n📄 Source: machine_learning_fundamentals.pdf (chunks 23-27)' },
]

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = () => {
    if (!input.trim()) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    setTimeout(() => {
      setIsTyping(false)
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: 'Thank you for your question. Based on the documents in your knowledge base, I can provide a detailed analysis. The retrieved context spans multiple sources and retrieval engines for comprehensive coverage.\n\n📄 Source: Retrieved via Tri-Hybrid RAG',
      }
      setMessages((prev) => [...prev, aiMsg])
    }, 1500)
  }

  return (
    <PageTransition className="h-[calc(100vh)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <h1 className="text-xl font-bold text-white">Academic Assistant</h1>
        <span className="inline-flex items-center gap-2 bg-green-500/15 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Connected
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-bg-sidebar flex items-center justify-center mr-3 shrink-0 mt-1">
                <Sparkles className="text-accent-cyan" size={14} />
              </div>
            )}
            <div
              className={
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-accent-cyan to-accent-purple text-white px-5 py-3 rounded-[16px] rounded-br-[4px] max-w-lg text-sm'
                  : 'glass-card px-5 py-3 rounded-[16px] rounded-bl-[4px] max-w-xl text-sm text-white/90 whitespace-pre-line'
              }
            >
              {msg.text}
            </div>
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-bg-sidebar flex items-center justify-center shrink-0">
              <Sparkles className="text-accent-cyan" size={14} />
            </div>
            <div className="glass-card px-5 py-3 rounded-[16px]">
              <div className="flex gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
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
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
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
