// TODO: implement real auth — currently mocked for development
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => void
  setUser: (user: User) => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      signIn: async (email: string, _password: string) => {
        set({ isLoading: true })
        // Simulate API call
        await new Promise((r) => setTimeout(r, 800))
        const userId = btoa(email).slice(0, 12) // deterministic ID from email
        const user: User = {
          id: userId,
          name: email.split('@')[0],
          email,
          memberSince: new Date().toISOString(),
        }
        // Clear workspace data if different user logged in
        const lastUser = localStorage.getItem('edu-nexus-last-user')
        if (lastUser && lastUser !== userId) {
          localStorage.removeItem('edu-nexus-workspaces')
        }
        localStorage.setItem('edu-nexus-last-user', userId)
        set({ user, token: 'mock-jwt-token', isLoading: false })
      },

      signUp: async (name: string, email: string, _password: string) => {
        set({ isLoading: true })
        await new Promise((r) => setTimeout(r, 800))
        const userId = btoa(email).slice(0, 12) // deterministic unique ID from email
        const user: User = {
          id: userId,
          name,
          email,
          memberSince: new Date().toISOString(),
        }
        // Always clear workspace data on fresh signup — clean slate
        localStorage.removeItem('edu-nexus-workspaces')
        localStorage.setItem('edu-nexus-last-user', userId)
        set({ user, token: 'mock-jwt-token', isLoading: false })
      },

      signOut: () => {
        set({ user: null, token: null })
        // Clear workspace data on logout
        localStorage.removeItem('edu-nexus-workspaces')
      },

      setUser: (user: User) => set({ user }),
    }),
    { name: 'edu-nexus-auth' }
  )
)
