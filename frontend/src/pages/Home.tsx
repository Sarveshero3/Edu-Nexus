import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Brain, GitBranch, ArrowRight, Sparkles } from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import BlurFade from '@/components/magicui/BlurFade'
import AnimatedGradientText from '@/components/magicui/AnimatedGradientText'
import { authStatus } from '@/lib/api'

const features = [
  {
    icon: Zap,
    title: 'Fast Brain (BM25)',
    desc: 'Lightning-fast keyword retrieval using BM25 ranking. Perfect for precise term matching across large document collections.',
    gradient: 'from-cyan-500/15 to-blue-500/15',
    borderColor: 'border-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
  {
    icon: Brain,
    title: 'Semantic Brain (Qdrant)',
    desc: 'Deep vector similarity search powered by Qdrant. Understands meaning and context beyond exact keyword matches.',
    gradient: 'from-purple-500/15 to-violet-500/15',
    borderColor: 'border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: GitBranch,
    title: 'Deep Brain (Graph)',
    desc: 'Knowledge graph traversal via NetworkX. Maps relationships between concepts for interconnected academic insights.',
    gradient: 'from-violet-500/15 to-fuchsia-500/15',
    borderColor: 'border-violet-500/20',
    iconColor: 'text-violet-400',
  },
]

export default function Home() {
  const navigate = useNavigate()

  // Auto-redirect if already logged in
  useEffect(() => {
    authStatus().then((status) => {
      if (status.logged_in) {
        navigate('/dashboard/sources', { replace: true })
      }
    }).catch(() => {})
  }, [navigate])

  return (
    <PageTransition>
      {/* ── HERO ──────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center">
        {/* Title — Animated Gradient */}
        <BlurFade delay={0.15} inView>
          <h1
            className="text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              textShadow: '0 4px 40px rgba(139,92,246,0.35), 0 0 80px rgba(34,211,238,0.2)',
            }}
          >
            <AnimatedGradientText
              colorFrom="#22d3ee"
              colorVia="#a78bfa"
              colorTo="#22d3ee"
              speed={0.8}
            >
              Edu Nexus
            </AnimatedGradientText>
          </h1>
        </BlurFade>

        {/* Subtitle */}
        <BlurFade delay={0.3} inView>
          <p
            className="text-2xl md:text-3xl text-white font-semibold mt-5 tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              textShadow: '0 2px 24px rgba(0,0,0,0.6)',
            }}
          >
            The Intelligent Backbone for Academic Mastery
          </p>
        </BlurFade>

        {/* Description — brighter */}
        <BlurFade delay={0.45} inView>
          <p
            className="text-white/80 text-lg md:text-xl max-w-2xl mt-5 leading-relaxed font-medium"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}
          >
            Upload research papers, query across three AI retrieval engines, and build
            knowledge graphs — all in one unified academic workspace.
          </p>
        </BlurFade>

        {/* CTAs */}
        <BlurFade delay={0.6} inView>
          <div className="flex flex-wrap items-center gap-4 mt-10">
            <button
              onClick={() => navigate('/sign-up')}
              className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.03]"
            >
              Launch Workspace
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/sign-in')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/20 text-white font-semibold text-base hover:bg-white/5 hover:border-white/30 backdrop-blur-sm transition-all duration-300"
            >
              Sign In
            </button>
          </div>
        </BlurFade>

        {/* Scroll indicator */}
        <BlurFade delay={0.8} inView>
          <div className="mt-16">
            <div className="w-6 h-10 rounded-full border-2 border-white/25 flex items-start justify-center pt-2">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              />
            </div>
          </div>
        </BlurFade>
      </section>

      {/* ── FEATURES — Spline shows through, gradient top edge for smooth blend ── */}
      <section id="features" className="relative py-32 px-6">
        {/* Gradient overlay: smooth blend from transparent to semi-opaque */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, rgba(6,8,15,0.35) 15%, rgba(6,8,15,0.35) 85%, transparent 100%)',
          }}
        />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <BlurFade delay={0} inView inViewMargin="-100px">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-6">
                <Sparkles size={14} />
                Powered by Three AI Brains
              </div>
            </BlurFade>
            <BlurFade delay={0.1} inView inViewMargin="-100px">
              <h2
                className="text-4xl md:text-5xl font-bold text-white"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  textShadow: '0 4px 24px rgba(0,0,0,0.6)',
                }}
              >
                Tri-Hybrid Intelligence
              </h2>
            </BlurFade>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <BlurFade key={f.title} delay={0.15 * i} inView inViewMargin="-80px">
                <div className={`group relative p-8 h-full rounded-2xl border ${f.borderColor} bg-gradient-to-br ${f.gradient} backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:shadow-lg`}>
                  <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <f.icon className={f.iconColor} size={28} />
                  </div>
                  <h3
                    className="text-xl font-bold text-white mb-3"
                    style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  )
}
