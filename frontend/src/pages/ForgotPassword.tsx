import { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, Sparkles, Lock } from 'lucide-react'
import { authStatus } from '@/lib/api'
import PageTransition from '@/components/common/PageTransition'
import BlurFade from '@/components/magicui/BlurFade'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [noAccount, setNoAccount] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = useState(false)

  // Guard: redirect if no account exists
  useEffect(() => {
    authStatus().then((status) => {
      if (!status.registered) {
        setNoAccount(true)
      }
    }).catch(() => {})
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

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

            {noAccount ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <AlertTriangle className="text-amber-400" size={28} />
                  </div>
                </div>
                <h1
                  className="text-3xl font-extrabold text-white text-center mb-3"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    textShadow: '0 4px 24px rgba(0,0,0,0.6)',
                  }}
                >
                  No account found
                </h1>
                <p className="text-white/80 text-center text-base mb-6 font-medium">
                  There's no account on this machine. Password reset is not available.
                </p>
                <div className="flex justify-center gap-3">
                  <Link
                    to="/sign-up"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-sm hover:scale-[1.02] transition-all"
                  >
                    Create an Account
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/10 flex items-center justify-center">
                    <Lock className="text-cyan-400" size={28} />
                  </div>
                </div>
                <h1
                  className="text-3xl font-extrabold text-white text-center mb-3"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    textShadow: '0 4px 24px rgba(0,0,0,0.6)',
                  }}
                >
                  Password Recovery
                </h1>
                <p className="text-white/80 text-center text-base mb-6 font-medium" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                  Edu Nexus is a local-only application. To reset your password, delete your account and create a new one from the Sign Up page.
                </p>
                <div className="flex justify-center gap-3">
                  <Link
                    to="/sign-up"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-sm hover:scale-[1.02] transition-all"
                  >
                    Go to Sign Up
                  </Link>
                </div>
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
