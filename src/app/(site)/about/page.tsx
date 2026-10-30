import type { Metadata } from "next"

import { AboutPage } from "@/features/resume/components/about-page"
import { defaultResume } from "@/features/resume/default-resume"

export const metadata: Metadata = {
  title: "About",
  description: defaultResume.profile.summary,
}

export default function AboutRoute() {
  return <AboutPage />
}
