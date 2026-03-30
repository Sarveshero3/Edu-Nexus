import { useState } from 'react'
import { Sparkles, FolderPlus, ArrowRight } from 'lucide-react'
import { useWorkspace } from '@/stores/workspaceStore'

/**
 * Full-screen modal that FORCES the user to create their first workspace.
 * Cannot be dismissed — there is no close button.
 * Shown when workspaces.length === 0.
 */
export default function WorkspaceGateModal() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const createWorkspace = useWorkspace((s) => s.createWorkspace)

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
    createWorkspace(trimmed)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#0f1117] shadow-2xl shadow-black/50 p-8 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Sparkles className="text-text-inverse" size={28} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-text-primary text-center mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Create Your First Workspace
        </h2>
        <p className="text-text-muted text-sm text-center mb-6 max-w-xs mx-auto leading-relaxed">
          A workspace organizes your documents and conversations.
          You can create more later.
        </p>

        {/* Input */}
        <label className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-2 block">
          Workspace Name
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          placeholder='e.g. "Machine Learning", "Semester 6"'
          className="w-full bg-bg-input border border-border-default rounded-xl px-4 py-3.5 text-text-primary text-sm font-medium outline-none focus:border-accent-cyan/60 focus:bg-bg-input-focus focus:shadow-[0_0_0_3px_rgba(34,211,238,0.1)] transition-all placeholder:text-text-muted"
        />
        {error && (
          <p className="text-red-400 text-xs mt-1.5 font-medium">{error}</p>
        )}

        {/* Limits info */}
        <div className="mt-4 p-3 rounded-lg bg-bg-card border border-border-subtle">
          <p className="text-text-muted text-[11px] leading-relaxed">
            <span className="text-accent-cyan font-semibold">Limits:</span>{' '}
            20 documents per workspace · 50 MB per file · 5 uploads per minute
          </p>
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          className="group w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-text-inverse font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-[1.02] mt-5"
        >
          <FolderPlus size={18} />
          Create Workspace
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}
