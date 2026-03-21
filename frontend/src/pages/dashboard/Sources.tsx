import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, FileText, File, Upload, X } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import PillButton from '@/components/common/PillButton'

const mockDocs = [
  { id: '1', name: 'machine_learning_fundamentals.pdf', type: 'pdf', date: '2 days ago', chunks: 124 },
  { id: '2', name: 'deep_learning_notes.docx', type: 'docx', date: '3 days ago', chunks: 89 },
  { id: '3', name: 'research_abstract.txt', type: 'txt', date: '1 week ago', chunks: 23 },
  { id: '4', name: 'nlp_foundations.pdf', type: 'pdf', date: '1 week ago', chunks: 156 },
  { id: '5', name: 'computer_vision_intro.pdf', type: 'pdf', date: '2 weeks ago', chunks: 78 },
]

const typeColors: Record<string, string> = {
  pdf: 'text-red-400',
  docx: 'text-blue-400',
  txt: 'text-gray-400',
}

export default function Sources() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const filtered = mockDocs.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`)
  }

  return (
    <PageTransition className="p-6 lg:p-8">
      {/* Top bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-white">Source Documents</h1>
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="input-field pl-9 text-sm"
          />
        </form>
        <PillButton onClick={() => setShowUpload(true)}>
          <Plus size={16} /> Add Source
        </PillButton>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc, i) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard
              className="p-5 cursor-pointer"
              onClick={() => navigate(`/dashboard/viewer/${doc.id}`)}
            >
              <div className="flex items-start gap-3">
                <FileText className={typeColors[doc.type] || 'text-gray-400'} size={24} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{doc.name}</p>
                  <p className="text-text-muted text-xs mt-1">Added {doc.date}</p>
                </div>
              </div>
              <div className="mt-3">
                <span className="badge-cyan text-xs">{doc.chunks} chunks</span>
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {/* Upload card */}
        <GlassCard
          className="p-5 border-2 border-dashed border-[rgba(255,255,255,0.15)] flex flex-col items-center justify-center min-h-[120px] cursor-pointer"
          onClick={() => setShowUpload(true)}
        >
          <Plus className="text-text-muted mb-2" size={24} />
          <p className="text-text-muted text-sm">Upload more documents</p>
        </GlassCard>
      </div>

      {/* Upload panel overlay */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={() => setShowUpload(false)}
        >
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full max-w-md bg-bg-sidebar h-full p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Upload Source</h2>
              <button onClick={() => setShowUpload(false)} className="text-text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-[16px] p-8 flex flex-col items-center">
              <Upload className="text-accent-cyan mb-4" size={40} />
              <p className="text-white font-medium">Drop files here</p>
              <p className="text-text-muted text-sm mt-1">PDF, DOCX, TXT, PPTX, XLSX, CSV</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </PageTransition>
  )
}
