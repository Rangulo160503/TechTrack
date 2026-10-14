import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loginApi, logoutApi, meApi } from '../api/auth'
import {
  clearSession,
  loadAccessToken,
  loadRefreshToken,
  loadStoredUser,
  persistSession,
} from './storage'
import type { AuthUser } from './types'

type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (login: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser())
  const [isLoading, setIsLoading] = useState(() => Boolean(loadAccessToken()))

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const token = loadAccessToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const me = await meApi()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) {
          clearSession()
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (loginValue: string, password: string) => {
    const result = await loginApi(loginValue, password)
    persistSession(result.user, result.tokens)
    setUser(result.user)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = loadRefreshToken()
    try {
      await logoutApi(refreshToken)
    } catch {
      // Still clear local session if API is unreachable.
    } finally {
      clearSession()
      setUser(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const me = await meApi()
    setUser(me)
    const access = loadAccessToken()
    const refresh = loadRefreshToken()
    if (access && refresh) {
      persistSession(me, {
        accessToken: access,
        refreshToken: refresh,
        accessTokenExpiresAtUtc: '',
        refreshTokenExpiresAtUtc: '',
      })
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, logout, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
