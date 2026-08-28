import type { Metadata } from "next"

// Metadata propia del minijuego: el link se comparte masivamente por WhatsApp
// y el preview (title/description/OG) es parte del gancho. La imagen OG la
// resuelve el archivo opengraph-image.png de esta carpeta.
export const metadata: Metadata = {
  // Solo la marca: la pestaña es un renglón de 15 caracteres y "· Intervalo"
  // se comía la mitad sin decir nada que el ícono no diga ya.
  title: "Intervalo",
  description:
    "Memorizá las tablas de derivadas con este minijuego. ¡Vení a bancar a tu universidad!",
  openGraph: {
    type: "website",
    url: "https://www.intervalo.xyz/derivadas",
    title: "Intervalo · Derivadas",
    description:
      "Memorizá las tablas de derivadas con este minijuego. ¡Vení a bancar a tu universidad!",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intervalo · Derivadas",
    description:
      "Memorizá las tablas de derivadas con este minijuego. ¡Vení a bancar a tu universidad!",
  },
}

export default function GameLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // `data-game` es lo que engancha la regla de globals.css que le saca la serif
  // a los títulos: acá adentro todo el texto es la misma sans.
  return (
    <div data-game className="min-h-dvh bg-background">
      {children}
    </div>
  )
}
