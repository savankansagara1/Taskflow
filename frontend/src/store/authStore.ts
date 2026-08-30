import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CurrentUser } from '@/types/api'

interface AuthState {
  token: string | null
  user: CurrentUser | null
  isAuthenticated: boolean

  setAuth: (token: string, user: CurrentUser) => void
  logout: () => void
  setUser: (user: CurrentUser) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        localStorage.setItem('access_token', token)
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        set({ token: null, user: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'taskflow-auth',
      // Only persist token and user — not functions
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

