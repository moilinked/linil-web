import type { Resume } from "@/features/resume/types"

export const defaultResume: Resume = {
  profile: {
    name: "oilinil",
    title: "写笔记，做小工具",
    location: "广东",
    summary: "把想到的东西做成能打开的页面。这个站用来记笔记、放作品，也留了一小块地方聊天。",
    links: [
      { id: "notes", label: "Notes", href: "/notes" },
      { id: "works", label: "Works", href: "/works" },
    ],
  },
  skillGroups: [
    {
      id: "web",
      name: "Web",
      items: ["TypeScript", "React", "Next.js", "Tailwind CSS"],
    },
    {
      id: "server",
      name: "Server",
      items: ["Go", "Markdown"],
    },
  ],
  experience: [
    {
      id: "site",
      company: "oilinil",
      role: "独立开发",
      start: "2024",
      end: "现在",
      summary: "维护这个站点，把笔记、作品和对话收在同一套界面里。",
      highlights: ["公开笔记的列表、阅读和后台编辑", "登录之后才能进入的对话"],
    },
  ],
  projects: [
    {
      id: "notes",
      name: "Notes",
      period: "2024",
      summary: "按标签翻笔记，正文支持 Markdown，也可以带 PDF。",
      tags: ["Next.js", "Markdown"],
      href: "/notes",
    },
    {
      id: "works",
      name: "Works",
      period: "进行中",
      summary: "准备用来放网站、小工具和试验。",
      tags: ["Works"],
      href: "/works",
    },
  ],
  education: [
    {
      id: "notes-as-school",
      school: "笔记",
      degree: "边做边记",
      period: "持续",
      summary: "课程表不如笔记更新得勤。",
    },
  ],
}
