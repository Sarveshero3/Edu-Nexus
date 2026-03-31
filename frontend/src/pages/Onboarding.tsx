import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Sparkles, Check, ArrowRight,
  Brain, GitBranch, Zap, Search, MessageSquare,
  FileText, Database, Network,
} from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import PillButton from '@/components/common/PillButton'
import { cn } from '@/lib/utils'
import AnimatedGradientText from '@/components/magicui/AnimatedGradientText'

/* ── Step data ── */
const steps = [
  {
    title: 'Upload & Index',
    highlight: 'Upload',
    desc: 'Drop your research papers, lecture notes, and study materials. The AI pipeline will instantly extract, chunk, and embed everything.',
    color: 'cyan',
    items: [
      { icon: FileText, label: 'research_paper.pdf', size: '2.4 MB' },
      { icon: FileText, label: 'lecture_notes.docx', size: '856 KB' },
      { icon: FileText, label: 'experiment_data.csv', size: '1.1 MB' },
    ],
  },
  {
    title: 'Tri-Hybrid Processing',
    highlight: 'Tri-Hybrid',
    desc: 'Three AI brains work simultaneously — BM25 for keywords, Qdrant for semantic understanding, NetworkX for knowledge relationships.',
    color: 'purple',
    items: [
      { icon: Zap, label: 'BM25 Keyword Index', size: 'Fast' },
      { icon: Database, label: 'Qdrant Vector Store', size: 'Semantic' },
      { icon: Network, label: 'NetworkX Graph', size: 'Relations' },
    ],
  },
  {
    title: 'Chat & Explore',
    highlight: 'Explore',
    desc: 'Ask questions in natural language, visualize knowledge graphs, and search across all your research with intelligent routing.',
    color: 'violet',
    items: [
      { icon: MessageSquare, label: 'AI Chat Interface', size: 'Query' },
      { icon: GitBranch, label: 'Knowledge Graph', size: 'Visual' },
      { icon: Search, label: 'Smart Search', size: 'Find' },
    ],
  },
]

const colorMap: Record<string, { from: string; to: string; accent: string; glow: string }> = {
  cyan: { from: 'from-cyan-500', to: 'to-blue-600', accent: 'text-cyan-400', glow: 'shadow-cyan-500/30' },
  purple: { from: 'from-purple-500', to: 'to-violet-600', accent: 'text-purple-400', glow: 'shadow-purple-500/30' },
  violet: { from: 'from-violet-500', to: 'to-fuchsia-600', accent: 'text-violet-400', glow: 'shadow-violet-500/30' },
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const next = () => {
    if (step < steps.length - 1) {
      setDirection(1)
      setStep((s) => s + 1)
    } else {
      navigate('/dashboard/sources')
    }
  }

  const prev = () => {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  const current = steps[step]
  const colors = colorMap[current.color]

  return (
    <PageTransition className="min-h-screen bg-bg-app flex flex-col items-center justify-center px-6 py-8">
      {/* Step indicator — pill style */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > step ? 1 : -1); setStep(i) }}
            className={cn(
              'h-2 rounded-full transition-all duration-500 cursor-pointer',
              step === i ? 'w-10 bg-gradient-to-r ' + colors.from + ' ' + colors.to : 'w-2 bg-border-default hover:bg-border-strong'
            )}
          />
        ))}
      </div>

      <div className="w-full max-w-3xl">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            initial={{ x: direction > 0 ? 120 : -120, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: direction > 0 ? -120 : 120, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Main card */}
            <div className="relative rounded-3xl border border-border-default bg-bg-card backdrop-blur-xl p-12 overflow-hidden">
              {/* Animated background glow */}
              <motion.div
                className="absolute inset-0 opacity-30 pointer-events-none"
                animate={{
                  background: [
                    `radial-gradient(600px circle at 20% 30%, ${current.color === 'cyan' ? 'rgba(34,211,238,0.15)' : current.color === 'purple' ? 'rgba(139,92,246,0.15)' : 'rgba(124,58,237,0.15)'}, transparent 60%)`,
                    `radial-gradient(600px circle at 80% 70%, ${current.color === 'cyan' ? 'rgba(34,211,238,0.15)' : current.color === 'purple' ? 'rgba(139,92,246,0.15)' : 'rgba(124,58,237,0.15)'}, transparent 60%)`,
                    `radial-gradient(600px circle at 20% 30%, ${current.color === 'cyan' ? 'rgba(34,211,238,0.15)' : current.color === 'purple' ? 'rgba(139,92,246,0.15)' : 'rgba(124,58,237,0.15)'}, transparent 60%)`,
                  ],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative z-10 flex flex-col items-center text-center">
                {/* Icon with pulse ring */}
                <div className="relative mb-8">
                  <motion.div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} opacity-20`}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center shadow-xl ${colors.glow}`}>
                    {step === 0 && <Upload className="text-text-inverse" size={36} />}
                    {step === 1 && <Brain className="text-text-inverse" size={36} />}
                    {step === 2 && <Sparkles className="text-text-inverse" size={36} />}
                  </div>
                </div>

                {/* Title with animated gradient */}
                <h2
                  className="text-3xl font-extrabold text-text-primary mb-3"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    textShadow: '0 4px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  <AnimatedGradientText
                    colorFrom={current.color === 'cyan' ? '#22d3ee' : current.color === 'purple' ? '#a78bfa' : '#8b5cf6'}
                    colorVia="#ffffff"
                    colorTo={current.color === 'cyan' ? '#22d3ee' : current.color === 'purple' ? '#a78bfa' : '#8b5cf6'}
                    speed={0.8}
                    className="font-extrabold"
                  >
                    {current.title}
                  </AnimatedGradientText>
                </h2>
                <p className="text-text-secondary text-base mb-10 max-w-lg leading-relaxed">{current.desc}</p>

                {/* Animated items — staggered cards */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                  {current.items.map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: 'easeOut' }}
                      className="flex flex-col items-center p-4 rounded-2xl border border-border-default bg-bg-card gap-2 hover:bg-bg-card-hover transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.from}/20 ${colors.to}/20 flex items-center justify-center`}>
                        <item.icon className={colors.accent} size={20} />
                      </div>
                      <span className="text-text-secondary text-xs font-semibold text-center leading-tight">{item.label}</span>
                      <span className="text-text-muted text-[10px] font-medium">{item.size}</span>

                      {/* Mini progress animation */}
                      <div className="w-full h-1 rounded-full bg-border-subtle overflow-hidden mt-1">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ delay: 0.6 + i * 0.2, duration: 1.2, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${colors.from} ${colors.to} opacity-60`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 px-2">
              <button
                onClick={prev}
                className={cn(
                  'text-text-muted text-sm font-medium hover:text-text-primary transition-colors',
                  step === 0 && 'invisible'
                )}
              >
                ← Back
              </button>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard/sources')}
                  className="text-text-muted text-sm hover:text-text-secondary transition-colors"
                >
                  Skip
                </button>
                <PillButton onClick={next}>
                  {step < steps.length - 1 ? (
                    <>Next <ArrowRight size={16} /></>
                  ) : (
                    <>Go to Dashboard <ArrowRight size={16} /></>
                  )}
                </PillButton>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
