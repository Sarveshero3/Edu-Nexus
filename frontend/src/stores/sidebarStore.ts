import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarState {
  collapsed: boolean
  width: number // px, for drag-resize
  toggle: () => void
  setCollapsed: (v: boolean) => void
  setWidth: (w: number) => void
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      width: 260,
      toggle: () => set((s) => ({ collapsed: !s.collapsed, width: s.collapsed ? 260 : 68 })),
      setCollapsed: (collapsed: boolean) => set({ collapsed, width: collapsed ? 68 : 260 }),
      setWidth: (width: number) => set({ width, collapsed: width < 120 }),
    }),
    { name: 'edu-nexus-sidebar' }
  )
)
