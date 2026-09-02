"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { CountUp } from "@/components/count-up"
import { XpDots } from "@/components/xp-dots"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { LeaderboardSkeleton } from "@/components/tab-skeletons"
import { Metric, ScopeFilters, fmtCount } from "@/components/leaderboard-chrome"
import { cn } from "@/lib/utils"
import { badgeWithCrown, CAREER_EMOJI } from "@/lib/career-emoji"
import { BELT_UNIT_TEXT_COLORS } from "@/lib/catalog"
import { UniTag } from "@/components/university-tag"
import { LayersIcon, UsersIcon } from "lucide-react"
// El verde y el glifo de WhatsApp salen del minijuego: son la misma acción y
// tienen que verse igual en los dos lados. Se importan, no se copian.
import {
  VERDE,
  VERDE_TINTA_OSCURA,
  WhatsappGlyph,
  shareLink,
  shareUrl,
} from "@/app/derivadas/cafecito-cta"
import {
  BoostBanner,
  useBoostMultipliers,
  type EmpujeVigente,
} from "@/components/boost-banner"
import {
  EJEMPLOS_COUNT,
  EJEMPLOS_XP_TOTAL,
  ListaDeReclutas,
  filasDeEjemplo,
  type FilaRecluta,
} from "@/components/reclutas-list"
import { filaConEmpuje } from "@/app/derivadas/game-colors"
import { useRecruits } from "./UseRecruits"
import { ALL, useLeaderboard } from "./UseLeaderboard"
import { useLeaderboardSummary } from "./UseLeaderboardSummary"
import { useUniversityLeaderboard } from "./UseUniversityLeaderboard"

// Color del nombre según el máximo cinturón real del usuario (mismo color que
// los títulos de unidad en practicar/repasar). Blanco para sin cinturón.
const BELT_TEXT: Record<string, string> = BELT_UNIT_TEXT_COLORS

/** El formato de «esta fila tiene un cafecito corriendo», o nada.
 *
 *  El mismo `filaConEmpuje` del minijuego, no una imitación: un empuje se ve
 *  igual en los dos productos porque es el mismo cafecito. Y va por `style`, así
 *  que le gana al azul de «esta fila sos vos», que va por clase — a propósito y
 *  también igual que allá: con la fila propia impulsada, lo que hay que contar es
 *  que está cobrando el doble, no dónde está, que ya lo dice el centrado. */
function empujeDeFila(
  boostByUni: Map<string, number>,
  university: string | null | undefined,
): React.CSSProperties | undefined {
  const mult = university ? boostByUni.get(university) : undefined
  return mult === undefined ? undefined : filaConEmpuje(mult)
}

// Tag por universidad (rivalidad): color de tinte único + la misma tipografía,
// peso y espaciado que usa cada una en el onboarding. Fuente única de verdad en
// @/lib/university-tags. El formato es el de los items del inicio: texto en
// color, borde "+99", fondo "+33".

type RankingView = "individual" | "university" | "recruits"

const fmt = fmtCount

