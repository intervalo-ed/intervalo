import Providers from "@/app/providers"
import type { Metadata, Viewport } from "next"
import { Noto_Sans, Noto_Sans_Mono, Noto_Serif } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils";

const notoSerifHeading = Noto_Serif({ subsets: ["latin"], variable: "--font-heading" });

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });

const notoSansMono = Noto_Sans_Mono({ subsets: ["latin"], variable: "--font-noto-mono" });

export const metadata: Metadata = {
  title: "Intervalo - Repaso Espaciado",
  description: "Sistema de repaso adaptativo con repetición espaciada",
}

export const viewport: Viewport = {
  themeColor: "#1E1E34",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", notoSans.variable, notoSansMono.variable, notoSerifHeading.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
