import type { Metadata } from "next"

import { ContentSection } from "@/features/admin/settings/content-section"
import { DisplayForm } from "@/features/admin/settings/preference-forms"

export const metadata: Metadata = {
  title: "Display",
  description: "Control what is displayed",
}

export default function SettingsDisplayPage() {
  return (
    <ContentSection title="Display" description="Turn items on or off to control what's displayed in the app.">
      <DisplayForm />
    </ContentSection>
  )
}
