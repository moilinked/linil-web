import type { Metadata } from "next"

import { AdminPageHeading } from "@/features/admin/components/admin-page-heading"
import { FileManager } from "@/features/admin/files/components/file-manager"

export const metadata: Metadata = {
  title: "Files",
  description: "Manage uploaded images and files",
}

export default function AdminFilesPage() {
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeading title="文件管理" description="上传图片和文件，Power By SeaweedFS" />
      <FileManager />
    </div>
  )
}
