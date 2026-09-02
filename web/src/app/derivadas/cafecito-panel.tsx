"use client"

// La diapo del café: el único momento del juego en que se pide algo.
//
// Es una PANTALLA y no un cartel al costado. Como cartel se la comía el ojo
// junto al ranking —era una caja más en una columna de cajas— y encima competía
// con la derivada siguiente, que estaba ahí al lado esperando. Acá el juego se
// detiene, la diapo ocupa el lugar de la tarjeta del ejercicio y entra con el
// mismo volteo que todo lo demás.
//
// Dos decisiones que parecen fricción y son lo contrario:
//
// · El botón de seguir tarda DIEZ SEGUNDOS en habilitarse. El juego se maneja
//   entero con Enter y a esta altura la persona lleva veinte derivadas
//   despachadas a golpe de tecla: sin la espera, la diapo se salta antes de
//   verse y no la leyó nadie. Los diez segundos no son un peaje —no hay nada
//   que pagar, se puede seguir de largo— son el tiempo de leer tres renglones.
// · Invitar es `shift + enter` y no `enter`. La tecla de siempre sigue
//   significando lo de siempre (seguir), así que nadie sale a Cafecito por
//   inercia: al único lugar al que se llega sin querer es al próximo ejercicio.
//
// El marrón es el del cinturón marrón de Intervalo (BELT_HEX), que es también
// el color del café. No es una coincidencia que se aprovecha: es el mismo tono
// que ya usan el botón de la cabecera y el multiplicador del marcador.

import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowLeft, ArrowRight, Coffee, UsersIcon } from "lucide-react"
import { ALL_SCOPE, fmtCount } from "@/components/leaderboard-chrome"
import { UniTag } from "@/components/university-tag"
import { XpDots } from "@/components/xp-dots"
import { BELT_HEX } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import { CAFECITO_URL, fmtMultiplier, type CafecitoTrigger } from "./cafecito-cta"
import {
  CAFE_AMBAR_RGB as AMBAR_RGB,
  CAFE_DORADO_RGB as DORADO,
  colorDeCafe as colorPara,
  filaConEmpuje,
  mezclarRGB as mezclar,
} from "./game-colors"
import {
  useCafecitoIntent,
  useCafecitoStatus,
  useGameUniversityLeaderboard,
  type GameCafecitoStatus,
} from "./UseGameLeaderboard"
import { KeyCap } from "./exercise-card"
import { CLASE_ACCION_EN_EL_PIE, claseDeSalida, Salida } from "./slide-salida"
import { useCta } from "./game-telemetry"
import { enCampoDeTexto, useTeclas } from "./teclas"

// Marrón de marca. `solid` para el relleno del botón —es el que tiene contraste
// suficiente con texto blanco encima— y `onDark` para todo lo que es tinta
// sobre el fondo oscuro.
//
// `CAFE` se exporta: en el teléfono el tinte de esta diapo ya no vive en su
// propia caja, vive de pantalla completa detrás de la diapo (ver `fullBleed`
// más abajo y `fondoDeSlide` en mobile-flow.tsx), y ese fondo necesita el mismo
// marrón para no desentonar con el botón.
export const CAFE = BELT_HEX.brown.solid
const CAFE_TINTA = BELT_HEX.brown.onDark

// Cuánto tarda en habilitarse el botón de seguir. En cero en desarrollo —
// misma guarda que CAFECITO_COOLDOWN (cafecito-cta.tsx)—: probar el resto del
// juego con esta diapo en el medio no tiene por qué costar diez segundos cada
// vez.
const EN_DESARROLLO = process.env.NODE_ENV === "development"
const COOLDOWN_S = EN_DESARROLLO ? 0 : 10

// Espejo de backend/game/boosts.py. Se duplican para poder dibujar el slider sin
// pedirle nada al servidor: el multiplicador de verdad lo calcula y lo aplica
// él, esto es la calculadora que muestra a qué se está invitando.
const CAFECITO_STEP = 0.1
// Lo que puede aportar UNA donación: el techo del juego es ×3, pero al ×3 no se
// llega solo. Por eso el slider corta en ×2 — es honesto sobre lo que esta
// persona puede hacer por su cuenta, y deja el resto para el que colabore.
const MAX_PER_DONATION = 2.0
const SLIDER_MAX = 10

// Un día siempre; los dos días SOLO al tope del multiplicador. Es el único
// escalón, y ese es el punto: con la duración creciendo pareja con el
// multiplicador (12, 24, 36…) cada paso del slider movía dos números a la vez, y
// dos premios que crecen juntos no se leen ninguno. Con un solo escalón, el
// slider tiene un lugar al que llegar.
const BOOST_HOURS = 24
const BOOST_HOURS_MAX = 48

const multiplierFor = (n: number) => Math.min(MAX_PER_DONATION, 1 + n * CAFECITO_STEP)
const horasDe = (n: number) =>
  multiplierFor(n) >= MAX_PER_DONATION ? BOOST_HOURS_MAX : BOOST_HOURS

/** "un día" / "dos días", que es como se dice. El número suelto ("24 horas")
 *  obliga a hacer la cuenta para entender que es un día entero. */
const duracionDe = (n: number) => (horasDe(n) >= BOOST_HOURS_MAX ? "dos días" : "un día")

// La barra arranca LLENA y no en uno. Arrancando en el mínimo, el número que
// se lee al llegar es el más chico que se puede invitar, y mover la barra
// queda planteado como "poné más"; llena de entrada, lo que se ofrece de
// arranque es lo más generoso que esta persona puede hacer sola (el tope de
// MAX_PER_DONATION), y mover la barra pasa a ser "achicar" en vez de "agrandar".
const SLIDER_INICIAL = SLIDER_MAX

