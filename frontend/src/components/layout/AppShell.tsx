import { useEffect } from 'react'
import Sidebar from './Sidebar'
import { useSidebar } from '@/stores/sidebarStore'
import { useWorkspace } from '@/stores/workspaceStore'
import { useTheme, applyTheme } from '@/stores/themeStore'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const collapsed = useSidebar((s) => s.collapsed)
  const sidebarWidth = useSidebar((s) => s.width)
  
  const workspaces = useWorkspace((s) => s.workspaces)
  const createWorkspace = useWorkspace((s) => s.createWorkspace)
  
  const theme = useTheme((s) => s.theme)
  const accentColor = useTheme((s) => s.accentColor)

  useEffect(() => {
    // Apply user's selected theme for the dashboard
    applyTheme(theme, accentColor)
  }, [theme, accentColor])

  useEffect(() => {
    // If user has no workspaces, automatically create a default one
    // This allows resuming a session seamlessly without an intrusive modal
    if (workspaces.length === 0) {
      createWorkspace('My Workspace')
    }
  }, [workspaces.length, createWorkspace])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <Sidebar />
      <main
        className="min-h-screen transition-all duration-200"
        style={{ marginLeft: collapsed ? 68 : sidebarWidth }}
      >
        {children}
      </main>
    </div>
  )
}
