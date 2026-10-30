import { defaultResume } from "@/features/resume/default-resume"
import { normalizeResumeDocument, toResumeDocument, type Resume, type ResumeDocument } from "@/features/resume/types"

const resumeDraftKey = "resume-draft:v1"
const resumeDraftEvent = "resume-draft-change"

interface StoredResumeDraft {
  version: 1
  resume: ResumeDocument
}

export function subscribeResumeDraft(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(resumeDraftEvent, onStoreChange)
  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(resumeDraftEvent, onStoreChange)
  }
}

export function readResumeDraftSnapshot() {
  try {
    return localStorage.getItem(resumeDraftKey) ?? ""
  } catch {
    return ""
  }
}

export function resumeFromSnapshot(snapshot: string): Resume {
  if (!snapshot) {
    return defaultResume
  }

  try {
    const parsed = JSON.parse(snapshot) as Partial<StoredResumeDraft>
    if (parsed.version !== 1) {
      return defaultResume
    }

    return normalizeResumeDocument(parsed.resume) ?? defaultResume
  } catch {
    return defaultResume
  }
}

export function writeResumeDraft(resume: Resume) {
  try {
    const payload: StoredResumeDraft = { version: 1, resume: toResumeDocument(resume) }
    localStorage.setItem(resumeDraftKey, JSON.stringify(payload))
    window.dispatchEvent(new Event(resumeDraftEvent))
    return true
  } catch {
    return false
  }
}
