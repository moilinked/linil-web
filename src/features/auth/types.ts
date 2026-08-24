export interface AuthUser {
  name: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  user: AuthUser
}