export function LeaderboardContent() {
  const [view, setView] = useState<RankingView>("individual")
  const [career, setCareer] = useState<string>(ALL)
  const [uni, setUni] = useState<string>(ALL)

  const summary = useLeaderboardSummary({ university: uni, career })
  const universities = summary.data?.universities ?? []
  const boosts = summary.data?.boosts ?? []
  const myUniversity = summary.data?.university ?? null

  // Solo con la vista abierta: son los reclutas de UNA persona y no el ranking,
  // así que no hay por qué pedirlos mientras se mira otra cosa. Sube hasta acá
  // —en vez de quedarse adentro de `RecruitsRanking`— porque los indicadores de
  // arriba también los muestran, y pedidos en los dos lugares serían dos
  // consultas para el mismo dato.
  const recruits = useRecruits({ enabled: view === "recruits" })
  // Mientras no hay reclutas propios —sea porque todavía no llegó la respuesta
  // o porque en verdad no hay ninguno— la lista de abajo muestra los CINCO
  // renglones de ejemplo, sin esperar al servidor: son datos fijos del cliente.
  // Los indicadores tienen que contar lo mismo que esos renglones y no cero, que
  // al lado de cinco filas se leería como una contradicción y no como «todavía
  // no tenés ninguno».
  const reclutasVacio = (recruits.data?.entries.length ?? 0) === 0
  const reclutasCount = reclutasVacio
    ? EJEMPLOS_COUNT
    : (recruits.data?.total_recruits ?? 0)
  const reclutasXp = reclutasVacio
    ? EJEMPLOS_XP_TOTAL
    : (recruits.data?.total_xp_given ?? 0)

  if (!summary.data) {
    return <LeaderboardSkeleton />
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Cabecera: mismo agrupado/espaciado que el switcher + métricas de
          Repasar/Practicar (gap-2 entre filas, gap-4 hasta la lista). */}
      <div className="flex shrink-0 flex-col gap-2">
      {/* Fila 1: dos números generales (globales, no dependen de los filtros).

          En la vista de Reclutas los MISMOS DOS huecos hablan de lo tuyo. No se
          agregan dos más abajo: cuatro indicadores apilados empujan la lista
          fuera de la pantalla de un teléfono, y dos de ellos —cuántos
          estudiantes hay en total, cuántos ejercicios se resolvieron— no dicen
          nada sobre una tabla que es de una sola persona. La cabecera no crece:
          cambia de tema. Es el mismo trato que ya tenía el ranking del
          minijuego. */}
      <div className="grid grid-cols-2 gap-2">
        {view === "recruits" ? (
          <>
            {/* En el mismo verde que la columna de aporte de cada renglón: es
                el mismo dato, arriba y resumido. */}
            <Metric
              label="Reclutas"
              value={
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ color: VERDE }}
                >
                  <CountUp value={reclutasCount} format={fmt} />
                  <UsersIcon className="size-[0.85em]" />
                </span>
              }
            />
            <Metric
              label="Te aportaron"
              value={
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ color: VERDE }}
                >
                  +
                  <CountUp value={reclutasXp} format={fmt} />
                  <XpDots className="size-[0.85em]" />
                </span>
              }
            />
          </>
        ) : (
          <>
            <Metric
              label="Estudiantes registrados"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <CountUp value={summary.data.total_students} format={fmt} />
                  <UsersIcon className="size-[0.85em] text-primary" />
                </span>
              }
            />
            <Metric
              label="Ejercicios completados"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <CountUp value={summary.data.total_exercises} format={fmt} />
                  <LayersIcon className="size-[0.85em] text-primary" />
                </span>
              }
            />
          </>
        )}
      </div>

      {/* Fila 2: selector de ranking + filtros de carrera y universidad. */}
      <ScopeFilters
        view={view}
        withRecruits
        onViewChange={setView}
        career={career}
        onCareerChange={setCareer}
        university={uni}
        onUniversityChange={setUni}
        universities={universities}
        // Los reclutas son tuyos, no de una universidad ni de una carrera:
        // filtrarlos por scope no querría decir nada.
        scopeDisabled={view === "recruits"}
      />
      {/* Los cafecitos vigentes, con su cuenta regresiva. Los de TODAS las
          universidades y no solo el de la propia: ver que la UTN está en ×2,0
          mientras la tuya está en nada es el motor entero de esta mecánica.

          Va acá arriba y no adentro de cada vista para que la individual y la
          universitaria lo hereden de una —y en Reclutas también se ve, que es
          justo donde alguien está pensando en cómo hacer crecer a la suya. */}
      <BoostBanner boosts={boosts} myUniversity={myUniversity} />
      </div>

      {view === "recruits" ? (
        <RecruitsRanking
          data={recruits.data}
          isLoading={recruits.isLoading}
          myUniversity={myUniversity}
        />
      ) : view === "individual" ? (
        <IndividualRanking university={uni} career={career} boosts={boosts} />
      ) : (
        <UniversityRanking university={uni} career={career} boosts={boosts} />
      )}
    </div>
  )
}

