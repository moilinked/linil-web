"use client"

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { loginRequest, logoutRequest } from "@/features/auth/auth-api"
import { AuthContext } from "@/features/auth/auth-context"
import { LoginDialog } from "@/features/auth/components/login-dialog"
import { subscribeSessionExpired } from "@/features/auth/session-expiry"
import type { AuthUser } from "@/features/auth/types"

interface AuthProviderProps {
  initialUser: AuthUser | null
  children: ReactNode
}

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
  const router = useRouter()
  const [user, setUser] = useState(initialUser)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const userRef = useRef(user)
  const endingRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

  const endSession = useCallback(() => {
    if (!userRef.current) {
      return Promise.resolve()
    }
    if (endingRef.current) {
      return endingRef.current
    }

    userRef.current = null
    setUser(null)
    setIsLoginOpen(false)

    const pending = logoutRequest()
      .catch(() => undefined)
      .then(() => {
        router.refresh()
      })
      .finally(() => {
        endingRef.current = null
      })

    endingRef.current = pending
    return pending
  }, [router])

  const login = useCallback(async (username: string, password: string) => {
    const nextUser = await loginRequest({ username, password })
    userRef.current = nextUser
    setUser(nextUser)
    setIsLoginOpen(false)
  }, [])

  const logout = useCallback(async () => {
    await endSession()
  }, [endSession])

  const openLogin = useCallback(() => {
    setIsLoginOpen(true)
  }, [])

  const closeLogin = useCallback(() => {
    setIsLoginOpen(false)
  }, [])

  useEffect(() => subscribeSessionExpired(() => void endSession()), [endSession])

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
