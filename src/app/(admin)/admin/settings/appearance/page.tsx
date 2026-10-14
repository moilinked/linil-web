import type { Metadata } from "next"

import { AppearanceForm } from "@/features/admin/settings/account-form"
import { ContentSection } from "@/features/admin/settings/content-section"

export const metadata: Metadata = {
  title: "Appearance",
  description: "Customize appearance",
}

export default function SettingsAppearancePage() {
  return (
    <ContentSection title="Appearance" description="Customize the appearance of the app.">
      <AppearanceForm />
    </ContentSection>
  )
}
