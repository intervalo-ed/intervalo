"use client"

// CTA de Cafecito: el propósito del juego. Un botón fijo discreto siempre
// visible + una card en hitos de dopamina (récord de puesto, subida grande,
// cada tantas resueltas) con cooldown para no espantar.

import { useEffect } from "react"
import { Coffee } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import { KeyCap } from "./exercise-card"
import {
  bumpCafecitosVistos,
  readCafecitosVistos,
  readUltimoPedidoAt,
  saveUltimoPedidoAt,
} from "./game-storage"
import { useCta } from "./game-telemetry"

// Perfil propio del juego, separado del de Intervalo. Ojo con este valor: ya
// una vez apuntó a `/intervalo`, que había dejado de existir, y durante todo ese
// tiempo el que quería donar caía en un 404 sin que nadie se enterara.
export const CAFECITO_URL = "https://cafecito.app/intervalo"

// Hitos: cada cuántas resueltas se considera mostrar la diapo, y cuántas
// resueltas tienen que pasar entre dos (cooldown).
//
// Veinte y no veinticinco: la diapo dejó de ser un cartel al costado y ahora
// detiene el juego, así que el pedido tiene que llegar cuando la partida
// todavía está viva. Veinte derivadas son unos pocos minutos de juego y ya
// alcanzan para que se entienda de qué se trata.
//
// CAFECITO_EVERY también es el PISO antes del cual ninguno de los tres
// disparadores cuenta —"milestone" (los múltiplos de este número) ya lo tenía
// gratis, pero "récord" y "big_climb" no, y un invitado nuevo bate su propio
// récord o pasa a varias cuentas en cero (el ranking está lleno de ellas) en
// casi cualquiera de sus primeras derivadas. Ver el `trigger` de
// desktop-layout.tsx/mobile-flow.tsx.
//
// Antes salía cada dos aciertos en desarrollo, para no tener que jugar veinte
// derivadas de verdad para ver la diapo una vez. Se sacó: interrumpía
// probando CUALQUIER otra cosa del juego, que es más seguido de lo que se
// prueba esta diapo puntual. Para trabajar en cafecito/reclutas, bajar estos
// números a mano (sin commitearlo).
export const CAFECITO_EVERY = 20
export const CAFECITO_COOLDOWN = 10

// Por qué apareció la diapo. Los tres primeros los decide el juego después de
// una respuesta; `pedido` es cuando la persona la abrió ella misma con el botón
// de la barra, y eso cambia dos cosas: no se la felicita por un hito que no
// acaba de pasar, y al salir vuelve a SU ejercicio en vez de pedir uno nuevo.
export type CafecitoTrigger = "record" | "big_climb" | "milestone" | "pedido"

// Las teclas de los dos botones de la barra que sacan del ejercicio.
//
// Estas letras dejan de poder escribirse en la respuesta —el atajo se las queda
// aunque el campo tenga el foco, que es como está casi todo el tiempo— así que
// elegirlas es elegir qué se pierde:
//
//   · `w` de WhatsApp no le cuesta NADA a nadie. De las 260 abreviaturas de
//     MathLive ninguna empieza con w, y en un juego donde la variable es siempre
//     `x` una w suelta no significa nada.
//   · `c` de cafecito era la primera opción y se descartó: `cos` empieza con c,
//     así que el atajo le robaba la tecla a quien escribe "cos(x)" a mano, que
//     en un juego de derivadas es media tabla.
//
// De ahí sale `i` de INVITAR, que es como se llama la acción en el producto
// —"Invitar un cafecito" en el botón, "Invitar 5 cafecitos" en la diapo—. Las
// otras candidatas eran `f` de café, descartada porque en un contexto de
// derivadas alguien escribe `f(x)` por costumbre, y `k`, que no quiere decir
// nada. Ninguna de las nueve abreviaturas que empiezan con i (`int`, `infty`,
// `iota`…) es parte del vocabulario del juego (ver backend/game/keyboard.py:
// sqrt, e, exp, ln, log, sen, cos, tg).
//
// No viven en `teclas.ts` como `enter` y `alt` porque ese archivo existe para
// las teclas que se llaman DISTINTO según el teclado (una Mac imprime "option" y
// "return"). Una letra se llama igual en todos lados.
export const TECLA_CAFECITO = "i"
export const TECLA_RECLUTAS = "w"

