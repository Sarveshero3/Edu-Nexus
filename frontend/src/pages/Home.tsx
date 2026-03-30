import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import {
  Zap, Brain, GitBranch, ArrowRight,
  FileText, Search, MessageSquare, BarChart3, Shield, Globe,
  Mail, Database, Cpu, Network, BookOpen,
  ChevronDown, Users, Layers, Upload, CircuitBoard,
  Braces, Boxes, Wind, Frame, PenTool, Binary,
  Code2, Palette, Terminal
} from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import AnimatedGradientText from '@/components/magicui/AnimatedGradientText'
import { Marquee } from '@/components/magicui/Marquee'
import { MagicCard } from '@/components/magicui/MagicCard'
import { authStatus } from '@/lib/api'

import sarveshPhoto from '@/assets/team/Sarvesh Chandran.jpg'
import swarajPhoto from '@/assets/team/Swaraj Bhattacharjee.jpeg'
import saattvikPhoto from '@/assets/team/Saatvik Tyagi.jpeg'
import kulvanshPhoto from '@/assets/team/Kulvansh Raghav.jpeg'


/* ═══════════════════════════════════════════════════════
   3D TILT — mouse-tracking perspective
   ═══════════════════════════════════════════════════════ */
function Tilt3D({ children, className = '', intensity = 12 }: {
  children: React.ReactNode; className?: string; intensity?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const rx = useMotionValue(0), ry = useMotionValue(0)
  const sx = useSpring(rx, { stiffness: 180, damping: 22 })
  const sy = useSpring(ry, { stiffness: 180, damping: 22 })

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * intensity)
    ry.set(((e.clientX - r.left) / r.width - 0.5) * intensity)
  }, [rx, ry, intensity])

  const onLeave = useCallback(() => { rx.set(0); ry.set(0) }, [rx, ry])

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ rotateX: sx, rotateY: sy, transformStyle: 'preserve-3d', perspective: 900 }}
      className={className}>
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   BIDIRECTIONAL SCROLL REVEAL
   ═══════════════════════════════════════════════════════ */
function Reveal({ children, className = '', delay = 0, y = 40 }: {
  children: React.ReactNode; className?: string; delay?: number; y?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: '-80px' })
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.6, delay: inView ? delay : 0, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════ */
const features = [
  { icon: Zap, title: 'Fast Brain (BM25)', desc: 'Lightning-fast keyword retrieval using Okapi BM25 ranking for precise term matching across your entire corpus.',
    gradient: 'from-cyan-500/20 to-blue-600/20', border: 'border-cyan-500/25 hover:border-cyan-400/50',
    iconBg: 'bg-cyan-500/20', iconColor: 'text-cyan-400', glow: 'rgba(34,211,238,0.15)' },
  { icon: Brain, title: 'Semantic Brain (Qdrant)', desc: 'Deep vector similarity search powered by Qdrant. Understands meaning and context beyond exact keyword matches.',
    gradient: 'from-purple-500/20 to-violet-600/20', border: 'border-purple-500/25 hover:border-purple-400/50',
    iconBg: 'bg-purple-500/20', iconColor: 'text-purple-400', glow: 'rgba(167,139,250,0.15)' },
  { icon: GitBranch, title: 'Deep Brain (Graph)', desc: 'Knowledge graph traversal via NetworkX. Maps entity relationships and concept hierarchies for deep reasoning.',
    gradient: 'from-violet-500/20 to-fuchsia-600/20', border: 'border-violet-500/25 hover:border-violet-400/50',
    iconBg: 'bg-violet-500/20', iconColor: 'text-violet-400', glow: 'rgba(139,92,246,0.15)' },
]

const pipeline = [
  { icon: Upload, title: 'Upload', desc: 'Drop PDFs, papers, or documents into your workspace.', color: 'text-cyan-400', bg: 'bg-cyan-500/15', accent: '#22d3ee' },
  { icon: Cpu, title: 'Process', desc: 'Tri-hybrid engine indexes via BM25, vectors & graph simultaneously.', color: 'text-purple-400', bg: 'bg-purple-500/15', accent: '#a78bfa' },
  { icon: Search, title: 'Query', desc: 'Ask anything — the engine auto-selects the best retrieval path.', color: 'text-violet-400', bg: 'bg-violet-500/15', accent: '#8b5cf6' },
  { icon: MessageSquare, title: 'Answer', desc: 'Get cited, context-aware answers generated from your own corpus.', color: 'text-emerald-400', bg: 'bg-emerald-500/15', accent: '#34d399' },
]

