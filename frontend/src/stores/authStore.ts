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
        const user: User = {
          id: '1',
          name: email.split('@')[0],
          email,
          memberSince: new Date().toISOString(),
        }
        set({ user, token: 'mock-jwt-token', isLoading: false })
      },

      signUp: async (name: string, email: string, _password: string) => {
        set({ isLoading: true })
        await new Promise((r) => setTimeout(r, 800))
        const user: User = {
          id: '1',
          name,
          email,
          memberSince: new Date().toISOString(),
        }
        set({ user, token: 'mock-jwt-token', isLoading: false })
      },

      signOut: () => {
        set({ user: null, token: null })
      },

      setUser: (user: User) => set({ user }),
    }),
    { name: 'edu-nexus-auth' }
  )
)
