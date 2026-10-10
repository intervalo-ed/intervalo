import { estilosDeTag, etiquetaDe, PAIS_NOMBRE, tagDe, type Pais, type UniversityTag } from "@/lib/university-tags"

// Bandera rectangular de Twemoji (CC-BY 4.0, ver public/flags/LICENSE.txt). El
// SVG es un cuadrado de 36 con la bandera ondeada adentro, así que `size` es el
// alto y el ancho sale solo.
export function Bandera({ country, size = 17 }: { country: Pais; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${country.toLowerCase()}.svg`}
      alt={PAIS_NOMBRE[country]}
      title={PAIS_NOMBRE[country]}
      width={size}
      height={size}
      className="block shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

// Tag de universidad (leaderboard individual, ranking por universidad y las
// secciones de ranking de la landing): color de marca + tipografía compartida,
// con la bandera de su país ADENTRO, después de la sigla. Las instituciones que no
// están en el listado ("CERN") reciben una tag generada con la misma fórmula
// (ver `tagGenerada`) y no llevan bandera.
//
// La bandera mide 10 px y es `block`: como `inline-block` hereda el hueco de
// descendentes de la línea y queda corrida hacia abajo. Es un hijo flex más, así
// que `items-center` la centra contra el texto.
export function UniTag({ university }: { university: string }) {
  const cfg = tagDe(university)
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center gap-[5px] rounded-md border px-[7px] py-[5px] text-center leading-none"
      style={{
        ...estilosDeTag(cfg),
        fontSize: cfg.tagFontSize,
        transform: cfg.tagDy ? `translateY(${cfg.tagDy}px)` : undefined,
      }}
    >
      {etiquetaDe(cfg)}
      {cfg.country && (
        // 0,5 px más abajo: el centro óptico del texto en versalitas queda por
        // debajo del centro de su caja, y centrada a secas la bandera se ve alta.
        <span className="translate-y-[0.5px]">
          <Bandera country={cfg.country} size={10} />
        </span>
      )}
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
