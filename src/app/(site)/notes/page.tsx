import type { Metadata } from "next"

import { ContentPlaceholder } from "@/components/content/content-placeholder"

export const metadata: Metadata = {
  title: "学习笔记",
  description: "开发与 AI Agent 学习笔记",
}

export default function NotesPage() {
  return (
    <ContentPlaceholder
      eyebrow="Notes"
      title="学习笔记"
      description="这里将用于整理开发实践、AI Agent 原理和项目学习记录，内容体系会在 Chat MVP 完成后接入。"
    />
  )
}
