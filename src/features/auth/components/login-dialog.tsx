"use client"

import Link from "next/link"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
          <DialogTitle>登录</DialogTitle>
          <DialogDescription>
            登录后即可开始对话。也可以前往{" "}
            <Link href="/login" onClick={closeLogin}>
              登录页面
            </Link>
            。
          </DialogDescription>
        </DialogHeader>
        <LoginForm />
      </DialogContent>
    </Dialog>
  )
}
