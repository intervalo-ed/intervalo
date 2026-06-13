import Providers from "@/app/providers"
import AppChrome from "@/app/app-chrome"
import type { Metadata, Viewport } from "next"
import { DM_Sans, Noto_Sans_Mono, Noto_Serif, Archivo, Cabin, Saira } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils";

const notoSerifHeading = Noto_Serif({ subsets: ["latin"], variable: "--font-heading" });

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

const notoSansMono = Noto_Sans_Mono({ subsets: ["latin"], variable: "--font-noto-mono" });

// Fuentes que evocan los logos de cada universidad (slide de universidad del onboarding).
const ubaFont = Archivo({ subsets: ["latin"], variable: "--font-uba" });
const utnFont = Cabin({ subsets: ["latin"], variable: "--font-utn" });
const unsamFont = Saira({ subsets: ["latin"], variable: "--font-unsam" });

export const metadata: Metadata = {
  title: "Intervalo - Repaso Espaciado",
  description: "Sistema de repaso adaptativo con repetición espaciada",
}

export const viewport: Viewport = {
  themeColor: "#131324",
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={cn("h-full", "antialiased", "font-sans", dmSans.variable, notoSansMono.variable, notoSerifHeading.variable, ubaFont.variable, utnFont.variable, unsamFont.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  )
}