function IndividualRanking({
  university,
  career,
  boosts,
}: {
  university: string
  career: string
  boosts: EmpujeVigente[]
}) {
  const boostByUni = useBoostMultipliers(boosts)
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
  } = useLeaderboard({ university, career })

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const topSentinelRef = useRef<HTMLDivElement | null>(null)
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null)
  const didCenterRef = useRef(false)
  const prevTopRankRef = useRef<number | null>(null)
  const prevHeightRef = useRef(0)

  const rows = data?.pages.flatMap((p) => p.entries) ?? []

  // Al cambiar de scope (universidad o carrera) se reinicia la query: recentrar.
  useEffect(() => {
    didCenterRef.current = false
    prevTopRankRef.current = null
    prevHeightRef.current = 0
  }, [university, career])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || rows.length === 0) return
    const firstRank = rows[0]?.rank ?? null
    if (!didCenterRef.current) {
      const meEl = el.querySelector<HTMLElement>("[data-current='true']")
      if (meEl) {
        el.scrollTop =
          meEl.offsetTop - el.clientHeight / 2 + meEl.offsetHeight / 2
      }
      didCenterRef.current = true
    } else if (
      prevTopRankRef.current !== null &&
      firstRank !== null &&
      firstRank < prevTopRankRef.current
    ) {
      el.scrollTop += el.scrollHeight - prevHeightRef.current
    }
    prevTopRankRef.current = firstRank
    prevHeightRef.current = el.scrollHeight
  })

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const observers: IntersectionObserver[] = []
    if (topSentinelRef.current && hasPreviousPage) {
      const io = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting && !isFetchingPreviousPage)
            void fetchPreviousPage()
        },
        { root, rootMargin: "300px" },
      )
      io.observe(topSentinelRef.current)
      observers.push(io)
    }
    if (bottomSentinelRef.current && hasNextPage) {
      const io = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting && !isFetchingNextPage) void fetchNextPage()
        },
        { root, rootMargin: "300px" },
      )
      io.observe(bottomSentinelRef.current)
      observers.push(io)
    }
    return () => observers.forEach((o) => o.disconnect())
  }, [
    hasPreviousPage,
    hasNextPage,
    isFetchingPreviousPage,
    isFetchingNextPage,
    fetchPreviousPage,
    fetchNextPage,
    rows.length,
  ])

  if (isLoading) {
    return <ListSkeleton />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No pudimos cargar el ranking: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  const first = data?.pages[0]
  if (!first || first.total_count === 0) {
    return (
      <p className="text-sm text-muted-foreground">Todavía no hay ranking.</p>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar relative -mx-1 min-h-0 flex-1 overflow-y-auto px-1"
    >
      {hasPreviousPage && (
        <div ref={topSentinelRef} aria-hidden className="h-px" />
      )}
      {isFetchingPreviousPage && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}

      <ol className="flex flex-col gap-2 py-1">
        {rows.map((entry) => (
          <li
            key={entry.user_id}
            data-current={entry.is_current_user ? "true" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10",
              entry.is_current_user && "bg-primary/10 ring-primary/30",
            )}
            style={empujeDeFila(boostByUni, entry.university)}
          >
            <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
              {entry.rank}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                className="truncate text-sm font-medium"
                style={{
                  color: BELT_TEXT[entry.belt] ?? BELT_TEXT.white,
                }}
              >
                {entry.username ?? entry.name}
              </span>
              {(() => {
                const resolved =
                  entry.emoji ?? (entry.career ? CAREER_EMOJI[entry.career] : undefined)
                const emoji = badgeWithCrown({
                  username: entry.username,
                  resolved,
                  career: entry.career,
                })
                return (
                  emoji && (
                    <span className="shrink-0 text-sm leading-none">{emoji}</span>
                  )
                )
              })()}
            </span>
            {entry.university && <UniTag university={entry.university} />}
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              <CountUp value={entry.total_xp} format={fmt} />
              <XpDots className="size-[0.85em] text-white" />
            </span>
          </li>
        ))}
      </ol>

      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}
      {hasNextPage && (
        <div ref={bottomSentinelRef} aria-hidden className="h-px" />
      )}
    </div>
  )
}

