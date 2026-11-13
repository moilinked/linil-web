export interface AuthUser {
  name: string
}

export interface LoginRequest {
  username: string
  password: string
  turnstileToken: string
}

export interface AuthResponse {
  user: AuthUser
}
