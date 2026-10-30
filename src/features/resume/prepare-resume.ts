import { resumeHrefKind, type Resume, type ResumeLink } from "@/features/resume/types"

const maxEntries = 12

export type PreparedResume = { ok: true; resume: Resume } | { ok: false; error: string }

function cleanLine(value: string, max: number) {
  return value.trim().slice(0, max)
}

function cleanLines(values: string[], maxItems: number, maxLength: number) {
  const items: string[] = []
  for (const value of values) {
    if (items.length >= maxItems) {
      break
    }

    const text = cleanLine(value, maxLength)
    if (text) {
      items.push(text)
    }
  }

  return items
}

function isBlank(values: string[]) {
  return values.every((value) => value.trim() === "")
}

function prepareLinks(links: ResumeLink[]): { ok: true; links: ResumeLink[] } | { ok: false; error: string } {
  const prepared: ResumeLink[] = []

  for (const link of links) {
    const label = cleanLine(link.label, 80)
    const href = cleanLine(link.href, 300)
    if (!label && !href) {
      continue
    }

    if (!label || !href) {
      return { ok: false, error: "Each link needs both a label and a URL." }
    }

    if (resumeHrefKind(href) === "invalid") {
      return { ok: false, error: `"${label}" needs an http, mailto, or site path.` }
    }

    if (prepared.length >= maxEntries) {
      break
    }

    prepared.push({ id: link.id || `link-${prepared.length + 1}`, label, href })
  }

  return { ok: true, links: prepared }
}

export function prepareResume(resume: Resume): PreparedResume {
  const name = cleanLine(resume.profile.name, 80)
  if (!name) {
    return { ok: false, error: "Name is required." }
  }

  const links = prepareLinks(resume.profile.links)
  if (!links.ok) {
    return links
  }

  const skillGroups = []
  for (const group of resume.skillGroups) {
    const groupName = cleanLine(group.name, 80)
    const items = cleanLines(group.items, 16, 40)
    if (!groupName && items.length === 0) {
      continue
    }

    if (!groupName) {
      return { ok: false, error: "Each skill group needs a name." }
    }

    if (items.length === 0) {
      return { ok: false, error: `"${groupName}" needs at least one skill.` }
    }

    if (skillGroups.length >= maxEntries) {
      break
    }

    skillGroups.push({ id: group.id, name: groupName, items })
  }

  const experience = []
  for (const item of resume.experience) {
    const company = cleanLine(item.company, 80)
    const role = cleanLine(item.role, 80)
    const start = cleanLine(item.start, 40)
    const end = cleanLine(item.end, 40)
    const summary = cleanLine(item.summary, 600)
    const highlights = cleanLines(item.highlights, 8, 200)
    if (isBlank([company, role, start, end, summary]) && highlights.length === 0) {
      continue
    }

    if (!company) {
      return { ok: false, error: "Each experience needs a company." }
    }

    if (experience.length >= maxEntries) {
      break
    }

    experience.push({ id: item.id, company, role, start, end, summary, highlights })
  }

  const projects = []
  for (const item of resume.projects) {
    const projectName = cleanLine(item.name, 80)
    const period = cleanLine(item.period, 80)
    const summary = cleanLine(item.summary, 600)
    const tags = cleanLines(item.tags, 8, 40)
    const href = cleanLine(item.href, 300)
    if (isBlank([projectName, period, summary, href]) && tags.length === 0) {
      continue
    }

    if (!projectName) {
      return { ok: false, error: "Each project needs a name." }
    }

    if (href && resumeHrefKind(href) === "invalid") {
      return { ok: false, error: `"${projectName}" needs an http, mailto, or site path.` }
    }

    if (projects.length >= maxEntries) {
      break
    }

    projects.push({ id: item.id, name: projectName, period, summary, tags, href })
  }

  const education = []
  for (const item of resume.education) {
    const school = cleanLine(item.school, 80)
    const degree = cleanLine(item.degree, 80)
    const period = cleanLine(item.period, 80)
    const summary = cleanLine(item.summary, 600)
    if (isBlank([school, degree, period, summary])) {
      continue
    }

    if (!school) {
      return { ok: false, error: "Each education entry needs a school." }
    }

    if (education.length >= maxEntries) {
      break
    }

    education.push({ id: item.id, school, degree, period, summary })
  }

  return {
    ok: true,
    resume: {
      profile: {
        name,
        title: cleanLine(resume.profile.title, 120),
        location: cleanLine(resume.profile.location, 80),
        summary: cleanLine(resume.profile.summary, 600),
        links: links.links,
      },
      skillGroups,
      experience,
      projects,
      education,
    },
  }
}
