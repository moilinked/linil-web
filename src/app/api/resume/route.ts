import { NextResponse } from "next/server"

import { defaultResume } from "@/features/resume/default-resume"
import { toResumeDocument } from "@/features/resume/types"

// Designed public read. Returns the local fixture until the site backend is connected.
export function GET() {
  return NextResponse.json(toResumeDocument(defaultResume), {
    headers: { "Cache-Control": "no-store" },
  })
}
