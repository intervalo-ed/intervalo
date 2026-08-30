"use client"

// El ranking del juego, con el mismo formato que el de Intervalo: dos números
// arriba, los tres selectores y las filas con badge de carrera, tag de
// universidad y XP.
//
// Es también el marcador del juego —el único contador de XP que queda— así que
// hace tres cosas más:
//
//   · Scroll infinito por baches hacia arriba y hacia abajo, anclando la
//     posición al cargar hacia arriba para que la lista no pegue saltos.
//   · Vuelve a acomodar la fila propia sola —a cuatro filas del techo, no en el
//     centro— a los 10 s sin tocar la rueda, o cuando el layout lo pide.
//   · Muestra el XP mientras el conteo del festejo lo va llenando (`liveXp`),
//     pintado del color de ese paso (`xpColor`), y recién cuando termina llega
//     el orden nuevo y la fila sube con un FLIP de motion.

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import { ArrowDown, ArrowUp, LayersIcon, UsersIcon } from "lucide-react"
import { CountUp } from "@/components/count-up"
import {
  ALL_SCOPE,
  Metric,
  ScopeFilters,
  fmtCount,
  type RankingView,
} from "@/components/leaderboard-chrome"
import { Spinner } from "@/components/ui/spinner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UniTag } from "@/components/university-tag"
import { XpDots } from "@/components/xp-dots"
import { badgeWithCrown, CAREER_EMOJI } from "@/lib/career-emoji"
import { cn } from "@/lib/utils"
import { Hueco } from "./skeleton-barra"
import { AMBAR, boostStrength, filaConEmpuje, levelColor } from "./game-colors"
import { VERDE } from "./cafecito-cta"
import { EJEMPLOS_COUNT, EJEMPLOS_XP_TOTAL, ListaDeReclutas } from "./reclutas-list"
import {
  useGameBoosts,
  useGameLeaderboard,
  useGameLeaderboardSummary,
  useGameRecruits,
  useGameUniversityLeaderboard,
  type GameBoost,
  type GameLeaderboardEntry,
  type GameRecruits,
  type GameUniversityRow,
  type Scope,
} from "./UseGameLeaderboard"

// Ritmo de la escalada: cada paso pasa a un jugador. El total está acotado para
// que una escalada larga no se eternice.
const CLIMB_TOTAL_MS = 1600
const CLIMB_STEP_MIN_MS = 80
const CLIMB_STEP_MAX_MS = 220

// Cuánto se acerca el scroll a la posición de descanso en cada paso de la
// escalada. Menos de 1 a propósito: el scroll acompaña con retraso, así se ve
// que la fila trepa por la pantalla en vez de quedarse clavada en su lugar.
const CLIMB_SCROLL_FOLLOW = 0.4

// Filas que quedan por encima de la propia cuando la lista descansa. No es el
// centro: se mira hacia arriba, a quién falta pasar, más que hacia abajo.
const ROWS_ABOVE = 4

// Para el chip propio, aclarado hasta que se lee como oro sobre el fondo.
const ORO_CHIP = `color-mix(in oklab, ${AMBAR} 55%, #FFFFFF)`

// Cuántos empujes entran en el cartel. Cuatro y no tres: van de a DOS por fila,
// así que un número impar deja siempre un hueco al lado del último. Con dos
// filas llenas el cartel sigue siendo una cabecera; de ahí para arriba se
// convierte en una lista y le come el lugar a lo que la gente vino a mirar.
const BOOSTS_SHOWN = 4

// Espejo de backend/game/boosts.py :: MIN_PLAYERS_RANKED. Acá solo se usa para
// escribir cuántos jugadores le faltan a una universidad; quién entra al ranking lo
// decide el server y viaja en `row.ranked`.
const MIN_PLAYERS_RANKED = 10

// Espejo de backend/game/elo.py :: RAMP_UPDATES. Igual que arriba: acá solo se
// usa para escribir cuántas respuestas le faltan a una persona; quién tiene el
// Elo firme lo decide el server y viaja en `entry.elo_ranked`.
const RAMP_UPDATES = 5

const fmtMultiplier = (m: number) => `×${m.toFixed(1).replace(".", ",")}`

// Minutos Y segundos, con el segundero siempre a la vista: "18:24".
//
// Antes decía "18 min" a secas, y un cartel que dice lo mismo durante sesenta
// segundos no parece un reloj sino una etiqueta. Con los segundos corriendo se
// lee lo que es —algo que se está por terminar— que es justo lo que hace mirar
// cuánto sale sumarle tiempo.
function fmtRemaining(seconds: number): string {
  const s = Math.max(0, seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

/** Cuenta regresiva de un empuje.
 *
 * Arranca de los segundos que mandó el servidor y descuenta sola, así el reloj
 * no necesita que le manden un instante con zona horaria.
 *
 * La resincronización NO se hace acá adentro: el chip se remonta con una `key`
 * que incluye los segundos del pulso, y al remontarse este `useState` se
 * reinicializa solo. Es el reset de estado por key de siempre, y evita el
 * `setLeft(initialSeconds)` sincrónico dentro del efecto, que el compilador de
 * React no permite (react-hooks/set-state-in-effect). */
function useCountdown(initialSeconds: number): number {
  const [left, setLeft] = useState(initialSeconds)
  useEffect(() => {
    if (initialSeconds <= 0) return
    const id = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [initialSeconds])
  return left
}

function BoostChip({ boost, mine }: { boost: GameBoost; mine: boolean }) {
  const left = useCountdown(boost.expires_in_seconds)
  if (left <= 0) return null
  const fuerza = boostStrength(boost.multiplier)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs tabular-nums ring-1",
        mine && "font-semibold",
      )}
      // Todos marrones, no solo el propio. Un empuje ES un cafecito, y el
      // cafecito tiene un color en este juego: pintar unos sí y otros no hacía
      // parecer que fueran dos cosas distintas.
      //
      // El BRILLO lo decide el multiplicador, no de quién es: un ×3 se ve de
      // lejos y un ×1,1 apenas se insinúa, así que la fuerza del café se lee sin
      // leer el número. Al propio lo distinguen el peso de la letra y el dorado
      // del texto — si además fuera el más brillante, el brillo dejaría de
      // significar fuerza y pasaría a significar dos cosas a la vez.
      style={{
        backgroundColor: `color-mix(in oklab, ${AMBAR} ${10 + 12 * fuerza}%, transparent)`,
        color: mine
          ? ORO_CHIP
          : `color-mix(in oklab, ${AMBAR} ${68 + 22 * fuerza}%, #FFFFFF)`,
        "--tw-ring-color": `color-mix(in oklab, ${AMBAR} ${45 + 35 * fuerza}%, transparent)`,
        // El halo solo aparece de verdad en la mitad de arriba de la escala: a
        // fuerza baja queda en nada, que es lo que se quiere. Sin él, la
        // diferencia entre ×2 y ×3 era solo un poco más de relleno.
        boxShadow: `0 0 ${6 + 10 * fuerza}px color-mix(in oklab, ${AMBAR} ${13 * fuerza}%, transparent)`,
      } as React.CSSProperties}
      title={
        boost.donor_name
          ? `${boost.donor_name} invitó ${boost.cafecitos} cafecito(s)`
          : `${boost.cafecitos} cafecito(s)`
      }
    >
      {/* Sin sigla es el empuje GLOBAL: la donación que no se pudo atribuir a
          ninguna universidad y termina cobrándola todo el juego. */}
      {boost.university ? (
        <UniTag university={boost.university} />
      ) : (
        <span className="font-semibold uppercase tracking-wide">todos</span>
      )}
      {/* El multiplicador con el ícono de XP pegado, que es lo que dice QUÉ se
          multiplica. Sin él, un "×1,2" suelto al lado de un reloj se puede leer
          como cualquier cosa. Van juntos y sin separación entre ellos, para que
          se lean como una sola unidad y no como dos datos. */}
      <span className="inline-flex items-center gap-0.5 font-semibold">
        {fmtMultiplier(boost.multiplier)}
        <XpDots className="size-[0.85em]" />
      </span>
      {/* `ml-auto`: el reloj se va contra el borde derecho de su caja en vez de
          quedar pegado al multiplicador. Como la grilla le da a todos los chips
          el mismo ancho, los cuatro relojes quedan en una vertical y se pueden
          comparar de un vistazo. */}
      <span className={cn("ml-auto", mine && "opacity-80")}>{fmtRemaining(left)}</span>
    </span>
  )
}

