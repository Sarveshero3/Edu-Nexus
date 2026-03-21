import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/stores/authStore'
import PageTransition from '@/components/common/PageTransition'
import PillButton from '@/components/common/PillButton'
import GlassCard from '@/components/common/GlassCard'

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

const engines = [
  { label: 'BM25 Keyword', pct: 80, color: '#5BC8F5' },
  { label: 'FAISS Semantic', pct: 65, color: '#A78BFA' },
  { label: 'Neo4j Graph', pct: 50, color: '#7C3AED' },
]

export default function SignIn() {
  const navigate = useNavigate()
  const signIn = useAuth((s) => s.signIn)
  const isLoading = useAuth((s) => s.isLoading)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await signIn(data.email, data.password)
    navigate('/dashboard/sources')
  }

  return (
    <PageTransition className="min-h-screen flex">
      {/* Left */}
      <div className="w-full lg:w-1/2 bg-bg-primary flex flex-col justify-center px-8 lg:px-16 py-12">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <Sparkles className="text-accent-cyan" size={24} />
          <span className="text-white font-bold text-xl">Edu Nexus</span>
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-text-muted mb-8">Sign in to access your knowledge graphs.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-md">
          <div>
            <input {...register('email')} placeholder="Email" className="input-field" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <input {...register('password')} type="password" placeholder="Password" className="input-field" />
            <div className="flex justify-end mt-1">
              <Link to="/forgot-password" className="text-accent-cyan text-xs hover:underline">
                Forgot password?
              </Link>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <PillButton type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In →'}
          </PillButton>
        </form>

        <p className="text-text-muted text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/sign-up" className="text-accent-cyan hover:underline">Create one</Link>
        </p>
      </div>

      {/* Right */}
      <div className="hidden lg:flex w-1/2 bg-bg-app flex-col items-center justify-center px-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-gradient-to-br from-accent-cyan/15 to-accent-purple/15 blur-[80px]" />

        <GlassCard hover={false} className="relative z-10 p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-accent-cyan" size={28} />
            <h3 className="text-white font-bold text-lg">Tri-Hybrid RAG Engine</h3>
          </div>

          <div className="flex flex-col gap-5">
            {engines.map((e, i) => (
              <div key={e.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-text-muted">{e.label}</span>
                  <span className="text-white font-medium">{e.pct}%</span>
                </div>
                <div className="h-2 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${e.pct}%` }}
                    transition={{ delay: 0.5 + i * 0.2, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: e.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard hover={false} className="relative z-10 px-6 py-5 max-w-sm mt-6">
          <p className="text-text-muted text-sm italic leading-relaxed">
            "The knowledge graph feature alone saved me weeks of manual cross-referencing
            during my dissertation research."
          </p>
          <p className="text-white text-sm font-semibold mt-3">Alex Chen, PhD</p>
          <p className="text-text-muted text-xs">MIT Media Lab</p>
        </GlassCard>
      </div>
    </PageTransition>
  )
}
