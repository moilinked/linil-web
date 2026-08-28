"use client"

import { type SubmitEvent, useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/auth-context"

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth()
  const id = useId()
  const usernameId = `${id}-username`
  const passwordId = `${id}-password`
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get("username") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    setError("")
    setIsSubmitting(true)

    try {
      await login(username, password)
      onSuccess?.()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
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
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Logging in…" : "Login"}
      </Button>
    </form>
  )
}
