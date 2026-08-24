"use client"

import { type ReactNode, useCallback, useMemo, useState } from "react"

import { loginRequest, logoutRequest } from "@/features/auth/auth-api"
import { AuthContext } from "@/features/auth/auth-context"
import { LoginDialog } from "@/features/auth/components/login-dialog"
import type { AuthUser } from "@/features/auth/types"

interface AuthProviderProps {
  initialUser: AuthUser | null
  children: ReactNode
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const [user, setUser] = useState(initialUser)
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const login = useCallback(async (username: string, password: string) => {
    const nextUser = await loginRequest({ username, password })
    setUser(nextUser)
    setIsLoginOpen(false)
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
    setIsLoginOpen(false)
  }, [])

  const openLogin = useCallback(() => {
    setIsLoginOpen(true)
  }, [])

  const closeLogin = useCallback(() => {
    setIsLoginOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
      isLoginOpen,
      openLogin,
      closeLogin,
    }),
    [user, login, logout, isLoginOpen, openLogin, closeLogin],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginDialog />
    </AuthContext.Provider>
  )
}
