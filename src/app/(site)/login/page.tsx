import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginPageContent } from "@/features/auth/components/login-page-content"
import { getSessionUser } from "@/features/auth/session"

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to use Chat Agent",
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getSessionUser()
  if (user) {
    redirect("/chat")
  }

  const { next } = await searchParams
  return <LoginPageContent nextPath={typeof next === "string" ? next : undefined} />
}
