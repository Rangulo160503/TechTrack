import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, loadAccessToken, loadRefreshToken, persistSession } from '../auth/storage'
import type { AuthResponse } from '../auth/types'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = loadRefreshToken()
  if (!refreshToken) {
    clearSession()
    return null
  }

  try {
    const { data } = await axios.post<AuthResponse>(
      `${baseURL}/api/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    )
    persistSession(data.user, data.tokens)
    return data.tokens.accessToken
  } catch {
    clearSession()
    return null
  }
}

apiClient.interceptors.request.use((config) => {
  const token = loadAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (original.url?.includes('/api/auth/login') || original.url?.includes('/api/auth/refresh')) {
      return Promise.reject(error)
    }

    original._retry = true
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null
    })

    const token = await refreshPromise
    if (!token) {
      return Promise.reject(error)
    }

    original.headers.Authorization = `Bearer ${token}`
    return apiClient(original)
  },
)
