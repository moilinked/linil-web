import type { Metadata } from "next"

import { NotesList } from "@/features/notes/components/notes-list"

export const metadata: Metadata = {
  title: "Reading",
  description: "Notes on development, AI agents, and project practice",
}

export default function ReadingPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-muted-foreground">Reading</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Learning Notes</h1>
      </div>
      <NotesList />
    </div>
  )
}
