import { cn } from '@/lib/utils'

interface EngineBadgeProps {
  engine: 'bm25' | 'faiss' | 'neo4j'
  className?: string
}

const config = {
  bm25: { label: 'BM25', className: 'badge-cyan' },
  faiss: { label: 'FAISS', className: 'badge-purple' },
  neo4j: { label: 'Neo4j', className: 'badge-violet' },
}

export default function EngineBadge({ engine, className }: EngineBadgeProps) {
  const { label, className: badgeClass } = config[engine]
  return <span className={cn(badgeClass, className)}>{label}</span>
}
