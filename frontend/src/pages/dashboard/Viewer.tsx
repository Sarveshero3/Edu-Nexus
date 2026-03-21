import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Send, Sparkles, Highlighter } from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'

const sampleText = `Machine learning is a subset of artificial intelligence that focuses on developing algorithms and statistical models that enable computers to learn and improve from experience without being explicitly programmed.

Supervised learning, a primary paradigm in machine learning, involves training models on labeled datasets where the desired output is known. The algorithm learns a mapping function from input to output, which can then be applied to new, unseen data. Common supervised learning algorithms include linear regression, logistic regression, decision trees, random forests, and neural networks.

Unsupervised learning, in contrast, deals with unlabeled data. The algorithm must discover the inherent structure and patterns within the data without guidance. Clustering algorithms like K-means, hierarchical clustering, and DBSCAN group similar data points together. Dimensionality reduction techniques such as PCA and t-SNE help visualize high-dimensional data.

Reinforcement learning represents a third paradigm where an agent learns to make decisions by interacting with an environment. The agent receives rewards or penalties based on its actions and learns to maximize cumulative reward over time. Applications include game playing, robotics, and autonomous systems.`

export default function Viewer() {
  const { id } = useParams()
  const [chatInput, setChatInput] = useState('')
  const [page, setPage] = useState(1)
  const totalPages = 12

  const filename = id === '1' ? 'machine_learning_fundamentals.pdf' : `document_${id}.pdf`

  return (
    <PageTransition className="h-[calc(100vh)] flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-[rgba(255,255,255,0.06)] text-sm">
        <Link to="/dashboard/sources" className="text-text-muted hover:text-white">Sources</Link>
        <ChevronRight size={14} className="text-text-muted" />
        <span className="text-white">{filename}</span>
      </div>

      {/* Split layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document */}
        <div className="flex-1 lg:w-[60%] flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Highlighter size={16} className="text-accent-cyan" />
            <span className="text-text-muted text-xs">Select text to ask questions about it</span>
          </div>

          <GlassCard hover={false} className="p-8 flex-1">
            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-line">
              {sampleText}
            </p>
          </GlassCard>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-30"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-text-muted text-sm">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-30"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right: Chat */}
        <div className="hidden lg:flex w-[40%] flex-col border-l border-[rgba(255,255,255,0.06)]">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-white font-bold text-sm">Ask about this document</h3>
            <p className="text-text-muted text-[11px] italic mt-1">Answering questions about: {filename}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-bg-sidebar flex items-center justify-center shrink-0">
                <Sparkles className="text-accent-cyan" size={12} />
              </div>
              <div className="glass-card px-4 py-2.5 rounded-[12px] rounded-bl-[4px] text-xs text-white/90">
                I can answer questions specifically about this document. Try selecting text or asking a question below.
              </div>
            </div>
          </div>

          <div className="px-5 pb-4 pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-end gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a question..."
                className="input-field text-sm flex-1"
              />
              <button className="btn-gradient p-2.5 rounded-full shrink-0">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
