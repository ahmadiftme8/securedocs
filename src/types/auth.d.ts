// src/types/auth.d.ts
export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  name?: string
  avatar?: string
  createdAt?: string
  lastLoginAt?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials extends LoginCredentials {
  name: string
  role?: 'admin' | 'user'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

export interface RefreshTokenResponse {
  accessToken: string
  expiresIn: number
}

export interface AuthError {
  message: string
  code?: string
  field?: string
}
