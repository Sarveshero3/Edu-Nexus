import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, RotateCw, MessageSquare } from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import EngineBadge from '@/components/common/EngineBadge'
import PillButton from '@/components/common/PillButton'
import { cn } from '@/lib/utils'

type Engine = 'bm25' | 'faiss' | 'neo4j'

interface QueryItem {
  id: string
  text: string
  engine: Engine
  time: string
  source: string
  answer: string
}

const mockQueries: QueryItem[] = [
  { id: '1', text: 'What are the key differences between supervised and unsupervised learning?', engine: 'bm25', time: '2 hours ago', source: 'machine_learning_fundamentals.pdf', answer: 'Supervised learning uses labeled data to learn mappings, while unsupervised learning discovers hidden patterns in unlabeled data...' },
  { id: '2', text: 'Explain backpropagation algorithm step by step', engine: 'faiss', time: '5 hours ago', source: 'deep_learning_notes.pdf', answer: 'Backpropagation involves: 1) Forward pass computing predictions, 2) Loss calculation, 3) Backward pass computing gradients via chain rule...' },
  { id: '3', text: 'How do attention mechanisms relate to transformer architecture?', engine: 'neo4j', time: '1 day ago', source: 'nlp_foundations.docx', answer: 'Attention mechanisms form the core of transformer architecture, allowing the model to weigh the importance of different input tokens...' },
  { id: '4', text: 'Compare CNN architectures: VGG, ResNet, and Inception', engine: 'bm25', time: '2 days ago', source: 'computer_vision_intro.pdf', answer: 'VGG uses uniform 3x3 convolutions, ResNet introduces skip connections to solve vanishing gradients, and Inception uses parallel convolution paths...' },
  { id: '5', text: 'What is the vanishing gradient problem?', engine: 'faiss', time: '3 days ago', source: 'deep_learning_notes.pdf', answer: 'The vanishing gradient problem occurs when gradients become exponentially small during backpropagation through many layers...' },
]

const tabs = ['All', 'BM25', 'FAISS', 'Neo4j'] as const

export default function History() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('All')
  const [expandedId, setExpandedId] = useState<string | null>('1')

  const filtered = activeTab === 'All'
    ? mockQueries
    : mockQueries.filter((q) => q.engine === activeTab.toLowerCase())

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

      {/* Query list */}
      <div className="flex flex-col gap-3">
        {filtered.map((q) => (
          <GlassCard key={q.id} hover={false} className="p-5">
            <div
              className="flex items-start justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
            >
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-white text-sm font-medium truncate">{q.text}</p>
                <div className="flex items-center gap-3 mt-2">
                  <EngineBadge engine={q.engine} />
                  <span className="text-text-muted text-xs">{q.time}</span>
                  <span className="text-text-muted text-xs">· {q.source}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <PillButton variant="ghost" className="text-xs px-3 py-1.5">
                  <RotateCw size={12} /> Re-run
                </PillButton>
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
                    <p className="text-text-muted text-sm leading-relaxed">{q.answer}</p>
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
