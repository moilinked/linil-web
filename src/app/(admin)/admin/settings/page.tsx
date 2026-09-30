import type { Metadata } from "next"

import { ContentSection } from "@/features/admin/settings/content-section"
import { ProfileForm } from "@/features/admin/settings/profile-form"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage account settings",
}

export default function SettingsProfilePage() {
  return (
    <ContentSection title="Profile" description="This is how others will see you on the site.">
      <ProfileForm />
    </ContentSection>
  )
}
