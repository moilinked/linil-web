import { NextResponse } from "next/server"

import { isAdminName } from "@/config/admin"
import { getSessionUser, requireAccessToken } from "@/features/auth/session"
import { prepareResume } from "@/features/resume/prepare-resume"
import { normalizeResumeDocument, toResumeDocument } from "@/features/resume/types"

// Designed admin write. Validates the document, then stops because storage is not connected.
export async function PUT(request: Request) {
  const access = await requireAccessToken()
  if (!access.ok) {
    return access.response
  }

  const user = await getSessionUser()
  if (!isAdminName(user?.name)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Resume payload must be JSON" }, { status: 400 })
  }

  const resume = normalizeResumeDocument(body)
  if (!resume) {
    return NextResponse.json({ error: "Resume payload is invalid" }, { status: 400 })
  }

  const prepared = prepareResume(resume)
  if (!prepared.ok) {
    return NextResponse.json({ error: prepared.error }, { status: 400 })
  }

  return NextResponse.json(
    { error: "Resume storage is not connected", resume: toResumeDocument(prepared.resume) },
    { status: 501 },
  )
}
