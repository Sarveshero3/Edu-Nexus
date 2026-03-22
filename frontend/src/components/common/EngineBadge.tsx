import { cn } from '@/lib/utils'

interface EngineBadgeProps {
  engine: 'bm25' | 'faiss' | 'neo4j' | 'hybrid' | 'none' | string
  className?: string
}

const config: Record<string, { label: string; className: string }> = {
  bm25: { label: 'BM25', className: 'badge-cyan' },
  faiss: { label: 'FAISS', className: 'badge-purple' },
  neo4j: { label: 'Neo4j', className: 'badge-violet' },
  hybrid: { label: 'Hybrid', className: 'bg-gradient-to-r from-[#5BC8F5]/20 to-[#A78BFA]/20 text-white border border-[rgba(255,255,255,0.1)] px-2.5 py-0.5 rounded-full text-[11px] font-semibold' },
  none: { label: 'None', className: 'bg-[rgba(255,255,255,0.06)] text-text-muted px-2.5 py-0.5 rounded-full text-[11px] font-semibold' },
}

export default function EngineBadge({ engine, className }: EngineBadgeProps) {
  const entry = config[engine] || config.none
  return <span className={cn(entry.className, className)}>{entry.label}</span>
}