// El movimiento es un desplazamiento FUGAZ, no un resorte: 110 ms con salida
// suave. El resorte de antes tenía rebote, y con una barra de diez pasos ese
// rebote hacía que el pulgar pareciera pasarse del valor elegido. Así llega
// antes que el ojo y el número de arriba —que cambia en el mismo gesto— se lee
// junto con la barra y no después.
const FUGAZ = { duration: 0.11, ease: "easeOut" } as const

// El color de la barra sube con la cantidad: apagado a la izquierda, dorado a
// la derecha. Es el mismo marrón de marca corrido hacia el negro o hacia el
// blanco, así que la barra "se enciende" al pedir más sin estrenar una paleta.
// La rampa (`AMBAR_RGB`/`DORADO`/`mezclar`/`colorPara`, importados de
// `game-colors.ts` como `colorDeCafe`) vive compartida porque las bolitas de
// XP la reusan cuando la universidad tiene un empuje corriendo.
//
// La tinta que acompaña al slider: ámbar cuando se pide poco, dorado cuando se
// pide mucho. La usan el ícono del encabezado, el multiplicador y la universidad,
// que son las tres cosas de la diapo que hablan de la misma decisión.
//
// Es OTRA rampa que la de la barra, y no por gusto: la de la barra arranca en un
// marrón apagado que sobre una barra oscura se ve perfecto, pero como TEXTO sobre
// el fondo de esta diapo da 2,15:1 — ilegible (medido). Esta arranca en el ámbar
// de marca y llega al mismo dorado, y va de 4,13 a 9,69.
const tintaPara = (t: number) => mezclar(AMBAR_RGB, DORADO, t)

// El dorado en rgba, para todo lo que se ANIMA. `color-mix(...)` no se puede
// interpolar —motion lo trata como texto y el valor salta— así que las auras que
// respiran se escriben acá y no con mezclas de CSS.
const doradoA = (a: number) => `rgba(${DORADO.join(", ")}, ${a.toFixed(3)})`

// La respiración del café: el ícono, el pulgar de la barra y el botón laten
// juntos, con el mismo período y en fase. Late el AURA, nunca el tamaño ni la
// posición: algo que se agranda y se achica en una pantalla donde hay que leer
// un número tira del ojo, un halo que va y viene no.
//
// Cinco segundos largos, más lento que una respiración tranquila: a este ritmo
// no se ve "una animación", se ve que la cosa está viva. Con dos o tres segundos
// se leía como un aviso parpadeando.
const RESPIRO_S = 5.2

// Cuánto crece el aura en el pico. 1,35 es el techo de lo que sigue pasando
// desapercibido: por encima ya no es que respire, es que titila.
const RESPIRO_PICO = 1.35

/** Los tres valores de un ciclo, para pasarle a `animate` un ida y vuelta.
 *
 * La amplitud va multiplicada por la posición de la barra dentro de cada `aura`,
 * así que en el mínimo no respira nada —no hay aura que agrandar— y la cosa se
 * enciende recién cuando se empieza a pedir. Es lo mismo que ya hacía el brillo
 * fijo, pero ahora además se mueve. */
const ciclo = (aura: (k: number) => string) => [aura(1), aura(RESPIRO_PICO), aura(1)]
const RESPIRO_TRANSICION = {
  duration: RESPIRO_S,
  repeat: Infinity,
  ease: "easeInOut",
} as const

// Las tres auras. Cada una toma la posición de la barra y el factor del ciclo.
const auraIcono = (t: number, k: number) =>
  `drop-shadow(0 0 ${((2 + 9 * t) * k).toFixed(1)}px ${doradoA(0.32 * t * k)})`
const auraPulgar = (t: number, k: number) =>
  `0 0 ${((4 + 10 * t) * k).toFixed(1)}px ${(2 * t * k).toFixed(1)}px ${doradoA(0.45 * t * k)}`
const auraBoton = (t: number, k: number) =>
  `0 0 ${((6 + 18 * t) * k).toFixed(1)}px ${doradoA(0.28 * t * k)}`

// La tinta del botón cuando su fondo se vuelve claro. Marrón muy oscuro y no
// negro: sobre el dorado, el negro puro se lee como un agujero.
const TINTA_OSCURA = "#1D1206"

// Las flechas van a los COSTADOS de la barra y no debajo del texto: ahí son su
// marco —lo que está a los lados de algo que se corre es lo que lo corre— y de
// paso son botones de verdad, así que la cantidad también se elige tocando en el
// teléfono, donde no hay teclas.
//
// Fuera del `Slider` y no adentro: declarada adentro sería un componente NUEVO
// en cada render, React la remontaría entera y perdería su estado en cada paso
// de la barra.
function Flecha({
  hacia,
  valor,
  onCambio,
}: {
  hacia: -1 | 1
  valor: number
  onCambio: (v: number) => void
}) {
  const sfx = useSfx()
  const destino = Math.min(SLIDER_MAX, Math.max(1, valor + hacia))
  const Icono = hacia < 0 ? ArrowLeft : ArrowRight
  return (
    <button
      type="button"
      aria-label={hacia < 0 ? "Un cafecito menos" : "Un cafecito más"}
      disabled={destino === valor}
      onClick={() => {
        sfx.select()
        onCambio(destino)
      }}
      // Grises, no ámbar: el color del cafecito tiene que quedar para lo que
      // ESTÁ eligiendo —la barra, el multiplicador, el botón de invitar— y no
      // para dos controles de a uno. Con todo ámbar, nada resaltaba.
      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent disabled:opacity-35"
    >
      <Icono size={18} />
    </button>
  )
}

