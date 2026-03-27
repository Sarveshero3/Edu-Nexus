import Sidebar from './Sidebar'
import { useSidebar } from '@/stores/sidebarStore'
import { useWorkspace } from '@/stores/workspaceStore'
import WorkspaceGateModal from '@/components/common/WorkspaceGateModal'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const collapsed = useSidebar((s) => s.collapsed)
  const sidebarWidth = useSidebar((s) => s.width)
  const workspaces = useWorkspace((s) => s.workspaces)

  const needsWorkspace = workspaces.length === 0

  return (
    <div className="min-h-screen bg-bg-app">
      <Sidebar />
      <main
        className="min-h-screen transition-all duration-200"
        style={{ marginLeft: collapsed ? 68 : sidebarWidth }}
      >
        {children}
      </main>

      {/* Force workspace creation if none exist */}
      {needsWorkspace && <WorkspaceGateModal />}
    </div>
  )
}
