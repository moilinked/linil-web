"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"

const displayItems = [
  { id: "recents", label: "Recents" },
  { id: "home", label: "Home" },
  { id: "applications", label: "Applications" },
  { id: "desktop", label: "Desktop" },
  { id: "downloads", label: "Downloads" },
  { id: "documents", label: "Documents" },
]

export function NotificationsForm() {
  const [type, setType] = useState("all")
  const [communication, setCommunication] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [social, setSocial] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault()
        setSaved(true)
      }}
    >
      <div className="space-y-3">
        <Label>Notify me about...</Label>
        <RadioGroup value={type} onValueChange={(value) => setType(value)} className="flex flex-col gap-2">
          <Label className="font-normal">
            <RadioGroupItem value="all" />
            All new messages
          </Label>
          <Label className="font-normal">
            <RadioGroupItem value="mentions" />
            Direct messages and mentions
          </Label>
          <Label className="font-normal">
            <RadioGroupItem value="none" />
            Nothing
          </Label>
        </RadioGroup>
      </div>
      <div>
        <h3 className="mb-4 text-lg font-medium">Email Notifications</h3>
        <div className="space-y-4">
          <SwitchRow
            title="Communication emails"
            description="Receive emails about your account activity."
            checked={communication}
            onCheckedChange={setCommunication}
          />
          <SwitchRow
            title="Marketing emails"
            description="Receive emails about new products, features, and more."
            checked={marketing}
            onCheckedChange={setMarketing}
          />
          <SwitchRow
            title="Social emails"
            description="Receive emails for friend requests, follows, and more."
            checked={social}
            onCheckedChange={setSocial}
          />
          <SwitchRow
            title="Security emails"
            description="Receive emails about your account activity and security."
            checked
            disabled
          />
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Checkbox checked={mobile} onCheckedChange={(checked) => setMobile(checked)} id="settings-mobile" />
        <div className="space-y-1">
          <Label htmlFor="settings-mobile" className="font-normal">
            Use different settings for my mobile devices
          </Label>
          <p className="text-sm text-muted-foreground">
            You can manage your mobile notifications in the{" "}
            <Link
              href="/admin/settings"
              className="underline decoration-dashed underline-offset-4 hover:decoration-solid"
            >
              mobile settings
            </Link>{" "}
            page.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit">Update notifications</Button>
        {saved ? <p className="text-sm text-muted-foreground">Saved on this page.</p> : null}
      </div>
    </form>
  )
}

function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div className="space-y-0.5">
        <p className="text-base font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={title} />
    </div>
  )
}

export function DisplayForm() {
  const [items, setItems] = useState<string[]>(["recents", "home"])
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  function toggleItem(id: string, checked: boolean) {
    setItems((current) => (checked ? [...current, id] : current.filter((item) => item !== id)))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (items.length === 0) {
      setError("You have to select at least one item.")
      setSaved(false)
      return
    }

    setError("")
    setSaved(true)
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="space-y-3">
        <div>
          <p className="text-base font-medium">Sidebar</p>
          <p className="text-sm text-muted-foreground">Select the items you want to display in the sidebar.</p>
        </div>
        {displayItems.map((item) => (
          <Label key={item.id} className="font-normal">
            <Checkbox checked={items.includes(item.id)} onCheckedChange={(checked) => toggleItem(item.id, checked)} />
            {item.label}
          </Label>
        ))}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit">Update display</Button>
        {saved ? <p className="text-sm text-muted-foreground">Saved on this page.</p> : null}
      </div>
    </form>
  )
}