/** Siglas con empuje vigente. Se calcula una vez por lista y se pasa a las
 * filas: llamar al hook adentro de cada fila serían cientos de suscripciones
 * al mismo caché para leer el mismo dato. */
function useBoostMultipliers(): Map<string, number> {
  const boosts = useGameBoosts()
  // El empuje global no entra: acá se marcan las filas de las universidades
  // impulsadas, y si le tocara a TODAS la marca dejaría de distinguir nada —
  // sería una pared encendida en vez de una comparación. El chip de "TODOS" ya
  // lo cuenta por su lado.
  return useMemo(() => {
    const m = new Map<string, number>()
    for (const b of boosts) if (b.university) m.set(b.university, b.multiplier)
    return m
  }, [boosts])
}

/** Cartel de empujes vigentes, arriba de todo el ranking.
 *
 * Va acá y no en cada layout para que la vista individual, la universitaria,
 * el escritorio y el teléfono lo hereden de una. Y muestra los empujes de las
 * OTRAS universidades a propósito: ver que otra está en ×1,6 mientras la tuya está
 * en nada es exactamente el motor de esta mecánica. */
function BoostBanner({ myUniversity }: { myUniversity: string | null }) {
  const boosts = useGameBoosts()
  const shown = useMemo(() => {
    if (boosts.length === 0) return []
    // La propia primero aunque tenga el multiplicador más bajo: es la que la
    // persona necesita ver, y la que decide si le conviene donar.
    const ordered = [...boosts].sort((a, b) => {
      const am = a.university === myUniversity ? 1 : 0
      const bm = b.university === myUniversity ? 1 : 0
      return bm - am || b.multiplier - a.multiplier
    })
    return ordered.slice(0, BOOSTS_SHOWN)
  }, [boosts, myUniversity])

  if (shown.length === 0) return null
  return (
    // Dos por fila, apilándose hacia abajo. Con `flex-wrap` los chips medían
    // cada uno lo suyo y la segunda fila arrancaba corrida respecto de la
    // primera: una escalera. En una grilla de dos columnas todos miden igual, se
    // alinean en dos verticales y agregar universidades solo agrega renglones.
    <div className="grid shrink-0 grid-cols-2 gap-1.5">
      {shown.map((b) => (
        <BoostChip
          // Los segundos van en la key a propósito: cada latido del pulso
          // remonta el chip y su cuenta regresiva vuelve a arrancar del valor
          // del servidor (ver useCountdown).
          key={`${b.university}:${b.expires_in_seconds}`}
          boost={b}
          mine={b.university === myUniversity}
        />
      ))}
    </div>
  )
}

// El `py-1` de la lista, que no forma parte de ninguna fila.
const LIST_TOP_PADDING = 4

// Sin tocar la rueda por este tiempo, la lista vuelve sola a la fila propia:
// mirar el ranking ajeno está bien, perderse en él no.
const IDLE_RECENTER_MS = 10_000

// Dónde tiene que quedar el scroll para que la fila marcada como propia
// descanse a ROWS_ABOVE del techo. Lo usan las dos vistas —la individual con la
// fila del jugador, la universitaria con la de su universidad— así que la lista
// se comporta igual en las dos.
function restingScrollTopFor(el: HTMLElement | null): number | null {
  const mine = el?.querySelector<HTMLElement>("[data-current='true']")
  if (!el || !mine) return null
  const rows = Array.from(el.querySelectorAll<HTMLElement>("li"))
  const index = rows.indexOf(mine)
  if (index < 0) return null
  const anchor = rows[Math.max(0, index - ROWS_ABOVE)]
  return Math.max(0, anchor.offsetTop - LIST_TOP_PADDING)
}

// Resaltado de "esta fila sos vos": el mismo en las dos vistas.
const MINE_ROW_CLASS = "bg-primary/10 ring-primary/30"

export type GameRankingProps = {
  // Puesto anterior: si viene y es peor que el actual, se anima la escalada.
  climbFrom?: number | null
  enabled?: boolean
  // XP a mostrar en la fila propia mientras el conteo la va llenando.
  liveXp?: number | null
  // Mientras el conteo está en curso, `liveXp` manda sobre el dato del ranking.
  counting?: boolean
  // El color del número mientras se llena: el azul-violeta de la XP, y null
  // cuando el conteo terminó (ver xp-conteo.ts).
  xpColor?: string | null
  // El nodo del número de la fila propia: es adonde vuelan los orbes. Solo lo
  // manda escritorio, que es donde los hay.
  attachXpTarget?: (node: HTMLElement | null) => void
  // Cambiar este número vuelve a centrar la fila propia con animación.
  centerKey?: number
  // La carrera del jugador. Solo se usa para saber si un filtro puesto es EL
  // SUYO y por lo tanto no hay que soltarlo al acertar.
  myCareer?: string | null
  // Universidad del jugador: se resalta en la vista universitaria igual que su
  // fila en la individual.
  myUniversity?: string | null
  // Vista impuesta desde afuera mientras dure algo. Hoy la usa una sola cosa: al
  // abrirse la diapo `¿Reclutas?` el ranking se conmuta a la lista de reclutas,
  // así que la promesa que la diapo escribe se ve al lado, en la tabla real, con
  // los que ya llegaron. Al cerrarse vuelve a `null` y con eso vuelve lo que la
  // persona estaba mirando: si conmutáramos con el setter normal, salir de la
  // diapo la dejaría en una vista que no eligió.
  viewOverride?: RankingView | null
  // Gemelo de `viewOverride`, para la diapo del café: mientras el slider ofrece
  // un multiplicador, el ranking se filtra a ESA universidad —individual, sin
  // carrera— y cada fila muestra el multiplicador en vez de su XP (ver `Row`).
  // Manda por encima de `viewOverride`: no pueden estar las dos diapos abiertas
  // a la vez, pero si alguna vez lo estuvieran, el café es el que se está
  // pagando ahora mismo.
  boostPreview?: { university: string; multiplier: number; color: string } | null
  // Por qué ordena el ranking, y qué número muestra cada fila: la experiencia
  // o el Elo. Vale para las DOS vistas —la individual y la universitaria—, que
  // es lo único que hace que el selector diga la verdad: estaba al lado de la
  // tuerca prometiendo "ordenar el ranking" y solo tocaba la de universidades,
  // así que pedir Elo dejaba la lista de personas ordenada por XP.
  //
  // Vive afuera —el selector que lo cambia está en la cabecera, no adentro del
  // ranking— así que es una prop y no un estado propio.
  sort?: RankingSort
  className?: string
}

/** Por qué ordena el ranking, en las dos vistas. Exportado para que el selector
 *  de la cabecera (desktop-layout.tsx) hable el mismo tipo.
 *
 *  Se dice "experiencia" y no "xp" porque es la palabra que se lee en la
 *  pantalla; el servidor usa la otra (UseGameLeaderboard.ts :: LeaderboardSort)
 *  y la traducción se hace acá, en el único lugar donde los dos se tocan. */
export type RankingSort = "experiencia" | "elo"

