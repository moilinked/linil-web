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
      <section className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">登录</h1>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">登录后即可使用 Chat Agent 开始对话。</p>
        <LoginForm onSuccess={handleSuccess} />
      </section>
    </div>
  )
}
