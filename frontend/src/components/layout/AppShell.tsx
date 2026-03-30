import { useEffect } from 'react'
import Sidebar from './Sidebar'
import { useSidebar } from '@/stores/sidebarStore'
import { useTheme, applyTheme } from '@/stores/themeStore'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const collapsed = useSidebar((s) => s.collapsed)
  const sidebarWidth = useSidebar((s) => s.width)
  
  const theme = useTheme((s) => s.theme)
  const accentColor = useTheme((s) => s.accentColor)

  useEffect(() => {
    // Apply user's selected theme for the dashboard
    applyTheme(theme, accentColor)
  }, [theme, accentColor])

  // Workspace existence is guaranteed by the SetupWorkspace page on first sign-up
  // and by preventing deletion of the last workspace — no auto-create needed

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
