import Sidebar from './Sidebar'
import { useSidebar } from '@/stores/sidebarStore'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const collapsed = useSidebar((s) => s.collapsed)

  return (
    <div className="min-h-screen bg-bg-app">
      <Sidebar />
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          collapsed ? 'ml-[68px]' : 'ml-[240px]'
        )}
      >
        {children}
      </main>
    </div>
  )
}