export function GameRanking({
  climbFrom = null,
  enabled = true,
  liveXp = null,
  counting = false,
  xpColor = null,
  attachXpTarget,
  centerKey = 0,
  myUniversity = null,
  myCareer = null,
  viewOverride = null,
  boostPreview = null,
  sort = "experiencia",
  className,
}: GameRankingProps) {
  // ── El ranking vuelve solo a donde el XP puede caer ────────────────────────
  // Al acertar, la XP entra en la fila propia. Si en ese momento se estaba
  // mirando el ranking de universidades —o el individual filtrado por OTRA
  // carrera o universidad— esa fila no está en pantalla, y el festejo termina en
  // una lista donde el número que sube no es de nadie que se vea.
  //
  // Así que el ranking se acomoda solo: vuelve al individual, y suelta los
  // filtros SALVO los propios. Filtrar por la carrera o la universidad de uno no
  // es irse a mirar otra cosa: es la misma competencia recortada, la fila propia
  // sigue ahí y sigue recibiendo la XP. Sacar ese filtro sería sacar a la persona
  // del ranking en el que estaba compitiendo.
  //
  // `centerKey` es la señal, y no una prop nueva: la bumpea el layout justo al
  // acertar, para que el ranking devuelva la fila propia a su lugar antes de que
  // el conteo arranque. Los medio segundos que el conteo espera antes del primer
  // paso son también los que la lista tiene para acomodarse (ver ESPERA_MS en
  // xp-conteo.ts): cuando el número empieza a subir, ya está a la vista.
  //
  // Derivado de la clave en vez de un setState en un efecto —que el compilador de
  // React no permite— igual que el paso de la escalada.
  const [elegido, setElegido] = useState<{
    key: number
    view: RankingView
    career: string
    university: string
  }>({ key: centerKey, view: "individual", career: ALL_SCOPE, university: ALL_SCOPE })

  const acaboDeAcertar = elegido.key !== centerKey
  const propio = (valor: string, mio: string | null) =>
    mio !== null && valor === mio ? valor : ALL_SCOPE

  // La vista impuesta gana sobre todo, incluido el reacomodo del acierto: si la
  // diapo de reclutas está abierta, lo que hay que mirar es la lista de reclutas.
  const view = boostPreview
    ? "individual"
    : (viewOverride ?? (acaboDeAcertar ? "individual" : elegido.view))
  const career = boostPreview
    ? ALL_SCOPE
    : acaboDeAcertar
      ? propio(elegido.career, myCareer)
      : elegido.career
  const university = boostPreview
    ? boostPreview.university
    : acaboDeAcertar
      ? propio(elegido.university, myUniversity)
      : elegido.university
  const scope: Scope = { university, career }

  // Los setters guardan SIEMPRE la clave del momento: así lo que se elija después
  // de un acierto queda, en vez de volver a reiniciarse en el siguiente render.
  const setView = (v: RankingView) =>
    setElegido({ key: centerKey, view: v, career, university })
  const setCareer = (v: string) =>
    setElegido({ key: centerKey, view, career: v, university })
  const setUniversity = (v: string) =>
    setElegido({ key: centerKey, view, career, university: v })

  const summary = useGameLeaderboardSummary(scope, enabled)
  // Solo se pide con la vista abierta: son los reclutas de UNA persona, no el
  // ranking entero, y antes de esto nadie más que `RecruitsRanking` la
  // necesitaba (ver useGameRecruits). Ahora también alimenta los indicadores
  // de arriba, así que sube hasta acá y baja como prop en vez de pedirse dos
  // veces.
  const recruits = useGameRecruits(enabled && view === "recruits")
  // Mientras no hay reclutas propios —sea porque todavía no llegó la respuesta
  // o porque en verdad no hay ninguno— la lista de abajo (ListaDeReclutas)
  // muestra los CINCO renglones de ejemplo, sin esperar al servidor: son datos
  // fijos del cliente. Los indicadores de arriba tienen que contar lo mismo
  // que esos renglones y no cero, que al lado de cinco filas se leería como una
  // contradicción y no como "todavía no tenés ninguno".
  const reclutasVacio = (recruits.data?.entries.length ?? 0) === 0
  const reclutasCount = reclutasVacio ? EJEMPLOS_COUNT : (recruits.data?.total_recruits ?? 0)
  const reclutasXp = reclutasVacio ? EJEMPLOS_XP_TOTAL : (recruits.data?.total_xp_given ?? 0)

  // Sin alto propio: lo acota quien lo usa (una columna flex en escritorio, la
  // slide en el teléfono). Con `h-full` acá, una cadena de padres sin `min-h-0`
  // lo dejaba crecer más que la pantalla y las últimas filas quedaban cortadas.
  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="flex shrink-0 flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {view === "recruits" ? (
            <>
              {/* Los mismos dos huecos que "Estudiantes"/"Derivadas", pero
                  hablando de LO TUYO: cuántos reclutas tenés y cuánto te
                  aportaron, en el mismo verde que la columna de aporte de cada
                  renglón (ver reclutas-list.tsx) — es el mismo dato, arriba y
                  resumido. */}
              <Metric
                label="Reclutas"
                value={
                  <span className="inline-flex items-center gap-1.5" style={{ color: VERDE }}>
                    <CountUp value={reclutasCount} format={fmtCount} />
                    <UsersIcon className="size-[0.85em]" />
                  </span>
                }
              />
              <Metric
                label="Te aportaron"
                value={
                  <span className="inline-flex items-center gap-1.5" style={{ color: VERDE }}>
                    +
                    <CountUp value={reclutasXp} format={fmtCount} />
                    <XpDots className="size-[0.85em]" />
                  </span>
                }
              />
            </>
          ) : boostPreview ? (
            <>
              {/* Gemelo del de reclutas: mientras la diapo del café ofrece un
                  multiplicador, acá van cuántos estudiantes tiene esa
                  universidad —`summary` ya viene filtrado por el `scope` de
                  arriba, así que no hace falta recontar nada— y con QUÉ, en
                  vez de con cuántas derivadas resolvió. Los dos íconos, en el
                  mismo color que la barra: son la misma decisión, resumida. */}
              <Metric
                label="Estudiantes"
                value={
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: boostPreview.color }}
                  >
                    {summary.isPending ? (
                      <Hueco alto="h-[1em]" className="w-10" barra="h-3.5 w-full" />
                    ) : (
                      <CountUp value={summary.data?.players ?? 0} format={fmtCount} />
                    )}
                    <UsersIcon className="size-[0.85em]" />
                  </span>
                }
              />
              <Metric
                label="Multiplicador"
                value={
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: boostPreview.color }}
                  >
                    {fmtMultiplier(boostPreview.multiplier)}
                    <XpDots className="size-[0.85em]" />
                  </span>
                }
              />
            </>
          ) : (
            <>
              {/* Mientras el resumen viaja va una barra y no el `?? 0`. El cero
                  no era un lugar vacío esperando el dato: decía que no hay
                  nadie jugando, que es una afirmación, y encima falsa. El
                  ícono sí se queda —no es dato, no hay nada suyo que
                  esperar— y con él la caja mide exactamente lo mismo antes y
                  después. */}
              <Metric
                label="Estudiantes"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    {summary.isPending ? (
                      <Hueco alto="h-[1em]" className="w-10" barra="h-3.5 w-full" />
                    ) : (
                      <CountUp value={summary.data?.players ?? 0} format={fmtCount} />
                    )}
                    <UsersIcon className="size-[0.85em] text-primary" />
                  </span>
                }
              />
              {/* Elo promedio y no Derivadas cuando el selector de la cabecera
                  (al lado de la tuerca) está en "elo": es el mismo par que ya
                  se respeta fila por fila (mostrar un número distinto del que
                  ordena se lee como un bug), llevado al resumen de arriba.

                  La palabra "Elo" no va en el rótulo sino PEGADA al número, en
                  la misma versalita que la lleva en cada fila del ranking (ver
                  `EloDeJugador`). Así el tile se lee igual que las veinte
                  filas de abajo —número más ELO— en vez de ser el único lugar
                  donde el Elo se nombra en un rótulo, y el renglón de abajo
                  queda para lo único que este número tiene de distinto: que es
                  un promedio. */}
              <Metric
                label={sort === "elo" ? "Promedio" : "Derivadas"}
                value={
                  sort === "elo" ? (
                    <span className="inline-flex items-baseline gap-1">
                      {summary.isPending ? (
                        <Hueco alto="h-[1em]" className="w-10" barra="h-3.5 w-full" />
                      ) : summary.data?.elo_avg == null ? (
                        // El guion es un dato, no una espera: significa que
                        // todavía no hay suficientes partidas para promediar.
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <CountUp value={summary.data.elo_avg} format={fmtCount} />
                      )}
                      <span className="text-[0.7em] font-normal tracking-wider text-muted-foreground">
                        ELO
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      {summary.isPending ? (
                        <Hueco alto="h-[1em]" className="w-10" barra="h-3.5 w-full" />
                      ) : (
                        <CountUp value={summary.data?.exercises ?? 0} format={fmtCount} />
                      )}
                      <LayersIcon className="size-[0.85em] text-primary" />
                    </span>
                  )
                }
              />
            </>
          )}
        </div>
        <ScopeFilters
          view={view}
          onViewChange={setView}
          career={career}
          onCareerChange={setCareer}
          university={university}
          onUniversityChange={setUniversity}
          universities={summary.data?.universities ?? []}
          withRecruits
          scopeDisabled={view === "recruits" || !!boostPreview}
        />
        <BoostBanner myUniversity={myUniversity} />
      </div>

      {view === "recruits" ? (
        <RecruitsRanking data={recruits.data} myUniversity={myUniversity} />
      ) : view === "individual" ? (
        <IndividualRanking
          scope={scope}
          enabled={enabled}
          sort={sort}
          // Todo lo del festejo queda apagado en el orden por Elo, y no es una
          // precaución: la escalada mueve la fila propia por los puestos que
          // ganó DE XP, y los orbes vuelan al número de XP de esa fila, que en
          // este orden no está dibujado. Al acertar el selector vuelve solo a
          // experiencia (desktop-layout.tsx), así que esto es lo que pasa en el
          // hueco entre el acierto y ese cambio, no el caso normal.
          climbFrom={sort === "elo" ? null : climbFrom}
          liveXp={sort === "elo" ? null : liveXp}
          counting={counting}
          xpColor={xpColor}
          attachXpTarget={sort === "elo" ? undefined : attachXpTarget}
          centerKey={centerKey}
          boostPreview={boostPreview}
        />
      ) : (
        <UniversityRanking
          scope={scope}
          enabled={enabled}
          myUniversity={myUniversity}
          sort={sort}
        />
      )}
    </div>
  )
}

