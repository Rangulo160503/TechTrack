import type { AuthTokens, AuthUser } from './types'

const ACCESS = 'techtrack.accessToken'
const REFRESH = 'techtrack.refreshToken'
const USER = 'techtrack.user'

export function loadAccessToken(): string | null {
  return localStorage.getItem(ACCESS)
}

export function loadRefreshToken(): string | null {
  return localStorage.getItem(REFRESH)
}

export function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function persistSession(user: AuthUser, tokens: AuthTokens) {
  localStorage.setItem(ACCESS, tokens.accessToken)
  localStorage.setItem(REFRESH, tokens.refreshToken)
  localStorage.setItem(USER, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
  localStorage.removeItem(USER)
}
