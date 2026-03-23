import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, FileText, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import EngineBadge from '@/components/common/EngineBadge'
import { cn } from '@/lib/utils'
import { search as apiSearch, type SearchResult, type SearchHit } from '@/lib/api'
import { useWorkspace } from '@/stores/workspaceStore'

const filters = ['All', 'BM25', 'FAISS', 'Neo4j'] as const

export default function SearchPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const query = params.get('q') || ''
  const [searchInput, setSearchInput] = useState(query)
  const [activeFilter, setActiveFilter] = useState('All')
  const activeWs = useWorkspace((s) => s.getActiveWorkspace())

  useEffect(() => {
    setSearchInput(query)
  }, [query])

  const engineParam = activeFilter === 'All' ? undefined : activeFilter.toLowerCase()
  const sourceFilter = activeWs?.sourceNames.length ? activeWs.sourceNames : undefined

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query, engineParam, sourceFilter],
    queryFn: () => apiSearch(query, engineParam, sourceFilter),
    enabled: !!query.trim(),
  })

  const hits = data?.hits || []

  const highlightQuery = (text: string) => {
    if (!query) return text
    try {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escaped})`, 'gi')
      return text.replace(regex, '<mark class="bg-accent-cyan/30 text-accent-cyan rounded px-0.5">$1</mark>')
    } catch {
      return text
    }
  }

  const engineMap: Record<string, 'bm25' | 'faiss' | 'neo4j'> = {
    bm25: 'bm25',
    faiss: 'faiss',
    neo4j: 'neo4j',
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

      {query && (
        <p className="text-text-muted text-sm mb-6">
          {isLoading ? 'Searching...' : `${hits.length} results for '`}
          <span className="text-white">{query}</span>
          {isLoading ? '' : "'"}
        </p>
      )}

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

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="text-accent-cyan animate-spin" size={32} />
        </div>
      )}

      {/* Error */}
      {error && (
        <GlassCard hover={false} className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400 text-sm">Search failed. Is the backend server running?</p>
          </div>
        </GlassCard>
      )}

      {/* Results */}
      {!isLoading && (
        <div className="flex flex-col gap-3">
          {hits.map((r: SearchHit, i: number) => (
            <motion.div
              key={`${r.engine}-${r.rank}-${i}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <GlassCard className="p-5">
                <div className="flex items-start gap-3">
                  <FileText className="text-text-muted shrink-0" size={20} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-text-muted text-sm mt-1 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: highlightQuery(r.text) }}
                    />
                    <div className="flex items-center gap-3 mt-3">
                      <EngineBadge engine={engineMap[r.engine] || r.engine} />
                      <span className="text-text-muted text-xs">Rank #{r.rank}</span>
                      {r.score !== null && (
                        <>
                          <div className="h-1.5 flex-1 max-w-[120px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent-cyan rounded-full"
                              style={{ width: `${Math.min(100, (1 - r.score) * 100)}%` }}
                            />
                          </div>
                          <span className="text-text-muted text-xs">{r.score.toFixed(4)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && !error && query && hits.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted text-lg">No results found. Try a different query or upload more documents.</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-16">
          <Search className="text-text-muted mx-auto mb-4" size={40} />
          <p className="text-text-muted text-lg">Enter a search query to find content in your documents.</p>
        </div>
      )}
    </PageTransition>
  )
}
