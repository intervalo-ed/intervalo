"use client"

// El dorso ELO de la card del ejercicio: las estadísticas generales del jugador,
// dónde está parado respecto a la masa de jugadores calificados, y una
// explicación breve de qué mide el Elo. Se abre con la tecla `j` (ver
// desktop-layout.tsx), a la vez que el dorso de la tabla enriquecida del
// ranking (derivatives-table.tsx :: DerivativesStatsTable) — las dos caras
// cuentan la misma historia, una en cada columna.
//
// Sin marco propio, igual que DerivativesTable y SettingsPanel: el `rounded-lg
// border border-border bg-card` lo pone quien lo monta (desktop-layout.tsx),
// porque el mismo componente vive detrás de un FlipCard cuyo `back` decide el
// padding.

import { BarChart3 as StatsIcon } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fmtCount } from "@/components/leaderboard-chrome"
import { XpDots } from "@/components/xp-dots"
import { VERDE } from "./cafecito-cta"
import { KeyCap } from "./exercise-card"
import { levelColor } from "./game-colors"
import { useCartel } from "./game-ranking"
import type { GamePlayer } from "./UseGamePlayer"
import type { GameStats } from "./UseGameStats"

// `VERDE` es el mismo del aporte en reclutas-list.tsx — el verde de WhatsApp,
// no un verde cualquiera.

// El dorado de cafecito-panel.tsx, el mismo al que llega `colorPara`/
// `tintaPara` cuando el slider está en el TOPE (t=1) — es el color que pide
// el pedido ("como cuando llevás el slider al máximo"), no un marrón inventado
// para esta tile.
const CAFE_CLARO = `rgb(${[0xea, 0xbb, 0x74].join(", ")})`

// El aura del cafecito respira más o menos fuerte según dónde está la barra
// del slider; acá no hay barra. Amplitud chica y no el pico de esa diapo: ahí
// el brillo se GANA subiendo el slider y el techo se justifica, acá está
// prendido todo el tiempo y el mismo número se sentía excesivo en una tile
// que solo se mira de reojo.
const auraA = (a: number) => `rgba(234, 187, 116, ${a.toFixed(3)})`
const AURA_PICO = 1.2
const auraBox = (k: number) => `0 0 ${(10 * k).toFixed(1)}px ${auraA(0.14 * k)}`
const AURA_TRANSICION = { duration: 5.2, repeat: Infinity, ease: "easeInOut" } as const

// La letra del atajo. Vive acá y no en cafecito-cta.tsx (donde están
// TECLA_CAFECITO/TECLA_RECLUTAS) porque ese archivo es de las diapos de
// pedido y este es harina de otro costal; el criterio de "un solo lugar por
// tecla" es el mismo, cambia dónde vive.
//
// Pasó por `p` (cedida al «¿Por qué?», porque-panel.tsx :: TECLA_PORQUE) y por
// `m` («mis números») antes de asentarse acá. Las cuatro teclas del juego —w,
// i, p, j— tienen que seguir siendo distintas entre sí.
export const TECLA_ESTADISTICAS = "j"

// Alto del área de barras. Fijo y no `flex-1`: un histograma que se estira
// con lo que sobre de la columna se ve distinto según cuántos jugadores haya
// en la base, y la forma de la campana no tiene por qué depender de eso.
const HIST_ALTO = 88

/** El botón de la cabecera, mismo molde que `TableButton`
 * (derivatives-table.tsx): ícono + `<KeyCap>`, sin rótulo. Ausente y no
 * deshabilitado antes de la derivada 10 — un botón gris prometería un atajo
 * que todavía no existe (game/stats.py :: UMBRAL_ESTADISTICAS). */
export function StatsButton({
  open,
  onToggle,
  visible,
  className,
}: {
  open: boolean
  onToggle: () => void
  visible: boolean
  className?: string
}) {
  if (!visible) return null
  return (
    <button
      type="button"
      aria-label={open ? "Volver al ejercicio" : "Ver tus estadísticas"}
      aria-pressed={open}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
        open
          ? "border-foreground/40 bg-accent text-foreground"
          : "border-border text-muted-foreground hover:bg-accent",
        className,
      )}
    >
      <StatsIcon size={15} />
      <KeyCap className="ml-0">{TECLA_ESTADISTICAS}</KeyCap>
    </button>
  )
}

