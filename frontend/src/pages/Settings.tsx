import { useState } from 'react'
import { useTheme } from '@/stores/themeStore'
import PageTransition from '@/components/common/PageTransition'
import GlassCard from '@/components/common/GlassCard'
import PillButton from '@/components/common/PillButton'
import { cn } from '@/lib/utils'

const themes = ['Light', 'Dark', 'System'] as const
const accents = [
  { id: 'cyan', color: '#5BC8F5' },
  { id: 'purple', color: '#A78BFA' },
  { id: 'coral', color: '#FF6B6B' },
  { id: 'teal', color: '#2DD4BF' },
] as const

const tabs = ['General', 'AI Engine', 'Appearance'] as const

export default function Settings() {
  const [activeTab, setActiveTab] = useState<string>('General')
  const { theme, accentColor, setTheme, setAccent } = useTheme()
  const [bm25, setBm25] = useState(40)
  const [faiss, setFaiss] = useState(40)
  const [neo4j, setNeo4j] = useState(20)
  const [mode, setMode] = useState('Auto')
  const [saved, setSaved] = useState(false)

  const adjustWeights = (target: string, val: number) => {
    const diff = val - (target === 'bm25' ? bm25 : target === 'faiss' ? faiss : neo4j)
    if (target === 'bm25') { setBm25(val); setFaiss(Math.max(0, faiss - diff / 2)); setNeo4j(Math.max(0, neo4j - diff / 2)) }
    else if (target === 'faiss') { setFaiss(val); setBm25(Math.max(0, bm25 - diff / 2)); setNeo4j(Math.max(0, neo4j - diff / 2)) }
    else { setNeo4j(val); setBm25(Math.max(0, bm25 - diff / 2)); setFaiss(Math.max(0, faiss - diff / 2)) }
  }

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
        </div>
      )}

      {activeTab === 'AI Engine' && (
        <div className="flex flex-col gap-6">
          {[{ label: 'BM25 Weight', val: bm25, key: 'bm25', color: '#5BC8F5' },
            { label: 'FAISS Weight', val: faiss, key: 'faiss', color: '#A78BFA' },
            { label: 'Neo4j Weight', val: neo4j, key: 'neo4j', color: '#7C3AED' }].map((s) => (
            <div key={s.key}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-text-muted">{s.label}</span>
                <span className="text-white font-medium">{Math.round(s.val)}</span>
              </div>
              <input type="range" min={0} max={100} value={s.val}
                onChange={(e) => adjustWeights(s.key, Number(e.target.value))}
                className="w-full accent-accent-cyan" style={{ accentColor: s.color }} />
            </div>
          ))}
          <div>
            <label className="text-text-muted text-xs block mb-1.5">Default Retrieval Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="input-field text-sm w-full max-w-xs">
              <option>Auto</option><option>Fast</option><option>Semantic</option><option>Deep</option>
            </select>
          </div>
          <GlassCard hover={false} className="p-4">
            <p className="text-text-muted text-sm">Current config: <span className="text-white">{Math.round(bm25)}% BM25 · {Math.round(faiss)}% FAISS · {Math.round(neo4j)}% Neo4j</span></p>
          </GlassCard>
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
