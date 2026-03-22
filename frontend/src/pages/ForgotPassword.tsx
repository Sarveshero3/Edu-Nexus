import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, ArrowLeft, Sparkles, ArrowRight } from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import BlurFade from '@/components/magicui/BlurFade'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSent(true)
  }

  return (
    <PageTransition className="min-h-screen flex items-center justify-center px-6 py-12">
      <BlurFade delay={0.1} inView={false}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="relative w-full max-w-2xl rounded-3xl border border-white/[0.14] bg-white/[0.07] backdrop-blur-2xl p-14 shadow-2xl shadow-black/30 overflow-hidden transition-all duration-500 hover:shadow-cyan-500/15 hover:border-white/[0.22]"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${glowPos.x}% ${glowPos.y}%, rgba(34,211,238,0.15), rgba(139,92,246,0.08) 40%, transparent 70%)`,
              opacity: isHovering ? 1 : 0,
            }}
          />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-8 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <Sparkles className="text-white" size={22} />
              </div>
              <span
                className="text-white font-bold text-xl tracking-tight group-hover:text-cyan-300 transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Edu Nexus
              </span>
            </Link>

            {!sent ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10 flex items-center justify-center">
                    <Mail className="text-cyan-400" size={28} />
                  </div>
                </div>

                <h1
                  className="text-3xl font-extrabold text-white text-center mb-3"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    textShadow: '0 4px 24px rgba(0,0,0,0.6)',
                  }}
                >
                  Reset your password
                </h1>
                <p className="text-white/80 text-center text-base mb-8 font-medium" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                  Enter your university email and we'll send a reset link.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto">
                  <div>
                    <label className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2.5 block">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@university.edu"
                      required
                      className="w-full bg-white/[0.10] border border-white/[0.15] rounded-xl px-4 py-4 text-white text-base font-medium outline-none focus:border-cyan-500/60 focus:bg-white/[0.12] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] transition-all placeholder:text-white/40 backdrop-blur-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    className="group w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.02] mt-2"
                  >
                    Send reset link
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle className="text-emerald-400" size={28} />
                  </div>
                </div>
                <h2
                  className="text-2xl font-extrabold text-white mb-3"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    textShadow: '0 4px 24px rgba(0,0,0,0.6)',
                  }}
                >
                  Check your inbox
                </h2>
                <p className="text-white/80 text-base font-medium">
                  We've sent a password reset link to <strong className="text-white">{email}</strong>
                </p>
              </motion.div>
            )}

            <Link
              to="/sign-in"
              className="flex items-center gap-2 text-cyan-400 text-base font-medium mt-10 hover:text-cyan-300 justify-center transition-colors"
            >
              <ArrowLeft size={16} /> Back to Sign In
            </Link>
          </div>
        </div>
      </BlurFade>
    </PageTransition>
  )
}
