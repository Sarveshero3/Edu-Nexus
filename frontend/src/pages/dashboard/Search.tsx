import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import EngineBadge from '@/components/common/EngineBadge'
import { cn } from '@/lib/utils'

type Engine = 'bm25' | 'faiss' | 'neo4j'

const mockResults = [
  { id: '1', filename: 'machine_learning_fundamentals.pdf', type: 'pdf', preview: '...neural networks are computational models inspired by biological neural networks that process information using connectionist approaches...', engine: 'bm25' as Engine, relevance: 92 },
  { id: '2', filename: 'deep_learning_notes.docx', type: 'docx', preview: '...deep neural networks consist of multiple layers of interconnected neurons, enabling hierarchical feature learning...', engine: 'faiss' as Engine, relevance: 87 },
  { id: '3', filename: 'nlp_foundations.pdf', type: 'pdf', preview: '...recurrent neural networks for sequence modeling have been largely superseded by transformer architectures...', engine: 'neo4j' as Engine, relevance: 78 },
  { id: '4', filename: 'computer_vision_intro.pdf', type: 'pdf', preview: '...convolutional neural networks apply learnable filters to extract spatial features from images...', engine: 'bm25' as Engine, relevance: 71 },
]

const filters = ['All', 'BM25', 'FAISS', 'Neo4j'] as const

export default function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const query = params.get('q') || ''
  const [searchInput, setSearchInput] = useState(query)
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = activeFilter === 'All'
    ? mockResults
    : mockResults.filter((r) => r.engine === activeFilter.toLowerCase())

  const highlightQuery = (text: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark class="bg-accent-cyan/30 text-accent-cyan rounded px-0.5">$1</mark>')
  }

  return (
    <PageTransition className="p-6 lg:p-8">
      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); navigate(`/dashboard/search?q=${encodeURIComponent(searchInput)}`) }}
        className="relative max-w-2xl mb-4"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="input-field pl-9 text-sm"
          placeholder="Search documents..."
        />
      </form>

      <p className="text-text-muted text-sm mb-6">
        {filtered.length} results for '<span className="text-white">{query}</span>'
      </p>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeFilter === f
                ? 'bg-accent-cyan/20 text-accent-cyan'
                : 'text-text-muted hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex flex-col gap-3">
        {filtered.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard
              className="p-5 cursor-pointer"
              onClick={() => navigate(`/dashboard/viewer/${r.id}`)}
            >
              <div className="flex items-start gap-3">
                <FileText className={r.type === 'pdf' ? 'text-red-400' : 'text-blue-400'} size={20} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{r.filename}</p>
                  <p
                    className="text-text-muted text-sm mt-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: highlightQuery(r.preview) }}
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <EngineBadge engine={r.engine} />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="h-1.5 flex-1 max-w-[120px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-cyan rounded-full"
                          style={{ width: `${r.relevance}%` }}
                        />
                      </div>
                      <span className="text-text-muted text-xs">{r.relevance}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted text-lg">No results found. Try a different query.</p>
        </div>
      )}
    </PageTransition>
  )
}
