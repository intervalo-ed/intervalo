import type { Metadata } from "next"

// Metadata propia del minijuego: el link se comparte masivamente por WhatsApp
// y el preview (title/description/OG) es parte del gancho. La imagen OG la
// resuelve el archivo opengraph-image.png de esta carpeta.

// El texto del preview, uno solo para los tres lugares: la pestaña, WhatsApp y
// Twitter tienen que decir exactamente lo mismo, y con tres literales sueltos la
// forma segura de que dejen de coincidir era editar uno.
//
// Dos oraciones separadas por un salto de línea: la primera dice qué es y para
// qué sirve, la segunda invita. Juntas en un párrafo, la invitación se leía como
// la cola de la explicación.
//
// Ojo con el salto: WhatsApp lo respeta en la descripción del preview, pero no
// todos los clientes lo hacen —varios colapsan los blancos del `og:description`
// y muestran las dos oraciones seguidas—. El texto está escrito para que se
// entienda igual en una sola línea.
const DESCRIPCION =
  "Memorizá todas las derivadas y llegá mejor preparado a tus parciales con este minijuego.\n¡Vení a bancar a tu universidad!"

// Solo la marca, también en el preview. La pestaña es un renglón de 15
// caracteres y "· Derivadas" se comía la mitad sin decir nada que el ícono no
// diga ya; en la tarjeta de WhatsApp pasa lo mismo con el logo al lado, que ya
// es el operador de derivada.
const TITULO = "Intervalo"

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRIPCION,
  openGraph: {
    type: "website",
    url: "https://www.intervalo.xyz/derivadas",
    title: TITULO,
    description: DESCRIPCION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO,
    description: DESCRIPCION,
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
