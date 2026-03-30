import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, FolderPlus, ArrowRight } from 'lucide-react'
import { useWorkspace } from '@/stores/workspaceStore'
import { useAuth } from '@/stores/authStore'
import AnimatedGradientText from '@/components/magicui/AnimatedGradientText'

/**
 * Forced workspace creation page — shown after first sign-up.
 * User must create at least one workspace before proceeding.
 */
export default function SetupWorkspace() {
  const navigate = useNavigate()
  const createWorkspace = useWorkspace((s) => s.createWorkspace)
  const workspaces = useWorkspace((s) => s.workspaces)
  const isNewUser = useAuth((s) => s.isNewUser)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  // If user already has workspaces (e.g. navigated here by mistake), redirect
  if (workspaces.length > 0 && !isNewUser) {
    navigate('/dashboard/sources', { replace: true })
    return null
  }

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a workspace name')
      return
    }
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters')
      return
    }
    try {
      createWorkspace(trimmed)
      navigate('/onboarding')
    } catch (err: any) {
      setError(err?.message || 'Failed to create workspace')
    }
  }

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg"
      >
        <div className="relative rounded-3xl border border-border-default bg-bg-card backdrop-blur-xl p-10 overflow-hidden">
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 opacity-30 pointer-events-none"
            animate={{
              background: [
                'radial-gradient(500px circle at 30% 40%, rgba(34,211,238,0.15), transparent 60%)',
                'radial-gradient(500px circle at 70% 60%, rgba(139,92,246,0.15), transparent 60%)',
                'radial-gradient(500px circle at 30% 40%, rgba(34,211,238,0.15), transparent 60%)',
              ],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="relative mb-6">
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 opacity-20"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-xl shadow-cyan-500/30">
                <FolderPlus className="text-white" size={30} />
              </div>
            </div>

            {/* Title */}
            <h1
              className="text-2xl font-extrabold text-text-primary mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Create your first{' '}
              <AnimatedGradientText
                colorFrom="#22d3ee"
                colorVia="#a78bfa"
                colorTo="#22d3ee"
                speed={0.8}
                className="font-extrabold"
              >
                Workspace
              </AnimatedGradientText>
            </h1>
            <p className="text-text-secondary text-sm mb-8 max-w-sm leading-relaxed">
              Workspaces organize your documents, chats, and knowledge graphs.
              Give your first workspace a name to get started.
            </p>

            {/* Input */}
            <div className="w-full max-w-xs mb-4">
              <input
                autoFocus
                value={name}
                onChange={(e) => { setName(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. Machine Learning, Thesis..."
                className="w-full bg-bg-app border border-border-default rounded-xl px-4 py-3.5 text-text-primary text-sm font-medium outline-none focus:border-accent-cyan/60 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)] transition-all placeholder:text-text-muted"
              />
              {error && (
                <p className="text-red-400 text-xs mt-2 text-left">{error}</p>
              )}
            </div>

            {/* Create button */}
            <button
              onClick={handleCreate}
              className="group w-full max-w-xs flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.02]"
            >
              <Sparkles size={16} />
              Create Workspace
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-text-muted text-xs mt-6">
              You can create up to 5 workspaces with 5 chats each.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
