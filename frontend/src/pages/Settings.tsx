import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/stores/themeStore'
import { useAuth } from '@/stores/authStore'
import PageTransition from '@/components/common/PageTransition'
import PillButton from '@/components/common/PillButton'
import { cn } from '@/lib/utils'

const themes = ['Light', 'Dark', 'System'] as const
const accents = [
  { id: 'cyan', color: '#5BC8F5' },
  { id: 'purple', color: '#A78BFA' },
  { id: 'coral', color: '#FF6B6B' },
  { id: 'teal', color: '#2DD4BF' },
] as const

export default function Settings() {
  const navigate = useNavigate()
  const { theme, accentColor, setTheme, setAccent } = useTheme()
  const deleteAccount = useAuth((s) => s.deleteAccount)
  const user = useAuth((s) => s.user)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    try {
      await deleteAccount()
      navigate('/')
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <PageTransition className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

      {/* AI Engine info */}
      <div className="p-4 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] mb-8">
        <p className="text-text-muted text-sm">
          <span className="text-accent-cyan font-semibold">AI Engine:</span> The orchestrator automatically selects the optimal retrieval strategy (BM25, Qdrant, NetworkX, or hybrid) for each query. No manual configuration needed.
        </p>
      </div>

      {/* Appearance */}
      <div className="mb-8">
        <h2 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Appearance</h2>
        <div className="flex flex-col gap-6">
          <div>
            <label className="text-text-muted text-xs block mb-3">Theme</label>
            <div className="flex gap-2">
              {themes.map((t) => (
                <button key={t} onClick={() => setTheme(t.toLowerCase() as any)}
                  className={cn('px-5 py-2 rounded-full text-sm font-medium transition-colors',
                    theme === t.toLowerCase() ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-text-muted border border-[rgba(255,255,255,0.1)] hover:text-white'
                  )}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-text-muted text-xs block mb-3">Accent Color</label>
            <div className="flex gap-3">
              {accents.map((a) => (
                <button key={a.id} onClick={() => setAccent(a.id as any)}
                  className={cn('w-10 h-10 rounded-full transition-all',
                    accentColor === a.id ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-app' : ''
                  )} style={{ backgroundColor: a.color }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="mb-8">
        <h2 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Account</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-text-muted text-xs block mb-1.5">Username</label>
            <p className="text-white text-sm font-medium">{user?.name || 'Unknown'}</p>
          </div>
          <div className="p-4 rounded-[12px] bg-red-500/5 border border-red-500/20">
            <h3 className="text-red-400 font-semibold text-sm mb-2">Danger Zone</h3>
            <p className="text-text-muted text-xs mb-4">
              Permanently delete your account and <strong>all data</strong> (documents, graphs, chat history). This cannot be undone.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className={cn(
                  'px-5 py-2.5 rounded-xl text-sm font-bold transition-all',
                  confirmDelete
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                )}
              >
                {deleting ? 'Deleting...' : confirmDelete ? 'Click Again to Confirm' : 'Delete Account & All Data'}
              </button>
              {confirmDelete && !deleting && (
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 text-text-muted text-sm hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <PillButton onClick={handleSave}>Save Settings</PillButton>
        {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
      </div>
    </PageTransition>
  )
}
