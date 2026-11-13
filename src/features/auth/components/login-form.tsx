"use client"

import { type SubmitEvent, useEffect, useId, useRef, useState } from "react"
import Script from "next/script"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/auth-context"

const turnstileScriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

interface TurnstileRenderOptions {
  sitekey: string
  execution: "execute"
  appearance: "interaction-only"
  callback: (token: string) => void
  "error-callback"?: (errorCode?: string) => void
  "expired-callback"?: () => void
  "timeout-callback"?: () => void
}

interface TurnstileApi {
  render: (element: HTMLElement, options: TurnstileRenderOptions) => string
  execute: (id: string) => void
  reset: (id: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

interface LoginFormProps {
  siteKey: string
  onSuccess?: () => void
}

export function LoginForm({ siteKey, onSuccess }: LoginFormProps) {
  const { login } = useAuth()
  const id = useId()
  const usernameId = `${id}-username`
  const passwordId = `${id}-password`
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const submittingRef = useRef(false)
  const credentialsRef = useRef({ username: "", password: "" })
  const loginRef = useRef(login)
  const onSuccessRef = useRef(onSuccess)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loginRef.current = login
    onSuccessRef.current = onSuccess
  }, [login, onSuccess])

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return
    }

    let active = true
    let renderedId = ""
    let timer = 0

    function fail(message: string) {
      submittingRef.current = false
      setIsSubmitting(false)
      setError(message)
      if (renderedId) {
        window.turnstile?.reset(renderedId)
      }
    }

    function mountWidget() {
      const turnstile = window.turnstile
      if (!active || renderedId || !turnstile || !containerRef.current) {
        return
      }

      renderedId = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        execution: "execute",
        appearance: "interaction-only",
        callback: async (token) => {
          const { username, password } = credentialsRef.current

          try {
            setError("")
            await loginRef.current(username, password, token)
            onSuccessRef.current?.()
          } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Login failed")
          } finally {
            submittingRef.current = false
            setIsSubmitting(false)
            if (renderedId) {
              turnstile.reset(renderedId)
            }
          }
        },
        "error-callback": (errorCode) => {
          if (errorCode === "110200") {
            fail("Verification is not allowed on this domain.")
            return
          }
          fail("Verification failed. Please try again.")
        },
        "expired-callback": () => fail("Verification expired. Please try again."),
        "timeout-callback": () => fail("Verification timed out. Please try again."),
      })
      widgetId.current = renderedId
    }

    mountWidget()
    if (!window.turnstile) {
      timer = window.setInterval(() => {
        if (!window.turnstile) {
          return
        }
        window.clearInterval(timer)
        mountWidget()
      }, 50)
    }

    return () => {
      active = false
      window.clearInterval(timer)
      if (renderedId) {
        window.turnstile?.remove(renderedId)
      }
      widgetId.current = null
    }
  }, [siteKey])

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) {
      return
    }
    if (!widgetId.current || !window.turnstile) {
      setError("Verification is still loading. Please try again.")
      return
    }

    const formData = new FormData(event.currentTarget)
    credentialsRef.current = {
      username: String(formData.get("username") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    }
    submittingRef.current = true
    setError("")
    setIsSubmitting(true)
    try {
      window.turnstile.execute(widgetId.current)
    } catch {
      submittingRef.current = false
      setIsSubmitting(false)
      setError("Verification failed. Please try again.")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <Script src={turnstileScriptSrc} strategy="afterInteractive" />
      <div className="grid gap-2">
        <Label htmlFor={usernameId}>Username</Label>
        <Input
          id={usernameId}
          name="username"
          autoComplete="username"
          placeholder="Enter your username"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={passwordId}>Password</Label>
        <Input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          disabled={isSubmitting}
        />
      </div>
      <p className="min-h-5 text-sm text-destructive" role="alert">
        {error}
      </p>
      <div ref={containerRef} />
      <Button type="submit" disabled={isSubmitting || !siteKey} className="w-full">
        {isSubmitting ? "Logging in…" : "Login"}
      </Button>
    </form>
  )
}