// El rótulo del gráfico. Chico, en versalitas y contra el borde izquierdo. Ni él
// ni las barras ni las etiquetas del eje llevan padding propio: se lo pone la
// caja que los envuelve (ver EloStatsPanel), y así los tres arrancan exactamente
// en la misma línea.
//
// Es lo que quedó del número grande que había arriba de todo. Ese número decía
// dos veces lo mismo —el gráfico ya marca en violeta el bucket donde cae— y se
// llevaba el primer golpe de vista de un panel donde lo que importa es DÓNDE
// está uno, no el número suelto. Ahora el número viaja adentro de la frase de
// abajo, que es la que lo pone en contexto.
const TITULO = "text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground"

function EloHistogram({
  stats,
  isLoading,
  rating,
  nivel,
}: {
  stats: GameStats | undefined
  isLoading: boolean
  rating: number
  nivel: number
}) {
  // Esqueleto con la FORMA de barras y no un cartel de "cargando" (mismo
  // criterio que ExerciseSkeleton en desktop-layout.tsx): así no hay salto de
  // layout cuando el pedido resuelve.
  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className={TITULO}>Elo</span>
        <div
          className="flex shrink-0 animate-pulse items-end gap-1 pb-2 pt-2"
          style={{ height: HIST_ALTO }}
          aria-hidden
        >
          {[25, 40, 55, 75, 90, 100, 95, 80, 65, 50, 35, 25, 40, 30, 20, 15].map((alto, i) => (
            <div key={i} className="flex-1 rounded-sm bg-white/10" style={{ height: `${alto}%` }} />
          ))}
        </div>
      </div>
    )
  }

  // Con pocos jugadores calificados una campana de pocos puntos no es un
  // gráfico: señala quiénes son y de paso miente sobre la forma real de la
  // distribución (ver game/stats.py :: MIN_HISTOGRAM_PLAYERS). Se muestra el
  // propio rating igual — es lo único que hay para mostrar todavía.
  if (!stats || !stats.enough_for_histogram) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className={TITULO}>Elo</span>
        {/* Sin marco propio: la caja de afuera ya lo pone, y dos bordes
            encajados se leen como un error de dibujo. */}
        <div className="flex flex-col items-center gap-2 py-2 text-center">
        <span className="text-2xl font-bold tabular-nums">{fmtCount(rating)}</span>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Todavía hay pocos jugadores con diez o más derivadas resueltas para
          armar la comparación
          {stats ? ` (${stats.n_rated_players} hasta ahora)` : ""}. Cuando
          haya más, acá vas a ver dónde estás parado.
        </p>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(1, ...stats.histogram.map((bucket) => bucket.count))
  const ultimo = stats.histogram[stats.histogram.length - 1]
  // Una etiqueta cada tantos buckets, más los dos extremos siempre — con 16
  // buckets (game/stats.py :: N_BUCKETS) da unas 9.
  const pasoEtiqueta = Math.max(1, Math.ceil(stats.histogram.length / 9))

  return (
    <div className="flex flex-col gap-1.5">
      <span className={TITULO}>Elo</span>
      <div
        className="flex shrink-0 items-end gap-1 pt-2"
        style={{ height: HIST_ALTO }}
      >
        {stats.histogram.map((bucket, i) => {
          const esLaPropia = i === stats.player_bucket_index
          // Piso de 6%: un bucket con un solo jugador entre otros de veinte no
          // puede desaparecer del todo, o la barra dejaría de contar que hay
          // alguien ahí.
          const alto = Math.max(6, Math.round((bucket.count / maxCount) * 100))
          return (
            <div
              key={bucket.from_rating}
              className={cn(
                "flex-1 rounded-sm transition-[height] duration-300",
                esLaPropia ? "bg-primary" : "bg-white/15",
              )}
              style={{ height: `${alto}%` }}
              title={`${fmtCount(bucket.from_rating)}–${fmtCount(bucket.to_rating)}: ${bucket.count} jugador${bucket.count === 1 ? "" : "es"}`}
            />
          )
        })}
      </div>
      {/* Mismo `flex gap-1` que las barras de arriba, un slot por bucket, para
          que cada etiqueta caiga exactamente debajo de SU barra — no alcanza
          con `justify-between` cuando hay más de dos etiquetas. La mayoría de
          los slots va vacío; solo marcan los múltiplos de `pasoEtiqueta` y
          los dos extremos. */}
      <div className="flex gap-1 text-[0.65rem] tabular-nums text-muted-foreground/70">
        {stats.histogram.map((bucket, i, arr) => {
          const esUltimo = i === arr.length - 1
          const marca = i === 0 || esUltimo || i % pasoEtiqueta === 0
          if (!marca) return <span key={bucket.from_rating} className="flex-1" />
          return (
            <span
              key={bucket.from_rating}
              className={cn(
                "flex-1",
                i === 0 ? "text-left" : esUltimo ? "text-right" : "text-center",
              )}
            >
              {fmtCount(esUltimo ? ultimo.to_rating : bucket.from_rating)}
            </span>
          )
        })}
      </div>
      {/* El número propio entra acá, en la única frase del panel que lo pone en
          contexto: solo dice algo comparado con los demás, y esta es la
          comparación. Va teñido con el color del nivel —el mismo `levelColor`
          que tenía el número grande de antes— porque ese color es el que el
          juego usa en todos lados para decir a qué altura está uno.
          Sin percentil no hay con qué comparar, y entonces la frase es solo el
          número: pasa cuando el propio bucket no se pudo ubicar. */}
      <p className="text-center text-xs text-muted-foreground">
        {stats.percentile !== null ? (
          <>
            Con{" "}
            <span className="font-semibold" style={{ color: levelColor(nivel) }}>
              {fmtCount(rating)}
            </span>{" "}
            estás por encima del{" "}
            <span className="font-semibold text-foreground">{stats.percentile}%</span> de los{" "}
            {fmtCount(stats.n_rated_players)} jugadores calificados
          </>
        ) : (
          <>
            Tu Elo es{" "}
            <span className="font-semibold" style={{ color: levelColor(nivel) }}>
              {fmtCount(rating)}
            </span>
          </>
        )}
      </p>
    </div>
  )
}

