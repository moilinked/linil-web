import { readFile } from "node:fs/promises"
import path from "node:path"

import { noteSlugPattern } from "@/features/notes/types"

const notesDirectory = path.resolve(process.cwd(), "src/content/notes")

export async function readLocalNote(slug: string) {
  if (!noteSlugPattern.test(slug)) {
    return null
  }

  const filePath = path.resolve(notesDirectory, `${slug}.md`)
  const relativePath = path.relative(notesDirectory, filePath)
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null
  }

  try {
    return await readFile(filePath, "utf8")
  } catch (error) {
    if (isMissingFile(error)) {
      return null
    }

    throw error
  }
}

function isMissingFile(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "ENOENT")
}