// Cada cuánto se aplica UN reordenamiento. El pulso trae los datos cada 10 s, así
// que hay lugar de sobra para desarmar una tanda en varios pasos sin que se
// solape con la siguiente.
const SWAP_MS = 420

// Más que esto no es una historia, es un revuelo: cuando la tanda trae demasiados
// cruces, se aplica de una. Verlos de a uno tardaría más que el próximo pulso y
// además nadie sigue catorce movimientos seguidos.
const MAX_SWAPS = 14

/** ¿Las dos listas ya dicen lo mismo, en el mismo orden? Lineal, para poder
 *  descartar el caso normal antes de gastar nada. */
function mismoOrden(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/** La secuencia de intercambios ENTRE VECINOS que lleva de un orden al otro.
 *
 * Es un bubble sort contra la posición de destino: cada paso devuelve el índice
 * `i` donde hay que cruzar `i` con `i+1`. Se eligió así y no "sacar y meter"
 * porque un cruce entre vecinos es exactamente lo que se lee como "este pasó a
 * aquel" — que es lo que el ranking tiene para contar. */
function swapsToReach(current: readonly number[], target: readonly number[]): number[] {
  const pos = new Map(target.map((id, i) => [id, i]))
  const arr = [...current]
  const out: number[] = []
  for (let end = arr.length - 1; end > 0; end--) {
    let moved = false
    for (let i = 0; i < end; i++) {
      if ((pos.get(arr[i]) ?? 0) > (pos.get(arr[i + 1]) ?? 0)) {
        const t = arr[i]
        arr[i] = arr[i + 1]
        arr[i + 1] = t
        out.push(i)
        moved = true
      }
    }
    if (!moved) break
  }
  return out
}

/** Muestra la lista aplicando UN reordenamiento por vez.
 *
 * Los datos llegan todos juntos con cada pulso —la XP de cada fila se actualiza
 * al toque— pero el ORDEN se acomoda de a un cruce, con una pausa entre uno y
 * otro. Sin esto, una tanda con cinco cambios mueve cinco filas a la vez y no se
 * entiende quién pasó a quién; de a uno, cada movimiento se lee.
 *
 * Solo se escalona el orden. Si cambia el CONJUNTO de jugadores (entró o salió
 * alguien de la ventana, o se cambió de filtro) no hay cruces que contar y se
 * aplica de una: un alta no es un sobrepaso. */
function useStagedOrder(entries: GameLeaderboardEntry[]): GameLeaderboardEntry[] {
  const [orderIds, setOrderIds] = useState<number[]>([])
  const targetRef = useRef<number[]>([])
  const orderRef = useRef<number[]>([])
  const queueRef = useRef<number[]>([])

  const byId = useMemo(
    () => new Map(entries.map((e) => [e.player_id, e])),
    [entries],
  )

  // El orden efectivo: hasta que el intervalo lo llene, el que viene del
  // servidor. Derivado y no un setState en efecto —que el compilador rechaza— y
  // de paso evita que la lista parpadee vacía en el primer render.
  //
  // Memoizado para que su identidad sea estable: es la dependencia de la lista
  // final, y sin esto había que compararlo armando un `join(",")` de todos los
  // ids en cada render.
  const shownIds = useMemo(
    () => (orderIds.length > 0 ? orderIds : entries.map((e) => e.player_id)),
    [orderIds, entries],
  )

  useEffect(() => {
    targetRef.current = entries.map((e) => e.player_id)
    orderRef.current = shownIds
  })

  useEffect(() => {
    const id = setInterval(() => {
      // Con la pestaña tapada no hay a quién contarle el sobrepaso, y este
      // intervalo es de los pocos que corren toda la sesión: en escritorio el
      // ranking queda montado de principio a fin.
      if (typeof document !== "undefined" && document.hidden) return

      const target = targetRef.current
      const actual = orderRef.current
      if (target.length === 0) return

      // La salida temprana: casi siempre el orden ya está donde tiene que estar
      // y no hay nada que hacer. Sin esto, cada latido pagaba el `includes` de
      // abajo —que es cuadrático— sobre las hasta noventa filas que puede tener
      // una lista scrolleada, dos veces y media por segundo, para nada.
      if (queueRef.current.length === 0 && mismoOrden(target, actual)) return

      // ¿Cambió el conjunto? Entonces no hay cruces: se aplica entero.
      const mismoConjunto =
        target.length === actual.length && target.every((x) => actual.includes(x))
      if (!mismoConjunto) {
        queueRef.current = []
        setOrderIds(target)
        return
      }

      if (queueRef.current.length === 0) {
        const pasos = swapsToReach(actual, target)
        if (pasos.length === 0) return
        if (pasos.length > MAX_SWAPS) {
          setOrderIds(target)
          return
        }
        queueRef.current = pasos
      }

      const i = queueRef.current.shift() as number
      setOrderIds((prev) => {
        const base = prev.length > 0 ? prev : actual
        if (i + 1 >= base.length) return base
        const next = [...base]
        const t = next[i]
        next[i] = next[i + 1]
        next[i + 1] = t
        return next
      })
    }, SWAP_MS)
    return () => clearInterval(id)
  }, [])

  // Los datos son SIEMPRE los últimos; lo único escalonado es el orden.
  return useMemo(
    () => shownIds.map((id) => byId.get(id)).filter((e): e is GameLeaderboardEntry => !!e),
    [shownIds, byId],
  )
}


function IndividualRanking({
  scope,
  enabled,
  sort,
  climbFrom,
  liveXp,
  counting,
  xpColor,
  attachXpTarget,
  centerKey,
  boostPreview,
}: {
  scope: Scope
  enabled: boolean
  sort: RankingSort
  climbFrom: number | null
  liveXp: number | null
  counting: boolean
  xpColor: string | null
  attachXpTarget?: (node: HTMLElement | null) => void
  centerKey: number
  boostPreview?: { university: string; multiplier: number; color: string } | null
}) {
  const boostByUni = useBoostMultipliers()
  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
  } = useGameLeaderboard(scope, enabled, sort === "elo" ? "elo" : "xp")

  // Al refrescar tras sumar XP, la ventana `around_me` se corre y puede repetir
  // a alguien que otra página ya traía: sin deduplicar, React vería dos filas
  // con la misma key.
  const rawEntries = useMemo(() => {
    const seen = new Set<number>()
    const out: GameLeaderboardEntry[] = []
    for (const entry of data?.pages.flatMap((p) => p.entries) ?? []) {
      if (seen.has(entry.player_id)) continue
      seen.add(entry.player_id)
      out.push(entry)
    }
    return out
  }, [data])

  // El orden llega de a un cruce por vez; los datos, todos juntos.
  const entries = useStagedOrder(rawEntries)

  const meIndex = entries.findIndex((e) => e.is_current_player)
  const myRank = meIndex >= 0 ? entries[meIndex].rank : null
  const climbing = climbFrom !== null && myRank !== null && climbFrom > myRank

  // ── Escalada puesto por puesto ─────────────────────────────────────────────
  // No es un salto del puesto viejo al nuevo: la fila propia va pasando a uno
  // por vez, y en cada paso las dos tarjetas permutan con el FLIP de motion. Es
  // lo que hace que se vea a quién superaste, en vez de aparecer más arriba.
  const distance = climbing ? climbFrom - (myRank as number) : 0

  // Identidad de la escalada en curso. Derivar el paso de esta clave (en vez de
  // resetearlo con un setState sincrónico en un efecto) evita el render en
  // cascada que marca el linter.
  const climbKey = climbing
    ? `${climbFrom}:${entries.map((e) => e.player_id).join(",")}`
    : null
  const [climbState, setClimbState] = useState<{ key: string | null; step: number }>({
    key: null,
    step: 0,
  })
  const step = climbState.key === climbKey ? climbState.step : 0
  const remaining = Math.max(0, distance - step)
  const settled = !climbing || remaining === 0

  // Duración de cada paso, con el total acotado: una escalada de tres puestos se
  // saborea, una de treinta no puede durar diez segundos.
  const stepMs =
    distance > 0
      ? Math.max(CLIMB_STEP_MIN_MS, Math.min(CLIMB_STEP_MAX_MS, Math.round(CLIMB_TOTAL_MS / distance)))
      : 0

  useEffect(() => {
    if (!climbing || remaining === 0) return
    const t = setTimeout(() => setClimbState({ key: climbKey, step: step + 1 }), stepMs)
    return () => clearTimeout(t)
  }, [climbing, climbKey, remaining, step, stepMs])

  // ── Scroll: centrado, anclaje al prepend y carga por baches ────────────────
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const centeredRef = useRef(false)
  const prevTopRankRef = useRef<number | null>(null)
  const prevHeightRef = useRef(0)

  // Posición de descanso de la fila propia: a ROWS_ABOVE filas del techo, no en
  // el centro exacto. Se ancla contando filas y no con aritmética de píxeles
  // para que no dependa del alto de la caja: la fila propia queda siempre la
  // quinta, entren ocho filas o quince.
  const restingScrollTop = useCallback(() => restingScrollTopFor(scrollRef.current), [])

  const snapToMe = useCallback(
    (smooth: boolean) => {
      const el = scrollRef.current
      const top = restingScrollTop()
      if (!el || top === null) return
      if (Math.abs(el.scrollTop - top) < 4) return
      el.scrollTo({ top, behavior: smooth ? "smooth" : "auto" })
    },
    [restingScrollTop],
  )

  // Cambiar de scope —o de orden— reinicia la query: hay que volver a acomodar
  // la lista. El orden no es un detalle acá: por Elo la fila propia cae en otro
  // puesto, así que sin este reinicio la lista nueva se dibuja con el scroll
  // apuntando a donde estaba la fila en la lista vieja.
  useEffect(() => {
    centeredRef.current = false
    prevTopRankRef.current = null
    prevHeightRef.current = 0
  }, [scope.university, scope.career, sort])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || entries.length === 0) return
    const firstRank = entries[0]?.rank ?? null
    if (!centeredRef.current) {
      snapToMe(false)
      centeredRef.current = true
    } else if (
      prevTopRankRef.current !== null &&
      firstRank !== null &&
      firstRank < prevTopRankRef.current
    ) {
      // Llegó un bache por arriba: la lista creció hacia atrás, así que hay que
      // compensar el scroll o el contenido salta bajo el cursor.
      el.scrollTop += el.scrollHeight - prevHeightRef.current
    }
    prevTopRankRef.current = firstRank
    prevHeightRef.current = el.scrollHeight
    // Con dependencias, no en cada render.
    //
    // Sin ellas esto corría después de CADA pintado, y lee `scrollHeight`, que
    // obliga al navegador a recalcular el layout en el acto. Durante el festejo
    // son catorce renders en menos de dos segundos, cada uno con su reflujo
    // forzado intercalado entre las escrituras de motion — justo lo que hace que
    // el momento de acertar se sienta trabado.
    //
    // Lo único que puede mover el alto de la lista o el puesto de la primera
    // fila es que cambien las filas, así que `entries` es toda la dependencia
    // que hace falta. La XP en vuelo no cambia ninguna de las dos cosas.
  }, [entries, snapToMe])

  // El scroll acompaña la escalada, con retraso. Se acerca solo una fracción del
  // camino en cada paso, así se ve que la fila trepa por la pantalla en vez de
  // quedar clavada en el centro mientras el resto desfila. Lo único que no se
  // negocia es que la tarjeta propia nunca se salga de la vista: por eso el
  // resultado se acota a la franja donde sigue entera en pantalla.
  useLayoutEffect(() => {
    if (!climbing) return
    const el = scrollRef.current
    const mine = el?.querySelector<HTMLElement>("[data-current='true']")
    if (!el || !mine) return
    const resting = restingScrollTop()
    if (resting === null) return
    const margin = mine.offsetHeight
    const lowest = mine.offsetTop + mine.offsetHeight + margin - el.clientHeight
    const highest = mine.offsetTop - margin
    const followed = el.scrollTop + (resting - el.scrollTop) * CLIMB_SCROLL_FOLLOW
    el.scrollTop = Math.max(Math.min(followed, highest), lowest)
  }, [step, climbing, restingScrollTop])

  // Al terminar de escalar, el retraso acumulado se salda: la fila vuelve a su
  // posición de descanso con un scroll suave.
  useEffect(() => {
    if (!climbing || !settled) return
    snapToMe(true)
  }, [climbing, settled, climbKey, snapToMe])

  // Cambiar de puesto siempre reacomoda, escales vos o te pasen los demás:
  // mientras resolvés el ranking sigue moviéndose, y sin esto la fila propia se
  // iría yendo de la vista sola.
  useEffect(() => {
    if (myRank === null || !settled) return
    snapToMe(true)
  }, [myRank, settled, snapToMe])

  // Recentrado a pedido del layout (al resolver) — con animación.
  const firstCenterKey = useRef(centerKey)
  useEffect(() => {
    if (centerKey === firstCenterKey.current) return
    snapToMe(true)
  }, [centerKey, snapToMe])

  // Recentrado por inactividad: el timer se reinicia con cada rueda.
  // `entries.length` en las dependencias no es decorativo: en el primer render
  // la lista todavía es el esqueleto y `scrollRef` está vacío, así que sin un
  // dato que cambie al llegar las filas el efecto no volvería a correr y el
  // listener no se ataría nunca.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let timer: ReturnType<typeof setTimeout>
    const arm = () => {
      clearTimeout(timer)
      timer = setTimeout(() => snapToMe(true), IDLE_RECENTER_MS)
    }
    el.addEventListener("scroll", arm, { passive: true })
    arm()
    return () => {
      clearTimeout(timer)
      el.removeEventListener("scroll", arm)
    }
  }, [snapToMe, entries.length])

  const topSentinelRef = useRef<HTMLDivElement | null>(null)
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const observers: IntersectionObserver[] = []
    const watch = (node: HTMLElement | null, enabledPage: boolean, load: () => void) => {
      if (!node || !enabledPage) return
      const io = new IntersectionObserver(
        (e) => {
          if (e[0].isIntersecting) load()
        },
        { root, rootMargin: "300px" },
      )
      io.observe(node)
      observers.push(io)
    }
    watch(topSentinelRef.current, hasPreviousPage && !isFetchingPreviousPage, () =>
      fetchPreviousPage(),
    )
    watch(bottomSentinelRef.current, hasNextPage && !isFetchingNextPage, () => fetchNextPage())
    return () => observers.forEach((o) => o.disconnect())
  }, [
    hasPreviousPage,
    hasNextPage,
    isFetchingPreviousPage,
    isFetchingNextPage,
    fetchPreviousPage,
    fetchNextPage,
    entries.length,
  ])

  // `isPending` y no `isLoading`: son distintos justo en el caso que importa.
  // `isLoading` es `isPending && isFetching`, así que da FALSO mientras la
  // consulta está deshabilitada — y esta lo está hasta que existe el jugador
  // (`enabled: player !== null`). Con `isLoading`, toda la ventana entre que
  // abrís el juego y que vuelve el alta caía acá abajo y decía «todavía no hay
  // ranking»: una afirmación sobre datos que nunca se pidieron. Con el back
  // caído se quedaba ahí para siempre.
  //
  // El esqueleto dice lo único cierto en ese momento, que es «todavía no sé».
  if (isPending) return <ListSkeleton />
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay ranking.</p>
  }

  // Orden de este paso: la fila propia todavía a `remaining` puestos de su lugar.
  const ordered =
    remaining === 0 || meIndex < 0
      ? entries
      : (() => {
          const rows = [...entries]
          const [mine] = rows.splice(meIndex, 1)
          rows.splice(Math.min(rows.length, meIndex + remaining), 0, mine)
          return rows
        })()

  return (
    // `relative` no es decorativo: hace que el scroller sea el `offsetParent` de
    // las filas. Sin él, `offsetTop` se mide contra el ancestro posicionado de
    // más arriba y arrastra el alto de los indicadores y los filtros, así que el
    // centrado se pasaba de largo y la fila propia quedaba pegada al techo.
    // La lista llena la card. Tuvo un tope de 516 px —diez filas exactas, para
    // que al llegar al final no asomara media por el techo— pero ese número no
    // se lleva con una card que mide lo que mide la ventana: en cuanto la
    // pantalla daba para más, sobraban ochenta y pico de píxeles muertos abajo,
    // y como la vista de universidades nunca tuvo tope, el hueco aparecía y
    // desaparecía al cambiar de vista. Una fila cortada arriba dice "hay más
    // gente encima", que es cierto; un hueco al pie no dice nada.
    <div
      ref={scrollRef}
      className="no-scrollbar relative -mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1"
    >
      {hasPreviousPage && <div ref={topSentinelRef} aria-hidden className="h-px" />}
      {isFetchingPreviousPage && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}
      <ol className="flex flex-col gap-2 py-1">
        {ordered.map((entry) => (
          <Row
            key={entry.player_id}
            entry={entry}
            // Durante la escalada el puesto propio va bajando de a uno, igual
            // que la fila.
            shownRank={
              entry.is_current_player ? entry.rank + remaining : entry.rank
            }
            // Mientras el conteo corre manda él (aunque la lista ya tenga el
            // total); una vez que terminó, el mayor de los dos, para que el
            // número no retroceda si el ranking viene atrasado.
            xp={
              entry.is_current_player && liveXp !== null
                ? counting
                  ? liveXp
                  : Math.max(liveXp, entry.xp)
                : entry.xp
            }
            // También la fila propia: si mientras resolvías te pasaron, la
            // flecha tiene que bajar o darse vuelta como la de cualquiera.
            delta={entry.rank_delta}
            sort={sort}
            boostMultiplier={
              entry.university ? boostByUni.get(entry.university) ?? null : null
            }
            xpColor={entry.is_current_player ? xpColor : null}
            attachXpTarget={entry.is_current_player ? attachXpTarget : undefined}
            // Todas las filas son de la misma universidad —la que filtró
            // `boostPreview`— así que el multiplicador que se está por comprar
            // es el mismo para todas: el empuje es parejo para toda la
            // universidad, no por persona.
            previewMultiplier={
              boostPreview
                ? { value: boostPreview.multiplier, color: boostPreview.color }
                : null
            }
          />
        ))}
      </ol>
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <Spinner />
        </div>
      )}
      {hasNextPage && <div ref={bottomSentinelRef} aria-hidden className="h-px" />}
    </div>
  )
}

