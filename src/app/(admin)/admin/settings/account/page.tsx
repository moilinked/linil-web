import type { Metadata } from "next"

import { AccountForm } from "@/features/admin/settings/account-form"
import { ContentSection } from "@/features/admin/settings/content-section"

export const metadata: Metadata = {
  title: "Account",
  description: "Update account settings",
}

export default function SettingsAccountPage() {
  return (
    <ContentSection
      title="Account"
      description="Update your account settings. Set your preferred language and timezone."
    >
      <AccountForm />
    </ContentSection>
  )
}
