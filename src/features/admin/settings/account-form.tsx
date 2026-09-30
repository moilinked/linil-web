"use client"

import { useState, type FormEvent } from "react"
import { ChevronDown } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const languages = [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Spanish", value: "es" },
  { label: "Portuguese", value: "pt" },
  { label: "Russian", value: "ru" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Chinese", value: "zh" },
]

const fonts = ["Inter", "Manrope", "System"]

function FieldMessage({ children }: { children?: string }) {
  if (!children) {
    return null
  }

  return <p className="text-sm text-destructive">{children}</p>
}

export function AccountForm() {
  const [name, setName] = useState("")
  const [dob, setDob] = useState("")
  const [language, setLanguage] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; dob?: string; language?: string }>({})
  const [saved, setSaved] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: { name?: string; dob?: string; language?: string } = {}
    const trimmedName = name.trim()

    if (trimmedName.length < 2) {
      nextErrors.name = "Name must be at least 2 characters."
    } else if (trimmedName.length > 30) {
      nextErrors.name = "Name must not be longer than 30 characters."
    }

    if (!dob) {
      nextErrors.dob = "Please select your date of birth."
    }

    if (!language) {
      nextErrors.language = "Please select a language."
    }

    setErrors(nextErrors)
    setSaved(Object.keys(nextErrors).length === 0)
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="settings-name">Name</Label>
        <Input
          id="settings-name"
          value={name}
          placeholder="Your name"
          onChange={(event) => setName(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          This is the name that will be displayed on your profile and in emails.
        </p>
        <FieldMessage>{errors.name}</FieldMessage>
      </div>
      <div className="space-y-2">
        <Label htmlFor="settings-dob">Date of birth</Label>
        <Input
          id="settings-dob"
          type="date"
          value={dob}
          className="w-48"
          onChange={(event) => setDob(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">Your date of birth is used to calculate your age.</p>
        <FieldMessage>{errors.dob}</FieldMessage>
      </div>
      <div className="space-y-2">
        <Label>Language</Label>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">This is the language that will be used in the dashboard.</p>
        <FieldMessage>{errors.language}</FieldMessage>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit">Update account</Button>
        {saved ? <p className="text-sm text-muted-foreground">Saved on this page.</p> : null}
      </div>
    </form>
  )
}

export function AppearanceForm() {
  const [font, setFont] = useState("Inter")
  const [theme, setTheme] = useState("dark")
  const [saved, setSaved] = useState(false)

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault()
        setSaved(true)
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="settings-font">Font</Label>
        <div className="relative w-max">
          <select
            id="settings-font"
            value={font}
            onChange={(event) => setFont(event.target.value)}
            className={cn(buttonVariants({ variant: "outline" }), "w-48 appearance-none pr-8 font-normal")}
          >
            {fonts.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-2 right-2.5 size-4 opacity-50" />
        </div>
        <p className="text-sm text-muted-foreground">Set the font you want to use in the dashboard.</p>
      </div>
      <div className="space-y-2">
        <Label>Theme</Label>
        <p className="text-sm text-muted-foreground">Select the theme for the dashboard.</p>
        <RadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value)}
          className="grid max-w-md grid-cols-2 gap-8 pt-2"
        >
          <ThemeOption value="light" label="Light" preview="light" />
          <ThemeOption value="dark" label="Dark" preview="dark" />
        </RadioGroup>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit">Update preferences</Button>
        {saved ? <p className="text-sm text-muted-foreground">Saved on this page.</p> : null}
      </div>
    </form>
  )
}

function ThemeOption({ value, label, preview }: { value: string; label: string; preview: "light" | "dark" }) {
  return (
    <Label className="block font-normal [&:has([data-checked])>div]:border-primary">
      <RadioGroupItem value={value} className="sr-only" />
      <div className="rounded-md border-2 border-muted p-1 hover:border-accent">
        {preview === "light" ? <LightPreview /> : <DarkPreview />}
      </div>
      <span className="block w-full p-2 text-center">{label}</span>
    </Label>
  )
}

function LightPreview() {
  return (
    <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
      <div className="space-y-2 rounded-md bg-white p-2 shadow-xs">
        <div className="h-2 w-20 rounded-lg bg-[#ecedef]" />
        <div className="h-2 w-24 rounded-lg bg-[#ecedef]" />
      </div>
      <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-xs">
        <div className="size-4 rounded-full bg-[#ecedef]" />
        <div className="h-2 w-24 rounded-lg bg-[#ecedef]" />
      </div>
      <div className="flex items-center gap-2 rounded-md bg-white p-2 shadow-xs">
        <div className="size-4 rounded-full bg-[#ecedef]" />
        <div className="h-2 w-24 rounded-lg bg-[#ecedef]" />
      </div>
    </div>
  )
}

function DarkPreview() {
  return (
    <div className="space-y-2 rounded-sm bg-slate-950 p-2">
      <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-xs">
        <div className="h-2 w-20 rounded-lg bg-slate-400" />
        <div className="h-2 w-24 rounded-lg bg-slate-400" />
      </div>
      <div className="flex items-center gap-2 rounded-md bg-slate-800 p-2 shadow-xs">
        <div className="size-4 rounded-full bg-slate-400" />
        <div className="h-2 w-24 rounded-lg bg-slate-400" />
      </div>
      <div className="flex items-center gap-2 rounded-md bg-slate-800 p-2 shadow-xs">
        <div className="size-4 rounded-full bg-slate-400" />
        <div className="h-2 w-24 rounded-lg bg-slate-400" />
      </div>
    </div>
  )
}
