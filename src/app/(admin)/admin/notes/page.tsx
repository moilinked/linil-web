import type { Metadata } from "next"

import { AdminPageHeading } from "@/features/admin/components/admin-page-heading"
import { ToastTestButton } from "@/features/admin/components/toast-test-button"
import { CreateNoteButton } from "@/features/admin/articles/components/create-note-button"
import { NotesBoard } from "@/features/admin/articles/components/notes-board"

export const metadata: Metadata = {
  title: "Notes",
  description: "Manage notes",
}

export default function AdminNotesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeading title="Nodes" description="Manage notes" />
        <div className="flex items-center gap-2">
          <ToastTestButton />
          <CreateNoteButton />
        </div>
      </div>
      <NotesBoard />
    </div>
  )
}