/** La barra de cafecitos.
 *
 * El `<input type="range">` sigue estando y sigue siendo el que manda: es el que
 * trae las flechas del teclado, el arrastre, el foco y lo que anuncia un lector
 * de pantalla. Lo que se hace es esconderlo (`opacity-0`) y dibujar encima el
 * riel, el relleno y el pulgar, que son tres divs animables. Estilar el nativo
 * con `::-webkit-slider-thumb` daba una barra distinta en cada motor y no había
 * forma de animarle nada. */
const Slider = ({
  ref,
  valor,
  onCambio,
  ...props
}: {
  ref?: React.Ref<HTMLInputElement>
  valor: number
  onCambio: (v: number) => void
} & Omit<React.ComponentProps<"input">, "ref" | "value" | "onChange" | "type">) => {
  const t = (valor - 1) / (SLIDER_MAX - 1)
  const pct = t * 100
  const color = colorPara(t)
  // Con movimiento reducido el aura se queda en su valor de reposo: sigue
  // creciendo con la barra, pero no late.
  const quieto = !!useReducedMotion()

  return (
    <div className="mt-4 flex items-center gap-3">
      <Flecha hacia={-1} valor={valor} onCambio={onCambio} />
      <div className="relative h-6 flex-1 select-none">
        {/* Riel */}
        <div
          className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={{ backgroundColor: `color-mix(in oklab, ${CAFE_TINTA} 22%, transparent)` }}
        />
        {/* Lo elegido */}
        <motion.div
          className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          animate={{ width: `${pct}%`, backgroundColor: color }}
          transition={FUGAZ}
        />
        {/* El pulgar. `translate` en clase y `left` animado: mover `left` con
            transform propio del motion pisaría el centrado. */}
        <motion.div
          aria-hidden
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
          style={{ "--tw-ring-color": CAFE } as React.CSSProperties}
          // El halo del pulgar crece con la posición: en el mínimo no hay
          // ninguno y en el máximo rodea la bolita. Es el mismo idioma que los
          // chips del ranking —cuanto más fuerte el café, más brilla— pero acá
          // pasa mientras se arrastra, así que la barra "se enciende" sola.
          animate={{
            left: `${pct}%`,
            backgroundColor: color,
            boxShadow: quieto ? auraPulgar(t, 1) : ciclo((k) => auraPulgar(t, k)),
          }}
          // La posición y el color se mueven con el pulgar —rápido, en cuanto se
          // suelta la barra— y el aura respira en su propio tiempo. Sin la
          // transición por propiedad, el ciclo lento se llevaría puesto el
          // seguimiento de la barra.
          transition={
            quieto ? FUGAZ : { ...FUGAZ, boxShadow: RESPIRO_TRANSICION }
          }
        />
        <input
          ref={ref}
          type="range"
          min={1}
          max={SLIDER_MAX}
          step={1}
          value={valor}
          onChange={(e) => onCambio(Number(e.target.value))}
          // `touch-none`: sin esto, arrastrar el pulgar con el dedo puede
          // interpretarse como si estuviera arrastrando la PÁGINA (scroll o el
          // pull-to-refresh del navegador) en vez del slider, sobre todo si el
          // dedo se corre un poco en vertical mientras desliza — y eso
          // recargaba el juego a mitad de la elección.
          className="absolute inset-0 h-full w-full cursor-pointer touch-none opacity-0"
          {...props}
        />
      </div>
      <Flecha hacia={1} valor={valor} onCambio={onCambio} />
    </div>
  )
}

const TRIGGER_COPY: Record<CafecitoTrigger, { title: string; sub: string }> = {
  record: {
    title: "¡Récord!",
    sub: "Nunca estuviste tan arriba en el ranking.",
  },
  big_climb: {
    title: "¡Qué escalada!",
    sub: "Subiste varios puestos de una sola derivada.",
  },
  milestone: {
    title: "¿Café?",
    sub: "Ya llevás un buen montón de derivadas.",
  },
  // Lo abrió la persona, así que no hay hito que celebrar ni nada que
  // justificar: vino sola. El subtítulo dice para qué sirve, que es lo único
  // que agrega valor cuando nadie interrumpió a nadie.
  pedido: {
    title: "¿Café?",
    sub: "Intervalo se mantiene únicamente gracias a las donaciones de los estudiantes.",
  },
}

// El único disparador que la persona elige. Cambia dos cosas: no hay cuenta
// regresiva para salir —nadie la interrumpió, así que retenerla sería cobrarle
// por haber venido— y al salir vuelve a su ejercicio en vez de pedir uno nuevo.
const LO_PIDIO = (t: CafecitoTrigger) => t === "pedido"

/** La cuenta regresiva del botón de seguir. Devuelve los segundos que faltan, y
 *  cero cuando ya se puede. El intervalo se limpia solo al desmontar: la diapo
 *  vive lo que dura la decisión y nada más. */
