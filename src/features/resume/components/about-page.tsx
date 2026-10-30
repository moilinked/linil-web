"use client"

import { useMemo, useSyncExternalStore } from "react"

import { ResumeView } from "@/features/resume/components/resume-view"
import { readResumeDraftSnapshot, resumeFromSnapshot, subscribeResumeDraft } from "@/features/resume/resume-store"

export function AboutPage() {
  const snapshot = useSyncExternalStore(subscribeResumeDraft, readResumeDraftSnapshot, () => "")
  const resume = useMemo(() => resumeFromSnapshot(snapshot), [snapshot])

  return <ResumeView resume={resume} />
}
