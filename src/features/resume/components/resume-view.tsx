"use client"

import type { PointerEvent, ReactNode } from "react"
import Link from "next/link"
import { ArrowUpRight, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Resume, ResumeLink, ResumeProject } from "@/features/resume/types"
import { resumeHrefKind } from "@/features/resume/types"

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
  }

  return name.trim().slice(0, 2).toUpperCase()
}

function formatPeriod(start: string, end: string) {
  if (start && end) {
    return `${start} — ${end}`
  }

  return start || end
}

function moveProfileLight(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "mouse") {
    return
  }

  const node = event.currentTarget
  const rect = node.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    return
  }

  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  node.style.setProperty("--glow-x", `${x.toFixed(1)}%`)
  node.style.setProperty("--glow-y", `${y.toFixed(1)}%`)
}

function resetProfileLight(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.removeProperty("--glow-x")
  event.currentTarget.style.removeProperty("--glow-y")
}

function ProfileCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="resume-profile relative isolate overflow-hidden rounded-2xl border border-border bg-card/90 p-5 shadow-(--shadow-panel) transition duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-(--shadow-panel-strong) sm:p-6"
      onPointerLeave={resetProfileLight}
      onPointerMove={moveProfileLight}
    >
      <div className="relative z-10">{children}</div>
    </div>
  )
}

function ResumeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-(--shadow-panel) sm:p-6">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

const linkClassName =
  "text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary-hover hover:underline"

function ProfileLink({ link }: { link: ResumeLink }) {
  if (!link.label) {
    return null
  }

  const kind = resumeHrefKind(link.href)
  if (kind === "internal") {
    return (
      <Link href={link.href} className={linkClassName}>
        {link.label}
      </Link>
    )
  }

  if (kind === "external") {
    return (
      <a href={link.href} className={linkClassName} target="_blank" rel="noopener noreferrer">
        {link.label}
      </a>
    )
  }

  return <span className="text-sm text-muted-foreground">{link.label}</span>
}

const projectCardClassName =
  "block rounded-2xl border border-border bg-background/70 p-4 shadow-(--shadow-panel) transition duration-200 outline-none hover:-translate-y-1 hover:bg-card hover:shadow-(--shadow-panel-strong) focus-visible:ring-3 focus-visible:ring-ring/50"

function ProjectBody({ project, linked }: { project: ResumeProject; linked: boolean }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight">{project.name}</h3>
        {linked ? <ArrowUpRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : null}
      </div>
      {project.period ? <p className="mt-1 text-xs text-muted-foreground">{project.period}</p> : null}
      {project.summary ? (
        <p className="mt-3 text-sm leading-6 wrap-break-word whitespace-pre-wrap text-muted-foreground">
          {project.summary}
        </p>
      ) : null}
      {project.tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((tag, index) => (
            <li key={`${tag}-${index}`}>
              <Badge variant="outline">{tag}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}

function ProjectCard({ project }: { project: ResumeProject }) {
  const kind = project.href ? resumeHrefKind(project.href) : "invalid"
  if (kind === "internal") {
    return (
      <Link href={project.href} className={projectCardClassName}>
        <ProjectBody project={project} linked />
      </Link>
    )
  }

  if (kind === "external") {
    return (
      <a href={project.href} className={projectCardClassName} target="_blank" rel="noopener noreferrer">
        <ProjectBody project={project} linked />
      </a>
    )
  }

  return (
    <article className="rounded-2xl border border-border bg-background/70 p-4 shadow-(--shadow-panel)">
      <ProjectBody project={project} linked={false} />
    </article>
  )
}

export function ResumeView({ resume }: { resume: Resume }) {
  const { profile } = resume
  const displayName = profile.name || "About"
  const hasStory = resume.experience.length > 0 || resume.projects.length > 0 || resume.education.length > 0

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12",
        hasStory && "lg:grid lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start lg:gap-8",
      )}
    >
      <ProfileCard>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary">About</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">{displayName}</h1>
            {profile.title ? <p className="mt-2 text-base text-foreground">{profile.title}</p> : null}
          </div>
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-(--shadow-panel) select-none">
            {initials(displayName)}
          </span>
        </div>
        {profile.location ? (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="size-3.5" />
            {profile.location}
          </p>
        ) : null}
        {profile.summary ? (
          <p className="mt-4 text-sm leading-7 wrap-break-word whitespace-pre-wrap text-muted-foreground">
            {profile.summary}
          </p>
        ) : null}
        {profile.links.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {profile.links.map((link) => (
              <ProfileLink key={link.id} link={link} />
            ))}
          </div>
        ) : null}
        {resume.skillGroups.length > 0 ? (
          <div className="mt-6 flex flex-col gap-4">
            {resume.skillGroups.map((group) => (
              <div key={group.id}>
                <h2 className="text-sm font-medium text-muted-foreground">{group.name}</h2>
                {group.items.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {group.items.map((item, index) => (
                      <li key={`${item}-${index}`}>
                        <Badge variant="secondary">{item}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </ProfileCard>
      {hasStory ? (
        <div className="flex min-w-0 flex-col gap-6">
          {resume.experience.length > 0 ? (
            <ResumeSection title="Experience">
              <ol className="relative flex flex-col gap-6 before:absolute before:top-2 before:bottom-2 before:left-1.5 before:w-px before:bg-border">
                {resume.experience.map((item) => {
                  const period = formatPeriod(item.start, item.end)
                  return (
                    <li key={item.id} className="grid grid-cols-[0.75rem_minmax(0,1fr)] gap-4">
                      <span
                        aria-hidden
                        className="relative z-10 mt-1.5 size-2.5 justify-self-center rounded-full bg-primary ring-4 ring-card"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <h3 className="text-base font-semibold tracking-tight">{item.role || item.company}</h3>
                          {period ? <p className="text-xs text-muted-foreground">{period}</p> : null}
                        </div>
                        {item.role ? <p className="mt-1 text-sm text-primary">{item.company}</p> : null}
                        {item.summary ? (
                          <p className="mt-3 text-sm leading-6 wrap-break-word whitespace-pre-wrap text-muted-foreground">
                            {item.summary}
                          </p>
                        ) : null}
                        {item.highlights.length > 0 ? (
                          <ul className="mt-3 list-disc space-y-1 ps-5 text-sm leading-6 text-foreground">
                            {item.highlights.map((highlight, index) => (
                              <li key={`${highlight}-${index}`}>{highlight}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </ResumeSection>
          ) : null}
          {resume.projects.length > 0 ? (
            <ResumeSection title="Projects">
              <div className="grid gap-4 sm:grid-cols-2">
                {resume.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </ResumeSection>
          ) : null}
          {resume.education.length > 0 ? (
            <ResumeSection title="Education">
              <div className="flex flex-col gap-5">
                {resume.education.map((item) => (
                  <article key={item.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <h3 className="text-base font-semibold tracking-tight">{item.school}</h3>
                      {item.period ? <p className="text-xs text-muted-foreground">{item.period}</p> : null}
                    </div>
                    {item.degree ? <p className="mt-1 text-sm text-primary">{item.degree}</p> : null}
                    {item.summary ? (
                      <p className="mt-3 text-sm leading-6 wrap-break-word whitespace-pre-wrap text-muted-foreground">
                        {item.summary}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </ResumeSection>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