function useCooldown(segundos: number) {
  const [restante, setRestante] = useState(segundos)
  useEffect(() => {
    const t = setInterval(() => {
      setRestante((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [])
  return restante
}

/** Lo que ve quien VOLVIÓ de Cafecito.
 *
 * Tapa un agujero del embudo: la persona tocaba invitar, se iba a pagar en otra
 * pestaña y volvía a encontrar la misma pantalla que había dejado, como si no
 * hubiera hecho nada. Es el peor momento posible para no decir nada, porque
 * acaba de pagar.
 *
 * Dos caras y no tres. Quien se arrepintió en Cafecito y volvió sin donar cae en
 * la misma que quien está esperando la acreditación, y está bien: ya sabe que no
 * va a llegar nada, así que el cartel no le dice nada falso — le dice que puede
 * seguir, que es lo único que necesita.
 */
function PanelDeVuelta({
  estado,
  pedidos,
  keyboard,
  slotSalida,
  onContinue,
}: {
  estado: GameCafecitoStatus
  // Cuántos cafecitos dejó marcados la barra antes de irse. Es lo ÚNICO que se
  // sabe de la donación mientras no está acreditada, y alcanza para no hablarle
  // en singular a quien pidió cinco.
  pedidos: number
  keyboard: boolean
  slotSalida?: HTMLElement | null
  onContinue: () => void
}) {
  const sfx = useSfx()
  const teclas = useTeclas()
  const llego = estado.state === "credited"
  // Si ya llegó manda el número REAL, que es el que se cobró. Si todavía no,
  // manda la intención: la barra es una calculadora y quien marcó cinco puede
  // terminar invitando uno, pero mientras no haya nada acreditado hablarle de
  // "tu cafecito" a quien pidió cinco suena a que se perdieron cuatro.
  const varios = llego ? estado.cafecitos > 1 : pedidos > 1
  // "las próximas 23 horas" / "los próximos 40 minutos", según cuánto quede.
  // Con empujes de un día, decirlo siempre en minutos daba "los próximos 1439
  // minutos", que obliga a hacer la cuenta para entender que es casi un día.
  const restante =
    estado.expires_in_seconds >= 3600
      ? `las próximas ${Math.max(1, Math.round(estado.expires_in_seconds / 3600))} horas`
      : `los próximos ${Math.max(1, Math.round(estado.expires_in_seconds / 60))} minutos`

  // Sin cuenta regresiva para salir, al revés que la oferta. Ahí la espera
  // existe para que el pedido se lea; acá la persona ya decidió —y quizás ya
  // pagó— y retenerla sería cobrarle dos veces.
  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      // Escribiendo en el chat, un Enter es un Enter. Este listener vive en
      // `document` y la diapo puede estar abierta con el aside volteado al chat,
      // así que sin esto un enter a mitad de una palabra saltaba de pantalla.
      if (enCampoDeTexto(e.target)) return
      e.preventDefault()
      onContinue()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [keyboard, onContinue])

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mx-auto w-fit">
        <Coffee size={34} style={{ color: CAFE_TINTA }} />
      </div>
      <p className="mt-2 text-2xl font-medium">
        {llego
          ? varios
            ? "¡Llegaron tus cafecitos!"
            : "¡Llegó tu cafecito!"
          : varios
            ? "Todavía no llegaron tus cafecitos"
            : "Todavía no llegó tu cafecito"}
      </p>

      {llego ? (
        <>
          {/* El multiplicador es el titular, no un detalle de la oración: es lo
              que la plata compró, y tiene que verse antes de leer nada. */}
          <p className="mt-4 text-3xl font-semibold tabular-nums" style={{ color: CAFE_TINTA }}>
            {estado.university
              ? `La ${estado.university} está en ${fmtMultiplier(estado.multiplier)}`
              : `Todo el juego está en ${fmtMultiplier(estado.multiplier)}`}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {estado.university ? (
              <>
                Durante {restante}, todos los de la{" "}
                {estado.university} que estén estudiando suman más XP, acá y en
                Intervalo. Ya se está viendo en las novedades.
              </>
            ) : (
              <>
                Durante {restante}, cualquiera que esté estudiando suma
                más XP, acá y en Intervalo. Se lo regalaste a todos.
              </>
            )}
          </p>
        </>
      ) : (
        <>
          <p className="mt-4 text-sm leading-relaxed text-foreground/90">
            A veces el pago tarda un rato en confirmarse. No hace falta que
            esperes acá, cuando llegue el multiplicador arranca solo y lo vas a
            ver en las novedades.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Si pasa un rato largo y no aparece, avisanos desde configuración.
          </p>
        </>
      )}

      {/* Este botón sale de la caja de color: al pie de la columna en escritorio,
          debajo de la diapo en el teléfono. En los dos casos, blanco — el mismo
          Continuar que el resto del juego, no el gris de "salir sin elegir nada"
          (claseDeSalida): acá no hay una segunda opción compitiendo al lado, así
          que no hace falta bajarle el volumen.

          Pierde el marrón de marca, y es una pérdida real: esta es la única
          pantalla del juego que llega después de que alguien pagó, y ahí el color
          hacía de festejo. Se paga a cambio de que el botón con el que se sigue
          esté SIEMPRE en el mismo lugar, que es lo que hace que la diapo se lea
          como una pausa adentro del juego y no como otra pantalla. */}
      <Salida slot={slotSalida}>
        <button
          type="button"
          onClick={() => {
            sfx.select()
            onContinue()
          }}
          className={cn(
            "flex w-full items-center justify-center rounded-md bg-white text-base font-semibold text-black transition-colors hover:bg-white/90",
            slotSalida ? "h-[var(--cta-h)]" : "mt-6 px-4 py-3",
          )}
        >
          Continuar
          {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
        </button>
      </Salida>
    </div>
  )
}

// Tu universidad y sus dos vecinas en el ranking de universidades, solo en el
// teléfono (ver `fullBleed` más abajo). En escritorio esta misma idea la
// cuenta el ranking de al lado, filtrado a la universidad propia con cada
// fila en el mismo formato (game-ranking.tsx :: boostPreview) — acá, sin
// ranking en pantalla, son estas tres cajas.
//
// Una arriba (mejor puesto), la propia en el medio, una abajo (peor puesto):
// es lo que convierte "invitá un cafecito" en "esto es lo que ya está en
// juego", con la propia universidad ubicada donde compite de verdad, no
// suelta. Las vecinas llevan ×1,0 —no compran nada, están para dar contexto—
// y la propia lleva el multiplicador que se está por comprar, en el mismo
// formato ámbar (`filaConEmpuje`, game-colors.ts) que ya usan las filas con un
// empuje corriendo.
//
// Si el ranking no tiene vecina real de un lado —la universidad propia está
// primera o última, o todavía no juntó XP— se inventa una plausible en vez de
// dejar el hueco: son datos de relleno, nunca la propia.
function CajaDeUniversidad({
  university,
  players,
  multiplier,
  color,
  propia = false,
}: {
  university: string
  players: number
  multiplier: number
  // La tinta del slider (tintaPara(t)) para la propia; un gris apagado para
  // las vecinas, que no reciben nada de este cafecito.
  color: string
  // Sin fondo ni borde: la caja de contexto no es lo que este cafecito mueve.
  // Solo la propia lleva `filaConEmpuje`, y solo ella cambia de brillo con el
  // slider —las vecinas se quedan en ×1,0 fijo, así que nada tendrían que
  // variar.
  propia?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-3 py-2",
        propia && "ring-1 ring-foreground/10",
      )}
      style={propia ? filaConEmpuje(multiplier) : undefined}
    >
      <UniTag university={university} />
      {/* Personas y XP pegados, igual que en el ranking (game-ranking.tsx):
          número primero, ícono después, los dos grupos uno al lado del otro.
          Acá los dos van del mismo color —el de la propia se pinta con el
          slider igual que el multiplicador, no solo el número de XP. */}
      <span
        className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold tabular-nums"
        style={{ color }}
      >
        <span className="inline-flex items-center gap-1">
          {fmtCount(players)}
          <UsersIcon className="size-[0.85em]" />
        </span>
        <span className="inline-flex items-center gap-1">
          {fmtMultiplier(multiplier)}
          <XpDots className="size-[0.85em]" />
        </span>
      </span>
    </div>
  )
}

// El gris de las vecinas: ni el ámbar de la propia ni un color de marca, para
// que quede claro de un vistazo cuál de las tres es la que este cafecito
// mueve.
const GRIS_VECINA = "var(--muted-foreground)"

// Universidades de relleno, en el orden en que se prueban. Nunca es la propia
// —se filtra antes de usarla— así que alcanza con una lista fija y corta.
const UNIVERSIDADES_DE_RELLENO = ["UBA", "UTN", "UNC", "UNLP", "UCA", "UNSAM"] as const

function universidadDeRelleno(
  yaUsadas: readonly string[],
  players: number,
): { university: string; players: number } {
  const nombre = UNIVERSIDADES_DE_RELLENO.find((u) => !yaUsadas.includes(u)) ?? "Otra"
  return { university: nombre, players }
}

const SIN_FILTRO = { university: ALL_SCOPE, career: ALL_SCOPE }

/** Las tres cajas, una debajo de la otra. */
function UniversidadesCercanas({
  university,
  multiplier,
  color,
  enabled,
}: {
  university: string
  multiplier: number
  color: string
  enabled: boolean
}) {
  const { data } = useGameUniversityLeaderboard(SIN_FILTRO, enabled)
  const filas = data?.rows ?? []
  const indice = filas.findIndex((f) => f.university === university)
  const propia = indice >= 0 ? filas[indice] : { university, players: 1 }

  const arriba =
    indice > 0
      ? filas[indice - 1]
      : universidadDeRelleno([propia.university], propia.players + 15)
  const abajo =
    indice >= 0 && indice < filas.length - 1
      ? filas[indice + 1]
      : universidadDeRelleno([propia.university, arriba.university], Math.max(1, propia.players - 8))

  return (
    <div className="mt-4 flex flex-col gap-2">
      <CajaDeUniversidad university={arriba.university} players={arriba.players} multiplier={1} color={GRIS_VECINA} />
      <CajaDeUniversidad
        university={propia.university}
        players={propia.players}
        multiplier={multiplier}
        color={color}
        propia
      />
      <CajaDeUniversidad university={abajo.university} players={abajo.players} multiplier={1} color={GRIS_VECINA} />
    </div>
  )
}

export function CafecitoPanel({
  trigger,
  university = null,
  solved,
  correctToday = 0,
  onContinue,
  onPickUniversity,
  // Dónde dibujar el botón de salir. En escritorio es el pie de la columna, para
  // que quede en el mismo lugar donde estaba Revisar; en el teléfono no viene y
  // el botón se queda adentro de la diapo. Ver slide-salida.tsx.
  slotSalida,
  // Ídem para el botón de color. Solo lo manda el teléfono: en escritorio se
  // queda adentro de la caja, que es donde se lo diseñó.
  slotAccion,
  // En escritorio el juego se maneja con el teclado y la diapo lo respeta: los
  // dos botones muestran su tecla y hay atajos de verdad detrás. En el teléfono
  // no hay tecla que mostrar.
  keyboard = false,
  // Solo lo manda el teléfono. Ahí el tinte de fondo pasó a cubrir toda la
  // pantalla (mobile-flow.tsx pinta el mismo `CAFE` de fondo, gradual con el
  // pase de diapo), así que esta diapo se dibuja sin su propia caja —ni
  // redondeo, ni borde, ni el color repetido adentro— para no pintarlo dos
  // veces. En escritorio sigue siendo la card de siempre.
  fullBleed = false,
  // Solo lo manda escritorio: mientras la diapo ofrece el slider, el ranking de
  // al lado se filtra a esta universidad y cambia lo que muestra cada fila por
  // el multiplicador que se está por comprar (ver desktop-layout.tsx). `null`
  // mientras no hay oferta que mostrar —el cartel de vuelta, por ejemplo, ya no
  // tiene slider del que previsualizar nada.
  onPreview,
  className,
}: {
  trigger: CafecitoTrigger
  university?: string | null
  solved?: number
  // Correctas de HOY (la manda el servidor con la respuesta). Cero o sin dato
  // vuelve al texto genérico, que es lo que corresponde: un "ya llevás 0" sería
  // peor que no decir nada.
  correctToday?: number
  onContinue: () => void
  onPickUniversity?: () => void
  slotSalida?: HTMLElement | null
  slotAccion?: HTMLElement | null
  keyboard?: boolean
  fullBleed?: boolean
  onPreview?: (preview: { multiplier: number; color: string } | null) => void
  className?: string
}) {
  const cta = useCta()
  const copy = TRIGGER_COPY[trigger]
  // El hito habla del día, no de la vida: el mérito del que se está hablando es
  // el de esta sentada, y "ya llevás 23 hoy" es un número que la persona
  // reconoce. Los otros dos disparadores (récord, escalada) ya dicen lo suyo.
  const sub =
    trigger === "milestone" && correctToday > 0
      ? `Ya llevás ${correctToday} ${correctToday === 1 ? "derivada resuelta" : "derivadas resueltas"} hoy.`
      : copy.sub
  const restante = useCooldown(LO_PIDIO(trigger) ? 0 : COOLDOWN_S)
  const listo = restante === 0
  const sfx = useSfx()
  const [n, setN] = useState(SLIDER_INICIAL)
  const multiplier = multiplierFor(n)
  // Posición en la recta, 0 en el mínimo y 1 en el máximo. Es lo que gobierna
  // cuánto brilla el botón: la misma cuenta que usa la barra por dentro.
  const t = (n - 1) / (SLIDER_MAX - 1)
  // Ídem el slider: con movimiento reducido, aura fija.
  const quieto = !!useReducedMotion()
  const teclas = useTeclas()
  const sliderRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    cta("boost_offer", "impression", {
      placement: trigger,
      solved,
      props: { has_university: university !== null },
    })
    // Y además una impresión de cafecito, pero SOLO si hay universidad: sin ella
    // la diapo no ofrece donar, pide un dato. Contarla igual metería en el
    // denominador del embudo a gente a la que nunca se le mostró un botón que
    // lleve a Cafecito, y haría bajar la conversión por un motivo que no es.
    if (university !== null) {
      cta("cafecito", "impression", { placement: trigger, solved })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  // El slider toma el foco al entrar: es lo que hace que las flechas lo muevan
  // sin tener que apuntarle con el mouse. Es también el único elemento
  // enfocable de la diapo mientras el botón de seguir está deshabilitado.
  useEffect(() => {
    sliderRef.current?.focus()
  }, [])

  const intent = useCafecitoIntent()
  // Se fue a Cafecito, y volvió al menos una vez desde entonces.
  //
  // Son dos banderas y no una: el estado se empieza a consultar apenas se va
  // (`seFue`), pero el cartel de vuelta no se muestra hasta que efectivamente
  // vuelve (`volvio`). Con una sola, a quien toca invitar se le cambiaría la
  // pantalla a «todavía no llegó» sin haber salido todavía.
  const [seFue, setSeFue] = useState(false)
  const [volvio, setVolvio] = useState(false)
  const estado = useCafecitoStatus(seFue)

  // ¿El cartel de vuelta está EN PANTALLA? Una sola definición, porque la usan
  // dos lugares que TIENEN que coincidir: qué se dibuja y quién se queda con el
  // Enter.
  //
  // Estuvieron desincronizados y el síntoma era feo: el render pedía las tres
  // condiciones y la guarda del Enter miraba solo `volvio`, así que en cuanto
  // alguien abría Cafecito y volvía —sin invitar, que es lo más común, o
  // simplemente antes de que llegara el estado— la pantalla seguía mostrando la
  // oferta de siempre y su Enter ya no existía. Las teclas quedaban muertas en
  // esta diapo y en ninguna otra, hasta salir de ella.
  //
  // `volvio` solo dice que la persona volvió a la pestaña. Eso pasa mucho antes
  // —y muchas más veces— que tener algo que contarle.
  const cartelDeVuelta = volvio && estado !== null && estado.state !== "none"

  // Avisa el multiplicador y el color de la barra en cada movimiento, para que
  // el ranking de al lado los muestre en vivo. Se apaga solo (`null`) con el
  // cartel de vuelta puesto —ahí ya no hay slider, así que no hay nada que
  // previsualizar— y al desmontarse la diapo, para no dejar el ranking pegado a
  // un número de una oferta que ya no está.
  useEffect(() => {
    if (!onPreview) return
    onPreview(cartelDeVuelta ? null : { multiplier, color: tintaPara(t) })
    return () => onPreview(null)
  }, [onPreview, cartelDeVuelta, multiplier, t])

  useEffect(() => {
    if (!seFue) return
    const alVolver = () => {
      if (document.visibilityState === "visible") setVolvio(true)
    }
    // Los dos, y no solo uno: cambiar de pestaña dispara `visibilitychange`,
    // pero volver de otra VENTANA encima de esta dispara solo `focus`.
    document.addEventListener("visibilitychange", alVolver)
    window.addEventListener("focus", alVolver)
    return () => {
      document.removeEventListener("visibilitychange", alVolver)
      window.removeEventListener("focus", alVolver)
    }
  }, [seFue])

  const invitar = () => {
    // Adentro de `invitar` y no en el onClick: al botón también se llega con
    // shift+enter, y el atajo tiene que sonar igual que tocarlo.
    sfx.select()
    cta("cafecito", "click", {
      placement: trigger,
      solved,
      // La cantidad y el multiplicador solo viven en PostHog: el slider es una
      // calculadora y lo que la persona elija acá no tiene por qué ser lo que
      // después invita en Cafecito.
      props: { cafecitos: n, multiplier, shortcut: true },
    })
    // Idem el botón del header: la intención se anota ANTES de abrir
    // Cafecito, que es el último momento en que sabemos quién es.
    intent.mutate()
    setSeFue(true)
    window.open(CAFECITO_URL, "_blank", "noopener,noreferrer")
  }

  // Los atajos. `keydown` en document y no en la caja: mientras el foco está en
  // el slider, las flechas son de él, pero Enter tiene que funcionar igual esté
  // donde esté el foco.
  const invitarRef = useRef(invitar)
  useEffect(() => {
    invitarRef.current = invitar
  })
  // El cambio de diapo dura unos 220 ms y durante ese rato la que se va sigue
  // montada junto a la que entra (así funciona AnimatePresence, ver
  // slide-flip.tsx). Si en ese instante llega un Enter, las dos lo escuchan y se
  // piden DOS derivadas: la segunda se sirve y se descarta sin que nadie la vea.
  // Con este pestillo, cada diapo despacha su Enter una sola vez en su vida.
  const seguidoRef = useRef(false)
  useEffect(() => {
    if (!keyboard) return
    // Con el cartel de vuelta en pantalla manda SU Enter, no este. Los efectos
    // de la oferta siguen corriendo aunque su JSX ya no se dibuje —viven en el
    // cuerpo del componente— así que sin esta guarda los dos escuchan la misma
    // tecla y `onContinue` se dispara dos veces.
    if (cartelDeVuelta) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      // Escribiendo en el chat, un Enter es un Enter. Este listener vive en
      // `document` y la diapo puede estar abierta con el aside volteado al chat,
      // así que sin esto un enter a mitad de una palabra saltaba de pantalla.
      if (enCampoDeTexto(e.target)) return
      e.preventDefault()
      if (e.shiftKey) {
        if (university !== null) invitarRef.current()
        return
      }
      if (!listo || seguidoRef.current) return
      seguidoRef.current = true
      onContinue()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [keyboard, listo, onContinue, university, cartelDeVuelta])

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-center p-6 text-center",
        !fullBleed && "rounded-lg border",
        className,
      )}
      style={
        fullBleed
          ? undefined
          : {
              // Marrón muy diluido de fondo: alcanza para que la diapo se lea
              // como otra cosa que el resto del juego sin dejar de ser la
              // misma card.
              backgroundColor: `color-mix(in oklab, ${CAFE} 12%, var(--card))`,
              borderColor: `color-mix(in oklab, ${CAFE_TINTA} 45%, transparent)`,
            }
      }
    >
      {cartelDeVuelta ? (
        <PanelDeVuelta
          estado={estado}
          pedidos={n}
          keyboard={keyboard}
          slotSalida={slotSalida}
          onContinue={onContinue}
        />
      ) : (
      <div className="mx-auto w-full max-w-sm">
        {/* La taza y el título son UNA cosa —el encabezado— y la oración de
            abajo es otra: la que explica. Con el mismo aire entre los tres, los
            tres se leían como una lista de renglones sueltos. El título se pega a
            su ícono y se despega de la oración, y ahí se ve qué titula a qué. */}
        <motion.div
          className="mx-auto w-fit"
          animate={quieto ? { filter: auraIcono(t, 1) } : { filter: ciclo((k) => auraIcono(t, k)) }}
          transition={quieto ? { duration: 0 } : RESPIRO_TRANSICION}
        >
          <Coffee size={34} style={{ color: tintaPara(t) }} />
        </motion.div>
        <p className="mt-2 text-2xl font-medium">{copy.title}</p>
        <p className="mt-3 text-sm text-muted-foreground">{sub}</p>

        {university ? (
          <>
            {/* El multiplicador va DENTRO de la oración y en dorado: es el
                número que la persona está eligiendo con la barra, así que tiene
                que cambiar donde se lo está leyendo y no en un rincón. */}
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">
              Invitá un cafecito y multiplicá por{" "}
              <span className="font-semibold tabular-nums" style={{ color: tintaPara(t) }}>
                {fmtMultiplier(multiplier)}
              </span>{" "}
              el XP obtenido para toda la{" "}
              {/* La sigla suelta y no la tag del ranking: acá está adentro de una
                  oración, y un chip con su propio fondo la parte en dos.

                  Los TRES datos que dependen de la barra —el multiplicador, la
                  universidad y la duración— van con el mismo tratamiento:
                  negrita y la tinta del slider. La duración estuvo un rato
                  en blanco y quedaba leyéndose como parte de la frase fija,
                  cuando en realidad es la otra mitad de lo que se está
                  eligiendo (un día, o dos al tope). */}
              <span className="font-semibold" style={{ color: tintaPara(t) }}>
                {university}
              </span>{" "}
              durante{" "}
              <span
                className="font-semibold tabular-nums"
                style={{ color: tintaPara(t) }}
              >
                {duracionDe(n)}
              </span>
              .
            </p>

            {/* Solo en el teléfono: en escritorio esta misma idea la cuenta el
                ranking de al lado, filtrado a la universidad propia (ver
                game-ranking.tsx :: boostPreview) — repetirla acá sería
                mostrar lo mismo dos veces en la misma pantalla. */}
            {fullBleed && (
              <UniversidadesCercanas
                university={university}
                multiplier={multiplier}
                color={tintaPara(t)}
                enabled={fullBleed}
              />
            )}

            <Slider
              ref={sliderRef}
              valor={n}
              onCambio={setN}
              aria-label="Cantidad de cafecitos"
            />

            <Salida slot={slotAccion}>
              <motion.button
                type="button"
                onClick={invitar}
                className={
                  slotAccion
                    ? CLASE_ACCION_EN_EL_PIE
                    : "mt-5 flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                }
                animate={quieto ? { boxShadow: auraBoton(t, 1) } : { boxShadow: ciclo((k) => auraBoton(t, k)) }}
                transition={quieto ? { duration: 0 } : RESPIRO_TRANSICION}
                // EXACTAMENTE el color de la barra, sin bajarlo: el botón es lo
                // que la barra está eligiendo, así que se enciende con ella.
                //
                // Lo que cambia es la TINTA, no el fondo. El dorado del extremo
                // derecho es un color claro y contra texto blanco da 1,77:1 —
                // ilegible— así que a partir de la mitad del recorrido la letra
                // pasa a ser oscura. El cruce está puesto donde las dos opciones
                // sirven (medido: 4,2 con blanco y 4,3 con tinta oscura), así que
                // no hay un punto del slider en el que el botón se lea mal.
                //
                // El aura crece con la posición: es lo que hace que llevar el
                // slider a la derecha se sienta como subir la potencia y no como
                // mover un número.
                style={{
                  backgroundColor: colorPara(t),
                  color: t < 0.5 ? "#FFFFFF" : TINTA_OSCURA,
                  transition: "color 150ms ease-out",
                }}
              >
                {/* La taza va DESPUÉS de la palabra: el botón se lee "invitar
                    cinco cafecitos" y el ícono cierra la frase en vez de
                    anunciarla. Adelante empujaba el texto a la derecha y el botón
                    quedaba descentrado con la tecla del otro lado. */}
                Invitar {n === 1 ? "un cafecito" : `${n} cafecitos`}
                <Coffee size={18} />
                {keyboard && <KeyCap>{teclas.shiftEnter}</KeyCap>}
              </motion.button>
            </Salida>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">
              Un cafecito multiplica el XP de toda tu universidad por un día.
              Elegí dónde estudiás y el próximo se lo llevás vos.
            </p>
            {onPickUniversity && (
              <Salida slot={slotAccion}>
                <button
                  type="button"
                  onClick={() => {
                    cta("boost_offer", "click", {
                      placement: trigger,
                      solved,
                      props: { action: "pick_university" },
                    })
                    onPickUniversity()
                  }}
                  className={
                    slotAccion
                      ? CLASE_ACCION_EN_EL_PIE
                      : "mt-5 flex w-full items-center justify-center rounded-md px-4 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
                  }
                  style={{ backgroundColor: CAFE, color: "#FFFFFF" }}
                >
                  Elegir mi universidad
                </button>
              </Salida>
            )}
          </>
        )}

        {/* La salida. Con recuadro y no como texto suelto: es un botón de
            verdad, y sin borde parecía un pie de página. "Ahora no" y no
            "Seguir derivando" porque nombra la DECISIÓN —se está diciendo que
            no a algo— en vez de describir lo que pasa después; y deja la puerta
            abierta, que es exactamente el trato.

            Deshabilitado mientras corre la cuenta, y con los segundos a la
            vista: un botón apagado sin explicación se lee como que algo se
            rompió. */}
        <Salida slot={slotSalida}>
          <button
            type="button"
            disabled={!listo}
            onClick={() => {
              sfx.select()
              onContinue()
            }}
            className={cn(
              claseDeSalida(!!slotSalida),
              // Solo en `fullBleed`: `disabled:opacity-45` baja la opacidad
              // del botón ENTERO, y con un color de fondo propio (ver `style`)
              // eso lo deja mezclarse con lo que sea que haya detrás mientras
              // corre la cuenta. Se apaga el texto en vez del botón entero.
              fullBleed && "disabled:opacity-100 disabled:text-muted-foreground/50",
            )}
            style={
              fullBleed
                ? {
                    // Ni el gris de siempre ni el café de la oferta: el 70%
                    // del 6% que tiñe toda la pantalla (fondoDeSlide,
                    // mobile-flow.tsx). Es la puerta de salida, no la oferta,
                    // así que no tiene por qué anunciarse igual de fuerte —
                    // pero tampoco tiene por qué fingir que la pantalla de
                    // atrás no cambió de color.
                    backgroundColor: `color-mix(in oklab, ${CAFE} 4.2%, var(--background))`,
                  }
                : undefined
            }
          >
            {/* «Ahora no» nombra la decisión de rechazar, y eso solo aplica
                cuando el juego ofreció. Si la persona abrió la diapo ella misma
                no está diciendo que no a nada: está volviendo. */}
            {LO_PIDIO(trigger)
              ? "Volver"
              : listo
                ? "Ahora no"
                : `Ahora no (${restante})`}
            {keyboard && listo && <KeyCap>{teclas.enter}</KeyCap>}
          </button>
        </Salida>
      </div>
      )}
    </div>
  )
}
