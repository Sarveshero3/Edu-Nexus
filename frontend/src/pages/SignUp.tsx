import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, FileText, Cpu, Target } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/stores/authStore'
import PageTransition from '@/components/common/PageTransition'
import PillButton from '@/components/common/PillButton'
import GlassCard from '@/components/common/GlassCard'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid university email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const stats = [
  { icon: FileText, value: '1,024+', label: 'documents indexed' },
  { icon: Cpu, value: '3', label: 'retrieval engines' },
  { icon: Target, value: '99.2%', label: 'query accuracy' },
]

export default function SignUp() {
  const navigate = useNavigate()
  const signUp = useAuth((s) => s.signUp)
  const isLoading = useAuth((s) => s.isLoading)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await signUp(data.name, data.email, data.password)
    navigate('/onboarding')
  }

  return (
    <PageTransition className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-full lg:w-1/2 bg-bg-primary flex flex-col justify-center px-8 lg:px-16 py-12">
        <Link to="/" className="flex items-center gap-2 mb-12">
          <Sparkles className="text-accent-cyan" size={24} />
          <span className="text-white font-bold text-xl">Edu Nexus</span>
        </Link>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Start your academic journey</h1>
        <p className="text-text-muted mb-8">Create your Edu Nexus account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-md">
          <div>
            <input {...register('name')} placeholder="Full name" className="input-field" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <input {...register('email')} placeholder="University email" className="input-field" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="input-field pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-xs hover:text-white"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="Confirm password"
              className="input-field"
            />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <PillButton type="submit" fullWidth disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account →'}
          </PillButton>
        </form>

        <p className="text-text-muted text-sm mt-6">
          Already have an account?{' '}
          <Link to="/sign-in" className="text-accent-cyan hover:underline">Sign in</Link>
        </p>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:flex w-1/2 bg-bg-app flex-col items-center justify-center px-12 relative overflow-hidden">
        {/* Gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 blur-[80px]" />

        <div className="relative z-10 flex flex-col gap-5 mb-12">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className="animate-float"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <GlassCard className="px-6 py-5 flex items-center gap-4">
                <s.icon className="text-accent-cyan" size={24} />
                <div>
                  <p className="text-white font-bold text-lg">{s.value}</p>
                  <p className="text-text-muted text-sm">{s.label}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <GlassCard hover={false} className="relative z-10 px-6 py-5 max-w-sm">
          <p className="text-text-muted text-sm italic leading-relaxed">
            "Edu Nexus transformed how I approach literature reviews. The tri-hybrid search
            finds connections I would have missed entirely."
          </p>
          <p className="text-white text-sm font-semibold mt-3">Dr. Priya Sharma</p>
          <p className="text-text-muted text-xs">Stanford University</p>
        </GlassCard>
      </div>
    </PageTransition>
  )
}
