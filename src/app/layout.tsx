import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { BackToTop } from "@/components/layout/back-to-top"
import { PageDecor } from "@/components/layout/page-decor"
import { siteConfig } from "@/config/site"
import { fileUrl } from "@/features/admin/files/files-api"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: fileUrl(siteConfig.faviconKey),
    apple: siteConfig.logo,
  },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="relative isolate flex min-h-full flex-col">
        <PageDecor />
        <div className="relative z-10 flex min-h-full flex-1 flex-col">
          {children}
          <BackToTop />
        </div>
      </body>
    </html>
  )
}
