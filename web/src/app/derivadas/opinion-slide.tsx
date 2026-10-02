"use client"

// La diapo que pregunta cómo viene resultando el juego.
//
// Una de las dos veces que el juego pregunta algo en vez de medirlo —la otra es
// repetitividad-slide.tsx, y comparten la escalera de turnos de
// opinion-trigger.ts—, y la única de las dos que mueve algo. Todo lo demás que el
// juego sabe sale de los aciertos —θ y β— y los aciertos no saben si alguien se
// está aburriendo.
//
// Como la de instalar, no pide nada: un toque, se sale sin contestar, y lo que
// devuelve es que el juego se le acomode. Por eso no tiene botón de color ni
// cuenta regresiva.
//
// Las tres opciones y sus emojis son los MISMOS que la micro-encuesta de
// Intervalo clásico (survey-pane.tsx, canal A), y los valores que viajan también
// (game/opinion.py :: VOTOS). Dos productos preguntando lo mismo tienen que
// poder compararse sin una tabla de traducción en el medio.

import { useEffect, useRef, useState } from "react"
import { motion, useIsPresent, useReducedMotion } from "motion/react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"

import { useGameApi } from "./UseGameApi"
import { KeyCap } from "./exercise-card"
import { Salida } from "./slide-salida"
import { digitoDe, enCampoDeTexto, enCampoHtml, useTeclas } from "./teclas"

export type VotoDificultad = "muy_facil" | "justo" | "muy_dificil"

// Con qué tecla se vota cada una, en escritorio. El índice ES el orden en que
// se dibujan: 1 la de arriba. Si alguna vez se suma una cuarta opción, hay que
// sumarle su tecla acá o queda muda.
const TECLAS = ["1", "2", "3"]

const OPCIONES: { voto: VotoDificultad; emoji: string; texto: string }[] = [
  { voto: "muy_facil", emoji: "😴", texto: "Muy fáciles" },
  { voto: "justo", emoji: "👌", texto: "Justas" },
  { voto: "muy_dificil", emoji: "🤯", texto: "Muy difíciles" },
]

// El renglón que aparece debajo apenas se elige una opción, y cambia si se
// cambia de opción. Es la respuesta del juego a lo que la persona acaba de
// decir: sin él, tocar una opción solo la pintaba y no se sabía si eso servía
// para algo.
//
// Hubo uno parecido que se fue —«Anotado.», «Te subimos la vara.»— y se fue por
// dos motivos que este esquiva. Salía DESPUÉS de mandar el voto, y hoy el voto
// no se manda hasta Continuar; este depende solo de lo elegido, así que no
// espera a nadie. Y el más frecuente era «Anotado.», que acusaba recibo sin
// decir nada; estos dicen qué va a pasar.
//
// En primera del plural, como el subtítulo («Ajustemos la dificultad»): la
// dificultad se decide entre los dos, y el renglón es la mitad del juego
// contestando.
//
// **Prometen más de lo que el servidor garantiza, y es una decisión de
// producto.** El voto decide el signo del ajuste y el registro de la persona
// decide el tamaño (backend/game/opinion.py): quien dice «muy fáciles» sin
// venir ganándole al motor no se mueve. «Aumentamos» es cierto para quien tiene
// el registro que lo respalda y es una intención para el resto.
const RESPUESTA: Record<VotoDificultad, string> = {
  muy_facil: "Aumentamos entonces.",
  justo: "La dejamos igual entonces.",
  muy_dificil: "Bajamos entonces.",
}

