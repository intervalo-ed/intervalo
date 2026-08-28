"use client"

// Card del enunciado y las piezas del feedback. El input y el teclado los arma
// el layout (mobile-flow / desktop-layout); acá va solo lo presentacional.
//
// El feedback NO es un cartel: es el mismo lugar donde se escribió la respuesta
// el que responde. La barra late en verde o se sacude en naranja, el botón toma
// ese color, y arriba de la barra queda una línea con lo que hay que decir (la
// pista, o la derivada correcta cuando ya no quedan intentos). Es el lenguaje
// de las sesiones de Intervalo — el sacudón sale de las opciones del
// session-runner y el latido de las tablas (components/exercise-table.tsx).

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import MathText from "@/components/math-text"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { fmtMultiplier } from "./cafecito-cta"
import type { GameAnswer } from "./UseGameExercise"

// No hay pregunta escrita. La consigna es siempre la misma —derivar— así que se
// explica una vez en la intro (intro-panel.tsx) y de ahí en más la dice la
// notación: el enunciado no es "f(x) = …" sino el operador de Leibniz aplicado a
// la función, cerrado con un "=" que sigue en el campo de abajo. Eso es lo que
// se pide, escrito como se escribe en un pizarrón.
//
// El renglón que ocupaba la pregunta pasó a ser el marcador del juego: los tres
// números que cambian mientras se juega.
const LEIBNIZ = (latex: string) => `$$\\frac{d}{dx}\\left[\\,${latex}\\,\\right] =$$`

// Ancho del canal central del panel. Lo comparten el campo de la respuesta, su
// feedback y las teclas (math-keyboard.tsx :: CONTENT_WIDTH): con todo alineado
// al mismo ancho, el panel se lee como una columna en vez de como tres cajas de
// bordes distintos. La fórmula queda afuera a propósito — una derivada larga
// necesita todo el ancho de la card antes de ponerse a scrollear.
export const PANEL_CONTENT = "mx-auto w-full max-w-[28rem]"

// Los mismos hex que usa el session-runner para las opciones: naranja al errar,
// verde al acertar. Que el juego y las sesiones hablen distinto sería gratis y
// no aportaría nada.
const WRONG = "#E3690B"
const RIGHT = "#22C55E"

const TONE_PULSE = {
  correct: "rgba(34, 197, 94, 0.26)",
  wrong: "rgba(227, 105, 11, 0.28)",
} as const

export type AnswerTone = "correct" | "wrong" | null

export function answerTone(answer: GameAnswer | null): AnswerTone {
  if (!answer) return null
  // Un LaTeX que no se pudo leer no consume intento, pero visualmente es un
  // rebote igual: la respuesta no entró.
  if (!answer.parse_ok) return "wrong"
  return answer.correct ? "correct" : "wrong"
}

const SHAKE = [0, -8, 8, -6, 6, -3, 0]
const SHAKE_S = 0.4
const PULSE_S = 0.45

// Cuánto dura el destello del botón, y con qué velocidad entra y sale el color.
// La ida es un golpe y la vuelta es lenta: eso es lo que lo hace leer como un
// pulso y no como un cambio de estado.
const FLASH_MS = 480
const FLASH_IN = "90ms"
const FLASH_OUT = "420ms"

