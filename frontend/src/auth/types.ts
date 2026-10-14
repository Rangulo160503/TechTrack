export type AuthUser = {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: string
  status: string
}

export type AuthTokens = {
  accessToken: string
  accessTokenExpiresAtUtc: string
  refreshToken: string
  refreshTokenExpiresAtUtc: string
}

export type AuthResponse = {
  user: AuthUser
  tokens: AuthTokens
}