export function OpinionSlide({
  onContinue,
  slotSalida,
  keyboard = false,
  fullBleed = false,
  className,
}: {
  /** `contesto` dice si se votó o si se salió sin contestar. Lo usa el flow para
   *  llevar la racha de salteos, que es lo que hace que el juego deje de
   *  preguntarle a quien nunca contesta (opinion-trigger.ts ::
   *  OPINION_SALTOS_PARA_CORTAR). Antes no hacía falta porque un tope de tres
   *  apariciones cortaba a todos por igual. */
  onContinue: (contesto: boolean) => void
  slotSalida?: HTMLElement | null
  /** Escritorio. Enciende los chips de tecla y el listener que los cumple: 1, 2
   *  y 3 votan, Enter sigue. El Enter global del juego no llega hasta acá
   *  —`enterFocused` solo cubre el ejercicio y la intro— así que la pantalla
   *  escucha el suyo, como las diapos de pedido. */
  keyboard?: boolean
  /** Gemelo del de pedido-instalar.tsx: solo lo manda el teléfono, donde el
   *  fondo lo pinta la pantalla entera. */
  fullBleed?: boolean
  className?: string
}) {
  const api = useGameApi()
  const sfx = useSfx()
  const teclas = useTeclas()
  const reduce = useReducedMotion()
  const [votado, setVotado] = useState<VotoDificultad | null>(null)

  useEffect(() => {
    posthog.capture("game_opinion_shown")
    // La impresión también va a la base: una pregunta mostrada y no contestada
    // es información sobre la pregunta, y sin registrarla no hay manera de saber
    // cuánta gente la ignora. Sin await ni manejo de error, como toda la
    // telemetría — que falle no puede frenar la partida.
    void api
      .POST("/game/derivemos/opinion", { body: { accion: "impression" } })
      .catch(() => {})
    // Una sola vez por aparición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // **Elegir no es contestar.** El primer toque marcaba la opción, mandaba el
  // voto y apagaba las otras dos: quien se equivocaba de renglón —o cambiaba de
  // idea al verlas juntas— no tenía forma de corregir, y el dato que quedaba en
  // la base era el error. Ahora el toque solo marca, se puede cambiar todas las
  // veces, y lo que manda es Continuar.
  function elegir(voto: VotoDificultad) {
    sfx.select()
    setVotado(voto)
  }

  /** Confirmar: manda lo elegido —si hay algo— y sigue.
   *
   *  Sin `await`: la pantalla se va en este mismo toque y no hay nada que
   *  mostrar con la respuesta. Si el POST se pierde, se perdió un voto; frenar
   *  la partida por eso sería cobrar el error dos veces. */
  function confirmar() {
    // Un solo Continuar por aparición, venga del teclado o del botón: desde que
    // el voto se manda acá, el segundo toque mandaba un segundo voto.
    if (seguidoRef.current) return
    seguidoRef.current = true
    const voto = votadoRef.current
    if (voto !== null) {
      posthog.capture("game_opinion_answered", { voto })
      void api
        .POST("/game/derivemos/opinion", { body: { accion: "answer", voto } })
        .catch(() => {})
    }
    onContinue(voto !== null)
  }

  // El listener vive en `document` y `votar` se redefine en cada render, así que
  // se lo alcanza por ref en vez de meterlo en las dependencias: con `votar` en
  // la lista, el efecto se desarma y se rearma en cada tecla. Es el mismo
  // mecanismo que reclutas-panel.tsx.
  const votarRef = useRef(elegir)
  useEffect(() => {
    votarRef.current = elegir
  })
  // Y lo mismo con «¿votó?», por el mismo motivo: el listener de Enter se arma
  // con `[keyboard, onContinue]` en las dependencias, así que leer `votado`
  // directo desde ahí daría el valor que tenía cuando se armó —siempre `null`—
  // y todo Continuar por teclado contaría como salteo.
  const votadoRef = useRef<VotoDificultad | null>(null)
  useEffect(() => {
    votadoRef.current = votado
  })
  const confirmarRef = useRef(confirmar)
  useEffect(() => {
    confirmarRef.current = confirmar
  })
  // Un solo Continuar por aparición: un teclado que repite mandaría dos, y el
  // segundo caería sobre la derivada siguiente.
  const seguidoRef = useRef(false)

  // Solo mientras la diapo ESTÁ: el fundido de salida la deja montada 220 ms, y
  // en captura esos 220 ms le robaban el primer dígito a la derivada siguiente.
  const presente = useIsPresent()
  useEffect(() => {
    if (!keyboard || !presente) return
    const onKey = (e: KeyboardEvent) => {
      // Escribiendo en el chat, un 2 es un 2. Este listener vive en `document` y
      // la diapo puede estar abierta con el aside volteado al chat.
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "Enter") {
        // El Enter de un desplegable es del desplegable: lo abre y lo cierra.
        if (enCampoDeTexto(e.target)) return
        e.preventDefault()
        e.stopPropagation()
        confirmarRef.current()
        return
      }
      // Los números solo ceden ante un campo de texto de verdad (el chat). Ni
      // un filtro del ranking con el foco ni el campo de la respuesta, que
      // queda enfocado debajo de la diapo, se los pueden quedar.
      if (enCampoHtml(e.target)) return
      const n = digitoDe(e)
      if (n === null || n > OPCIONES.length) return
      const i = n - 1
      e.preventDefault()
      e.stopPropagation()
      votarRef.current(OPCIONES[i].voto)
    }
    // EN CAPTURA, y parando la tecla usada. El campo de la respuesta conserva el
    // foco debajo de esta diapo y MathLive no deja burbujear sus teclas: en
    // burbuja el 1, el 2 y el 3 se escribían en un campo que no se ve y acá no
    // llegaban. Ver `teclas.ts :: enCampoHtml`.
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [keyboard, onContinue, presente])

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-center gap-6 p-6",
        // `bg-card` y no solo el borde. Sin fondo, la caja se recortaba sobre la
        // grilla del tablero y la diapo se leía como un hueco en la pantalla en
        // vez de como una card — al lado de «elegí tu universidad», que sí lo
        // tiene porque se lo pone el layout, la diferencia saltaba.
        !fullBleed && "rounded-lg border border-border bg-card",
        className,
      )}
    >
      <div className="text-center">
        {/* Dos palabras y nada más.
         *
         *  Antes decía «¿Cómo te vienen resultando?» con un subtítulo que explicaba
         *  para qué servía contestar. Las dos cosas eran lenguaje de producto:
         *  «resultando» no se dice hablando, y el subtítulo justificaba la
         *  pregunta ante alguien que todavía no había decidido si le molestaba.
         *
         *  Las tres opciones de abajo ya dicen de qué se trata —muy fáciles,
         *  justas, muy difíciles—, así que el título no tiene que acotar nada.
         *
         *  El subtítulo volvió, pero con otro trabajo: no explica para qué
         *  sirve contestar, dice qué se va a hacer con la respuesta. Es lo que
         *  le da sentido al renglón que aparece abajo al elegir. */}
        <h2 className="text-xl font-semibold">¿Cómo venís?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajustemos la dificultad.
        </p>
      </div>

      {/* Las tres opciones, centradas y angostas. A lo ancho de la card de
          escritorio la fila quedaba enorme y el emoji a un extremo con el texto
          a medio camino: tres renglones que no se leían como tres opciones
          comparables entre sí. */}
      <div className="mx-auto flex w-full max-w-xs flex-col gap-2">
        {OPCIONES.map((o, i) => (
          <motion.button
            key={o.voto}
            type="button"
            onClick={() => elegir(o.voto)}
            // Entran escalonadas, de arriba abajo: es el orden en que se leen, y
            // el retraso hace que la lista se lea COMO una lista y no como un
            // bloque que apareció de golpe.
            //
            // El desplazamiento entra SIN opacidad a propósito, y no es un
            // olvido. Un `initial` de `opacity: 0` deja el estado de reposo en
            // invisible: si la animación no llegara a correr —el navegador
            // congela el rAF en pestañas de fondo, que es justo el motivo por el
            // que la presentación del logo tiene su `MAX_INTRO_MS`— las tres
            // opciones quedarían en blanco y la pregunta sería incontestable.
            // Con solo `y`, el peor caso es que aparezcan ocho píxeles corridas.
            initial={reduce ? false : { y: 8 }}
            animate={{
              // La no elegida se apaga en vez de desaparecer: sigue ahí para que
              // se vea qué se eligió CONTRA qué.
              opacity: votado !== null && votado !== o.voto ? 0.4 : 1,
              y: 0,
            }}
            transition={{
              duration: reduce ? 0 : 0.22,
              delay: reduce || votado !== null ? 0 : 0.05 * i,
              ease: "easeOut",
            }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className={cn(
              "relative flex items-center justify-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:border-chart-5 hover:bg-accent/40",
              votado === o.voto && "border-chart-5 bg-accent/40",
            )}
          >
            <span aria-hidden className="text-2xl">
              {o.emoji}
            </span>
            <span className="font-medium">{o.texto}</span>
            {/* Absoluto, para que el chip no descentre lo que rotula: lo que
                tiene que quedar en el eje es la opción, no la fila. */}
            {keyboard && (
              <KeyCap className="absolute right-3 ml-0">{TECLAS[i]}</KeyCap>
            )}
          </motion.button>
        ))}
      </div>

      {/* El alto se reserva desde el principio: sin esto, el renglón aparece y
          empuja las tres opciones justo cuando la persona acaba de tocar una.
          `aria-live` para que un lector de pantalla también lo diga. */}
      <p
        aria-live="polite"
        className="min-h-5 text-center text-sm text-muted-foreground"
      >
        {votado !== null ? RESPUESTA[votado] : null}
      </p>

      <Salida slot={slotSalida}>
        {/* Blanco, como el Continuar del resto del juego, y no el gris de salida
            de las diapos que ofrecen algo (`claseDeSalida`): acá no hay una
            segunda opción compitiendo al lado, así que no hay nada a lo que
            bajarle el volumen. Mismo botón que la cara de vuelta del cafecito. */}
        <button
          type="button"
          onClick={confirmar}
          className={cn(
            "flex w-full items-center justify-center rounded-md bg-white text-base font-semibold text-black transition-colors hover:bg-white/90",
            slotSalida ? "h-[var(--cta-h)]" : "mt-3 px-4 py-3",
          )}
        >
          Continuar
          {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
        </button>
      </Salida>
    </div>
  )
}
