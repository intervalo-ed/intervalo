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
import { ArrowLeft, ArrowRight, Coffee } from "lucide-react"
import { BELT_HEX } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import { CAFECITO_URL, fmtMultiplier, type CafecitoTrigger } from "./cafecito-cta"
import {
  useCafecitoIntent,
  useCafecitoStatus,
  type GameCafecitoStatus,
} from "./UseGameLeaderboard"
import { KeyCap } from "./exercise-card"
import { CLASE_ACCION_EN_EL_PIE, claseDeSalida, Salida } from "./slide-salida"
import { useCta } from "./game-telemetry"
import { useTeclas } from "./teclas"

// Marrón de marca. `solid` para el relleno del botón —es el que tiene contraste
// suficiente con texto blanco encima— y `onDark` para todo lo que es tinta
// sobre el fondo oscuro.
const CAFE = BELT_HEX.brown.solid
const CAFE_TINTA = BELT_HEX.brown.onDark

// Cuánto tarda en habilitarse el botón de seguir.
const COOLDOWN_S = 10

// Espejo de backend/game/boosts.py. Se duplican para poder dibujar el slider sin
// pedirle nada al servidor: el multiplicador de verdad lo calcula y lo aplica
// él, esto es la calculadora que muestra a qué se está invitando.
const CAFECITO_STEP = 0.1
// Lo que puede aportar UNA donación: el techo del juego es ×3, pero al ×3 no se
// llega solo. Por eso el slider corta en ×2 — es honesto sobre lo que esta
// persona puede hacer por su cuenta, y deja el resto para el que colabore.
const MAX_PER_DONATION = 2.0
const SLIDER_MAX = 10

// Media hora siempre; la hora entera SOLO al tope del multiplicador. Es el único
// escalón, y ese es el punto: con los minutos creciendo parejo con el
// multiplicador (15, 30, 45…) cada paso del slider movía dos números a la vez, y
// dos premios que crecen juntos no se leen ninguno. Con un solo escalón, el
// slider tiene un lugar al que llegar.
const BOOST_MINUTES = 30
const BOOST_MINUTES_MAX = 60

const multiplierFor = (n: number) => Math.min(MAX_PER_DONATION, 1 + n * CAFECITO_STEP)
const minutesFor = (n: number) =>
  multiplierFor(n) >= MAX_PER_DONATION ? BOOST_MINUTES_MAX : BOOST_MINUTES

// La barra arranca en el MEDIO y no en uno. Arrancando en el mínimo, el número
// que se lee al llegar es el más chico que se puede invitar, y mover la barra
// queda planteado como "poné más"; desde el medio, la barra ya está en una
// oferta razonable y se puede ir para los dos lados. Es la misma razón por la
// que las propinas sugeridas nunca empiezan en la más baja.
const SLIDER_INICIAL = Math.round(SLIDER_MAX / 2)

// El movimiento es un desplazamiento FUGAZ, no un resorte: 110 ms con salida
// suave. El resorte de antes tenía rebote, y con una barra de diez pasos ese
// rebote hacía que el pulgar pareciera pasarse del valor elegido. Así llega
// antes que el ojo y el número de arriba —que cambia en el mismo gesto— se lee
// junto con la barra y no después.
const FUGAZ = { duration: 0.11, ease: "easeOut" } as const