const techStack = [
  { name: 'Python', icon: Code2, color: 'text-yellow-400' },
  { name: 'FastAPI', icon: Zap, color: 'text-emerald-400' },
  { name: 'React', icon: CircuitBoard, color: 'text-cyan-400' },
  { name: 'Qdrant', icon: Database, color: 'text-purple-400' },
  { name: 'NetworkX', icon: Network, color: 'text-orange-400' },
  { name: 'BM25', icon: Search, color: 'text-amber-400' },
  { name: 'LangChain', icon: Braces, color: 'text-green-400' },
  { name: 'TypeScript', icon: Binary, color: 'text-blue-300' },
  { name: 'Tailwind', icon: Palette, color: 'text-sky-400' },
  { name: 'Framer', icon: Frame, color: 'text-pink-400' },
  { name: 'Zustand', icon: Boxes, color: 'text-amber-300' },
  { name: 'Vite', icon: Wind, color: 'text-violet-400' },
]

const capabilities = [
  { icon: Database, title: 'Multi-Format Ingestion', desc: 'PDF, DOCX, TXT — all supported out of the box.', accent: '#22d3ee' },
  { icon: BarChart3, title: 'Knowledge Graphs', desc: 'Interactive concept relationship visualization.', accent: '#a78bfa' },
  { icon: Shield, title: 'Workspace Isolation', desc: 'Each project stays fully separate and secure.', accent: '#8b5cf6' },
  { icon: Network, title: 'Tri-Hybrid RAG', desc: 'Three retrieval engines, one unified answer.', accent: '#e879f9' },
  { icon: BookOpen, title: 'Citation Tracking', desc: 'Every answer cites its source document.', accent: '#34d399' },
  { icon: Globe, title: 'Real-Time Streaming', desc: 'Watch answers stream as they generate.', accent: '#60a5fa' },
]

const team = [
  { name: 'Sarvesh Chandran', role: 'Lead · Full-Stack · Orchestrator', photo: sarveshPhoto,
    accent: '#22d3ee', gradient: 'from-cyan-500 to-blue-600' },
  { name: 'Swaraj Bhattacharjee', role: 'BM25 Engine · API', photo: swarajPhoto,
    accent: '#a78bfa', gradient: 'from-purple-500 to-violet-600' },
  { name: 'Saatvik Tyagi', role: 'Qdrant Vectors · Graph', photo: saattvikPhoto,
    accent: '#818cf8', gradient: 'from-indigo-500 to-violet-600' },
  { name: 'Kulvansh Raghav', role: 'Text Preprocessing · NLP', photo: kulvanshPhoto,
    accent: '#34d399', gradient: 'from-emerald-500 to-teal-600' },
]