// El molde de las seis tiles. Es el mismo recuadro de `Metric`
// (leaderboard-chrome.tsx) —de donde salieron estas cuatro primeras— pero dibujado
// acá y como BOTÓN, porque desde que cada una explica qué mide tiene que poder
// recibir el foco y el mouse. `Metric` se queda como está: lo usa el ranking, que
// no tiene nada que explicar en esas tiles.
const TILE = "flex flex-col justify-center gap-1 rounded-md border px-3 py-[14px] text-left outline-none transition-opacity hover:opacity-80"
const TILE_VALOR = "text-lg font-semibold leading-none tabular-nums"
const TILE_ROTULO = "whitespace-nowrap text-[0.7rem] leading-tight text-foreground/60"
const CARTEL = "text-left text-xs leading-relaxed text-muted-foreground"

/** El cartel de una tile: el mismo gesto que los del ranking (game-ranking.tsx ::
 *  useCartel) — abre con el mouse encima Y con click.
 *
 *  El click no sobra aunque este panel sea de escritorio: se llega con la tecla
 *  `j` y también con el botón, y quien lo abrió con el teclado no
 *  necesariamente tiene el mouse sobre la tile.
 *
 *  Los gestos van repartidos entre el disparador y el contenido porque el cartel
 *  se dibuja en un portal y no es hijo del botón; sin eso, ir de la tile al
 *  cartel lo hace parpadear en el camino. */
function Tile({
  label,
  value,
  explicacion,
}: {
  label: string
  value: React.ReactNode
  explicacion: React.ReactNode
}) {
  const { abierto, setAbierto, gestos } = useCartel()
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger {...gestos} className={cn(TILE, "border-white/10 bg-white/5")}>
        <span className={TILE_VALOR}>{value}</span>
        <span className={TILE_ROTULO}>{label}</span>
      </PopoverTrigger>
      <PopoverContent {...gestos} className={CARTEL}>
        {explicacion}
      </PopoverContent>
    </Popover>
  )
}

/** Las dos tiles de abajo, con color propio en vez del `bg-white/5` neutro de las
 *  otras cuatro — cada una habla del mismo canal que ya tiñe el resto del juego
 *  (reclutas = verde de WhatsApp, cafecito = el dorado del slider al tope), y no
 *  de un color inventado para la ocasión. El ícono es el rayo de XP —las dos
 *  cuentan XP, así que llevan el mismo glifo— y no un emoji por tile, que hacía
 *  pensar que cada una medía una cosa distinta. `glow` es opcional: sin él es un
 *  fondo de color quieto, con él respira en el pico (ver `auraBox`).
 *
 *  El disparador va por `render` y no como hijo: Base UI compone así, y hace
 *  falta porque el aura es una animación de motion y el botón tiene que ser un
 *  `motion.button`. */
