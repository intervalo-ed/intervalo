import { estilosDeTag, UNIVERSITY_TAG_BY_KEY } from "@/lib/university-tags"

// Tag de universidad (leaderboard individual, ranking por universidad y las
// secciones de ranking de la landing) — color de marca + tipografía
// compartida (ver UNIVERSITY_TAG_BY_KEY), o un chip gris genérico si la
// universidad no tiene tag propia (entró por "Otra" en el onboarding).
export function UniTag({ university }: { university: string }) {
  const cfg = UNIVERSITY_TAG_BY_KEY[university]
  if (!cfg) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center rounded bg-white/10 px-1 py-1 text-center text-[0.55rem] leading-none text-foreground/70">
        {university}
      </span>
    )
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md border px-1 py-1 text-center leading-none"
      style={{
        ...estilosDeTag(cfg),
        fontSize: cfg.tagFontSize,
        transform: cfg.tagDy ? `translateY(${cfg.tagDy}px)` : undefined,
      }}
    >
      {university}
    </span>
  )
}
