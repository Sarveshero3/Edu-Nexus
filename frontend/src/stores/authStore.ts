import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authRegister, authLogin, authLogout, authStatus, authDeleteAccount } from '@/lib/api'
import { useWorkspace } from '@/stores/workspaceStore'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  institution?: string
  fieldOfStudy?: string
  role?: 'Student' | 'Researcher' | 'Faculty' | 'Other'
  memberSince: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isNewUser: boolean
  signIn: (username: string, password: string) => Promise<void>
  signUp: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: User) => void
  checkAuth: () => Promise<void>
  deleteAccount: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isNewUser: false,

      signIn: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const data = await authLogin(username, password)
          const user: User = {
            id: username,
            name: username,
            email: `${username}@local`,
            memberSince: new Date().toISOString(),
          }
          localStorage.setItem('edu-nexus-session-token', data.token)
          set({ user, token: data.token, isLoading: false, isNewUser: false })
        } catch (err: any) {
          set({ isLoading: false })
          throw err
        }
      },

      signUp: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const data = await authRegister(username, password)
          const user: User = {
            id: username,
            name: username,
            email: `${username}@local`,
            memberSince: new Date().toISOString(),
          }
          // Clean slate — reset workspace store in memory and localStorage
          useWorkspace.getState().clearAll()
          localStorage.setItem('edu-nexus-session-token', data.token)
          set({ user, token: data.token, isLoading: false, isNewUser: true })
        } catch (err: any) {
          set({ isLoading: false })
          throw err
        }
      },

      signOut: async () => {
        try {
          await authLogout()
        } catch {
          // If backend is down, still clear local state
        }
        localStorage.removeItem('edu-nexus-session-token')
        set({ user: null, token: null })
      },

      checkAuth: async () => {
        try {
          const status = await authStatus()
          if (status.logged_in && status.username) {
            const user: User = {
              id: status.username,
              name: status.username,
              email: `${status.username}@local`,
              memberSince: new Date().toISOString(),
            }
            set({ user, token: localStorage.getItem('edu-nexus-session-token') || '' })
          } else {
            set({ user: null, token: null })
          }
        } catch {
          // Backend not reachable — clear state
          set({ user: null, token: null })
        }
      },

      deleteAccount: async () => {
        try {
          await authDeleteAccount()
        } catch {
          // Force clear even if backend call fails
        }
        localStorage.removeItem('edu-nexus-session-token')
        useWorkspace.getState().clearAll()
        localStorage.removeItem('edu-nexus-auth')
        set({ user: null, token: null })
      },

      setUser: (user: User) => set({ user }),
    }),
    { name: 'edu-nexus-auth' }
  )
)
