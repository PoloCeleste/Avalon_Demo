import { create } from 'zustand'
import * as auth from '../api/auth.api'
import { AxiosError } from 'axios'
import { normalizeRole } from '../utils/roles'
import type { User } from '../types/user'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  appReady: boolean
  needActivation: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  _refreshPromise?: Promise<void> | null
  _setRefreshPromise: (p: Promise<void> | null) => void
}

export const useAuthStore = create<AuthState>()(set => ({
  user: null,
  isAuthenticated: false,
  appReady: false,
  needActivation: false,
  _refreshPromise: null,
  _setRefreshPromise: p => set({ _refreshPromise: p }),

  login: async (username, password) => {
    try {
      await auth.login(username, password)
      const me = await auth.getMe()

      set({
        user: { ...(me as User), role: normalizeRole((me as User).role) },
        isAuthenticated: true,
        appReady: true,
        needActivation: false,
      })
    } catch (e: unknown) {
      if (e instanceof AxiosError) {
        const status = e?.response?.status
        if (status === 403) {
          set({
            needActivation: true,
            appReady: true,
            isAuthenticated: false,
            user: null,
          })
        } else {
          set({
            isAuthenticated: false,
            user: null,
            appReady: true,
            needActivation: false,
          })
        }
      } else {
        console.error('An unknown error occurred during login:', e)
        set({
          isAuthenticated: false,
          user: null,
          appReady: true,
          needActivation: false,
        })
      }
      throw e
    }
  },

  logout: async () => {
    try {
      await auth.logout()
    } catch (_error) {
      console.error('Logout request failed:', _error)
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        appReady: false,
        needActivation: false,
        _refreshPromise: null,
      })
    }
  },

  checkAuth: async () => {
    try {
      const me = await auth.getMe()

      set({
        user: {
          ...(me as User),
          role: normalizeRole((me as User).role),
        },
        isAuthenticated: true,
        appReady: true,
        needActivation: false,
      })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      set({
        user: null,
        isAuthenticated: false,
        appReady: true,
        needActivation: false,
      })
    }
  },
}))