// Cuánto tiene que subir de una sola derivada para que cuente como "escalada".
const SALTO_GRANDE = 3

/** Por qué le sale sola la diapo del café, o `null` si no le toca.
 *
 * Vivía copiada y pegada en los dos layouts —mobile-flow.tsx y
 * desktop-layout.tsx—, que es la forma segura de que dentro de un mes cada
 * aparato interrumpa por un motivo distinto. Acá está una sola vez.
 *
 * `totalCorrectas` son las ACUMULADAS del jugador (las manda el servidor), no
 * las de esta pestaña: un contador de sesión vuelve a cero en cada recarga, y el
 * cooldown —que sí se guarda— quedaba comparándose contra él.
 *
 * La PRIMERA vez que la diapo sale sola, el motivo es siempre `milestone`. Los
 * otros dos son felicitaciones, y felicitar a alguien por batir un récord que no
 * sabía que tenía —un invitado nuevo bate el suyo casi en cualquier derivada, y
 * pasa a varias cuentas en cero porque el ranking está lleno de ellas— es
 * celebrar algo que la persona no tiene forma de percibir como logro. Recién con
 * una aparición encima el récord significa algo. */
export function elegirTriggerDeCafecito({
  isRecord,
  delta,
  totalCorrectas,
}: {
  isRecord: boolean
  delta: number
  totalCorrectas: number
}): CafecitoTrigger | null {
  // Piso para los TRES, no solo para `milestone` (que ya lo tenía gratis por el
  // módulo). Antes de esta cantidad ninguno cuenta como para interrumpir.
  if (totalCorrectas < CAFECITO_EVERY) return null
  const motivo: CafecitoTrigger | null = isRecord
    ? "record"
    : delta >= SALTO_GRANDE
      ? "big_climb"
      : totalCorrectas % CAFECITO_EVERY === 0
        ? "milestone"
        : null
  // La primera solo cambia la COPY, no CUÁNDO sale: si no había motivo, sigue
  // sin haberlo. Al revés, la primera aparición se adelantaría a la primera
  // derivada que cumpla el piso y se comería el hito.
  if (motivo === null) return null
  return readCafecitosVistos() === 0 ? "milestone" : motivo
}

export function shouldShowCafecito(
  solvedCount: number,
  trigger: CafecitoTrigger | null,
): boolean {
  if (!trigger) return false
  // Contra el último pedido de CUALQUIER tipo, no solo contra el último café:
  // el reclutamiento también interrumpe, y dos interrupciones seguidas no son
  // dos pedidos sino un peaje (ver readUltimoPedidoAt).
  return solvedCount - readUltimoPedidoAt() >= CAFECITO_COOLDOWN
}

/** Anota el cooldown y suma una aparición (lo que hace que la SEGUNDA en
 *  adelante pueda volver a felicitar; ver `elegirTriggerDeCafecito`).
 *
 *  La impresión NO se registra acá: la registra la propia
 *  card al montarse (ver `CafecitoCard`), que es cuando el cartel existe de
 *  verdad y además sabe si tiene universidad y por lo tanto si hay un camino a
 *  Cafecito o solo un pedido de datos. Registrarla en los dos lados contaría
 *  dos veces la misma impresión. */
export function markCafecitoShown(solvedCount: number) {
  saveUltimoPedidoAt(solvedCount)
  bumpCafecitosVistos()
}

