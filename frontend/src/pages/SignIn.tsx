import { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Lock, UserX } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/stores/authStore'
import { authStatus } from '@/lib/api'
import PageTransition from '@/components/common/PageTransition'
import BlurFade from '@/components/magicui/BlurFade'
import AnimatedGradientText from '@/components/magicui/AnimatedGradientText'

const schema = z.object({
  username: z.string().min(2, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function SignIn() {
  const navigate = useNavigate()
  const signIn = useAuth((s) => s.signIn)
  const isLoading = useAuth((s) => s.isLoading)
  const [error, setError] = useState('')
  const [existingUser, setExistingUser] = useState<string | null>(null)
  const [noAccount, setNoAccount] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = useState(false)

  // Check if user exists
  useEffect(() => {
    authStatus().then((status) => {
      if (status.registered) {
        setExistingUser(status.username)
        // If already logged in, redirect
        if (status.logged_in) {
          navigate('/dashboard/sources', { replace: true })
        }
      } else {
        setNoAccount(true)
      }
    }).catch(() => {})
  }, [navigate])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setGlowPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await signIn(data.username, data.password)
      navigate('/dashboard/sources')
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials')
    }
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
          {/* Cursor glow */}
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${glowPos.x}% ${glowPos.y}%, rgba(34,211,238,0.15), rgba(139,92,246,0.08) 40%, transparent 70%)`,
              opacity: isHovering ? 1 : 0,
            }}
          />

          <div className="relative z-10">
            {/* Logo */}
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

            <h1
              className="text-4xl font-extrabold text-white mb-2 leading-tight"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                textShadow: '0 4px 24px rgba(0,0,0,0.6)',
              }}
            >
              Welcome{' '}
              <AnimatedGradientText colorFrom="#22d3ee" colorVia="#a78bfa" colorTo="#22d3ee" speed={0.8} className="font-extrabold">
                Back
              </AnimatedGradientText>
            </h1>

            {/* Welcome back hint */}
            {existingUser && (
              <p className="text-white/80 text-base mb-6 font-medium" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                Welcome back, <span className="text-cyan-400 font-semibold">{existingUser}</span>. Sign in to access your knowledge graphs.
              </p>
            )}

            {/* No account warning */}
            {noAccount && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2">
                  <UserX className="text-amber-400" size={16} />
                  <p className="text-amber-300 text-sm font-medium">No account found on this machine.</p>
                </div>
                <p className="text-white/60 text-xs mt-1">
                  <Link to="/sign-up" className="text-cyan-400 hover:text-cyan-300 font-bold">Create an account</Link> to get started.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {!noAccount && (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-y-4">
                  <div>
                    <label className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2.5 block">Username</label>
                    <input
                      {...register('username')}
                      defaultValue={existingUser || ''}
                      placeholder="Your username"
                      className="w-full bg-bg-input border border-border-default rounded-xl px-4 py-4 text-white text-base font-medium outline-none focus:border-accent-cyan/60 focus:bg-bg-input-focus focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] transition-all placeholder:text-white/50 backdrop-blur-sm"
                    />
                    {errors.username && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.username.message}</p>}
                  </div>
                  <div>
                    <label className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2.5 block">Password</label>
                    <input
                      {...register('password')}
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-bg-input border border-border-default rounded-xl px-4 py-4 text-white text-base font-medium outline-none focus:border-accent-cyan/60 focus:bg-bg-input-focus focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] transition-all placeholder:text-white/50 backdrop-blur-sm"
                    />
                    {errors.password && <p className="text-red-400 text-xs mt-1 font-medium">{errors.password.message}</p>}
                    <div className="mt-2 text-right">
                      <Link to="/forgot-password" className="text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-colors">Forgot your password?</Link>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  <Lock size={18} />
                  {isLoading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}

            <p className="text-white/60 text-base mt-6 font-medium">
              Don't have an account?{' '}
              <Link to="/sign-up" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">Create one</Link>
            </p>
          </div>
        </div>
      </BlurFade>
    </PageTransition>
  )
}
