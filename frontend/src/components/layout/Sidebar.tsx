import { NavLink, useNavigate } from 'react-router-dom'
import {
  FolderOpen, MessageSquare, GitBranch, Clock,
  Settings, LogOut, Sparkles
} from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { useSidebar } from '@/stores/sidebarStore'
import { cn } from '@/lib/utils'

const navSections = [
  {
    label: 'KNOWLEDGE BASE',
    links: [
      { to: '/dashboard/sources', icon: FolderOpen, label: 'Sources' },
    ],
  },
  {
    label: 'NAVIGATION',
    links: [
      { to: '/dashboard/chat', icon: MessageSquare, label: 'Chat Assistant' },
      { to: '/dashboard/graph', icon: GitBranch, label: 'Graph Explorer' },
      { to: '/dashboard/history', icon: Clock, label: 'History' },
    ],
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const signOut = useAuth((s) => s.signOut)
  const user = useAuth((s) => s.user)
  const collapsed = useSidebar((s) => s.collapsed)

  const handleLogout = () => {
    signOut()
    navigate('/sign-in')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-bg-sidebar flex flex-col z-40 transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <Sparkles className="text-accent-cyan shrink-0" size={24} />
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight">Edu Nexus</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 flex flex-col gap-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-text-muted text-[10px] font-semibold tracking-widest uppercase px-3 mb-2">
                {section.label}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-3')
                  }
                >
                  <link.icon size={18} />
                  {!collapsed && <span>{link.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 flex flex-col gap-1 border-t border-[rgba(255,255,255,0.06)] pt-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-3')
          }
        >
          <Settings size={18} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-3')
          }
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && <span>Profile</span>}
        </NavLink>
        <button
          onClick={handleLogout}
          className={cn(
            'sidebar-link text-red-400 hover:text-red-300 hover:bg-red-500/10',
            collapsed && 'justify-center px-3'
          )}
        >
          <LogOut size={18} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  )
}