// Lugares cuya impresión ya se registró en esta carga de página.
//
// Los dos botones de la barra anotan su impresión al montarse, y el comentario
// de abajo dice —con razón— que eso tiene que ser una por partida. En escritorio
// lo era, porque la barra vive fuera de los volteos. En el teléfono no: la barra
// está adentro del contenedor con `key` que se remonta en cada cambio de slide,
// así que responder → ranking → continuar → ejercicio anotaba CUATRO impresiones
// y cuatro POST por ejercicio. Además de gastar datos de un plan medido, eso
// inflaba por un orden de magnitud el denominador del embudo del cafecito, que
// es con lo que se decide si el juego se sostiene.
//
// Módulo y no ref: la idea es "esta persona tuvo el cafecito adelante", que no
// depende de cuántas veces React haya montado el botón.
const impresionesAnotadas = new Set<string>()

function useImpresionPorPartida(
  cta: ReturnType<typeof useCta>,
  tipo: "cafecito" | "share",
  placement: string,
) {
  useEffect(() => {
    const clave = `${tipo}:${placement}`
    if (impresionesAnotadas.has(clave)) return
    impresionesAnotadas.add(clave)
    cta(tipo, "impression", { placement })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

export function CafecitoButton({
  placement,
  onOpen,
  compact = false,
  keyboard = false,
  className,
}: {
  placement: string
  // El chip de la tecla solo donde hay tecla, igual que el botón de la tabla: en
  // el teléfono se toca, y una "c" impresa al lado sería prometer un atajo que
  // no existe.
  keyboard?: boolean
  // Solo el ícono. En escritorio la cabecera ya lleva el botón de la tabla con
  // su rótulo y su tecla, y tres botones con texto se pisaban entre sí.
  //
  // Fuera de escritorio no se usa: ahí la palabra ya la esconde el `sm` de
  // abajo en un teléfono, y en una tablet —que entra por MobileFlow, porque el
  // layout se elige por user agent y no por ancho— sobra lugar para mostrarla.
  // Y mostrarla es lo que se quiere: es el propósito del juego, no un adorno.
  compact?: boolean
  // Abre la diapo del cafecito, en vez de mandar directo a Cafecito.
  //
  // Antes esto era un enlace que abría Cafecito en otra pestaña y anotaba la
  // intención de paso. Eso dejaba DOS caminos al mismo lugar —este y la diapo—
  // con la mitad de las cosas cada uno: el botón se saltaba el slider (o sea que
  // nadie veía cuánto multiplica lo que está por invitar) y, sobre todo, se
  // saltaba la pantalla de vuelta, así que quien donaba por acá volvía a
  // encontrar todo igual que como lo había dejado.
  //
  // Ahora el botón solo abre la diapo, y la diapo hace lo que ya sabía hacer:
  // anotar la intención, abrir Cafecito y contarle a la persona qué pasó cuando
  // vuelve. Un solo camino, y todo lo que se arregla se arregla una vez.
  onOpen: () => void
  className?: string
}) {
  const cta = useCta()
  // El botón de la cabecera está SIEMPRE a la vista, así que su impresión no es
  // por render sino una por partida: «esta persona tuvo el cafecito adelante».
  // Ese es justo el denominador que hace falta para poder decir qué fracción de
  // los que jugaron llegó a tocarlo.
  useImpresionPorPartida(cta, "cafecito", placement)
  return (
    <button
      type="button"
      aria-label="Invitar un cafecito"
      onClick={() => {
        cta("cafecito", "click", { placement })
        onOpen()
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-[#EABB74]/60 px-2.5 py-1.5 text-sm text-[#EABB74] transition-colors hover:bg-[#EABB74]/10",
        className,
      )}
    >
      <Coffee size={15} />
      {!compact && <span className="hidden sm:inline">cafecito</span>}
      {keyboard && <KeyCap className="ml-0">{TECLA_CAFECITO}</KeyCap>}
    </button>
  )
}

// Reclutar por WhatsApp: el canal por el que llega casi todo el mundo.
//
// Se manda SOLO EL LINK:
//
//     https://www.intervalo.xyz/derivadas?r=nvrancovich
//
// Antes iba con una arenga a la universidad ("¡Vengan a bancar a la UBA!"), y el
// problema no era cómo estaba escrita sino que se mandaba siempre: fue pensada
// para un grupo de esa universidad y terminaba yendo también al amigo de otra
// facultad, a quien le pide bancar a una que no es la suya.
//
// Y hay algo mejor que cualquier cosa que podamos prellenar: el link solo deja
// el cursor en un chat vacío, así que quien comparte escribe su propia línea
// antes de mandar. Eso convence más que una frase escrita por nosotros, y no hay
// forma de que quede fuera de lugar.
//
// La vista previa la arma WhatsApp pidiendo la URL tal cual, así que el `?r=` no
// la cambia —la ruta sigue siendo /derivadas, con sus mismos tags Open Graph— y
// lo que se ve es la misma tarjeta para todos.
const SHARE_BASE = "https://www.intervalo.xyz/derivadas"

// El verde de WhatsApp, con el mismo tratamiento que el marrón del cafecito:
// `VERDE` para el relleno del botón y `VERDE_TINTA` para lo que es tinta sobre el
// fondo oscuro.
//
// El relleno lleva letra OSCURA y no blanca. #25D366 es un color claro: contra
// blanco da 1,9:1 —ilegible— y contra este verde muy oscuro, 9,6:1. Es la misma
// decisión que toma el botón del cafecito cuando el slider lo lleva al dorado.
export const VERDE = "#25D366"
export const VERDE_TINTA_OSCURA = "#07271A"
// El verde de la TINTA: el de la barra de arriba y el de las filas de color de
// configuración. Va apagado contra el relleno, porque al lado tiene al marrón
// del cafecito y con los dos al mismo brillo el verde se lo comía.
//
// Pero estaba apagado de más. Medido sobre el fondo del juego (#131324):
// #25D366 da 9,2:1 y el marrón #EABB74 da 10,3:1 — o sea que el verde nunca
// tuvo más contraste que su vecino, y el #2E9E5B que había acá daba 5,4:1, la
// mitad. Lo que hacía que se comiera al otro no era el contraste sino la
// saturación: un verde saturado tira más del ojo que un ámbar suave con el
// mismo brillo. Así que el freno se mantiene, pero apenas: este da 7,1:1, se
// lee bastante más verde de WhatsApp y sigue estando por debajo del marrón.
//
// Un comentario decía que el marrón daba 4,1:1. No lo da; el número estaba mal
// y con él la conclusión de cuánto había que bajar el verde.
export const VERDE_TINTA = "#2CB863"

/** El link con el @ de quien comparte, que es lo que después permite contar
 *  cuánta gente entró por cada persona (ver FIRST_REFERRER en
 *  lib/analytics/attribution.ts). Sin alias, el link pelado. */
export function shareLink(alias?: string | null) {
  return alias ? `${SHARE_BASE}?r=${encodeURIComponent(alias)}` : SHARE_BASE
}

/** El link de WhatsApp, listo para abrir. Es lo único que se manda. */
export function shareUrl(alias?: string | null) {
  return `https://wa.me/?text=${encodeURIComponent(shareLink(alias))}`
}

/** Abre WhatsApp con el link propio, a mano.
 *
 * SOLO para el atajo de teclado, que no tiene anchor que clickear. Todo lo que
 * se toca usa `ReclutarButton`, que es un `<a>` de verdad: desde una ventana
 * standalone en iOS, `window.open` a otro origen es inconsistente según la
 * versión. */
export function abrirWhatsapp(alias?: string | null) {
  window.open(shareUrl(alias), "_blank", "noopener,noreferrer")
}

/** El botón verde de reclutar.
 *
 * El relleno es `VERDE` con letra oscura, y el logo va DESPUÉS de la palabra,
 * como la taza del cafecito: el botón se lee "reclutar" y el ícono cierra la
 * frase diciendo por dónde, en vez de anunciarla.
 *
 * Es un `<a>` y no un `<button>`, igual que el del cafecito y por el mismo
 * motivo: wa.me es otro origen y tiene que salir de la PWA instalada. Un anchor
 * clickeado por la persona abre WhatsApp parejo en los dos sistemas.
 *
 * La geometría la pone quien lo usa (`className`), que es lo único que cambia
 * entre el pie de la diapo y el lugar del CTA del ranking. */
export function ReclutarButton({
  alias,
  placement,
  telemetryProps,
  onClick,
  className,
  keycap,
}: {
  alias?: string | null
  placement: string
  telemetryProps?: Record<string, unknown>
  // Para quien ya tiene su propia función de "anotá que reclutó" —la diapo la
  // comparte con el atajo de teclado— y no quiere que se anote dos veces.
  onClick?: () => void
  className?: string
  keycap?: React.ReactNode
}) {
  const cta = useCta()
  const sfx = useSfx()
  return (
    <a
      href={shareUrl(alias)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={
        onClick ??
        (() => {
          sfx.select()
          cta("share", "click", { placement, props: telemetryProps })
        })
      }
      className={cn(
        "flex items-center justify-center gap-2 text-base font-semibold transition-opacity hover:opacity-90",
        className,
      )}
      style={{ backgroundColor: VERDE, color: VERDE_TINTA_OSCURA }}
    >
      Reclutar
      <WhatsappGlyph size={18} />
      {keycap}
    </a>
  )
}

/** El botón de reclutar de la barra de arriba.
 *
 * Abre la diapo `¿Reclutas?`, no WhatsApp. Es la misma lección que dejó el
 * cafecito: mientras hubo dos caminos al mismo lugar, el del botón se saltaba
 * todo lo que la diapo sabe hacer —explicar qué se gana, mostrar los reclutas
 * que ya llegaron— y encima nadie se enteraba de que había algo que ganar. */
export function ShareButton({
  placement,
  onOpen,
  keyboard = false,
  className,
}: {
  placement: string
  onOpen: () => void
  keyboard?: boolean
  className?: string
}) {
  const cta = useCta()
  useImpresionPorPartida(cta, "share", placement)
  return (
    <button
      type="button"
      aria-label="Reclutar por WhatsApp"
      onClick={() => {
        cta("share", "click", { placement })
        onOpen()
      }}
      style={{ borderColor: `${VERDE_TINTA}99`, color: VERDE_TINTA }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors hover:bg-accent",
        className,
      )}
    >
      <WhatsappGlyph size={15} />
      {keyboard && <KeyCap className="ml-0">{TECLA_RECLUTAS}</KeyCap>}
    </button>
  )
}

/** El logo de WhatsApp.
 *
 * Dibujado y no de `lucide-react`: la biblioteca de íconos del proyecto es de
 * trazo genérico y no trae marcas. Y acá la marca importa — el botón promete
 * abrir WhatsApp y no un compartir cualquiera, que es justo lo que el ícono de
 * flechitas anterior no decía.
 *
 * Relleno y no trazo, como lo dibuja WhatsApp: a 15px un contorno de teléfono
 * adentro de un globo se convierte en una mancha. */
export function WhatsappGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.17h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.4c0-4.54 3.7-8.23 8.25-8.23a8.23 8.23 0 0 1 8.24 8.24c0 4.54-3.7 8.25-8.24 8.25Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.1-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.63 4.18 3.69.58.25 1.04.4 1.4.52.59.18 1.12.16 1.55.1.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  )
}

// El multiplicador siempre con la coma decimal de acá y una sola cifra: es el
// mismo formato en el slider, en el cartel del ranking y en el marcador de la
// card, así que vive en un solo lugar.
export const fmtMultiplier = (m: number) => `×${m.toFixed(1).replace(".", ",")}`
