import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginPageContent } from "@/features/auth/components/login-page-content"
import { getSafeNextPath } from "@/features/auth/next-path"
import { getSessionUser } from "@/features/auth/session"

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to use Chat Agent",
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams
  const nextPath = typeof next === "string" ? next : undefined
  const user = await getSessionUser()
  if (user) {
    redirect(getSafeNextPath(nextPath))
  }

  return <LoginPageContent nextPath={nextPath} />
}
