"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const emails = ["m@example.com", "m@google.com", "m@support.com"]

interface ProfileErrors {
  username?: string
  email?: string
  bio?: string
  urls?: string
}

function FieldMessage({ children }: { children?: string }) {
  if (!children) {
    return null
  }

  return <p className="text-sm text-destructive">{children}</p>
}

export function ProfileForm() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState<string | null>(null)
  const [bio, setBio] = useState("I own a computer.")
  const [urls, setUrls] = useState(["https://shadcn.com", "http://twitter.com/shadcn"])
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [saved, setSaved] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: ProfileErrors = {}
    const trimmedName = username.trim()

    if (trimmedName.length < 2) {
      nextErrors.username = "Username must be at least 2 characters."
    } else if (trimmedName.length > 30) {
      nextErrors.username = "Username must not be longer than 30 characters."
    }

    if (!email) {
      nextErrors.email = "Please select an email to display."
    }

    if (bio.trim().length < 4) {
      nextErrors.bio = "Bio must be at least 4 characters."
    } else if (bio.length > 160) {
      nextErrors.bio = "Bio must not be longer than 160 characters."
    }

    const invalidUrl = urls.some((url) => {
      const value = url.trim()
      if (!value) {
        return false
      }

      try {
        new URL(value)
        return false
      } catch {
        return true
      }
    })

    if (invalidUrl) {
      nextErrors.urls = "Please enter a valid URL."
    }

    setErrors(nextErrors)
    setSaved(Object.keys(nextErrors).length === 0)
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="settings-username">Username</Label>
        <Input
          id="settings-username"
          value={username}
          placeholder="shadcn"
          onChange={(event) => setUsername(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          This is your public display name. It can be your real name or a pseudonym. You can only change this once every
          30 days.
        </p>
        <FieldMessage>{errors.username}</FieldMessage>
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Select
          value={email}
          onValueChange={(value) => {
            setEmail(value)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a verified email to display" />
          </SelectTrigger>
          <SelectContent>
            {emails.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">You can manage verified email addresses in your email settings.</p>
        <FieldMessage>{errors.email}</FieldMessage>
      </div>
      <div className="space-y-2">
        <Label htmlFor="settings-bio">Bio</Label>
        <Textarea
          id="settings-bio"
          value={bio}
          placeholder="Tell us a little bit about yourself"
          className="min-h-24 resize-none"
          onChange={(event) => setBio(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          You can <span>@mention</span> other users and organizations to link to them.
        </p>
        <FieldMessage>{errors.bio}</FieldMessage>
      </div>
      <div className="space-y-2">
        {urls.map((url, index) => (
          <div key={index} className="space-y-2">
            <Label className={cn(index !== 0 && "sr-only")} htmlFor={`settings-url-${index}`}>
              URLs
            </Label>
            <p className={cn("text-sm text-muted-foreground", index !== 0 && "sr-only")}>
              Add links to your website, blog, or social media profiles.
            </p>
            <Input
              id={`settings-url-${index}`}
              value={url}
              onChange={(event) => {
                setUrls((current) =>
                  current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)),
                )
              }}
            />
          </div>
        ))}
        <FieldMessage>{errors.urls}</FieldMessage>
        <Button type="button" variant="outline" size="sm" onClick={() => setUrls((current) => [...current, ""])}>
          Add URL
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit">Update profile</Button>
        {saved ? <p className="text-sm text-muted-foreground">Saved on this page.</p> : null}
      </div>
    </form>
  )
}
