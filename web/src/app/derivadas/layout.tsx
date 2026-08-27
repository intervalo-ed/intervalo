import type { Metadata } from "next"

// Metadata propia del minijuego: el link se comparte masivamente por WhatsApp
// y el preview (title/description/OG) es parte del gancho. La imagen OG la
// resuelve el archivo opengraph-image.png de esta carpeta.
export const metadata: Metadata = {
  title: "Derivadas · Intervalo",
  description:
    "¿Cuántas derivadas aguantás? Subí en el ranking y bancá a tu universidad.",
  openGraph: {
    type: "website",
    url: "https://www.intervalo.xyz/derivadas",
    title: "Derivadas · Intervalo",
    description:
      "¿Cuántas derivadas aguantás? Subí en el ranking y bancá a tu universidad.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Derivadas · Intervalo",
    description:
      "¿Cuántas derivadas aguantás? Subí en el ranking y bancá a tu universidad.",
  },
}

export default function DerivadasLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-dvh bg-background">{children}</div>
}
