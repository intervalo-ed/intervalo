import Providers from "@/app/providers"
import AppChrome from "@/app/app-chrome"
import { auth } from "@clerk/nextjs/server"
import { cookies } from "next/headers"
import { COOKIE_BIENVENIDA, yaHizoSesion } from "@/lib/nav/bienvenida"
import type { Metadata, Viewport } from "next"
import { DM_Sans, Noto_Sans_Mono, Noto_Serif, Outfit } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils";
import { appleStartupImages } from "@/lib/ios-splash";

const notoSerifHeading = Noto_Serif({ subsets: ["latin"], variable: "--font-heading" });

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

const notoSansMono = Noto_Sans_Mono({ subsets: ["latin"], variable: "--font-noto-mono" });

// Tipografía compartida por todas las tags de universidad (slide de universidad
// del onboarding y tag del leaderboard). Ver web/src/lib/university-tags.ts.
const itbaFont = Outfit({ subsets: ["latin"], variable: "--font-itba" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.intervalo.xyz"),
  title: "Intervalo",
  description:
    "Repasá análisis, álgebra y probabilidad todos los días. ¡Vení a bancar a tu universidad!",
  openGraph: {
    type: "website",
    url: "https://www.intervalo.xyz/",
    title: "Intervalo",
    description:
      "Repasá análisis, álgebra y probabilidad todos los días. ¡Vení a bancar a tu universidad!",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intervalo",
    description:
      "Repasá análisis, álgebra y probabilidad todos los días. ¡Vení a bancar a tu universidad!",
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
  //
  // Este layout también envuelve el 404 de las rutas que el matcher del proxy
  // excluye (assets inexistentes como /apple-touch-icon.png o /foo.js). Ahí
  // clerkMiddleware nunca corrió y auth() tira, convirtiendo ese 404 en un 500;
  // para decidir el splash alcanza con tratarlo como deslogueado.
  //
  // Y de los logueados, solo los que todavía no terminaron su primera sesión:
  // la bienvenida es una presentación, no un peaje diario (ver
  // lib/nav/bienvenida.ts). La cookie se lee acá, en el servidor, para que la
  // decisión esté tomada antes del primer pintado — con el dato del lado del
  // cliente lo único que se ahorraría es el final de la animación.
  //
  // Es una lectura de cookie y no un fetch a propósito: este layout envuelve
  // TODAS las rutas, así que cualquier `await` que meta acá se lo come también
  // quien entra al minijuego o a la landing, y ningún loading.tsx lo puede
  // tapar (está por debajo del layout en el árbol). Ese es exactamente el
  // problema que el gate de enrollment resolvió con su propio Suspense en
  // (app)/layout.tsx.
  const [{ userId }, jar] = await Promise.all([
    auth().catch(() => ({ userId: null })),
    cookies(),
  ])
  const yaVino = yaHizoSesion(jar.get(COOKIE_BIENVENIDA)?.value, userId)

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
        itbaFont.variable,
      )}
      style={{ backgroundColor: "#131324" }}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <AppChrome signedIn={!!userId} splash={!!userId && !yaVino}>
            {children}
          </AppChrome>
        </Providers>
      </body>
    </html>
  )
}
