import { cn } from '@/lib/utils'

interface EngineBadgeProps {
  engine: 'bm25' | 'qdrant' | 'graph' | 'hybrid' | 'keyword' | 'semantic' | 'none' | string
  className?: string
}

const config: Record<string, { label: string; className: string }> = {
  bm25: { label: 'BM25', className: 'badge-cyan' },
  keyword: { label: 'Keyword', className: 'badge-cyan' },
  qdrant: { label: 'Qdrant', className: 'badge-purple' },
  semantic: { label: 'Semantic', className: 'badge-purple' },
  faiss: { label: 'Qdrant', className: 'badge-purple' },  // legacy compat
  graph: { label: 'NetworkX', className: 'badge-violet' },
  neo4j: { label: 'NetworkX', className: 'badge-violet' },   // legacy compat
  hybrid: { label: 'Hybrid', className: 'bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 text-text-primary border border-border-default px-2.5 py-0.5 rounded-full text-[11px] font-semibold' },
  none: { label: 'None', className: 'bg-bg-card text-text-muted px-2.5 py-0.5 rounded-full text-[11px] font-semibold' },
}

export default function EngineBadge({ engine, className }: EngineBadgeProps) {
  const entry = config[engine] || config.none
  return <span className={cn(entry.className, className)}>{entry.label}</span>
}
