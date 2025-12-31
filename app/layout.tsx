import type React from "react"
import type { Metadata } from "next"
import { Geist, Cairo } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ConfirmDialogProvider } from "@/hooks/use-confirm-dialog"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" })

export const metadata: Metadata = {
  title: "مجمع حلقات الحبيب",
  description: "الدليل الشامل لمجمع الحبيب في مكان واحد",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${cairo.className} antialiased`}>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
