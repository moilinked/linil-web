import type { Metadata } from "next"

import { ContentSection } from "@/features/admin/settings/content-section"
import { NotificationsForm } from "@/features/admin/settings/preference-forms"

export const metadata: Metadata = {
  title: "Notifications",
  description: "Configure notifications",
}

export default function SettingsNotificationsPage() {
  return (
    <ContentSection title="Notifications" description="Configure how you receive notifications.">
      <NotificationsForm />
    </ContentSection>
  )
}