// `memo` a propósito, y es de las pocas veces que hace falta teniendo el
// compilador de React activado.
//
// El festejo sube el contador una vez por paso —hasta catorce en menos de dos
// segundos, y ahora además le cambia el color a cada uno— y cada una de esas
// subidas vuelve a correr el `.map()` de la lista. Sin esto, cada tick rehacía
// las hasta noventa filas que puede tener un ranking scrolleado, y como cada fila
// es un `motion.li layout`, eso significa noventa mediciones de caja y noventa
// resortes por tick. El momento de recompensa —justo donde el juego tiene que
// verse bien— era el fotograma más caro de la aplicación.
//
// Las props de las filas ajenas son todas primitivas más `entry`, que viene
// estable del caché de la query: la comparación superficial de `memo` alcanza
// para que solo se rehaga la fila propia, que es la única que cambia.
const Row = memo(function Row({
  entry,
  shownRank,
  xp,
  delta,
  sort,
  boostMultiplier,
  xpColor,
  attachXpTarget,
  previewMultiplier = null,
}: {
  entry: GameLeaderboardEntry
  shownRank: number
  xp: number
  // Puestos que ganó (+) o perdió (−) en los últimos minutos. 0 = sin flecha.
  delta: number
  // Qué número cierra la fila: la experiencia o el Elo. Es el mismo que ordena
  // la lista, siempre — mostrar uno y ordenar por el otro se lee como un bug,
  // que es exactamente lo que pasaba antes de que el selector llegara hasta
  // acá.
  sort: RankingSort
  // Su universidad tiene un empuje de cafecitos corriendo. Se marca en la fila
  // para que quede claro por qué esta persona está sumando más rápido: el
  // multiplicador se ve, no se esconde.
  // Multiplicador de su universidad, o null si no tiene empuje corriendo.
  boostMultiplier: number | null
  // Solo la fila propia y solo mientras cuenta: el color del conteo, o null.
  xpColor?: string | null
  attachXpTarget?: (node: HTMLElement | null) => void
  // La diapo del café tiene un slider abierto y esta fila es de la universidad
  // que filtró: en vez de la experiencia (o el Elo) se muestra lo que ese
  // multiplicador le daría, con el mismo color que la barra. Gana por encima de
  // `sort`: previsualizar un empuje importa más que el orden del momento.
  previewMultiplier?: { value: number; color: string } | null
}) {
  const mine = entry.is_current_player
  const emoji = badgeWithCrown({
    username: entry.alias,
    resolved: entry.career ? CAREER_EMOJI[entry.career] : undefined,
    career: entry.career,
  })
  return (
    <motion.li
      layout
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      data-current={mine ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10",
        mine && MINE_ROW_CLASS,
      )}
      style={
        previewMultiplier
          ? filaConEmpuje(previewMultiplier.value)
          : boostMultiplier === null
            ? undefined
            : filaConEmpuje(boostMultiplier)
      }
    >
      <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
        {shownRank}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className="truncate text-sm font-medium"
          style={{ color: levelColor(entry.level) }}
        >
          {entry.alias}
        </span>
        {emoji && <span className="shrink-0 text-sm leading-none">{emoji}</span>}
      </span>
      {delta !== 0 && (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-0.5 text-xs font-medium tabular-nums",
            delta > 0 ? "text-green-400" : "text-orange-400",
          )}
          aria-label={`${delta > 0 ? "subió" : "bajó"} ${Math.abs(delta)} puestos`}
        >
          {delta > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
          {Math.abs(delta)}
        </span>
      )}
      {entry.university && (
        <span className="inline-flex shrink-0 items-center gap-1">
          <UniTag university={entry.university} />
        </span>
      )}
      {previewMultiplier ? (
        // Sin popover: acá no hay nada que explicar que la propia diapo del
        // café no esté diciendo ya. El número es el mismo para las veinte
        // filas —el empuje es parejo para toda la universidad— así que lo
        // único que cambia entre una fila y otra es a quién pertenece.
        <span
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums"
          style={{ color: previewMultiplier.color }}
        >
          {fmtMultiplier(previewMultiplier.value)}
          <XpDots className="size-[0.85em]" />
        </span>
      ) : sort === "elo" ? (
        <EloDeJugador elo={entry.elo} ranked={entry.elo_ranked} alias={entry.alias} />
      ) : (
        <XpDeJugador xp={xp} color={xpColor} attachXpTarget={attachXpTarget} />
      )}
    </motion.li>
  )
})

