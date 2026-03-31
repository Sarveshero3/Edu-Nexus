import { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, UserPlus, Eye, EyeOff, AlertTriangle, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/stores/authStore'
import { authStatus, authDeleteAccount } from '@/lib/api'
import PageTransition from '@/components/common/PageTransition'
import BlurFade from '@/components/magicui/BlurFade'
import AnimatedGradientText from '@/components/magicui/AnimatedGradientText'

const schema = z.object({
  name: z.string().min(2, 'Username must be at least 2 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

const inputClass = "w-full bg-bg-input border border-border-default rounded-xl px-4 py-3.5 text-white text-base font-medium outline-none focus:border-accent-cyan/60 focus:bg-bg-input-focus focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] transition-all placeholder:text-white/50 backdrop-blur-sm"

export default function SignUp() {
  const navigate = useNavigate()
  const signUp = useAuth((s) => s.signUp)
  const isLoading = useAuth((s) => s.isLoading)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Single-user disclaimer state
  const [existingUser, setExistingUser] = useState<string | null>(null)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = useState(false)

  // Check if user already exists
  useEffect(() => {
    authStatus().then((status) => {
      if (status.registered) {
        setExistingUser(status.username ?? null)
        setShowDisclaimer(true)
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await signUp(data.name, data.password)
      navigate('/onboarding')
    } catch (err: any) {
      setError(err?.message || 'Registration failed')
    }
  }

  const handleDeleteAndContinue = async () => {
    setIsDeleting(true)
    try {
      await authDeleteAccount()
      localStorage.removeItem('edu-nexus-session-token')
      localStorage.removeItem('edu-nexus-workspaces')
      localStorage.removeItem('edu-nexus-auth')
      setExistingUser(null)
      setShowDisclaimer(false)
    } catch (err: any) {
      setError('Failed to delete existing account')
    }
    setIsDeleting(false)
  }

  return (
    <PageTransition className="h-screen flex items-center justify-center px-6">
      <BlurFade delay={0.1} inView={false}>
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="relative w-full max-w-2xl rounded-3xl border border-white/[0.14] bg-white/[0.07] backdrop-blur-2xl px-14 py-10 shadow-2xl shadow-black/30 overflow-hidden transition-all duration-500 hover:shadow-purple-500/15 hover:border-white/[0.22]"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${glowPos.x}% ${glowPos.y}%, rgba(139,92,246,0.15), rgba(34,211,238,0.08) 40%, transparent 70%)`,
              opacity: isHovering ? 1 : 0,
            }}
          />

          <div className="relative z-10">
            {/* Header row */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    <Sparkles className="text-white" size={20} />
                  </div>
                  <span
                    className="text-white font-bold text-lg tracking-tight group-hover:text-cyan-300 transition-colors"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    Edu Nexus
                  </span>
                </Link>
                <h1
                  className="text-3xl font-extrabold text-white leading-tight"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    textShadow: '0 4px 24px rgba(0,0,0,0.6)',
                  }}
                >
                  Start your{' '}
                  <AnimatedGradientText colorFrom="#22d3ee" colorVia="#a78bfa" colorTo="#22d3ee" speed={0.8} className="font-extrabold">
                    journey
                  </AnimatedGradientText>
                </h1>
                <p className="text-white/80 text-sm mt-1 font-medium" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                  Create your local Edu Nexus account.
                </p>
              </div>
            </div>

            {/* Disclaimer: account already exists */}
            {showDisclaimer && (
              <div className="mb-6 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="text-amber-300 font-bold text-sm mb-1">Account already exists</h3>
                    <p className="text-white/70 text-sm">
                      This machine already has an account for <span className="text-cyan-400 font-semibold">{existingUser}</span>.
                      Edu Nexus supports one user per machine.
                    </p>
                    <p className="text-white/50 text-xs mt-2">
                      You can sign in with the existing account, or delete everything and start fresh.
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                      <Link
                        to="/sign-in"
                        className="px-4 py-2 rounded-lg bg-bg-card border border-border-default text-white text-sm font-semibold hover:bg-bg-card-hover transition-colors"
                      >
                        Sign In Instead
                      </Link>
                      <button
                        onClick={handleDeleteAndContinue}
                        disabled={isDeleting}
                        className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {isDeleting ? 'Deleting...' : 'Delete Everything & Start Fresh'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Form — hidden when disclaimer is active */}
            {!showDisclaimer && (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-y-3">
                  <div>
                    <label className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 block">Username</label>
                    <input {...register('name')} placeholder="Choose a username" className={inputClass} />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div className="relative">
                    <label className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 block">Password</label>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 4 characters"
                      className={`${inputClass} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[38px] text-white/50 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                  </div>
                  <div>
                    <label className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 block">Confirm Password</label>
                    <input {...register('confirmPassword')} type="password" placeholder="••••••••" className={inputClass} />
                    {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <div className="mt-3 px-4 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-cyan-300 text-xs">
                    🔒 Single-user · This account is local to your machine. No cloud sync.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-5"
                >
                  <UserPlus size={18} />
                  {isLoading ? 'Creating account...' : 'Create Account'}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}

            <p className="text-white/60 text-sm mt-4 font-medium">
              Already have an account?{' '}
              <Link to="/sign-in" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </BlurFade>
    </PageTransition>
  )
}
