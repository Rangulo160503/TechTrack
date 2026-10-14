import { apiClient } from './client'
import type { AuthResponse, AuthUser } from '../auth/types'

export async function loginApi(login: string, password: string): Promise<AuthResponse> {
  const trimmed = login.trim()
  const body = trimmed.includes('@')
    ? { email: trimmed, password }
    : { username: trimmed, password }
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', body)
  return data
}

export async function logoutApi(refreshToken: string | null): Promise<void> {
  await apiClient.post('/api/auth/logout', { refreshToken })
}

export async function refreshApi(refreshToken: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/refresh', {
    refreshToken,
  })
  return data
}

export async function meApi(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/api/auth/me')
  return data
}

export async function forgotPasswordApi(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/api/auth/forgot-password', {
    email: email.trim(),
  })
  return data
}

export async function resetPasswordApi(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/api/auth/reset-password', {
    token,
    newPassword,
  })
  return data
}

export async function registerUserApi(payload: {
  username: string
  password: string
  email: string
  firstName: string
  lastName: string
  role: string
}): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>('/api/auth/register', payload)
  return data
}
