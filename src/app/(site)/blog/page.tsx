import type { Metadata } from "next"

import { ContentPlaceholder } from "@/components/content/content-placeholder"

export const metadata: Metadata = {
  title: "Blog",
  description: "技术文章与项目实践",
}

export default function BlogPage() {
  return (
    <ContentPlaceholder
      eyebrow="Blog"
      title="技术文章"
      description="这里将发布完整的技术文章、架构思考和项目复盘，后续可以接入 MDX、数据库或 Headless CMS。"
    />
  )
}
