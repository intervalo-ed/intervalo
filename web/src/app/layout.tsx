import Providers from "@/app/providers"
import AppChrome from "@/app/app-chrome"
import { auth } from "@clerk/nextjs/server"
import type { Metadata, Viewport } from "next"
import {
  DM_Sans,
  Noto_Sans_Mono,
  Noto_Serif,
  Archivo,
  Cabin,
  Saira,
  Manrope,
  Inter,
  Plus_Jakarta_Sans,
  Figtree,
  Public_Sans,
  Karla,
  Sora,
  Outfit,
  Hanken_Grotesk,
} from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils";
import { appleStartupImages } from "@/lib/ios-splash";

const notoSerifHeading = Noto_Serif({ subsets: ["latin"], variable: "--font-heading" });

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

const notoSansMono = Noto_Sans_Mono({ subsets: ["latin"], variable: "--font-noto-mono" });

// Fuentes que evocan los logos de cada universidad (slide de universidad del onboarding
// y tag del leaderboard). Ver web/src/lib/university-tags.ts para el mapeo completo.
const ubaFont = Archivo({ subsets: ["latin"], variable: "--font-uba" });
const utnFont = Cabin({ subsets: ["latin"], variable: "--font-utn" });
const unsamFont = Saira({ subsets: ["latin"], variable: "--font-unsam" });
const unlpFont = Manrope({ subsets: ["latin"], variable: "--font-unlp" });
const uncFont = Inter({ subsets: ["latin"], variable: "--font-unc" });
const unrFont = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-unr" });
const unlFont = Figtree({ subsets: ["latin"], variable: "--font-unl" });
const untFont = Public_Sans({ subsets: ["latin"], variable: "--font-unt" });
const unsFont = Karla({ subsets: ["latin"], variable: "--font-uns" });
const uadeFont = Sora({ subsets: ["latin"], variable: "--font-uade" });
const itbaFont = Outfit({ subsets: ["latin"], variable: "--font-itba" });
const unlamFont = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-unlam" });

export const metadata: Metadata = {
  title: "Intervalo",
  description: "Repasá análisis matemático todos los días.",
  openGraph: {
    title: "Intervalo",
    description: "Repasá análisis matemático todos los días.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intervalo",
    description: "Repasá análisis matemático todos los días.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Intervalo",
    startupImage: appleStartupImages,
  },
}

export const viewport: Viewport = {
  themeColor: "#131324",
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // El splash es el loader del shell de la app: solo lo mostramos a usuarios
  // logueados. La landing y el onboarding (públicos) no lo muestran.
  const { userId } = await auth()

  return (
    <html
      lang="es"
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        dmSans.variable,
        notoSansMono.variable,
        notoSerifHeading.variable,
        ubaFont.variable,
        utnFont.variable,
        unsamFont.variable,
        unlpFont.variable,
        uncFont.variable,
        unrFont.variable,
        unlFont.variable,
        untFont.variable,
        unsFont.variable,
        uadeFont.variable,
        itbaFont.variable,
        unlamFont.variable,
      )}
      style={{ backgroundColor: "#131324" }}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <AppChrome splash={!!userId}>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  )
}