function TileDestacada({
  label,
  value,
  explicacion,
  fondo,
  borde,
  tinta,
  glow,
}: {
  label: string
  value: React.ReactNode
  explicacion: React.ReactNode
  fondo: string
  borde: string
  tinta: string
  glow?: boolean
}) {
  const { abierto, setAbierto, gestos } = useCartel()
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        {...gestos}
        className={TILE}
        style={{ backgroundColor: fondo, borderColor: borde }}
        render={
          <motion.button
            type="button"
            animate={
              glow ? { boxShadow: [auraBox(1), auraBox(AURA_PICO), auraBox(1)] } : undefined
            }
            transition={glow ? AURA_TRANSICION : undefined}
          />
        }
      >
        <span className={cn(TILE_VALOR, "flex items-center gap-1")} style={{ color: tinta }}>
          {value}
          <XpDots className="size-[0.85em]" />
        </span>
        <span className={TILE_ROTULO}>{label}</span>
      </PopoverTrigger>
      <PopoverContent {...gestos} className={CARTEL}>
        {explicacion}
      </PopoverContent>
    </Popover>
  )
}

// Qué dice cada cartel. Todo lo de acá está chequeado contra el backend, que es
// el único que sabe de verdad cuándo se mueve cada número:
// `exercises_attempted` sube al RESPONDER y no al saltear, la racha la corta
// errar y saltear —pero no consultar la tabla ni este panel—, y el mejor puesto
// solo se actualiza cuando se acierta (backend/game/router.py, game/stats.py).
//
// Las dos de abajo estuvieron mostrando otra cosa que la que decían, y las dos
// maneras de equivocarse eran invisibles mientras dieran cero: la de reclutas
// leía el lado contrario de la relación —lo que vos le pagás a quien te trajo—
// y la de cafecitos mostraba CUÁNTOS cafecitos había recibido tu universidad,
// que ni es XP ni es tuyo. Las dos tienen su chequeo en
// backend/scripts/check_game_stats.py, sección 6.
function GeneralTiles({ general }: { general: GameStats["general"] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Tile
        label="Derivadas resueltas"
        value={<>{fmtCount(general.exercises_correct)} 🧩</>}
        explicacion="Las que terminaste bien. Los intentos son ilimitados: equivocarte no te saca la derivada de encima, y cuando sale suma igual."
      />
      <Tile
        label="Efectividad"
        value={
          <>
            {general.accuracy_overall === null ? "—" : `${general.accuracy_overall}%`} 🎯
          </>
        }
        explicacion="De todo lo que respondiste, cuánto salió bien. Cada intento cuenta, así que acertar de una la sube y llegar después de errar la baja. Saltear no cuenta como intento."
      />
      <Tile
        label="Racha más larga"
        value={<>{fmtCount(general.best_combo)} 🔥</>}
        explicacion="La mayor cantidad de derivadas que resolviste bien una atrás de la otra. Errar la corta, y saltear también; mirar la tabla o este panel no."
      />
      <Tile
        label="Mejor puesto"
        value={general.best_rank == null ? "—" : `#${fmtCount(general.best_rank)}`}
        explicacion="El puesto más alto al que llegaste en el ranking. Se queda con el mejor que hiciste, aunque después bajes."
      />
      <TileDestacada
        label="XP generado por reclutas"
        value={fmtCount(general.xp_from_referrals)}
        explicacion="Cada persona que entra por tu link de reclutar te suma el 10% de la experiencia que gana, sin que a ella le reste nada. Es para siempre: sigue sumando cada vez que juega."
        fondo={`color-mix(in oklab, ${VERDE} 14%, transparent)`}
        borde={`color-mix(in oklab, ${VERDE} 35%, transparent)`}
        tinta={VERDE}
      />
      <TileDestacada
        label="XP extra por cafecitos"
        value={fmtCount(general.xp_from_boosts)}
        explicacion="Cada cafecito que le invitan a tu universidad multiplica media hora la experiencia de todos los que estudian ahí, también la tuya. Esto es cuánta te tocó de más por eso — lo que ganaste antes de que empezáramos a llevar la cuenta no está."
        fondo={`color-mix(in oklab, ${CAFE_CLARO} 22%, transparent)`}
        borde={`color-mix(in oklab, ${CAFE_CLARO} 50%, transparent)`}
        tinta={CAFE_CLARO}
        glow
      />
    </div>
  )
}

