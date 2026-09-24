export interface FileSummary {
  key: string
  name: string
  size: number
  last_modified: string
  etag?: string
}

// The list endpoint omits content_type; only the upload response carries it.
export interface UploadedFile extends FileSummary {
  content_type?: string
}

export interface FileListPage {
  items: FileSummary[]
  end_cursor?: string
  has_next_page: boolean
}

// The formats the site backend serves inline. SVG is deliberately absent: it comes back as an
// attachment so it cannot execute scripts on this origin.
const inlineImageExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "bmp", "ico"])

export function isPreviewableImage(name: string) {
  const dot = name.lastIndexOf(".")

  return dot !== -1 && inlineImageExtensions.has(name.slice(dot + 1).toLowerCase())
}

export function formatFileSize(bytes: number) {
  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unit = 0

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }

  return `${unit === 0 ? size : size.toFixed(1)} ${units[unit]}`
}