// El color de la barra sube con la cantidad: apagado a la izquierda, dorado a
// la derecha. Es el mismo marrón de marca corrido hacia el negro o hacia el
// blanco, así que la barra "se enciende" al pedir más sin estrenar una paleta.
//
// Los extremos se calculan en RGB y no con `color-mix` porque motion no sabe
// interpolar un `color-mix(...)`: lo trataría como texto y el color saltaría de
// un paso al otro en vez de correrse.
const AMBAR_RGB = [0xa8, 0x70, 0x3c] as const
const mezclar = (a: readonly number[], b: readonly number[], t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(", ")})`
const APAGADO = [0x6b, 0x4a, 0x28] as const
const DORADO = [0xea, 0xbb, 0x74] as const
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

const colorPara = (t: number) =>
  t < 0.5
    ? mezclar(APAGADO, AMBAR_RGB, t * 2)
    : mezclar(AMBAR_RGB, DORADO, (t - 0.5) * 2)

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
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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
    sub: "Es lo que mantiene el juego en pie.",
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
  slotAccion,
  onContinue,
}: {
  estado: GameCafecitoStatus
  // Cuántos cafecitos dejó marcados la barra antes de irse. Es lo ÚNICO que se
  // sabe de la donación mientras no está acreditada, y alcanza para no hablarle
  // en singular a quien pidió cinco.
  pedidos: number
  keyboard: boolean
  slotAccion?: HTMLElement | null
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
  const minutos = Math.max(1, Math.round(estado.expires_in_seconds / 60))

  // Sin cuenta regresiva para salir, al revés que la oferta. Ahí la espera
  // existe para que el pedido se lea; acá la persona ya decidió —y quizás ya
  // pagó— y retenerla sería cobrarle dos veces.
  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
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
                Durante los próximos {minutos} minutos, todos los de la{" "}
                {estado.university} que estén jugando suman más XP. Ya se está
                viendo en las novedades.
              </>
            ) : (
              <>
                Durante los próximos {minutos} minutos, cualquiera que esté
                jugando suma más XP. Se lo regalaste a todos.
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
          debajo de la diapo en el teléfono. En los dos casos queda gris.

          Pierde el marrón de marca, y es una pérdida real: esta es la única
          pantalla del juego que llega después de que alguien pagó, y ahí el color
          hacía de festejo. Se paga a cambio de que el botón con el que se sigue
          esté SIEMPRE en el mismo lugar, que es lo que hace que la diapo se lea
          como una pausa adentro del juego y no como otra pantalla. */}
      <Salida slot={slotAccion}>
        <button
          type="button"
          onClick={() => {
            sfx.select()
            onContinue()
          }}
          className={
            slotAccion
              ? claseDeSalida(true)
              : "mt-6 flex w-full items-center justify-center rounded-md px-4 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90"
          }
          style={slotAccion ? undefined : { backgroundColor: CAFE }}
        >
          Continuar
          {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
        </button>
      </Salida>
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
  // El volteo dura unos 380 ms y durante ese rato la diapo que se va sigue
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
    if (volvio) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
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
  }, [keyboard, listo, onContinue, university, volvio])

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-center rounded-lg border p-6 text-center",
        className,
      )}
      style={{
        // Marrón muy diluido de fondo: alcanza para que la diapo se lea como
        // otra cosa que el resto del juego sin dejar de ser la misma card.
        backgroundColor: `color-mix(in oklab, ${CAFE} 12%, var(--card))`,
        borderColor: `color-mix(in oklab, ${CAFE_TINTA} 45%, transparent)`,
      }}
    >
      {volvio && estado !== null && estado.state !== "none" ? (
        <PanelDeVuelta
          estado={estado}
          pedidos={n}
          keyboard={keyboard}
          slotAccion={slotAccion}
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
                  universidad y los minutos— van con el mismo tratamiento:
                  negrita y la tinta del slider. Los minutos estuvieron un rato
                  en blanco y quedaban leyéndose como parte de la frase fija,
                  cuando en realidad son la otra mitad de lo que se está
                  eligiendo (media hora, o una entera al tope). */}
              <span className="font-semibold" style={{ color: tintaPara(t) }}>
                {university}
              </span>{" "}
              durante{" "}
              <span
                className="font-semibold tabular-nums"
                style={{ color: tintaPara(t) }}
              >
                {minutesFor(n)} minutos
              </span>
              .
            </p>

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
              Un cafecito multiplica el XP de toda tu universidad por media hora.
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
            className={claseDeSalida(!!slotSalida)}
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
