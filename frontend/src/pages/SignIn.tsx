import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/stores/authStore'
import PageTransition from '@/components/common/PageTransition'
import BlurFade from '@/components/magicui/BlurFade'
import AnimatedGradientText from '@/components/magicui/AnimatedGradientText'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function SignIn() {
  const navigate = useNavigate()
  const signIn = useAuth((s) => s.signIn)
  const isLoading = useAuth((s) => s.isLoading)

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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await signIn(data.email, data.password)
    navigate('/dashboard/sources')
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
            <p className="text-white/80 text-base mb-8 font-medium" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              Sign in to access your knowledge graphs.
            </p>

            {/* Two-column layout for wider card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2.5 block">Email</label>
                <input
                  {...register('email')}
                  placeholder="your@university.edu"
                  className="w-full bg-white/[0.10] border border-white/[0.15] rounded-xl px-4 py-4 text-white text-base font-medium outline-none focus:border-cyan-500/60 focus:bg-white/[0.12] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] transition-all placeholder:text-white/40 backdrop-blur-sm"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2.5 block">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/[0.10] border border-white/[0.15] rounded-xl px-4 py-4 text-white text-base font-medium outline-none focus:border-cyan-500/60 focus:bg-white/[0.12] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] transition-all placeholder:text-white/40 backdrop-blur-sm"
                />
                <div className="flex justify-end mt-2">
                  <Link to="/forgot-password" className="text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-1 font-medium">{errors.password.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              <Lock size={18} />
              {isLoading ? 'Signing in...' : 'Sign In'}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

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
