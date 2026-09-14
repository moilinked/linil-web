"use client"

import { useRouter } from "next/navigation"

import { LoginForm } from "@/features/auth/components/login-form"

function getSafeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) {
    return "/chat"
  }

  return value
}

interface LoginPageContentProps {
  nextPath?: string
}

export function LoginPageContent({ nextPath }: LoginPageContentProps) {
  const router = useRouter()

  function handleSuccess() {
    router.push(getSafeNextPath(nextPath))
    router.refresh()
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <section className="w-full max-w-sm rounded-[24px] border border-border bg-card/80 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-[12px]">
        <h1 className="text-xl font-semibold tracking-tight">Login</h1>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">Log in to start a conversation with Chat Agent.</p>
        <LoginForm onSuccess={handleSuccess} />
      </section>
    </div>
  )
}
