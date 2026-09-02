import Link from "next/link"

// Índice del primer bloque de las páginas legales (/privacidad y /terminos):
// una entrada por sección, apuntando a las anclas de cada <section>. Mismo
// cuerpo de texto que los párrafos y el número apagado, como los pasos de
// instalación.
export function LegalIndex({
  items,
  chico = false,
}: {
  items: { href: string; label: string }[]
  // Mismo motivo y mismo valor que `chico` en legal-content.tsx: para el dorso
  // angosto del minijuego en escritorio, donde el `clamp` de siempre mide
  // contra la ventana entera y sale grande aunque el panel sea chico. Sin
  // esto, el índice quedaba más grande que el cuerpo que ya se había achicado.
  chico?: boolean
}) {
  return (
    <nav aria-label="Índice" className="mt-10 flex flex-col gap-2">
      {items.map((item, i) => (
        <Link
          key={item.href}
          href={item.href}
          className={`group max-w-[44rem] ${
            chico
              ? "text-base leading-relaxed"
              : "text-[clamp(1rem,3vw,1.2rem)] leading-[1.8]"
          }`}
        >
          <span className="tabular-nums text-[#768899]">{i + 1}.</span>{" "}
          <span className="text-[#E6EEFA] underline underline-offset-4 decoration-[#38385A] transition-colors group-hover:text-[#F6F8FC] group-hover:decoration-[#7E80F7]">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  )
}
