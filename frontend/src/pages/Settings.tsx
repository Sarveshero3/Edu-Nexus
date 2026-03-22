import { useState } from 'react'
import { useTheme } from '@/stores/themeStore'
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

const tabs = ['General', 'Appearance'] as const

export default function Settings() {
  const [activeTab, setActiveTab] = useState<string>('General')
  const { theme, accentColor, setTheme, setAccent } = useTheme()
  const [saved, setSaved] = useState(false)

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <PageTransition className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="flex gap-2 mb-8">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={cn('px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeTab === t ? 'bg-accent-cyan/20 text-accent-cyan' : 'text-text-muted hover:text-white'
            )}>{t}</button>
        ))}
      </div>

      {activeTab === 'General' && (
        <div className="flex flex-col gap-6">
          <div>
            <label className="text-text-muted text-xs block mb-1.5">Language</label>
            <select className="input-field text-sm w-full max-w-xs"><option>English</option><option>Hindi</option><option>Spanish</option></select>
          </div>
          <div>
            <label className="text-text-muted text-xs block mb-1.5">Timezone</label>
            <select className="input-field text-sm w-full max-w-xs"><option>UTC+5:30 (IST)</option><option>UTC+0 (GMT)</option><option>UTC-5 (EST)</option></select>
          </div>
          <div>
            <label className="text-text-muted text-xs block mb-1.5">Account Email</label>
            <p className="text-white text-sm">user@university.edu</p>
          </div>
          <div className="mt-4 p-4 rounded-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
            <p className="text-text-muted text-sm">
              <span className="text-accent-cyan font-semibold">AI Engine:</span> The orchestrator automatically selects the optimal retrieval strategy (BM25, FAISS, Neo4j, or hybrid) for each query. No manual configuration needed.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'Appearance' && (
        <div className="flex flex-col gap-8">
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
      )}

      <div className="mt-8 flex items-center gap-4">
        <PillButton onClick={handleSave}>Save Settings</PillButton>
        {saved && <span className="text-green-400 text-sm">✓ Saved</span>}
      </div>
    </PageTransition>
  )
}