// Cuánto espera el cartel antes de cerrarse al salir con el mouse. El contenido
// se dibuja en un PORTAL, o sea que no es hijo del disparador: sin esta demora,
// ir del número al cartel dispara el `mouseleave` del primero antes del
// `mouseenter` del segundo y el cartel parpadea en el camino.
const CIERRE_MS = 120

/** El Elo de una universidad, con la explicación de qué mide.
 *
 * Abre con el mouse encima Y con click, las dos cosas. El click no se puede
 * perder: en el teléfono —donde más se mira el ranking— no hay hover, y era la
 * única forma de leer esto. Pero pedir un click en escritorio para una aclaración
 * de dos renglones es pedir de más.
 *
 * Sigue siendo un Popover y no un tooltip por lo mismo de siempre: el tooltip
 * abre solo con hover. */
/** El gesto de los carteles del ranking: abre con el mouse encima Y con click.
 *
 * El click no se puede perder: en el teléfono —donde más se mira el ranking— no
 * hay hover y era la única forma de leer esto. Pero pedir un click en escritorio
 * para una aclaración de dos renglones es pedir de más.
 *
 * Devuelve lo que hay que repartir entre el disparador y el contenido: los dos
 * necesitan `onMouseEnter`/`onMouseLeave`, porque el cartel se dibuja en un
 * portal y no es hijo del disparador (ver CIERRE_MS). */