function UniversityRanking({
  university,
  career,
  boosts,
}: {
  university: string
  career: string
  boosts: EmpujeVigente[]
}) {
  const boostByUni = useBoostMultipliers(boosts)
  const { data, isLoading, isError, error } = useUniversityLeaderboard({
    university,
    career,
  })

  if (isLoading) {
    return <ListSkeleton />
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No pudimos cargar el ranking: {error.message}
        </AlertDescription>
      </Alert>
    )
  }

  if (!data || data.rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay ranking de universidades.
      </p>
    )
  }

  return (
    <div className="no-scrollbar relative -mx-1 min-h-0 flex-1 overflow-y-auto px-1">
      <ol className="flex flex-col gap-2 py-1">
        {data.rows.map((row, index) => (
          <li
            key={row.university}
            className="flex items-center gap-2 rounded-lg px-4 py-3 ring-1 ring-foreground/10"
            // Acá la marca dice todavía más que en la individual: esta tabla ES
            // la competencia entre universidades, y una fila encendida dice
            // exactamente «esta está subiendo más rápido que la tuya».
            style={empujeDeFila(boostByUni, row.university)}
          >
            <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <span className="flex min-w-0 flex-1 items-center">
              <UniTag university={row.university} />
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              <CountUp value={row.students} format={fmt} />
              <UsersIcon className="size-[0.9em] text-white" />
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              <CountUp value={row.total_xp} format={fmt} />
              <XpDots className="size-[0.85em] text-white" />
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function ListSkeleton() {
  const nameW = ["w-24", "w-32", "w-28", "w-36", "w-24", "w-32"]
  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-hidden">
      <div className="flex animate-pulse flex-col gap-2 py-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10"
          >
            <span className="w-4 shrink-0 text-center text-sm">
              <span className="inline-block h-3.5 w-3 rounded bg-white/10 align-middle" />
            </span>
            <span className="flex min-w-0 flex-1 items-center text-sm">
              <span
                className={cn(
                  "inline-block h-3.5 rounded bg-white/10 align-middle",
                  nameW[i % nameW.length],
                )}
              />
            </span>
            <span className="inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-white/10 px-1 py-1 text-center text-[0.55rem] leading-none">
              <span className="invisible">UNSAM</span>
            </span>
            <span className="shrink-0 text-sm">
              <span className="inline-block h-3.5 w-10 rounded bg-white/10 align-middle" />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


/** Los reclutas propios: quiénes entraron por tu link y cuánto te generaron.
 *
 *  La LISTA va arriba y el botón abajo del todo, y ese orden es la pantalla
 *  entera. Es un ranking: lo primero que tiene que haber es una tabla, igual que
 *  en las otras dos vistas. Con el copy y el botón arriba, la única vez que
 *  alguien ve esto —que es justo la vez que no tiene ningún recluta— lo que
 *  encuentra es un folleto, y la tabla que vino a mirar queda abajo de todo.
 *
 *  Los contadores de arriba cuentan a TODOS, la lista muestra solo a los que ya
 *  aportaron algo. Es la misma asimetría que el ranking del minijuego: "trajiste
 *  a 8" es la noticia aunque 3 no hayan arrancado, y una lista con renglones en
 *  cero se lee como un reproche. */
function RecruitsRanking({
  data,
  isLoading,
  myUniversity,
}: {
  data: ReturnType<typeof useRecruits>["data"]
  isLoading: boolean
  myUniversity: string | null
}) {
  const entries = data?.entries ?? []
  const vacia = entries.length === 0
  // Los renglones de ejemplo se pintan con la universidad de quien mira: la
  // promesa es "así se va a ver tu universidad creciendo", y una fila de la UCA
  // al lado de la propia no la cuenta igual.
  const filas: FilaRecluta[] = vacia
    ? filasDeEjemplo(myUniversity)
    : entries.map((e) => ({
        key: e.rank,
        rank: e.rank,
        nombre: e.username ?? "",
        // El mismo color que su fila del ranking individual: es la misma persona
        // en las dos tablas.
        color: BELT_TEXT[e.belt] ?? BELT_TEXT.white,
        university: e.university,
        career: e.career,
        xp_given: e.xp_given,
      }))

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* Sin pantalla de carga: mientras la respuesta viaja se muestran los
          renglones de ejemplo, que son datos fijos del cliente. Un «Cargando…»
          acá hacía parpadear la pantalla entera para terminar mostrando lo
          mismo en el 95% de los casos, porque casi nadie tiene reclutas
          todavía. */}
      <div className="no-scrollbar -mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        <ListaDeReclutas filas={filas} ejemplo={vacia} className="py-1" />
      </div>

      {/* El bloque de la acción, anclado abajo: el copy dice qué se gana, el
          botón lleva a WhatsApp y el link queda a la vista para el que prefiera
          copiarlo a mano. `shrink-0` para que la lista sea lo único que cede
          cuando la pantalla es corta. */}
      <div className="flex shrink-0 flex-col gap-3">
        {/* El mismo copy que el panel de reclutas del minijuego
            (derivadas/reclutas-panel.tsx): es la misma mecánica de los dos
            lados y con dos redacciones distintas cada una explicaba una mitad.

            Con universidad se nombra el circuito completo —el 10% viaja a esta
            persona, y por eso también a su universidad— en vez de solo su
            parte. Sin universidad no hay nada que nombrar y queda la genérica.

            Se cayó «No se le descuenta nada: esa XP se acuña»: contestaba una
            objeción que nadie se hacía todavía, y para hacerlo tenía que
            introducir la idea de que a alguien podría descontársele algo. */}
        <p className="text-sm leading-relaxed text-muted-foreground">
          Quienes ingresen con tu link generan un{" "}
          <span className="font-medium tabular-nums" style={{ color: VERDE }}>
            {data?.share_percent ?? 10}%
          </span>{" "}
          más de XP, el cual va{" "}
          <span className="font-medium" style={{ color: VERDE }}>
            para vos
          </span>
          {myUniversity ? (
            <>
              {" "}
              y por lo tanto a la{" "}
              <span className="font-medium" style={{ color: VERDE }}>
                {myUniversity}
              </span>{" "}
              también.
            </>
          ) : (
            <> y a tu universidad también.</>
          )}
        </p>

        {/* Un <a> de verdad y no un window.open: wa.me es otro origen y tiene
            que salir al navegador, que adentro de la PWA instalada es la
            diferencia entre abrir WhatsApp y quedarse trabado en una ventana sin
            barra.

            `aria-disabled` y no `disabled` mientras no llegó el @: un ancla no
            tiene ese atributo, y sin handle el link saldría con el `?r=` vacío y
            no atribuiría a nadie. */}
        <a
          href={shareUrl(data?.handle)}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={isLoading || !data?.handle}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-md font-semibold transition-opacity",
            (isLoading || !data?.handle) && "pointer-events-none opacity-50",
          )}
          style={{ backgroundColor: VERDE, color: VERDE_TINTA_OSCURA }}
        >
          Reclutar
          <WhatsappGlyph size={18} />
        </a>
        <p className="text-center text-xs break-all text-muted-foreground">
          {shareLink(data?.handle)}
        </p>
      </div>
    </div>
  )
}
