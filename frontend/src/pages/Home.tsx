import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Brain, GitBranch } from 'lucide-react'
import PublicNavbar from '@/components/layout/PublicNavbar'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import PillButton from '@/components/common/PillButton'

const features = [
  {
    icon: Zap,
    title: 'Fast Brain (BM25)',
    desc: 'Lightning-fast keyword retrieval using BM25 ranking. Perfect for precise term matching across large document collections.',
    color: 'text-accent-cyan',
  },
  {
    icon: Brain,
    title: 'Semantic Brain (FAISS)',
    desc: 'Deep vector similarity search powered by FAISS. Understands meaning and context beyond exact keyword matches.',
    color: 'text-accent-purple',
  },
  {
    icon: GitBranch,
    title: 'Deep Brain (Neo4j)',
    desc: 'Knowledge graph traversal via Neo4j. Maps relationships between concepts for interconnected academic insights.',
    color: 'text-accent-violet',
  },
]

const containerAnim = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

const itemAnim = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <PageTransition>
      {/* HERO */}
      <section className="relative min-h-screen bg-bg-primary flex flex-col">
        <PublicNavbar />

        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-accent-cyan/20 text-accent-cyan px-4 py-1.5 rounded-full text-sm font-semibold mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            Tri-Hybrid RAG Engine Live
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight max-w-4xl"
          >
            The Intelligent Backbone for Academic Mastery
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="text-text-muted text-lg md:text-xl max-w-2xl mt-6"
          >
            Upload research papers, query across three AI retrieval engines, and build
            knowledge graphs — all in one unified academic workspace.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center gap-4 mt-10"
          >
            <PillButton onClick={() => navigate('/sign-up')}>Launch Workspace →</PillButton>
            <PillButton variant="ghost" onClick={() => navigate('/docs')}>View Documentation</PillButton>
          </motion.div>

          {/* Spline placeholder */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="w-full max-w-3xl mt-16"
          >
            <div
              id="spline-hero"
              className="w-full h-[500px] border-2 border-dashed border-[rgba(255,255,255,0.2)] rounded-[24px] flex items-center justify-center text-text-muted text-sm"
            >
              [ SPLINE 3D EMBED ZONE ]
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-bg-app py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
          >
            Tri-Hybrid Intelligence
          </motion.h2>

          <motion.div
            variants={containerAnim}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={itemAnim}>
                <GlassCard className="p-8 h-full">
                  <f.icon className={`${f.color} mb-4`} size={32} />
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </PageTransition>
  )
}