export function useCartel() {
  const [abierto, setAbierto] = useState(false)
  const cierreRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abrir = () => {
    if (cierreRef.current) clearTimeout(cierreRef.current)
    setAbierto(true)
  }
  const cerrar = () => {
    if (cierreRef.current) clearTimeout(cierreRef.current)
    cierreRef.current = setTimeout(() => setAbierto(false), CIERRE_MS)
  }
  useEffect(() => () => {
    if (cierreRef.current) clearTimeout(cierreRef.current)
  }, [])
  return {
    abierto,
    setAbierto,
    gestos: { onMouseEnter: abrir, onMouseLeave: cerrar },
  }
}

/** La experiencia de una fila, con la explicación de qué mide.
 *
 * Es el complemento exacto del cartel del Elo: uno dice que el Elo NO mide
 * cuánto jugaste y que los cafecitos no lo mueven, y este dice que la
 * experiencia sí mide eso y que los cafecitos sí la multiplican. Leídos juntos,
 * los dos números del ranking dejan de ser dos números parecidos.
 *
 * `color` pinta el número Y su ícono mientras dura el festejo, y al terminar
 * vuelve a null, que es el color heredado de la fila. Va SIN transición a
 * propósito: se prende junto con el primer paso, y un degradé de medio segundo lo
 * despegaría de eso.
 *
 * Se pinta el par entero y no solo el dígito porque el par entero ES la unidad
 * que se lee —"tanta experiencia"—; con el número verde y el ícono blanco al
 * lado, lo que se ve es un número que se destiñó, no una cosa que se prendió.
 *
 * `attachXpTarget` va sobre el DISPARADOR y no sobre un envoltorio ni sobre el
 * span del número: es el destino de los orbes, y la caja del botón es la que
 * ocupa el número junto con su ícono, o sea el blanco al que hay que apuntar. */
function XpDeJugador({
  xp,
  color = null,
  attachXpTarget,
}: {
  xp: number
  color?: string | null
  attachXpTarget?: (node: HTMLElement | null) => void
}) {
  const { abierto, setAbierto, gestos } = useCartel()
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        {...gestos}
        ref={attachXpTarget}
        className="inline-flex shrink-0 items-center gap-1 rounded text-sm font-semibold tabular-nums outline-none transition-opacity hover:opacity-80"
        style={color === null ? undefined : { color }}
        aria-label="Qué es la experiencia"
      >
        {fmtCount(xp)}
        {/* Sin `text-white` mientras cuenta: el ícono se dibuja con
            `currentColor`, así que soltándolo se prende del mismo verde que
            hereda del botón. */}
        <XpDots className={cn("size-[0.85em]", color === null && "text-white")} />
      </PopoverTrigger>
      <PopoverContent {...gestos} className="text-left text-xs leading-relaxed">
        <p>
          <span className="font-semibold text-foreground">
            {fmtCount(xp)} de experiencia
          </span>
          . Cada derivada bien resuelta suma: un poco más si era difícil, y de
          arranque más del triple si sale al primer intento.
        </p>
        <p className="mt-2 text-muted-foreground">
          Mide cuánto jugaste, no qué tan bien — nunca baja, y los cafecitos la
          multiplican. Qué tan difícil es lo que resolvés lo dice el Elo.
        </p>
      </PopoverContent>
    </Popover>
  )
}

/** El Elo de una persona: el mismo lugar de la fila que ocupa `XpDeJugador`,
 *  con el otro número. Cuál de los dos se dibuja lo decide el selector de la
 *  cabecera, y es SIEMPRE el que ordena la lista.
 *
 *  Sin `attachXpTarget` ni color de conteo, a diferencia de su hermano: los
 *  orbes son de experiencia y vuelan al número de experiencia. Por eso acertar
 *  devuelve el selector a esa columna (desktop-layout.tsx) en vez de hacer que
 *  este número los reciba — un orbe cayendo sobre el Elo estaría diciendo que
 *  el acierto lo sube, y el Elo lo mueven los aciertos y los errores por igual.
 *
 *  Provisorio hasta las RAMP_UPDATES respuestas, igual que una universidad
 *  antes de sus diez jugadores: hasta ahí muestra "—" y en el orden por Elo va
 *  al fondo. */
function EloDeJugador({
  elo,
  ranked,
  alias,
}: {
  elo: number
  ranked: boolean
  alias: string
}) {
  const { abierto, setAbierto, gestos } = useCartel()
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        {...gestos}
        className="inline-flex shrink-0 items-baseline gap-1 rounded text-sm font-semibold tabular-nums outline-none transition-opacity hover:opacity-80"
        aria-label={`Qué mide el Elo de ${alias}`}
      >
        {ranked ? fmtCount(elo) : <span className="text-muted-foreground">—</span>}
        {/* Misma versalita que la fila de una universidad: es el mismo número
            y tiene que leerse igual en las dos tablas. */}
        <span className="text-[0.7em] font-normal tracking-wider text-muted-foreground">
          ELO
        </span>
      </PopoverTrigger>
      <PopoverContent {...gestos} className="text-left text-xs leading-relaxed">
        {ranked ? (
          <p>
            <span className="font-semibold text-foreground">{fmtCount(elo)} de Elo</span>.
          </p>
        ) : (
          <p>
            El Elo de {alias} todavía es provisorio: se firma a las{" "}
            <span className="font-semibold text-foreground">
              {RAMP_UPDATES} respuestas
            </span>
            , y hasta entonces va al final de esta tabla.
          </p>
        )}
        {/* Mismo texto, palabra por palabra, que elo-stats-panel.tsx y que
            EloDeUniversidad — un solo lugar dice qué es el Elo, y las copias
            tienen que envejecer juntas. */}
        <p className="mt-2 text-muted-foreground">
          El Elo mide qué tan difíciles son las derivadas que resolvés. Se ajusta
          con tus respuestas, sube con los aciertos y baja con los errores.
        </p>
      </PopoverContent>
    </Popover>
  )
}

/** El indicador de experiencia de una universidad, contraparte de
 *  `XpDeJugador` pero para la SUMA de toda su gente, no la de una persona.
 *  Vive en la pestaña "experiencia" del selector de la cabecera
 *  (desktop-layout.tsx), al lado de `EloDeUniversidad`, que es la del "elo" —
 *  ordenar por una y mostrar la otra se leería como un bug, mismo criterio
 *  que ya vale para esa. */
function XpDeUniversidad({ row }: { row: GameUniversityRow }) {
  const { abierto, setAbierto, gestos } = useCartel()

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        {...gestos}
        className="inline-flex shrink-0 items-center gap-1 rounded text-sm font-semibold tabular-nums outline-none transition-opacity hover:opacity-80"
        aria-label={`Cuánta experiencia sumó ${row.university}`}
      >
        <CountUp value={row.xp} format={fmtCount} />
        <XpDots className="size-[0.85em]" />
      </PopoverTrigger>
      <PopoverContent {...gestos} className="text-left text-xs leading-relaxed">
        <p>
          <span className="font-semibold text-foreground">
            {fmtCount(row.xp)} de experiencia
          </span>{" "}
          es lo que sumaron entre todos los estudiantes de {row.university}.
        </p>
        <p className="mt-2 text-muted-foreground">
          Mide cuánto jugaron, no qué tan bien — nunca baja, y los cafecitos la
          multiplican. Qué tan difícil es lo que resuelven lo dice el Elo.
        </p>
      </PopoverContent>
    </Popover>
  )
}

