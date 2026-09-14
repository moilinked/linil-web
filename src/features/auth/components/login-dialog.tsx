"use client"

import Link from "next/link"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/features/auth/auth-context"
import { LoginForm } from "@/features/auth/components/login-form"

export function LoginDialog() {
  const { isLoginOpen, openLogin, closeLogin } = useAuth()

  return (
    <Dialog
      open={isLoginOpen}
      onOpenChange={(open) => {
        if (open) {
          openLogin()
          return
        }

        closeLogin()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            Log in to start a conversation. You can also visit the{" "}
            <Link href="/login" onClick={closeLogin}>
              login page
            </Link>
            .
          </DialogDescription>
        </DialogHeader>
        <LoginForm />
      </DialogContent>
    </Dialog>
  )
}
