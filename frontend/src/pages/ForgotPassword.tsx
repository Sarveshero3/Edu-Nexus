import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react'
import PageTransition from '@/components/common/PageTransition'
import PillButton from '@/components/common/PillButton'
import GlassCard from '@/components/common/GlassCard'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSent(true)
  }

  return (
    <PageTransition className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
      <GlassCard hover={false} className="w-full max-w-md p-8">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <Sparkles className="text-accent-cyan" size={24} />
          <span className="text-white font-bold text-xl">Edu Nexus</span>
        </Link>

        {!sent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-center mb-6">
              <Mail className="text-accent-cyan" size={40} />
            </div>
            <h1 className="text-2xl font-bold text-white text-center mb-2">Reset your password</h1>
            <p className="text-text-muted text-center text-sm mb-8">
              Enter your university email and we'll send a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="input-field"
                required
              />
              <PillButton type="submit" fullWidth>Send reset link →</PillButton>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <CheckCircle className="text-green-400 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
            <p className="text-text-muted text-sm">
              We've sent a password reset link to <strong className="text-white">{email}</strong>
            </p>
          </motion.div>
        )}

        <Link
          to="/sign-in"
          className="flex items-center gap-2 text-accent-cyan text-sm mt-8 hover:underline justify-center"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </GlassCard>
    </PageTransition>
  )
}
