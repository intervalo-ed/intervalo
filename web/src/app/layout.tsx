import Providers from "@/app/providers"
import AppChrome from "@/app/app-chrome"
import { auth } from "@clerk/nextjs/server"
import type { Metadata, Viewport } from "next"
import { DM_Sans, Noto_Sans_Mono, Noto_Serif, Archivo, Cabin, Saira } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils";
import { appleStartupImages } from "@/lib/ios-splash";

const notoSerifHeading = Noto_Serif({ subsets: ["latin"], variable: "--font-heading" });

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

const notoSansMono = Noto_Sans_Mono({ subsets: ["latin"], variable: "--font-noto-mono" });

// Fuentes que evocan los logos de cada universidad (slide de universidad del onboarding).
const ubaFont = Archivo({ subsets: ["latin"], variable: "--font-uba" });
const utnFont = Cabin({ subsets: ["latin"], variable: "--font-utn" });
const unsamFont = Saira({ subsets: ["latin"], variable: "--font-unsam" });

export const metadata: Metadata = {
  title: "Intervalo",
  description: "Repasá análisis matemático todos los días",
  openGraph: {
    title: "Intervalo",
    description: "Repasá análisis matemático todos los días",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intervalo",
    description: "Repasá análisis matemático todos los días",
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
      className={cn("h-full", "antialiased", "font-sans", dmSans.variable, notoSansMono.variable, notoSerifHeading.variable, ubaFont.variable, utnFont.variable, unsamFont.variable)}
      style={{ backgroundColor: "#131324" }}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Activa la clase .pwa ANTES del primer paint para que los tamaños
            reducidos en standalone (--nav-py / --cta-*) apliquen de entrada.
            Si se hace recién en un useEffect, Mobile Safari no recalcula los
            var() hasta un scroll y la tab bar / CTA quedan altos hasta entonces. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var s=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;if(s)document.documentElement.classList.add('pwa')}catch(e){}",
          }}
        />
        <Providers>
          <AppChrome splash={!!userId}>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  )
}
