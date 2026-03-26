/**
 * Workspace Store — Zustand + localStorage persistence
 * =====================================================
 * Manages workspaces, each with its own sources and chat sessions.
 * Backend stays workspace-agnostic; this is a frontend grouping layer.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  engine_used?: string
  chain_of_thought?: { step: string; detail: string; status: string }[]
  confidence?: number
  timestamp: string
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string
}

const WORKSPACE_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
]

export interface Workspace {
  id: string
  name: string
  color: string  // auto-assigned color tag
  sourceNames: string[]  // filenames that belong to this workspace
  chatSessions: ChatSession[]
  createdAt: string
}

interface WorkspaceState {
  workspaces: Workspace[]
  activeWorkspaceId: string | null
  activeChatSessionId: string | null

  // --- Workspace CRUD ---
  createWorkspace: (name: string) => string
  deleteWorkspace: (id: string) => void
  renameWorkspace: (id: string, name: string) => void
  setActiveWorkspace: (id: string) => void
  getActiveWorkspace: () => Workspace | null

  // --- Sources in workspace ---
  addSourceToWorkspace: (workspaceId: string, sourceName: string) => void
  removeSourceFromWorkspace: (workspaceId: string, sourceName: string) => void
  syncSourceNames: (backendNames: string[]) => void

  // --- Chat sessions ---
  createChatSession: (workspaceId: string, title?: string) => string
  deleteChatSession: (workspaceId: string, chatId: string) => void
  setActiveChatSession: (chatId: string) => void
  getActiveChatSession: () => ChatSession | null

  // --- Messages ---
  addMessage: (workspaceId: string, chatId: string, message: Message) => void
  getChatMessages: (workspaceId: string, chatId: string) => Message[]

  // --- Reset ---
  clearAll: () => void
}

export const MAX_WORKSPACES = 4

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      activeChatSessionId: null,

      createWorkspace: (name: string) => {
        if (get().workspaces.length >= MAX_WORKSPACES) {
          throw new Error(`Maximum of ${MAX_WORKSPACES} workspaces allowed`)
        }
        const id = generateId()
        const idx = get().workspaces.length
        const workspace: Workspace = {
          id,
          name,
          color: WORKSPACE_COLORS[idx % WORKSPACE_COLORS.length],
          sourceNames: [],
          chatSessions: [],
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ workspaces: [...s.workspaces, workspace], activeWorkspaceId: id }))
        // Auto-create first chat session
        get().createChatSession(id, 'Chat 1')
        return id
      },

      deleteWorkspace: (id) => {
        set((s) => ({
          workspaces: s.workspaces.filter((w) => w.id !== id),
          activeWorkspaceId: s.activeWorkspaceId === id ? null : s.activeWorkspaceId,
        }))
      },

      renameWorkspace: (id, name) => {
        set((s) => ({
          workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, name } : w)),
        }))
      },

      setActiveWorkspace: (id) => {
        const ws = get().workspaces.find((w) => w.id === id)
        const firstChat = ws?.chatSessions[0]?.id || null
        set({ activeWorkspaceId: id, activeChatSessionId: firstChat })
      },

      getActiveWorkspace: () => {
        const { workspaces, activeWorkspaceId } = get()
        return workspaces.find((w) => w.id === activeWorkspaceId) || null
      },

      addSourceToWorkspace: (workspaceId, sourceName) => {
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId && !w.sourceNames.includes(sourceName)
              ? { ...w, sourceNames: [...w.sourceNames, sourceName] }
              : w
          ),
        }))
      },

      removeSourceFromWorkspace: (workspaceId, sourceName) => {
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId
              ? { ...w, sourceNames: w.sourceNames.filter((n) => n !== sourceName) }
              : w
          ),
        }))
      },

      // Prune sourceNames that no longer exist in the backend
      syncSourceNames: (backendNames: string[]) => {
        const nameSet = new Set(backendNames)
        set((s) => ({
          workspaces: s.workspaces.map((w) => ({
            ...w,
            sourceNames: w.sourceNames.filter((n) => nameSet.has(n)),
          })),
        }))
      },

      createChatSession: (workspaceId, title) => {
        const chatId = generateId()
        const session: ChatSession = {
          id: chatId,
          title: title || `Chat ${(get().workspaces.find((w) => w.id === workspaceId)?.chatSessions.length ?? 0) + 1}`,
          messages: [],
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId
              ? { ...w, chatSessions: [...w.chatSessions, session] }
              : w
          ),
          activeChatSessionId: chatId,
        }))
        return chatId
      },

      deleteChatSession: (workspaceId, chatId) => {
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId
              ? { ...w, chatSessions: w.chatSessions.filter((c) => c.id !== chatId) }
              : w
          ),
          activeChatSessionId: s.activeChatSessionId === chatId ? null : s.activeChatSessionId,
        }))
      },

      setActiveChatSession: (chatId) => {
        set({ activeChatSessionId: chatId })
      },

      getActiveChatSession: () => {
        const { workspaces, activeWorkspaceId, activeChatSessionId } = get()
        const ws = workspaces.find((w) => w.id === activeWorkspaceId)
        return ws?.chatSessions.find((c) => c.id === activeChatSessionId) || null
      },

      addMessage: (workspaceId, chatId, message) => {
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === workspaceId
              ? {
                  ...w,
                  chatSessions: w.chatSessions.map((c) =>
                    c.id === chatId
                      ? { ...c, messages: [...c.messages, message] }
                      : c
                  ),
                }
              : w
          ),
        }))
      },

      getChatMessages: (workspaceId, chatId) => {
        const ws = get().workspaces.find((w) => w.id === workspaceId)
        const chat = ws?.chatSessions.find((c) => c.id === chatId)
        return chat?.messages || []
      },

      clearAll: () => {
        set({ workspaces: [], activeWorkspaceId: null, activeChatSessionId: null })
      },
    }),
    {
      name: 'edu-nexus-workspaces',
    }
  )
)
