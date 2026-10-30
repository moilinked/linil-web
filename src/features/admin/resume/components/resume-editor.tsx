"use client"

import { useId, useMemo, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { notifyFailure, notifySuccess } from "@/features/admin/components/notify"
import { defaultResume } from "@/features/resume/default-resume"
import { prepareResume } from "@/features/resume/prepare-resume"
import {
  readResumeDraftSnapshot,
  resumeFromSnapshot,
  subscribeResumeDraft,
  writeResumeDraft,
} from "@/features/resume/resume-store"
import {
  copyResume,
  resumeEndpoints,
  type Resume,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeLink,
  type ResumeProject,
  type ResumeSkillGroup,
} from "@/features/resume/types"

function createId() {
  return crypto.randomUUID()
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
}) {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  )
}

function LinesField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
}) {
  const id = useId()
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value.join("\n")}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value.split("\n"))}
      />
    </div>
  )
}

function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium">{title}</h2>
      {children}
    </section>
  )
}

function EntryCard({ title, onRemove, children }: { title: string; onRemove: () => void; children: ReactNode }) {
  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-medium">{title}</p>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
      {children}
    </div>
  )
}

export function ResumeEditor() {
  const snapshot = useSyncExternalStore(subscribeResumeDraft, readResumeDraftSnapshot, () => "")
  const stored = useMemo(() => resumeFromSnapshot(snapshot), [snapshot])
  const [draft, setDraft] = useState<Resume | null>(null)
  const resume = draft ?? stored

  function edit(recipe: (current: Resume) => Resume) {
    setDraft((current) => recipe(copyResume(current ?? stored)))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const prepared = prepareResume(resume)
    if (!prepared.ok) {
      notifyFailure("About", prepared.error)
      return
    }

    if (!writeResumeDraft(prepared.resume)) {
      notifyFailure("About", "Could not save the draft in this browser.")
      return
    }

    setDraft(null)
    notifySuccess("Saved in this browser.")
  }

  return (
    <form className="max-w-3xl space-y-8" autoComplete="off" onSubmit={handleSubmit}>
      <p className="text-sm text-muted-foreground">
        Saving writes to this browser so About can preview it. {resumeEndpoints.read} and PUT {resumeEndpoints.write}{" "}
        are designed and not connected to the backend.
      </p>
      <SectionBlock title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Name"
            value={resume.profile.name}
            onChange={(name) => edit((current) => ({ ...current, profile: { ...current.profile, name } }))}
          />
          <TextField
            label="Title"
            value={resume.profile.title}
            onChange={(title) => edit((current) => ({ ...current, profile: { ...current.profile, title } }))}
          />
        </div>
        <TextField
          label="Location"
          value={resume.profile.location}
          onChange={(location) => edit((current) => ({ ...current, profile: { ...current.profile, location } }))}
        />
        <TextField
          label="Summary"
          multiline
          value={resume.profile.summary}
          onChange={(summary) => edit((current) => ({ ...current, profile: { ...current.profile, summary } }))}
        />
        <div className="space-y-3">
          {resume.profile.links.map((link) => (
            <EntryCard
              key={link.id}
              title={link.label || "New link"}
              onRemove={() =>
                edit((current) => ({
                  ...current,
                  profile: {
                    ...current.profile,
                    links: current.profile.links.filter((item) => item.id !== link.id),
                  },
                }))
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Label" value={link.label} onChange={(label) => updateLink(link.id, { label })} />
                <TextField label="URL" value={link.href} onChange={(href) => updateLink(link.id, { href })} />
              </div>
            </EntryCard>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              edit((current) => ({
                ...current,
                profile: {
                  ...current.profile,
                  links: [...current.profile.links, { id: createId(), label: "", href: "" }],
                },
              }))
            }
          >
            Add link
          </Button>
        </div>
      </SectionBlock>
      <SectionBlock title="Skills">
        {resume.skillGroups.map((group) => (
          <EntryCard
            key={group.id}
            title={group.name || "New skill group"}
            onRemove={() =>
              edit((current) => ({
                ...current,
                skillGroups: current.skillGroups.filter((item) => item.id !== group.id),
              }))
            }
          >
            <TextField label="Group" value={group.name} onChange={(name) => updateSkill(group.id, { name })} />
            <LinesField
              label="Skills"
              value={group.items}
              placeholder="One skill per line"
              onChange={(items) => updateSkill(group.id, { items })}
            />
          </EntryCard>
        ))}
        <Button type="button" variant="outline" onClick={() => addSkill()}>
          Add skill group
        </Button>
      </SectionBlock>
      <SectionBlock title="Experience">
        {resume.experience.map((item) => (
          <EntryCard
            key={item.id}
            title={item.company || item.role || "New experience"}
            onRemove={() =>
              edit((current) => ({
                ...current,
                experience: current.experience.filter((entry) => entry.id !== item.id),
              }))
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Company"
                value={item.company}
                onChange={(company) => updateExperience(item.id, { company })}
              />
              <TextField label="Role" value={item.role} onChange={(role) => updateExperience(item.id, { role })} />
              <TextField label="Start" value={item.start} onChange={(start) => updateExperience(item.id, { start })} />
              <TextField label="End" value={item.end} onChange={(end) => updateExperience(item.id, { end })} />
            </div>
            <TextField
              label="Summary"
              multiline
              value={item.summary}
              onChange={(summary) => updateExperience(item.id, { summary })}
            />
            <LinesField
              label="Highlights"
              value={item.highlights}
              placeholder="One highlight per line"
              onChange={(highlights) => updateExperience(item.id, { highlights })}
            />
          </EntryCard>
        ))}
        <Button type="button" variant="outline" onClick={() => addExperience()}>
          Add experience
        </Button>
      </SectionBlock>
      <SectionBlock title="Projects">
        {resume.projects.map((item) => (
          <EntryCard
            key={item.id}
            title={item.name || "New project"}
            onRemove={() =>
              edit((current) => ({
                ...current,
                projects: current.projects.filter((entry) => entry.id !== item.id),
              }))
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" value={item.name} onChange={(name) => updateProject(item.id, { name })} />
              <TextField label="Period" value={item.period} onChange={(period) => updateProject(item.id, { period })} />
            </div>
            <TextField
              label="Summary"
              multiline
              value={item.summary}
              onChange={(summary) => updateProject(item.id, { summary })}
            />
            <TextField label="URL" value={item.href} onChange={(href) => updateProject(item.id, { href })} />
            <LinesField
              label="Tags"
              value={item.tags}
              placeholder="One tag per line"
              onChange={(tags) => updateProject(item.id, { tags })}
            />
          </EntryCard>
        ))}
        <Button type="button" variant="outline" onClick={() => addProject()}>
          Add project
        </Button>
      </SectionBlock>
      <SectionBlock title="Education">
        {resume.education.map((item) => (
          <EntryCard
            key={item.id}
            title={item.school || "New education"}
            onRemove={() =>
              edit((current) => ({
                ...current,
                education: current.education.filter((entry) => entry.id !== item.id),
              }))
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="School"
                value={item.school}
                onChange={(school) => updateEducation(item.id, { school })}
              />
              <TextField
                label="Degree"
                value={item.degree}
                onChange={(degree) => updateEducation(item.id, { degree })}
              />
              <TextField
                label="Period"
                value={item.period}
                onChange={(period) => updateEducation(item.id, { period })}
              />
            </div>
            <TextField
              label="Summary"
              multiline
              value={item.summary}
              onChange={(summary) => updateEducation(item.id, { summary })}
            />
          </EntryCard>
        ))}
        <Button type="button" variant="outline" onClick={() => addEducation()}>
          Add education
        </Button>
      </SectionBlock>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Save draft</Button>
        <Button type="button" variant="outline" onClick={() => setDraft(copyResume(defaultResume))}>
          Load default
        </Button>
      </div>
    </form>
  )

  function updateLink(id: string, patch: Partial<ResumeLink>) {
    edit((current) => ({
      ...current,
      profile: {
        ...current.profile,
        links: current.profile.links.map((link) => (link.id === id ? { ...link, ...patch } : link)),
      },
    }))
  }

  function updateSkill(id: string, patch: Partial<ResumeSkillGroup>) {
    edit((current) => ({
      ...current,
      skillGroups: current.skillGroups.map((group) => (group.id === id ? { ...group, ...patch } : group)),
    }))
  }

  function updateExperience(id: string, patch: Partial<ResumeExperience>) {
    edit((current) => ({
      ...current,
      experience: current.experience.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  function updateProject(id: string, patch: Partial<ResumeProject>) {
    edit((current) => ({
      ...current,
      projects: current.projects.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  function updateEducation(id: string, patch: Partial<ResumeEducation>) {
    edit((current) => ({
      ...current,
      education: current.education.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }))
  }

  function addSkill() {
    edit((current) => ({
      ...current,
      skillGroups: [...current.skillGroups, { id: createId(), name: "", items: [] }],
    }))
  }

  function addExperience() {
    edit((current) => ({
      ...current,
      experience: [
        ...current.experience,
        { id: createId(), company: "", role: "", start: "", end: "", summary: "", highlights: [] },
      ],
    }))
  }

  function addProject() {
    edit((current) => ({
      ...current,
      projects: [...current.projects, { id: createId(), name: "", period: "", summary: "", tags: [], href: "" }],
    }))
  }

  function addEducation() {
    edit((current) => ({
      ...current,
      education: [...current.education, { id: createId(), school: "", degree: "", period: "", summary: "" }],
    }))
  }
}
