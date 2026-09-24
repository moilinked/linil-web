import { notifyIfUnauthorized } from "@/features/auth/session-expiry"
import type { FileListPage, FileSummary, UploadedFile } from "@/features/admin/files/types"

const pageSize = 24

async function readError(response: Response, fallback: string): Promise<never> {
  notifyIfUnauthorized(response.status)
  const payload = (await response.json().catch(() => null)) as { error?: string } | null

  throw new Error(payload?.error || fallback)
}

// Each key segment is percent-encoded while the separators stay intact, matching the backend.
export function fileUrl(key: string) {
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`
}

interface ListFilesOptions {
  after?: string
  prefix?: string
  signal?: AbortSignal
}

export async function listFiles({ after, prefix, signal }: ListFilesOptions = {}): Promise<FileListPage> {
  const params = new URLSearchParams({ first: String(pageSize) })
  if (after) {
    params.set("after", after)
  }
  if (prefix) {
    params.set("prefix", prefix)
  }

  const response = await fetch(`/api/files?${params}`, { cache: "no-store", signal })
  if (!response.ok) {
    await readError(response, "Failed to load files")
  }

  const payload = (await response.json().catch(() => null)) as Partial<FileListPage> | null

  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    end_cursor: payload?.end_cursor,
    has_next_page: Boolean(payload?.has_next_page),
  }
}

export async function uploadFile(file: File, signal?: AbortSignal): Promise<UploadedFile> {
  const body = new FormData()
  body.set("file", file)

  const response = await fetch("/api/files", { method: "POST", body, signal })
  if (!response.ok) {
    await readError(response, `Failed to upload ${file.name}`)
  }

  const payload = (await response.json().catch(() => null)) as UploadedFile | null
  if (!payload || typeof payload.key !== "string") {
    throw new Error("The file service returned an invalid response")
  }

  return payload
}

export async function deleteFile(key: FileSummary["key"], signal?: AbortSignal) {
  const response = await fetch(fileUrl(key), { method: "DELETE", signal })
  if (!response.ok) {
    await readError(response, "Failed to delete the file")
  }
}