/* ═══════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 0.95])
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    authStatus().then((s) => { if (s.logged_in) navigate('/dashboard/sources', { replace: true }) }).catch(() => {})
  }, [navigate])

  useEffect(() => {
    const h = (e: MouseEvent) => setMouse({
      x: (e.clientX / window.innerWidth - 0.5) * 2,
      y: (e.clientY / window.innerHeight - 0.5) * 2,
    })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  return (
    <PageTransition>
      <div ref={containerRef} className="overflow-x-hidden text-3d">

        {/* ━━━━━━━━━━ HERO ━━━━━━━━━━ */}
        <motion.section style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">

          {/* Mouse-reactive ambient orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div animate={{ x: mouse.x * 18, y: mouse.y * 14 }}
              transition={{ type: 'spring', stiffness: 40, damping: 30 }}
              className="absolute top-[20%] left-[12%] w-[420px] h-[420px] rounded-full bg-cyan-500/[0.05] blur-[100px]" />
            <motion.div animate={{ x: mouse.x * -22, y: mouse.y * -18 }}
              transition={{ type: 'spring', stiffness: 40, damping: 30 }}
              className="absolute bottom-[25%] right-[12%] w-[500px] h-[500px] rounded-full bg-purple-500/[0.05] blur-[120px]" />
          </div>

          <div className="relative max-w-5xl mx-auto flex flex-col items-center justify-center text-center z-10 w-full pt-10">
            <Reveal delay={0.05}>
              <div style={{ perspective: '800px' }}>
                <motion.h1
                  className="text-8xl md:text-9xl lg:text-[9rem] font-extrabold tracking-tight leading-[0.95]"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    transformStyle: 'preserve-3d',
                    filter: [
                      'drop-shadow(0 1px 0 rgba(0,0,0,0.4))',
                      'drop-shadow(0 2px 0 rgba(0,0,0,0.35))',
                      'drop-shadow(0 4px 0 rgba(0,0,0,0.3))',
                      'drop-shadow(0 6px 1px rgba(0,0,0,0.25))',
                      'drop-shadow(0 8px 2px rgba(0,0,0,0.2))',
                      'drop-shadow(0 12px 8px rgba(0,0,0,0.15))',
                      'drop-shadow(0 20px 20px rgba(0,0,0,0.1))',
                    ].join(' '),
                  }}
                  animate={{
                    rotateX: [2, -1, 2],
                    rotateY: [-1, 1, -1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <AnimatedGradientText colorFrom="#22d3ee" colorVia="#a78bfa" colorTo="#22d3ee" speed={0.8}>
                     Edu Nexus
                  </AnimatedGradientText>
                </motion.h1>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="text-2xl md:text-3xl text-text-primary font-semibold mt-5 tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                The Intelligent Backbone for Academic Mastery
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mt-4 leading-relaxed">
                Upload research papers, query across three AI retrieval engines, and build
                knowledge graphs — all in one unified workspace.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="flex flex-wrap items-center gap-4 mt-10 justify-center">
                <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(34,211,238,0.3)' }}
                  whileTap={{ scale: 0.97 }} onClick={() => navigate('/sign-up')}
                  className="shimmer-btn group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-base shadow-lg shadow-cyan-500/20 cursor-pointer">
                  Launch Workspace
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/sign-in')}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-border-default text-text-primary font-semibold cursor-pointer hover:bg-white/[0.06] hover:border-border-strong transition-all duration-200">
                  Sign In
                </motion.button>
              </div>
            </Reveal>
          </div>

          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <ChevronDown size={24} className="text-text-muted/50" />
          </motion.div>
        </motion.section>

        {/* ━━━━━━━━━━ TRI-HYBRID FEATURES ━━━━━━━━━━ */}
        <section className="relative py-32 px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-transparent pointer-events-none" />
          <div className="relative max-w-6xl mx-auto">
            <Reveal>
              <div className="text-center mb-20 relative flex flex-col items-center justify-center">
                {/* Subtle surrounding animated glow */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[150%] bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-[100%] blur-[60px] -z-10 pointer-events-none"
                />
                <h2 className="text-5xl md:text-6xl font-bold text-text-primary relative z-10" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Tri-Hybrid Intelligence
                </h2>
                <p className="text-text-secondary text-xl mt-4 max-w-lg mx-auto relative z-10">
                  Three specialized retrieval engines working in concert.
                </p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={0.1 * i}>
                  <Tilt3D intensity={8}>
                    <MagicCard gradientColor={f.glow} gradientOpacity={0.5} gradientSize={280}>
                      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.25 }}
                        className={`relative p-8 h-full rounded-2xl border ${f.border} bg-[#0A0A0A] bg-gradient-to-br ${f.gradient} backdrop-blur-3xl cursor-default transition-all duration-200`}>
                        <motion.div whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                          className={`w-14 h-14 rounded-xl ${f.iconBg} border border-white/[0.1] flex items-center justify-center mb-6`}>
                          <f.icon className={f.iconColor} size={26} />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-text-primary mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {f.title}
                        </h3>
                        <p className="text-text-secondary text-base leading-relaxed">{f.desc}</p>
                      </motion.div>
                    </MagicCard>
                  </Tilt3D>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ HOW IT WORKS ━━━━━━━━━━ */}
        <section className="relative py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <h2 className="text-5xl md:text-6xl font-bold text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  How It Works
                </h2>
                <p className="text-text-secondary text-xl mt-4 max-w-md mx-auto">
                  From upload to insight in four simple steps.
                </p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {pipeline.map((step, i) => (
                <Reveal key={step.title} delay={0.12 * i}>
                  <Tilt3D intensity={8}>
                    <motion.div whileHover={{ y: -6, boxShadow: `0 8px 40px ${step.accent}15` }}
                      transition={{ duration: 0.25 }}
                      className="group relative p-7 rounded-2xl border border-white/[0.12] bg-black/60 backdrop-blur-3xl text-center cursor-default transition-all duration-200 hover:border-white/[0.22] hover:bg-black/40">
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-cyan-500/20">
                        {i + 1}
                      </div>
                      {/* Connecting dashes between cards */}
                      {i < 3 && (
                        <div className="hidden lg:flex absolute top-1/2 -right-3 items-center">
                          <motion.div animate={{ opacity: [0.2, 0.6, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                            className="w-6 h-px" style={{ background: `linear-gradient(90deg, ${step.accent}60, transparent)` }} />
                        </div>
                      )}
                      <motion.div whileHover={{ rotate: 360, scale: 1.15 }}
                        transition={{ duration: 0.6 }}
                        className={`w-14 h-14 rounded-xl ${step.bg} border border-white/[0.1] flex items-center justify-center mx-auto mb-5`}>
                        <step.icon size={24} className={step.color} />
                      </motion.div>
                      <h3 className="text-xl font-bold text-text-primary mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {step.title}
                      </h3>
                      <p className="text-text-secondary text-base leading-relaxed">{step.desc}</p>
                    </motion.div>
                  </Tilt3D>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ CAPABILITIES ━━━━━━━━━━ */}
        <section className="relative py-28 px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-transparent pointer-events-none" />
          <div className="relative max-w-6xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <h2 className="text-5xl md:text-6xl font-bold text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Built for Researchers
                </h2>
                <p className="text-text-secondary text-xl mt-4 max-w-md mx-auto">
                  Every feature designed to accelerate your academic workflow.
                </p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {capabilities.map((cap, i) => (
                <Reveal key={cap.title} delay={0.08 * i}>
                  <motion.div whileHover={{ y: -3, boxShadow: `0 4px 30px ${cap.accent}12` }}
                    transition={{ duration: 0.2 }}
                    className="group flex items-start gap-4 p-6 rounded-2xl border border-white/[0.12] bg-white/[0.08] backdrop-blur-xl cursor-default transition-all duration-200 hover:border-white/[0.22] hover:bg-white/[0.12]">
                    <motion.div whileHover={{ scale: 1.15, rotate: -8 }} transition={{ duration: 0.3 }}
                      className="w-11 h-11 shrink-0 rounded-xl border border-white/[0.1] flex items-center justify-center transition-colors duration-200"
                      style={{ backgroundColor: `${cap.accent}18` }}>
                      <cap.icon size={20} style={{ color: cap.accent }} />
                    </motion.div>
                    <div>
                      <h3 className="text-base font-bold text-text-primary mb-1">{cap.title}</h3>
                      <p className="text-text-secondary text-sm leading-relaxed">{cap.desc}</p>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ TECH STACK — FULL-WIDTH MARQUEE ━━━━━━━━━━ */}
        <section className="relative py-24 overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 mb-12">
            <Reveal>
              <div className="text-center">
                <h2 className="text-5xl md:text-6xl font-bold text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Tech Stack
                </h2>
              </div>
            </Reveal>
          </div>

          <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
            <Marquee pauseOnHover className="[--duration:30s] [--gap:1rem] mb-4">
              {techStack.map((t) => (
                <motion.div key={t.name} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-white/[0.12] bg-white/[0.08] backdrop-blur-xl cursor-default transition-all duration-200 hover:border-cyan-500/30 hover:bg-white/[0.14]">
                  <t.icon size={20} className={t.color} />
                  <span className="font-semibold text-sm text-text-primary whitespace-nowrap">{t.name}</span>
                </motion.div>
              ))}
            </Marquee>

            <Marquee reverse pauseOnHover className="[--duration:35s] [--gap:1rem]">
              {techStack.slice().reverse().map((t) => (
                <motion.div key={`r-${t.name}`} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-white/[0.12] bg-white/[0.08] backdrop-blur-xl cursor-default transition-all duration-200 hover:border-purple-500/30 hover:bg-white/[0.14]">
                  <t.icon size={20} className={t.color} />
                  <span className="font-semibold text-sm text-text-primary whitespace-nowrap">{t.name}</span>
                </motion.div>
              ))}
            </Marquee>
          </div>
        </section>

        {/* ━━━━━━━━━━ TEAM PraxisX ━━━━━━━━━━ */}
        <section className="relative py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="text-center mb-16">
                <h2 className="text-5xl md:text-6xl font-bold text-text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Team{' '}
                  <AnimatedGradientText colorFrom="#22d3ee" colorVia="#a78bfa" colorTo="#ec4899" speed={1.2}>
                    PraxisX
                  </AnimatedGradientText>
                </h2>
                <p className="text-text-secondary text-xl mt-4 max-w-lg mx-auto">
                  Four engineers. One mission. Smarter academic AI.
                </p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((m, i) => (
                <Reveal key={m.name} delay={0.1 * i}>
                  <Tilt3D intensity={12}>
                    <motion.div whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      className="group relative p-6 rounded-2xl border border-white/[0.12] bg-white/[0.08] backdrop-blur-xl text-center cursor-default transition-all duration-300 hover:bg-white/[0.14] hover:border-white/[0.2]">

                      <div className="relative mx-auto w-[140px] h-[140px] mb-5">
                        <div className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: `conic-gradient(from 0deg, transparent 0%, ${m.accent}40 25%, transparent 50%, ${m.accent}40 75%, transparent 100%)`,
                            animation: 'spin 4s linear infinite',
                          }} />
                        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-xl"
                          style={{ backgroundColor: m.accent }} />
                        <img src={m.photo} alt={m.name}
                          className="relative w-full h-full rounded-full object-cover border-2 border-white/[0.12] group-hover:border-transparent transition-all duration-300 z-10" />
                      </div>

                      <h3 className="text-[15px] font-bold text-text-primary mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {m.name}
                      </h3>
                      <p className="text-text-secondary text-xs font-medium leading-relaxed">{m.role}</p>
                    </motion.div>
                  </Tilt3D>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ FOOTER CTA ━━━━━━━━━━ */}
        <section className="relative py-24 px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 pointer-events-none" />
          <div className="relative max-w-3xl mx-auto text-center">
            <Reveal>
              <h2 className="text-5xl md:text-6xl font-bold text-text-primary mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Ready to Transform Your Research?
              </h2>
              <p className="text-text-secondary text-xl mb-10 max-w-xl mx-auto">
                Join students and researchers who use Edu Nexus to study smarter.
              </p>
            </Reveal>

            <Reveal delay={0.12}>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(34,211,238,0.25), 0 0 80px rgba(167,139,250,0.12)' }}
                whileTap={{ scale: 0.97 }} onClick={() => navigate('/sign-up')}
                className="shimmer-btn group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-lg shadow-xl shadow-cyan-500/20 cursor-pointer">
                Get Started Free
                <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-200" />
              </motion.button>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-16 pt-8 border-t border-border-subtle">
                <p className="text-text-secondary text-sm mb-3">
                  Built with care by <span className="text-text-primary font-semibold">Team PraxisX</span>
                </p>
                <a href="mailto:praxisx35@gmail.com"
                  className="inline-flex items-center gap-2 text-text-secondary text-sm hover:text-accent-cyan transition-colors duration-200 cursor-pointer">
                  <Mail size={14} /> praxisx35@gmail.com
                </a>
              </div>
            </Reveal>
          </div>
        </section>

      </div>
    </PageTransition>
  )
}