/** El hueco de las tiles mientras `/stats` viaja.
 *
 * Mismo criterio que el esqueleto del histograma —forma, no cartel— pero acá
 * hace falta por una razón nueva: desde que las tiles son lo PRIMERO del panel,
 * aparecer de la nada empuja hacia abajo el Elo, la campana y el párrafo. Abajo
 * de todo, como estaban antes, llegar tarde no molestaba a nadie.
 *
 * Las medidas no son a ojo: la caja repite las clases de `TILE` y las dos barras
 * miden exactamente los dos renglones que reemplazan (1,125rem el valor, que es
 * `text-lg` con `leading-none`; 0,875rem el rótulo, que es 0,7rem con
 * `leading-tight`). El hueco que reserva es el que van a ocupar. */
function TilesSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-2" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cn(TILE, "border-white/10 bg-white/5")}>
          <div className="h-[1.125rem] w-12 rounded bg-white/10" />
          <div className="h-[0.875rem] w-24 rounded bg-white/[0.07]" />
        </div>
      ))}
    </div>
  )
}

export function EloStatsPanel({
  player,
  stats,
  isLoading,
}: {
  player: GamePlayer | null
  stats: GameStats | undefined
  isLoading: boolean
}) {
  // El rating propio sale de `player.elo` (ya viaja en GamePlayerOut, sin
  // esperar a este pedido) y se pisa con el de `/stats` apenas llega — son el
  // mismo número, pero el primero no depende de la red.
  const rating = stats?.player_rating ?? player?.elo ?? 1000
  const nivel = player?.level ?? 0

  return (
    // Scrollea adentro, mismo patrón que DerivativesTable: la caja que gira
    // mide lo que mide el ejercicio (min-h-[26rem]) y este contenido casi
    // seguro pide más — la página entera no scrollea nunca (h-dvh
    // overflow-hidden), así que el que cede es este panel.
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* `my-auto` y no `justify-center` en el padre: con `justify-center` un
          contenido más alto que la caja queda centrado Y RECORTADO por arriba
          —el flexbox clásico de "hay que scrollear para arriba para ver el
          principio"—, porque el excedente se reparte mitad arriba, mitad
          abajo. El margen automático hace lo mismo cuando sobra lugar, pero
          se anula solo apenas el contenido no entra: ahí vuelve a quedar
          pegado arriba y el `overflow-y-auto` del padre scrollea desde el
          principio, como corresponde. */}
      <div className="my-auto flex shrink-0 flex-col gap-4">
        {/* Primero los números propios y después el Elo, y no al revés. Lo que
            se viene a mirar cuando se abre este dorso son las derivadas
            resueltas, la efectividad y la racha: son de uno y se entienden
            solos. El Elo es lo que hay que explicar —de ahí el párrafo del
            final— y arrancar por él era abrir con lo más difícil de leer. */}
        {stats ? (
          <GeneralTiles general={stats.general} />
        ) : isLoading ? (
          <TilesSkeleton />
        ) : null}

        {/* Todo lo del Elo en UNA caja: el rótulo, la campana, dónde cae uno y
            qué mide. Es el mismo recuadro de las tiles de arriba (`Metric`,
            leaderboard-chrome.tsx) menos el fondo — solo el borde, porque acá
            adentro hay un gráfico y un `bg-white/5` debajo de las barras les
            baja el contraste justo donde hay que leer una forma.
            El padding es el que alinea todo: adentro nadie lleva el suyo, así
            que el rótulo, la primera barra y el `400` del eje arrancan los tres
            en la misma línea. */}
        <div className="flex flex-col gap-3 rounded-md border border-white/10 px-3 py-[14px]">
          <EloHistogram
            stats={stats}
            isLoading={isLoading}
            rating={rating}
            nivel={nivel}
          />

          {/* La explicación breve que pide el pedido. Mismo contenido que ya
              dice el resto del juego (TIPS.elo en exercise-card.tsx,
              EloDeUniversidad en game-ranking.tsx) — acá se cuenta una vez más
              y con más lugar, no una versión distinta.
              Va al FINAL y pegada al gráfico: es el pie de lo que se acaba de
              mirar, la respuesta a «¿y esto qué mide?» que llega cuando ya se
              vio la campana, no antes.
              Mismo texto, palabra por palabra, que game-ranking.tsx ::
              EloDeUniversidad — un solo lugar dice qué es el Elo, y las dos
              copias tienen que envejecer juntas. */}
          <p className="text-xs leading-relaxed text-muted-foreground">
            El Elo mide qué tan difíciles son las derivadas que resolvés. Se
            ajusta con tus respuestas, sube con los aciertos y baja con los
            errores.
          </p>
        </div>
      </div>
    </div>
  )
}
