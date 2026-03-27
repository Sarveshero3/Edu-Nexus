import { NavLink, useNavigate } from 'react-router-dom'
import {
  FolderOpen, MessageSquare, GitBranch, Clock,
  Settings, LogOut, Sparkles, Plus, ChevronDown,
  LayoutGrid, Trash2, Check, X,
  PanelLeftClose, PanelLeftOpen, GripVertical
} from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { useSidebar } from '@/stores/sidebarStore'
import { useWorkspace } from '@/stores/workspaceStore'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect, useCallback } from 'react'

export default function Sidebar() {
  const navigate = useNavigate()
  const signOut = useAuth((s) => s.signOut)
  const user = useAuth((s) => s.user)
  const collapsed = useSidebar((s) => s.collapsed)
  const sidebarWidth = useSidebar((s) => s.width)
  const toggle = useSidebar((s) => s.toggle)
  const setWidth = useSidebar((s) => s.setWidth)

  const workspaces = useWorkspace((s) => s.workspaces)
  const activeWorkspaceId = useWorkspace((s) => s.activeWorkspaceId)
  const activeChatSessionId = useWorkspace((s) => s.activeChatSessionId)
  const createWorkspace = useWorkspace((s) => s.createWorkspace)
  const deleteWorkspace = useWorkspace((s) => s.deleteWorkspace)
  const setActiveWorkspace = useWorkspace((s) => s.setActiveWorkspace)
  const createChatSession = useWorkspace((s) => s.createChatSession)
  const deleteChatSession = useWorkspace((s) => s.deleteChatSession)
  const setActiveChatSession = useWorkspace((s) => s.setActiveChatSession)

  const [wsDropdownOpen, setWsDropdownOpen] = useState(false)
  const [showNewWs, setShowNewWs] = useState(false)
  const [newWsName, setNewWsName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId)

  // ── Drag-to-resize ──────────────────────────────────────────────
  const isDragging = useRef(false)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const newWidth = Math.max(68, Math.min(360, e.clientX))
      setWidth(newWidth)
    }
    const handleUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [setWidth])

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setWsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCreateWorkspace = () => {
    const name = newWsName.trim() || `Workspace ${workspaces.length + 1}`
    const id = createWorkspace(name)
    setNewWsName('')
    setShowNewWs(false)
    setWsDropdownOpen(false)
    navigate('/dashboard/sources')
  }

  const handleLogout = () => {
    signOut()
    navigate('/')
  }

  const showFull = !collapsed

  return (
    <>
      <aside
        className="fixed left-0 top-0 h-screen bg-bg-sidebar flex flex-col z-40 transition-all duration-200"
        style={{ width: collapsed ? 68 : sidebarWidth }}
      >
        {/* Logo + collapse button */}
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center gap-3">
            <Sparkles className="text-accent-cyan shrink-0" size={22} />
            {showFull && (
              <span className="text-white font-bold text-lg tracking-tight">Edu Nexus</span>
            )}
          </div>
          <button
            onClick={toggle}
            className="text-text-muted hover:text-white p-1 rounded-md hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Workspace Switcher */}
        {showFull && (
          <div className="px-3 mb-4" ref={dropdownRef}>
            <button
              onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] transition-colors text-sm text-white border border-[rgba(255,255,255,0.06)]"
            >
              {activeWs ? (
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: activeWs.color }} />
              ) : (
                <LayoutGrid size={14} className="text-accent-cyan shrink-0" />
              )}
              <span className="truncate flex-1 text-left">
                {activeWs?.name || 'Select Workspace'}
              </span>
              <ChevronDown
                size={14}
                className={cn('transition-transform text-text-muted', wsDropdownOpen && 'rotate-180')}
              />
            </button>

            {wsDropdownOpen && (
              <div className="mt-1 rounded-lg bg-bg-card border border-[rgba(255,255,255,0.08)] shadow-lg overflow-hidden">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors group',
                      ws.id === activeWorkspaceId
                        ? 'bg-accent-cyan/10 text-accent-cyan'
                        : 'text-text-secondary hover:bg-[rgba(255,255,255,0.04)]'
                    )}
                  >
                    <span className="flex items-center gap-2 truncate flex-1"
                      onClick={() => {
                        setActiveWorkspace(ws.id)
                        setWsDropdownOpen(false)
                        navigate('/dashboard/sources')
                      }}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ws.color || '#5BC8F5' }} />
                      {ws.name}
                    </span>
                    <span className="text-[10px] text-text-muted mr-2">
                      {ws.sourceNames.length} docs
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteWorkspace(ws.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* New workspace input */}
                {showNewWs ? (
                  <div className="flex items-center gap-1 px-2 py-2 border-t border-[rgba(255,255,255,0.06)]">
                    <input
                      autoFocus
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                      placeholder="Name..."
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-text-muted px-2 py-1 rounded border border-[rgba(255,255,255,0.1)]"
                    />
                    <button onClick={handleCreateWorkspace} className="text-green-400 hover:text-green-300 p-1">
                      <Check size={14} />
                    </button>
                    <button onClick={() => { setShowNewWs(false); setNewWsName('') }} className="text-red-400 hover:text-red-300 p-1">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewWs(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent-cyan hover:bg-[rgba(255,255,255,0.04)] border-t border-[rgba(255,255,255,0.06)]"
                  >
                    <Plus size={14} />
                    New Workspace
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 flex flex-col gap-4 overflow-y-auto">
          {/* Knowledge Base */}
          <div>
            {showFull && (
              <p className="text-text-muted text-[10px] font-semibold tracking-widest uppercase px-3 mb-2">
                KNOWLEDGE BASE
              </p>
            )}
            <div className="flex flex-col gap-1">
              <NavLink
                to="/dashboard/sources"
                className={({ isActive }) =>
                  cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-3')
                }
              >
                <FolderOpen size={18} />
                {showFull && <span>Sources</span>}
              </NavLink>
            </div>
          </div>

          {/* Chat Sessions */}
          <div>
            {showFull && (
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-text-muted text-[10px] font-semibold tracking-widest uppercase">
                  CHATS
                </p>
                {activeWorkspaceId && (
                  <button
                    onClick={() => {
                      if (activeWorkspaceId) {
                        const sessions = activeWs?.chatSessions || []
                        createChatSession(activeWorkspaceId, `Chat ${sessions.length + 1}`)
                        navigate('/dashboard/chat')
                      }
                    }}
                    className="text-accent-cyan hover:text-accent-cyan/80 transition-colors"
                    title="New Chat"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {activeWs?.chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors group',
                    session.id === activeChatSessionId
                      ? 'bg-accent-cyan/10 text-accent-cyan'
                      : 'text-text-secondary hover:bg-[rgba(255,255,255,0.04)]'
                  )}
                  onClick={() => {
                    setActiveChatSession(session.id)
                    navigate('/dashboard/chat')
                  }}
                >
                  <MessageSquare size={14} className="shrink-0" />
                  {showFull && (
                    <>
                      <span className="truncate flex-1">{session.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (activeWorkspaceId) deleteChatSession(activeWorkspaceId, session.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-0.5"
                      >
                        <Trash2 size={10} />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {!activeWs && showFull && (
                <p className="text-text-muted text-xs px-3 py-2 italic">
                  Select a workspace to see chats
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            {showFull && (
              <p className="text-text-muted text-[10px] font-semibold tracking-widest uppercase px-3 mb-2">
                EXPLORE
              </p>
            )}
            <div className="flex flex-col gap-1">
              <NavLink
                to="/dashboard/graph"
                className={({ isActive }) =>
                  cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-3')
                }
              >
                <GitBranch size={18} />
                {showFull && <span>Graph Explorer</span>}
              </NavLink>
              <NavLink
                to="/dashboard/history"
                className={({ isActive }) =>
                  cn('sidebar-link', isActive && 'active', collapsed && 'justify-center px-3')
                }
              >
                <Clock size={18} />
                {showFull && <span>History</span>}
              </NavLink>
            </div>
          </div>
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
            {showFull && <span>Settings</span>}
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
            {showFull && <span>Profile</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            className={cn(
              'sidebar-link text-red-400 hover:text-red-300 hover:bg-red-500/10',
              collapsed && 'justify-center px-3'
            )}
          >
            <LogOut size={18} />
            {showFull && <span>Log out</span>}
          </button>
        </div>
      </aside>

      {/* Drag handle on the right edge of sidebar */}
      {!collapsed && (
        <div
          onMouseDown={handleDragStart}
          className="fixed top-0 h-screen w-1.5 z-50 cursor-col-resize group hover:bg-accent-cyan/20 transition-colors"
          style={{ left: sidebarWidth - 2 }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-8 rounded-full bg-transparent group-hover:bg-accent-cyan/30 flex items-center justify-center transition-colors">
            <GripVertical size={10} className="text-transparent group-hover:text-accent-cyan" />
          </div>
        </div>
      )}
    </>
  )
}