// Un momento que dura `ms` y que tiene que volver a correr en cada respuesta,
// incluso si la anterior fue del mismo tipo: si el valor animado se quedara
// igual, ni motion ni una transición CSS reanimarían. En vez de resetear el
// estado desde el efecto (que sería un setState síncrono dentro de un effect),
// se DERIVA: está activo mientras la última respuesta asentada no sea esta.
function useMoment(active: boolean, seq: number, ms: number) {
  const [settled, setSettled] = useState<number | null>(null)
  const on = active && settled !== seq
  useEffect(() => {
    if (!on) return
    const t = setTimeout(() => setSettled(seq), ms)
    return () => clearTimeout(t)
  }, [on, seq, ms])
  return on
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// Un dígito como rodillo: la tira completa de 0 a 9, desplazada hasta dejar a
// la vista el que toca. La dirección del giro no se calcula ni se recuerda —
// sale sola de interpolar el `y` entre el valor viejo y el nuevo, así que subir
// de 4 a 5 rueda hacia arriba y caer de 7 a 0 rueda hacia abajo, sin comparar
// nada contra un valor anterior guardado.
//
// Alto de línea y ancho de columna, en PÍXELES ENTEROS y no en `em`.
//
// Esto no es una preferencia de unidades: con `1.1em` sobre 16 px la línea medía
// 17.6 y el desplazamiento de cada dígito caía en 35.188, 105.563, 158.344…
// —todos fraccionarios y todos distintos—, así que el navegador redondeaba cada
// columna a un sub-píxel diferente y los dígitos de un mismo número se veían
// corridos entre sí. Lo mismo a lo ancho: la columna medía 11.047. Con enteros,
// cada múltiplo cae exacto y las cuatro cifras de un Elo se apoyan en la misma
// línea.
//
// El precio es que el rodillo deja de escalar solo con el tamaño de letra: si
// alguna vez el marcador cambia de cuerpo, estos dos números hay que moverlos.
// Vale la pena — un marcador con los dígitos torcidos se nota siempre.
//
// VEINTIDÓS y no veinte, y ese píxel de más es un arreglo, no un capricho: DM
// Sans a 16 px pide una caja de línea de 21 (16 de ascenso + 5 de descenso,
// medido con el canvas del navegador). Con la celda en 20, el medio interlineado
// daba −0,5 y CADA dígito pintaba medio píxel afuera de su celda, arriba y
// abajo. Como las celdas van apiladas al ras, ese medio píxel cae justo sobre la
// línea donde el rodillo recorta, así que el glifo de al lado cruza el corte y
// cada motor de dibujo decide por su cuenta qué hacer con esa franja: en
// Chromium no se ve nada y en el WebKit de iOS aparecía una raya punteada
// asomando por arriba del número.
//
// Con 22 el medio interlineado es +0,5 y ningún glifo sale de su celda, así que
// no queda nada que el recorte pueda agarrar — en ningún navegador.
const LINE_PX = 22
// Un poco más que el dígito más ancho (medido: 11.047 el "0"), redondeado para
// arriba. Es el mismo ancho para los diez porque la tira los apila en una sola
// columna: sin ancho fijo, el número entero se movería al cambiar de cifra.
const DIGIT_W_PX = 12

function RollingDigit({ d, instant }: { d: number; instant: boolean }) {
  return (
    <span
      className="inline-block overflow-hidden"
      style={{ height: LINE_PX, width: DIGIT_W_PX }}
    >
      <motion.span
        className="flex flex-col"
        animate={{ y: -d * LINE_PX }}
        transition={instant ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32 }}
      >
        {DIGITS.map((n) => (
          // `text-center` y no la alineación por defecto: la columna mide lo que
          // el dígito MÁS ANCHO, y esta fuente ignora `tabular-nums` (medido: un
          // "1" son 5.25 px de tinta contra 11.05 de un "0"). Alineado al
          // inicio, el 1 dejaba medio glifo de hueco a su derecha y un "102" se
          // leía "1 02". Centrado, el aire sobrante se reparte y pasa por
          // espaciado normal.
          <span
            key={n}
            className="text-center"
            style={{ height: LINE_PX, lineHeight: `${LINE_PX}px` }}
          >
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

function RollingNumber({ value }: { value: number }) {
  const reduceMotion = useReducedMotion()
  const digits = Math.max(0, Math.trunc(value)).toString().split("")
  return (
    // aria-hidden: diez dígitos por columna son ruido para un lector de
    // pantalla. El número lo anuncia el aria-label del contador.
    <span aria-hidden className="flex tabular-nums">
      {digits.map((d, i) => (
        // La key cuenta desde la DERECHA: al pasar de 9 a 10 la columna de las
        // unidades tiene que seguir siendo la misma y rodar de 9 a 0, no
        // remontarse y aparecer de golpe.
        <RollingDigit key={digits.length - i} d={Number(d)} instant={!!reduceMotion} />
      ))}
    </span>
  )
}

// Cartelito propio y no el `title` del navegador: ese tarda casi un segundo en
// aparecer, se dibuja con la tipografía del sistema y no entra en una sola
// línea. Estos tres números son un número y un emoji, sin rótulo — sin algo que
// los explique, la primera vez no se entiende ninguno.
function Tip({ title, body }: { title: string; body: string }) {
  return (
    <span
      // aria-hidden: lo que dice ya está en el `aria-label` del contador, y
      // anunciarlo dos veces solo ensucia el lector de pantalla.
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-[13rem] -translate-x-1/2 scale-95 rounded-md border border-border bg-popover px-2.5 py-1.5 text-left opacity-0 shadow-lg transition-[opacity,transform] duration-150 group-hover:scale-100 group-hover:opacity-100"
    >
      <span className="block text-xs font-medium text-foreground">{title}</span>
      <span className="mt-0.5 block text-[0.7rem] leading-snug text-muted-foreground">{body}</span>
    </span>
  )
}

function Counter({
  value,
  text,
  emoji,
  label,
  tip,
  dim = false,
  glyphClass,
}: {
  // Retoque de tamaño para el glifo, cuando no es un emoji. Medido: los emojis
  // de color se dibujan a 22 px de ancho con el cuerpo de 16, y un símbolo de
  // texto al mismo cuerpo mide 16 y se ve chico al lado de los otros tres.
  glyphClass?: string
  // Entero: se dibuja con el rodillo. El multiplicador del cafecito no es
  // entero y viaja por `text`, sin rodillo — la coma no rueda.
  value?: number
  text?: string
  emoji: string
  // Lo que anuncia el lector de pantalla.
  label: string
  tip: { title: string; body: string }
  dim?: boolean
}) {
  return (
    // `leading-none` en los dos: el emoji trae una caja de línea más alta que
    // la del rodillo y, sin achicarla, estiraba la fila entera.
    <span
      className={cn(
        "group relative flex items-center gap-1 text-base font-medium leading-none",
        dim ? "text-muted-foreground" : "text-foreground",
      )}
      aria-label={label}
    >
      {text !== undefined ? (
        <span aria-hidden>{text}</span>
      ) : (
        <RollingNumber value={value ?? 0} />
      )}
      {/* Sin corrección de posición a propósito. Medido en pantalla: la tinta
          del dígito y la del emoji tienen su centro a la misma altura sobre la
          línea base, y con `leading-none` en los dos el centrado del flex deja
          las dos líneas base en el mismo píxel. Cualquier empujón acá los
          desalinea en vez de arreglarlos. */}
      <span
        aria-hidden
        className={cn("leading-none", glyphClass, dim && "opacity-40 grayscale")}
      >
        {emoji}
      </span>
      <Tip {...tip} />
    </span>
  )
}

const TIPS = {
  attempted: {
    title: "Ejercicios",
    body: "Cuántas derivadas jugaste desde que arrancaste.",
  },
  streak: {
    title: "Racha",
    body: "Correctas al primer intento, seguidas. Un error la vuelve a cero.",
  },
  elo: {
    title: "Elo",
    body: "Tu nivel. Sube cuando resolvés algo difícil y baja cuando errás.",
  },
  boost: {
    title: "Cafecito",
    body: "Un cafecito multiplica el XP de toda tu universidad por media hora.",
  },
} as const

// Los tres marcadores, en el renglón que antes ocupaba la pregunta. Van juntos
// en una pastilla centrada y no separados a lo ancho de la card: son UNA cosa
// —el marcador del juego— y desparramados a lo largo de 28 rem se leían como
// tres adornos sueltos, cada uno perdido en su esquina.
//
// Con los separadores alcanza para que no se confundan entre sí, que era el
// problema de ponerlos pegados en fila ("120" y "0" al lado parecían un solo
// número partido).
//
// El Elo no es el tercer contador por casualidad: los otros dos solo suben, así
// que ninguno dice qué tan bien se está jugando. Este sí, porque baja.
function Counters({
  attempted,
  streak,
  elo,
  multiplier,
  className,
}: {
  attempted: number
  streak: number
  // Null hasta que carga el jugador: se deja el hueco en vez de mostrar un 1000
  // que después salta al valor real.
  elo: number | null
  // Empuje vigente de la universidad. Se muestra SIEMPRE, también en ×1,0 y
  // apagado: es la única forma de que alguien que nunca vio un empuje sepa que
  // existe la mecánica antes de que le toque uno.
  multiplier: number
  className?: string
}) {
  const bar = <span aria-hidden className="h-3.5 w-px shrink-0 bg-border" />
  return (
    <span
      className={cn(
        // Aire más apretado en el teléfono. Los cuatro contadores con su emoji
        // piden 204 px de tinta que no se pueden achicar, y con el aire de
        // escritorio la pastilla pedía 325: más que los 311 que deja una
        // pantalla de 375. Con `gap-2 px-3` baja a 281 y entra —con lugar de
        // sobra para que el contador de ejercicios llegue a cuatro cifras—,
        // mientras que de `md` para arriba, donde el canal mide 28rem, queda el
        // aire de siempre.
        "mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 md:gap-3.5 md:px-4",
        className,
      )}
    >
      {/* Una pieza de rompecabezas y no el ábaco que había antes: lo que se
          cuenta acá no son cuentas sino problemas, y cada uno encaja en el
          siguiente. Es además el emoji con el que la intro nombra la palabra
          "ejercicio" (intro-panel.tsx), así que el contador y el texto que lo
          explica dicen lo mismo. */}
      <Counter
        value={attempted}
        emoji="🧩"
        label={`${attempted} ejercicios`}
        tip={TIPS.attempted}
      />
      {bar}
      <Counter
        value={streak}
        emoji="🔥"
        label={`racha de ${streak}`}
        tip={TIPS.streak}
        dim={streak === 0}
      />
      {elo !== null && (
        <>
          {bar}
          {/* Un peón de ajedrez y no la flecha para arriba que había antes: el
              Elo es el ÚNICO contador que baja —los otros dos solo suben, y por
              eso ninguno dice qué tan bien se está jugando— así que un gráfico
              ascendente prometía lo contrario de lo que el número hace. El
              ajedrez es además de donde sale el sistema (Árpád Élő).

              El `︎` es un selector de presentación de TEXTO, y no es
              opcional: sin él el navegador puede dibujar el peón como emoji, o
              sea una imagen de color fijo y oscura, que sobre este fondo se
              apaga. Con él es un glifo, hereda `currentColor` y se ve como los
              números de al lado. Ese mismo cuerpo lo deja más chico que los
              emojis (medido: 16 px contra 22), y de ahí el retoque de tamaño. */}
          <Counter
            value={elo}
            emoji={"♟︎"}
            glyphClass="text-[1.35em]"
            label={`elo ${elo}`}
            tip={TIPS.elo}
          />
        </>
      )}
      {bar}
      <Counter
        text={fmtMultiplier(multiplier)}
        emoji="☕"
        label={`multiplicador de XP ${fmtMultiplier(multiplier)}`}
        tip={TIPS.boost}
        dim={multiplier <= 1}
      />
    </span>
  )
}

// La caja del enunciado NO se mide por su fórmula: es la que absorbe todo el alto
// que sobra en la card, con un piso de 6rem.
//
// Las dos cosas importan. El piso, porque si midiera lo que mide la fórmula cada
// ejercicio cambiaría el alto de la caja y el marcador de arriba saltaría con
// cada derivada (6rem deja 94 px de contenido, y la fórmula más alta que sirve
// el juego —un cociente con exponentes dentro del corchete— pide unos 65). Y que
// crezca, porque ese sobrante tiene que ir a algún lado: cuando quedaba afuera
// se juntaba en un hueco de 80 px entre el marcador y la fórmula, y ochenta
// píxeles de nada se leen como un error de maquetado. Adentro de la caja, en
// cambio, son aire alrededor del problema — que es de lo que la caja está hecha.
// El piso baja a 5rem en el teléfono. Con el CTA a la altura del onboarding
// (--cta-pb, 2.5rem) la caja quedaba clavada en los 6rem de antes, o sea sin un
// píxel de reserva: en una pantalla más corta —o en Safari, donde la barra de
// URL se come alto REAL y `dvh` es bastante menos que la pantalla— el panel se
// pasaba de largo y `overflow-hidden` lo recortaba.
//
// 5rem sigue estando muy por encima de lo que la fórmula necesita: la más alta
// que sirve el juego —un cociente con exponentes dentro del corchete— pide unos
// 65 px, y acá quedan 78. En escritorio se queda en 6rem, que es donde el
// sobrante de la columna tiene que ir a parar.
const PROMPT_H = "min-h-20 flex-1 md:min-h-24"

const PROMPT_BOX = cn(
  "flex flex-col justify-center rounded-xl border border-border bg-background px-6 text-center text-[1.25rem]",
  // Tres ajustes que no son cosméticos, los tres medidos en pantalla:
  //
  // · `[&>span]:block` — MathText devuelve un span EN LÍNEA con un bloque
  //   adentro, y esa línea aporta su propio puntal. Hecho bloque, desaparece.
  // · `[&_.katex-display]:my-0!` con `!` — KaTeX le pone `margin: 1em 0` a
  //   `.katex-display` y su hoja gana por orden de cascada, así que el `my-0`
  //   que MathText ya intenta aplicar no surte efecto (medido: 20 px arriba y
  //   20 abajo que seguían ahí).
  // · `[&>span>span]:overflow-y-hidden` — el desborde horizontal de una fórmula
  //   larga ya lo resuelve MathText por dentro, pero al pedir `overflow-x: auto`
  //   el eje Y se vuelve `auto` solo, y con la fórmula rozando el alto de su
  //   caja aparecía una barra de scroll flotando contra el borde derecho.
  "[&>span]:block [&>span>span]:overflow-y-hidden [&_.katex-display]:my-0!",
  PANEL_CONTENT,
)

// La caja del enunciado. Mide el CANAL, no la fórmula. Se probó lo otro (`w-fit`, y después
// como ítem de una fila) y las dos veces quedó de 50 px con la fórmula
// desarmada en varios renglones: el nodo que devuelve MathText mide 0 de ancho
// —adentro tiene un bloque de KaTeX— así que cualquier ancho calculado a partir
// del contenido da cero. Con el canal fijo eso deja de importar, y de paso la
// caja se alinea con el campo y las teclas, que ya viven en el mismo ancho.
function PromptBox({
  promptLatex,
  gone,
  boxRef,
}: {
  promptLatex: string
  gone: boolean
  boxRef?: (node: HTMLDivElement | null) => void
}) {
  return (
    // Al acertar, la fórmula no se desvanece: se ROMPE. Las monedas nacen
    // repartidas a lo largo de esta misma fórmula y caen al fondo de esta misma
    // caja (ver xp-burst.tsx), así que lo que se ve es un objeto que se hace
    // pedazos y no dos animaciones que coinciden.
    //
    // La transición se le aplica al hijo con `[&>span]` en vez de envolverlo:
    // esta caja ya tiene dos reglas medidas apuntando a `>span` y a `>span>span`
    // (ver PROMPT_BOX), y meter un envoltorio las corre un nivel y le devuelve al
    // enunciado el puntal de línea que esas reglas justamente sacan.
    //
    // Se va con `opacity` y no con `display`: la caja tiene que conservar su
    // alto, si no el panel entero pega un salto justo cuando las monedas están
    // en el aire. Y sale rápido —100 ms— porque la explosión es el corte: más
    // lento se vería la fórmula conviviendo con sus propios pedazos.
    <div
      ref={boxRef}
      className={cn(
        PROMPT_BOX,
        PROMPT_H,
        "[&>span]:transition-[opacity,transform] [&>span]:duration-100 [&>span]:ease-out",
        gone && "[&>span]:scale-[0.96] [&>span]:opacity-0",
      )}
    >
      <MathText text={LEIBNIZ(promptLatex)} />
    </div>
  )
}

export function ExerciseCard({
  streak,
  attempted,
  elo,
  multiplier,
  promptLatex,
  promptGone = false,
  promptRef,
  bare = false,
  children,
  className,
}: {
  // Correctas al primer intento seguidas (el combo del jugador).
  streak: number
  attempted: number
  elo: number | null
  multiplier: number
  promptLatex: string
  // El enunciado se rompió en monedas y ya no está. Queda así hasta el ejercicio
  // siguiente: lo que se convirtió en puntos no vuelve.
  promptGone?: boolean
  // La caja del enunciado: de acá salen las monedas y acá adentro caen (ver
  // xp-burst.tsx).
  promptRef?: (node: HTMLDivElement | null) => void
  // Sin caja propia: en escritorio el enunciado y el teclado comparten UNA
  // sola card, así que el borde y el fondo los pone el contenedor de afuera.
  // Sin borde tampoco lleva padding abajo: ahí abajo va el teclado, y quien
  // decide cuánto aire hay entre las dos cosas es él (ver math-keyboard.tsx).
  bare?: boolean
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        // `gap-3`: el mismo aire que hay entre la caja de la fórmula y el campo.
        // Sin él, la caja quedaba pegada al marcador — antes los separaba el
        // sobrante que ahora vive adentro de la caja.
        "flex flex-col gap-3 px-4 pt-4",
        bare ? "pb-0" : "rounded-lg border border-border bg-card pb-4",
        className,
      )}
    >
      <Counters
        attempted={attempted}
        streak={streak}
        elo={elo}
        multiplier={multiplier}
        className="shrink-0"
      />
      {/* En escritorio la card crece hasta llenar la columna. Lo que crece es la
          caja de la FÓRMULA, y el campo queda pegado abajo de todo: es lo que
          hace que el teclado —que va justo después— quede a la misma distancia
          del campo que del fondo de la card. Si en vez de eso se centrara el
          grupo entero, el sobrante se repartiría también DEBAJO del campo y el
          teclado terminaría lejos de él y cerca del borde.
          Sin `min-h-0` a propósito — con él, en una ventana baja la card se
          encoge por debajo de su contenido y el enunciado se sale por arriba. */}
      <div className="flex flex-1 flex-col gap-3">
        {/* La derivada en su propia caja, como los marcadores: un recuadro
            sutil sobre el fondo es el mismo recurso separando las tres cosas que
            muestra la card —marcador, problema, respuesta— sin tener que dibujar
            líneas entre ellas. */}
        <PromptBox promptLatex={promptLatex} gone={promptGone} boxRef={promptRef} />
        {children}
      </div>
    </div>
  )
}

// Sin línea de feedback. Lo dice todo la respuesta misma: la barra late en
// verde o se sacude en naranja y el botón toma ese color y pasa a "Continuar".
// Un cartel que además lo escribiera sería decir dos veces lo mismo, y en un
// juego donde se acierta cada quince segundos ese cartel aparece y desaparece
// todo el tiempo.
//
// Cuesta algo: al quemar los dos intentos ya no se ve la derivada correcta. Es
// una decisión de producto, no un olvido.

// La caja de la respuesta: late al confirmar y se sacude si está mal. El pulso
// va montado por `seq` y no por tono, así dos erradas seguidas laten dos veces.
export function AnswerField({
  tone,
  seq,
  children,
}: {
  tone: AnswerTone
  seq: number
  children?: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const shaking = useMoment(tone === "wrong", seq, SHAKE_S * 1000 + 60) && !reduceMotion

  return (
    <motion.div
      className="relative"
      animate={shaking ? { x: SHAKE } : { x: 0 }}
      transition={shaking ? { duration: SHAKE_S, ease: "easeInOut" } : { duration: 0 }}
    >
      {children}
      {tone && !reduceMotion && (
        <motion.span
          key={`pulse-${seq}`}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg"
          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
          animate={{
            backgroundColor: ["rgba(0,0,0,0)", TONE_PULSE[tone], "rgba(0,0,0,0)"],
          }}
          transition={{ duration: PULSE_S, times: [0, 0.22, 1], ease: "easeOut" }}
        />
      )}
    </motion.div>
  )
}

// Chip de tecla, con el aire y el redondeo de los que muestran los CLI. Solo en
// escritorio: en el teléfono no hay tecla que mostrar.
// Los colores salen de `currentColor`: el mismo chip va sobre el botón blanco
// (texto negro), sobre el "saltear" apagado (texto claro) y sobre el de la
// tabla en la cabecera.
export function KeyCap({
  children,
  className,
}: {
  children: React.ReactNode
  // El `ml-2` de base es para el caso común (el chip va después de una palabra).
  // La intro los alinea en columna y lo anula con `ml-0`.
  className?: string
}) {
  return (
    <kbd
      className={cn(
        "ml-2 inline-flex items-center gap-0.5 rounded border border-current/25 bg-current/10 px-1.5 py-[3px] font-mono text-[0.7rem] font-normal leading-none",
        className,
      )}
    >
      {children}
    </kbd>
  )
}

// El botón ES el feedback, pero de paso y no de estado: destella verde al
// acertar o naranja al errar y vuelve enseguida a blanco. Antes se quedaba
// pintado hasta que la persona empezaba a corregir, y un botón verde fijo se
// lee como "este botón es verde" en vez de como "acertaste".
//
// El destello se hace con la transición CSS que el botón ya tiene, cambiando su
// duración entre la ida y la vuelta: entra en 90 ms y sale en 420. Con una sola
// duración el color se apagaría tan rápido como se prendió y el pulso no se
// leería.
export function AnswerButton({
  tone,
  seq,
  closed,
  disabled,
  onClick,
  showKeyHint = false,
  className,
}: {
  tone: AnswerTone
  seq: number
  closed: boolean
  disabled?: boolean
  onClick: () => void
  showKeyHint?: boolean
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const shaking = useMoment(tone === "wrong", seq, SHAKE_S * 1000 + 60) && !reduceMotion
  const flashing = useMoment(tone !== null, seq, FLASH_MS)

  const bg = flashing && tone ? (tone === "correct" ? RIGHT : WRONG) : "#FFFFFF"

  return (
    <motion.div
      className={cn("shrink-0", className)}
      animate={shaking ? { x: SHAKE } : { x: 0 }}
      transition={shaking ? { duration: SHAKE_S, ease: "easeInOut" } : { duration: 0 }}
    >
      <Button
        size="lg"
        // El color va inline y no por clase: son los mismos hex que el resto
        // del feedback, y Tailwind no genera clases interpoladas.
        style={{
          backgroundColor: bg,
          color: "#000",
          transitionDuration: flashing ? FLASH_IN : FLASH_OUT,
        }}
        className="h-[var(--cta-h)] w-full rounded-md transition-colors hover:opacity-90"
        disabled={disabled}
        onClick={onClick}
      >
        {closed ? "Continuar" : "Revisar"}
        {showKeyHint && (
          <KeyCap>enter</KeyCap>
        )}
      </Button>
    </motion.div>
  )
}

// Saltear. Mismo formato que el botón "Opciones" de las sesiones de Intervalo
// (session-runner.tsx :: OptionsArea): contorno fino sobre el fondo, sin
// relleno. Es la forma que el proyecto ya usa para "la acción secundaria de
// este paso", y acá cumple ese mismo papel al lado del botón principal.
//
// Va al lado y no debajo porque el pedido fue que el bloque ocupara menos alto,
// y una fila más para un atajo secundario iba justo en contra.
export function SkipButton({
  disabled,
  onClick,
  showKeyHint = false,
}: {
  disabled?: boolean
  onClick: () => void
  showKeyHint?: boolean
}) {
  return (
    <Button
      size="lg"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="h-[var(--cta-h)] shrink-0 rounded-md bg-background px-5 font-normal dark:bg-background"
    >
      Saltear
      {showKeyHint && <KeyCap>alt + enter</KeyCap>}
    </Button>
  )
}
