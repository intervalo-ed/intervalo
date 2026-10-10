import { estilosDeTag, etiquetaDe, PAIS_NOMBRE, tagDe, type Pais, type UniversityTag } from "@/lib/university-tags"

// Bandera rectangular de Twemoji (CC-BY 4.0, ver public/flags/LICENSE.txt). El
// SVG es un cuadrado de 36 con la bandera ondeada adentro, así que `size` es el
// alto y el ancho sale solo. Va al lado de la tag y no adentro, con aire.
export function Bandera({ country, size = 17 }: { country: Pais; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${country.toLowerCase()}.svg`}
      alt={PAIS_NOMBRE[country]}
      title={PAIS_NOMBRE[country]}
      width={size}
      height={size}
      className="inline-block shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

// La tag en sí, sin bandera: la usan los botones de sugerencia, que ponen la
// bandera adentro.
function Chip({ cfg }: { cfg: UniversityTag }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md border px-1 py-1 text-center leading-none"
      style={{
        ...estilosDeTag(cfg),
        fontSize: cfg.tagFontSize,
        transform: cfg.tagDy ? `translateY(${cfg.tagDy}px)` : undefined,
      }}
    >
      {etiquetaDe(cfg)}
    </span>
  )
}

// Tag de universidad (leaderboard individual, ranking por universidad y las
// secciones de ranking de la landing): color de marca + tipografía compartida y
// la bandera de su país a la derecha. Las instituciones que no están en el
// listado ("CERN") reciben una tag generada con la misma fórmula (ver
// `tagGenerada`) y no llevan bandera.
export function UniTag({
  university,
  bandera = "derecha",
}: {
  university: string
  // De qué lado de la tag va la bandera. El ranking individual la pone ANTES
  // (la bandera, después la sigla); el resto de las pantallas, después.
  bandera?: "izquierda" | "derecha"
}) {
  const cfg = tagDe(university)
  if (!cfg.country) return <Chip cfg={cfg} />
  const flag = <Bandera country={cfg.country} />
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      {bandera === "izquierda" && flag}
      <Chip cfg={cfg} />
      {bandera === "derecha" && flag}
    </span>
  )
}

// Botón de sugerencia del campo "Otra": la bandera va ADENTRO de la tag, que es
// lo que distingue dos universidades con la misma sigla de países distintos.
export function SugerenciaUniversidad({
  cfg,
  onClick,
}: {
  cfg: UniversityTag
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={cfg.fullName}
      className="inline-flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-opacity hover:opacity-80"
      style={estilosDeTag(cfg)}
    >
      {etiquetaDe(cfg)}
      {cfg.country && <Bandera country={cfg.country} size={15} />}
    </button>
  )
}
