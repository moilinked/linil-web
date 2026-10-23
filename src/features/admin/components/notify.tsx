"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { CircleCheckIcon, CircleXIcon, InfoIcon, SettingsIcon, TriangleAlertIcon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const toastDuration = 3000

type ToastKind = "success" | "info" | "warning" | "error" | "default"

type FailureDetail = {
  title: string
  detail: string
}

const toastStyles: Record<ToastKind, string> = {
  success: "bg-[#7ed9a4] text-[#143028]",
  info: "bg-[#5eb0f0] text-[#10243d]",
  warning: "bg-[#f5d34e] text-[#3d3208]",
  error: "bg-[#f07c7c] text-[#3d1212]",
  default: "bg-[#f7f7f8] text-[#1c1c1c]",
}

const toastIcons = {
  success: CircleCheckIcon,
  info: InfoIcon,
  warning: TriangleAlertIcon,
  error: CircleXIcon,
  default: SettingsIcon,
}

let showFailureDetail: ((detail: FailureDetail) => void) | null = null

function summarizeReason(detail: string) {
  const text = detail.trim()
  if (!text) {
    return "请求没有完成。"
  }

  const sentence = text.split(/(?<=[。！？.!?])\s+/)[0] ?? text
  const singleLine = sentence.replace(/\s+/g, " ")
  if (singleLine.length <= 96) {
    return singleLine
  }

  return `${singleLine.slice(0, 96)}…`
}

function showToast(kind: ToastKind, content: ReactNode) {
  return toast.custom((id) => <AppToast id={id} kind={kind} content={content} />, {
    duration: Number.POSITIVE_INFINITY,
    unstyled: true,
    className: "w-[356px]",
  })
}

function AppToast({ id, kind, content }: { id: string | number; kind: ToastKind; content: ReactNode }) {
  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(toastDuration)
  const startedRef = useRef(0)
  const Icon = toastIcons[kind]

  useEffect(() => {
    if (paused) {
      return
    }

    startedRef.current = Date.now()
    const timeout = window.setTimeout(() => toast.dismiss(id), remainingRef.current)
    return () => {
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedRef.current))
      window.clearTimeout(timeout)
    }
  }, [id, paused])

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-lg shadow-lg", toastStyles[kind])}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      role="status"
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1 text-sm leading-5">{content}</div>
        <button type="button" aria-label="关闭" className="shrink-0 rounded-sm" onClick={() => toast.dismiss(id)}>
          <XIcon aria-hidden="true" className="size-3.5" />
        </button>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left bg-black/35"
        style={{
          animationName: "toast-progress",
          animationDuration: `${toastDuration}ms`,
          animationTimingFunction: "linear",
          animationFillMode: "forwards",
          animationPlayState: paused ? "paused" : "running",
        }}
      />
    </div>
  )
}

export function notifySuccess(message: string) {
  showToast("success", message)
}

export function notifyInfo(message: string) {
  showToast("info", message)
}

export function notifyWarning(message: string) {
  showToast("warning", message)
}

export function notifyMessage(message: string) {
  showToast("default", message)
}

export function notifyFailure(title: string, detail: string) {
  const summary = summarizeReason(detail)
  showToast(
    "error",
    <>
      {summary}{" "}
      <button
        type="button"
        className="underline underline-offset-2"
        onClick={() => showFailureDetail?.({ title, detail })}
      >
        Details
      </button>
    </>,
  )
}

export function NotifyHost() {
  const [failure, setFailure] = useState<FailureDetail | null>(null)

  useEffect(() => {
    showFailureDetail = setFailure
    return () => {
      showFailureDetail = null
    }
  }, [])

  return (
    <Dialog
      open={failure !== null}
      onOpenChange={(open) => {
        if (!open) {
          setFailure(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{failure?.title}</DialogTitle>
          <DialogDescription className="sr-only">失败原因</DialogDescription>
        </DialogHeader>
        <p className="text-sm wrap-break-word whitespace-pre-wrap">{failure?.detail}</p>
      </DialogContent>
    </Dialog>
  )
}
