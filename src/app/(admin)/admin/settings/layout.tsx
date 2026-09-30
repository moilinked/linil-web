import type { ReactNode } from "react"

import { SettingsShell } from "@/features/admin/settings/settings-shell"

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsShell>{children}</SettingsShell>
}
