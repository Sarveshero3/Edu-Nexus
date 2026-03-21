import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Zap, Brain, GitBranch, Sparkles, Check } from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import PillButton from '@/components/common/PillButton'
import { cn } from '@/lib/utils'

const engines = [
  { id: 'bm25', icon: Zap, label: 'BM25', desc: 'Keyword Search', color: 'border-accent-cyan text-accent-cyan' },
  { id: 'faiss', icon: Brain, label: 'FAISS', desc: 'Vector Similarity', color: 'border-accent-purple text-accent-purple' },
  { id: 'neo4j', icon: GitBranch, label: 'Neo4j', desc: 'Knowledge Graph', color: 'border-accent-violet text-accent-violet' },
]

const fileTypes = ['PDF', 'DOCX', 'TXT', 'URL']

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [fileSelected, setFileSelected] = useState(false)
  const [selectedEngines, setSelectedEngines] = useState(['bm25', 'faiss', 'neo4j'])

  const nextStep = () => { setDirection(1); setStep((s) => Math.min(s + 1, 3)) }
  const prevStep = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 1)) }

  const toggleEngine = (id: string) => {
    setSelectedEngines((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    )
  }

  return (
    <PageTransition className="min-h-screen bg-bg-app flex flex-col items-center px-6 py-12">
      {/* Progress */}
      <div className="flex items-center gap-4 mb-16">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                step >= s
                  ? 'bg-accent-cyan text-white'
                  : 'bg-[rgba(255,255,255,0.08)] text-text-muted'
              )}
            >
              {step > s ? <Check size={16} /> : s}
            </div>
            {s < 3 && (
              <div className={cn('w-16 h-0.5', step > s ? 'bg-accent-cyan' : 'bg-[rgba(255,255,255,0.1)]')} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div key="s1" variants={stepVariants} custom={direction} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-white text-center mb-8">Upload your first document</h2>
              <GlassCard
                hover={false}
                className="p-12 border-2 border-dashed border-[rgba(255,255,255,0.2)] flex flex-col items-center cursor-pointer"
                onClick={() => setFileSelected(true)}
              >
                <Upload className="text-accent-cyan mb-4" size={48} />
                <p className="text-white font-medium mb-2">Drop a PDF or paste a URL</p>
                <p className="text-text-muted text-sm">Supported formats:</p>
                <div className="flex gap-2 mt-3">
                  {fileTypes.map((ft) => (
                    <span key={ft} className="badge-cyan text-xs">{ft}</span>
                  ))}
                </div>
                {fileSelected && <p className="text-green-400 text-sm mt-4">✓ document_sample.pdf selected</p>}
              </GlassCard>
              <div className="flex justify-end mt-8">
                <PillButton onClick={nextStep} disabled={!fileSelected}>Next →</PillButton>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" variants={stepVariants} custom={direction} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <h2 className="text-2xl font-bold text-white text-center mb-8">Choose retrieval engines</h2>
              <div className="grid grid-cols-3 gap-4">
                {engines.map((e) => (
                  <GlassCard
                    key={e.id}
                    className={cn(
                      'p-6 flex flex-col items-center text-center cursor-pointer border-2 transition-colors',
                      selectedEngines.includes(e.id) ? e.color : 'border-transparent'
                    )}
                    onClick={() => toggleEngine(e.id)}
                  >
                    <e.icon size={32} className="mb-3" />
                    <h3 className="text-white font-bold">{e.label}</h3>
                    <p className="text-text-muted text-xs mt-1">{e.desc}</p>
                    {selectedEngines.includes(e.id) && <Check className="text-green-400 mt-3" size={18} />}
                  </GlassCard>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                <PillButton variant="ghost" onClick={prevStep}>← Back</PillButton>
                <PillButton onClick={nextStep}>Next →</PillButton>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" variants={stepVariants} custom={direction} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Sparkles className="text-accent-cyan mb-6" size={64} />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-3">Your workspace is ready.</h2>
                <p className="text-text-muted mb-8">Start exploring your documents with tri-hybrid intelligence.</p>
                <PillButton onClick={() => navigate('/dashboard/sources')}>Launch Workspace →</PillButton>
                <button
                  onClick={() => navigate('/dashboard/sources')}
                  className="text-text-muted text-sm mt-4 hover:text-white transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
