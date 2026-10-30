// Resume API, not connected to the site backend.
// GET  /api/resume            -> ResumeDocument
// PUT  /api/admin/resume      -> ResumeDocument, admin session required

export const resumeEndpoints = {
  read: "/api/resume",
  write: "/api/admin/resume",
} as const

export interface ResumeLink {
  id: string
  label: string
  href: string
}

export interface ResumeSkillGroup {
  id: string
  name: string
  items: string[]
}

export interface ResumeExperience {
  id: string
  company: string
  role: string
  start: string
  end: string
  summary: string
  highlights: string[]
}

export interface ResumeProject {
  id: string
  name: string
  period: string
  summary: string
  tags: string[]
  href: string
}

export interface ResumeEducation {
  id: string
  school: string
  degree: string
  period: string
  summary: string
}

export interface ResumeProfile {
  name: string
  title: string
  location: string
  summary: string
  links: ResumeLink[]
}

export interface Resume {
  profile: ResumeProfile
  skillGroups: ResumeSkillGroup[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  education: ResumeEducation[]
}

export interface ResumeDocument {
  profile: ResumeProfile
  skill_groups: ResumeSkillGroup[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  education: ResumeEducation[]
}

const maxEntries = 20
const maxList = 16
const maxShort = 120
const maxLine = 200
const maxText = 600
const maxHref = 300

export function copyResume(resume: Resume): Resume {
  return structuredClone(resume)
}

export function resumeHrefKind(href: string): "internal" | "external" | "invalid" {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return "internal"
  }

  try {
    const url = new URL(href)
    if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:") {
      return "external"
    }
  } catch {
    return "invalid"
  }

  return "invalid"
}

function readString(value: unknown, max: number) {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().slice(0, max)
}

function readId(value: unknown, fallback: string) {
  const id = readString(value, 80)
  return id || fallback
}

function readStringList(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) {
    return []
  }

  const items: string[] = []
  for (const item of value) {
    if (items.length >= maxItems) {
      break
    }

    const text = readString(item, maxLength)
    if (text) {
      items.push(text)
    }
  }

  return items
}

function readLinks(value: unknown): ResumeLink[] {
  if (!Array.isArray(value)) {
    return []
  }

  const links: ResumeLink[] = []
  for (const item of value) {
    if (links.length >= maxEntries || !item || typeof item !== "object") {
      continue
    }

    const link = item as { id?: unknown; label?: unknown; href?: unknown }
    links.push({
      id: readId(link.id, `link-${links.length + 1}`),
      label: readString(link.label, maxShort),
      href: readString(link.href, maxHref),
    })
  }

  return links
}

export function toResumeDocument(resume: Resume): ResumeDocument {
  return {
    profile: {
      name: resume.profile.name,
      title: resume.profile.title,
      location: resume.profile.location,
      summary: resume.profile.summary,
      links: resume.profile.links.map((link) => ({ id: link.id, label: link.label, href: link.href })),
    },
    skill_groups: resume.skillGroups.map((group) => ({
      id: group.id,
      name: group.name,
      items: [...group.items],
    })),
    experience: resume.experience.map((item) => ({
      ...item,
      highlights: [...item.highlights],
    })),
    projects: resume.projects.map((item) => ({
      ...item,
      tags: [...item.tags],
    })),
    education: resume.education.map((item) => ({ ...item })),
  }
}

export function normalizeResumeDocument(value: unknown): Resume | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const payload = value as Partial<ResumeDocument>
  if (!payload.profile || typeof payload.profile !== "object") {
    return null
  }

  const profile = payload.profile as Partial<ResumeProfile>

  return {
    profile: {
      name: readString(profile.name, maxShort),
      title: readString(profile.title, maxShort),
      location: readString(profile.location, maxShort),
      summary: readString(profile.summary, maxText),
      links: readLinks(profile.links),
    },
    skillGroups: readSkillGroups(payload.skill_groups),
    experience: readExperience(payload.experience),
    projects: readProjects(payload.projects),
    education: readEducation(payload.education),
  }
}

function readSkillGroups(value: unknown): ResumeSkillGroup[] {
  if (!Array.isArray(value)) {
    return []
  }

  const groups: ResumeSkillGroup[] = []
  for (const [index, item] of value.entries()) {
    if (groups.length >= maxEntries || !item || typeof item !== "object") {
      continue
    }

    const group = item as Partial<ResumeSkillGroup>
    groups.push({
      id: readId(group.id, `skill-${index + 1}`),
      name: readString(group.name, maxShort),
      items: readStringList(group.items, maxList, maxShort),
    })
  }

  return groups
}

function readExperience(value: unknown): ResumeExperience[] {
  if (!Array.isArray(value)) {
    return []
  }

  const items: ResumeExperience[] = []
  for (const [index, item] of value.entries()) {
    if (items.length >= maxEntries || !item || typeof item !== "object") {
      continue
    }

    const entry = item as Partial<ResumeExperience>
    items.push({
      id: readId(entry.id, `experience-${index + 1}`),
      company: readString(entry.company, maxShort),
      role: readString(entry.role, maxShort),
      start: readString(entry.start, 40),
      end: readString(entry.end, 40),
      summary: readString(entry.summary, maxText),
      highlights: readStringList(entry.highlights, maxList, maxLine),
    })
  }

  return items
}

function readProjects(value: unknown): ResumeProject[] {
  if (!Array.isArray(value)) {
    return []
  }

  const items: ResumeProject[] = []
  for (const [index, item] of value.entries()) {
    if (items.length >= maxEntries || !item || typeof item !== "object") {
      continue
    }

    const project = item as Partial<ResumeProject>
    items.push({
      id: readId(project.id, `project-${index + 1}`),
      name: readString(project.name, maxShort),
      period: readString(project.period, maxShort),
      summary: readString(project.summary, maxText),
      tags: readStringList(project.tags, maxList, 40),
      href: readString(project.href, maxHref),
    })
  }

  return items
}

function readEducation(value: unknown): ResumeEducation[] {
  if (!Array.isArray(value)) {
    return []
  }

  const items: ResumeEducation[] = []
  for (const [index, item] of value.entries()) {
    if (items.length >= maxEntries || !item || typeof item !== "object") {
      continue
    }

    const entry = item as Partial<ResumeEducation>
    items.push({
      id: readId(entry.id, `education-${index + 1}`),
      school: readString(entry.school, maxShort),
      degree: readString(entry.degree, maxShort),
      period: readString(entry.period, maxShort),
      summary: readString(entry.summary, maxText),
    })
  }

  return items
}