function EloDeUniversidad({ row }: { row: GameUniversityRow }) {
  const { abierto, setAbierto, gestos } = useCartel()

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        {...gestos}
        className="inline-flex shrink-0 items-baseline gap-1 rounded text-sm font-semibold tabular-nums outline-none transition-opacity hover:opacity-80"
        aria-label={`Qué mide el Elo de ${row.university}`}
      >
        {row.ranked ? (
          <CountUp value={row.rating_avg} format={fmtCount} />
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
        {/* Versalita con `tracking`: en mayúscula y a 0,7em las letras se
            amontonan, y "ELO" pegado se lee como una sola mancha. El aviso de
            que esto es un PROMEDIO va en el tile de arriba (ver
            "ELO PROMEDIO" en el resumen), no acá: repetido en cada fila sería
            ruido. */}
        <span className="text-[0.7em] font-normal tracking-wider text-muted-foreground">
          ELO
        </span>
      </PopoverTrigger>
      <PopoverContent {...gestos} className="text-left text-xs leading-relaxed">
              {row.ranked ? (
                <>
                  <p>
                    <span className="font-semibold text-foreground">
                      {fmtCount(row.rating_avg)} de Elo
                    </span>{" "}
                    es el promedio de los{" "}
                    <span className="font-semibold text-foreground">
                      {row.rated_players} estudiantes
                    </span>{" "}
                    de {row.university} que ya jugaron lo suficiente.
                  </p>
                  {/* Mismo texto, palabra por palabra, que
                      elo-stats-panel.tsx :: EloStatsPanel — un solo lugar
                      dice qué es el Elo, y las dos copias tienen que
                      envejecer juntas. */}
                  <p className="mt-2 text-muted-foreground">
                    El Elo mide qué tan difíciles son las derivadas que
                    resolvés. Se ajusta con tus respuestas, sube con los
                    aciertos y baja con los errores.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    {row.university} todavía no entra al promedio: hacen falta{" "}
                    <span className="font-semibold text-foreground">
                      {MIN_PLAYERS_RANKED} estudiantes
                    </span>{" "}
                    que hayan jugado lo suficiente y por ahora son{" "}
                    <span className="font-semibold text-foreground">
                      {row.rated_players}
                    </span>
                    .
                  </p>
                  <p className="mt-2 text-muted-foreground">
                    Con menos, un solo jugador con suerte manda la universidad al
                    tope y la tabla mide suerte en vez de nivel.
                  </p>
                </>
              )}
      </PopoverContent>
    </Popover>
  )
}

/** La vista "Reclutas": quiénes entraron por tu link y cuánto te dieron.
 *
 * Sin cabecera con el total. El total es la suma de una columna que ya está a la
 * vista, y puesto arriba se lleva el ojo antes que los renglones — que son lo
 * que hace que la mecánica se entienda, porque cada uno es una persona.
 *
 * Sin scroll infinito ni paginado: son los reclutas de una persona, no el juego
 * entero, y el endpoint corta en cincuenta. */
function RecruitsRanking({
  data,
  myUniversity,
}: {
  // Sin esqueleto de carga, a propósito. Los renglones de ejemplo son datos
  // FIJOS del cliente: esperar a que conteste el servidor para dibujarlos es
  // cobrarle un viaje de red a algo que ya está en el bundle, y lo único que se
  // veía mientras tanto era una caja gris.
  //
  // El costo es que quien YA tiene reclutas ve los de ejemplo un instante antes
  // de que lleguen los suyos, la primera vez de la sesión. Es un cambio de
  // relleno a contenido en la misma forma —se lee como que se completó, no como
  // que decía otra cosa— y de ahí en más el caché lo tiene resuelto.
  //
  // El pedido lo hace GameRanking y no acá: los mismos reclutas alimentan los
  // indicadores de arriba (ver `recruits` ahí), así que se piden una sola vez y
  // bajan como prop.
  data: GameRecruits | undefined
  myUniversity: string | null
}) {
  return (
    // El MISMO contenedor que la vista individual, incluido el par `-mx-1 px-1`
    // que le da aire lateral al anillo de cada fila sin correr la lista.
    //
    // Lo único distinto es el relleno de arriba, y no se hereda: la vista
    // individual arranca SCROLLEADA —se acomoda sola para dejar la fila propia a
    // cuatro del techo— así que su `py-1` queda por encima del borde y no se ve
    // nunca. Esta no scrollea (son los reclutas de una persona, y son pocos), así
    // que acá el número se elige mirando, no copiando: cinco píxeles, para que la
    // lista respire contra los filtros sin quedar despegada de ellos.
    <div className="no-scrollbar relative -mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pt-[5px]">
      <ListaDeReclutas entries={data?.entries ?? []} university={myUniversity} />
    </div>
  )
}

function UniversityRanking({
  scope,
  enabled,
  myUniversity,
  sort,
}: {
  scope: Scope
  enabled: boolean
  myUniversity: string | null
  sort: RankingSort
}) {
  const { data, isPending } = useGameUniversityLeaderboard(scope, enabled)
  const boostByUni = useBoostMultipliers()
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const placedRef = useRef(false)

  // La universidad propia se acomoda igual que la fila propia de la vista
  // individual: a cuatro filas del techo. Sin esto, entrar a "Universitario"
  // dejaba la tuya fuera de pantalla y había que buscarla scrolleando.
  useEffect(() => {
    placedRef.current = false
  }, [scope.university, scope.career, myUniversity])

  useLayoutEffect(() => {
    if (placedRef.current || !data || data.rows.length === 0) return
    const top = restingScrollTopFor(scrollRef.current)
    if (top === null) return
    scrollRef.current?.scrollTo({ top, behavior: "auto" })
    placedRef.current = true
  })

  if (isPending) return <ListSkeleton />
  if (!data || data.rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay ranking de universidades.
      </p>
    )
  }

  // Por Elo el orden YA llega del servidor (mostrar un número distinto del
  // que ordena se lee como un bug, ver GameUniversityRow). Por experiencia se
  // reordena ACÁ: el dato ya viaja en cada fila, así que pedir un fetch nuevo
  // solo para cambiar de pestaña sería más lento que lo que reemplaza.
  //
  // `[...]` y no un `.sort()` sobre `data.rows`: ese array es el mismo objeto
  // que React Query cachea, y mutarlo in place correría el orden por debajo
  // de cualquier otra vista que lo esté leyendo al mismo tiempo.
  const rows = sort === "experiencia" ? [...data.rows].sort((a, b) => b.xp - a.xp) : data.rows

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar relative -mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1"
    >
      <ol className="flex flex-col gap-2 py-1">
        {rows.map((row, index) => {
          const mine = myUniversity !== null && row.university === myUniversity
          // "No cuenta todavía" es un concepto del ELO (MIN_PLAYERS_RANKED):
          // sin jugadores suficientes, un promedio es ruido. La experiencia es
          // una SUMA sin ese piso de confianza —diez estudiantes que jugaron
          // poco suman menos que uno que jugó mucho, y está bien que así
          // sea—, así que en esa pestaña compiten todas las filas.
          const entraEnEsteOrden = sort === "elo" ? row.ranked : true
          return (
          <li
            key={row.university}
            data-current={mine ? "true" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-3 ring-1 ring-foreground/10",
              mine && MINE_ROW_CLASS,
              !entraEnEsteOrden && "opacity-55",
            )}
            // Misma pintura que en la vista individual: la universidad con
            // empuje se ve, no se marca con un ícono.
            style={
              boostByUni.has(row.university)
                ? filaConEmpuje(boostByUni.get(row.university) as number)
                : undefined
            }
          >
            <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
              {entraEnEsteOrden ? index + 1 : "—"}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-1">
              <UniTag university={row.university} />

            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
              <CountUp value={row.players} format={fmtCount} />
              <UsersIcon className="size-[0.9em] text-white" />
            </span>
            {/* Lo que se muestra es por lo que se ordena, en las dos pestañas
                del selector de la cabecera: mostrar un número distinto del
                que ordena se lee como un bug. */}
            {sort === "experiencia" ? (
              <XpDeUniversidad row={row} />
            ) : (
              <EloDeUniversidad row={row} />
            )}
          </li>
          )
        })}
      </ol>
    </div>
  )
}

// El esqueleto de la lista: calca a `Row` y a su scroller, contenedor por
// contenedor. Las clases de las tres cajas —el scroller, la lista y la fila— son
// LAS MISMAS de arriba a propósito; si alguna se toca allá, hay que tocarla acá.
//
// Los `h-5` de las hojas son el alto de la caja de línea de `text-sm`, que es lo
// que le da altura a la fila de verdad (12 px de `py-3` por lado + 20 px de
// línea = 44 px). Con las barras sueltas, cada fila quedaba en 38 px y la lista
// entera pegaba un salto de 36 px justo cuando entraban los datos.
//
// Los anchos del alias sí son inventados y varían por fila: son texto, y un
// bloque de seis barras del mismo largo se lee como una tabla vacía, no como
// nombres que todavía no llegaron.
function ListSkeleton() {
  const anchos = ["w-24", "w-32", "w-28", "w-36", "w-24", "w-32"]
  return (
    <div className="no-scrollbar relative -mx-1 min-h-0 flex-1 overflow-hidden px-1">
      <div className="flex animate-pulse flex-col gap-2 py-1" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10"
          >
            {/* El puesto: `w-4`, el mismo ancho fijo que reserva la fila. */}
            <Hueco alto="h-5" className="w-4 shrink-0" barra="h-3.5 w-full" />
            <Hueco
              alto="h-5"
              className="min-w-0 flex-1"
              barra={cn("h-3.5", anchos[i % anchos.length])}
            />
            {/* El número del final: cifras más el ícono de XP, con su `gap-1`. */}
            <Hueco alto="h-5" className="w-12 shrink-0" barra="h-3.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
