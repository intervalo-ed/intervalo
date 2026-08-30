"use client"

// El logo del minijuego: d/dx [ intervalo ].
//
// Es notación correcta y se lee literalmente "la derivada de intervalo", así que
// dice la marca y el tema en un solo gesto — que es justo el problema que abría
// fusionar la marca: con el wordmark de Intervalo solo, el que cae de un link no
// sabe a qué juega.
//
// Ese argumento vale donde se cae de un link, que es el teléfono: el juego se
// comparte por WhatsApp. En escritorio se entra sabiendo, y ahí el lockup pasa a
// ser una firma de más sobre una pantalla que ya tiene ejercicio, ranking y
// novedades. Por eso `showNotation={false}` deja SOLO la palabra con su barra —
// el logo común de Intervalo— y es lo que usa el escritorio, en el header y en
// la presentación (game-intro.tsx). El dibujo sigue siendo el mismo archivo:
// quitar la notación no cambia ni la letra ni el subrayado, así que las dos
// versiones siguen siendo la misma marca.
//
// NO se usa el <Wordmark> de la app, aunque la palabra sea la misma. El logo del
// splash VIAJA hasta su lugar definitivo escalándose (ver game-splash.tsx), y
// para que al aterrizar no se note ningún cambio, el que vuela y el que queda
// tienen que ser el mismo dibujo a distinta escala. El Wordmark tiene la
// separación en píxeles fijos (gap-[5px]) y a tamaño chico su subrayado es
// proporcionalmente más grueso — una corrección óptica deliberada allá, que acá
// despegaría la palabra de la barra a mitad de vuelo. De ahí que todo lo de este
// archivo esté en `em`, contra el tamaño de letra del contenedor.

import { motion } from "motion/react"
import { BELT_LEGEND_BAR_COLORS } from "@/lib/catalog"

export const LOGO_WORD = "intervalo"

const BELT_COLORS = BELT_LEGEND_BAR_COLORS
const GAP_EM = 0.16
const BAR_EM = 0.12

// El operador va en redonda y no en bastardilla: la Noto Serif del proyecto se
// carga sin cursiva, así que el navegador la sintetizaría inclinándola, y una
// bastardilla falsa en el logo se nota. Además es la misma "d/dx" derecha del
// ícono y del avatar de Cafecito.
const OP_EM = 0.66  // ~0,92 del alto del corchete, medido sobre el PNG del preview
const OP_BAR_EM = 0.075

// Corchetes dibujados con bordes y no con el glifo "[": así se estiran EXACTO al
// alto del contenido, como los corchetes que KaTeX arma en los enunciados, en
// vez de depender de que un carácter llegue a esa altura.
// Cómo entran las dos piezas de la notación —los corchetes y el operador—
// cuando la palabra ya está escrita: aparecen. Un fundido con un apenas de
// escala pareja (0,94 → 1), igual en las dos, para que se lean como UN gesto
// —la notación encendiéndose alrededor de la palabra— y no como dos cosas que
// llegan cada una por su lado.
//
// La escala va en los dos ejes a propósito: estirar uno solo es lo que hace que
// algo parezca desplegarse, y eso es justo lo que acá no se quiere.
const PARTE_VISIBLE = { opacity: 1, scale: 1 }
const PARTE_OCULTA = { opacity: 0, scale: 0.94 }
const PARTE_TRANSICION = { duration: 0.3, ease: "easeOut" } as const

const BRACKET_W_EM = 0.2
const BRACKET_STEM_EM = 0.07
const BRACKET_ARM_EM = 0.055
const BRACKET_PAD_EM = 0.13

function Bracket({ side, shown }: { side: "left" | "right"; shown: boolean }) {
  return (
    <motion.span
      aria-hidden
      initial={false}
      // Aparece, no se despliega. Antes crecía en `scaleY` desde el centro —el
      // corchete dibujándose a mano—, pero eso es el mismo gesto con el que se
      // escribe la palabra, y el lockup terminaba siendo tres despliegues
      // encadenados: la atención no sabía dónde pararse. La notación es el marco
      // de la palabra, así que entra de otra manera — se enciende alrededor de
      // algo que ya está escrito.
      animate={shown ? PARTE_VISIBLE : PARTE_OCULTA}
      transition={PARTE_TRANSICION}
      style={{
        width: `${BRACKET_W_EM}em`,
        borderTop: `${BRACKET_ARM_EM}em solid currentColor`,
        borderBottom: `${BRACKET_ARM_EM}em solid currentColor`,
        [side === "left" ? "borderLeft" : "borderRight"]:
          `${BRACKET_STEM_EM}em solid currentColor`,
      }}
    />
  )
}

export function GameLogo({
  fontSize,
  typedCount,
  barCount,
  showNotation = true,
  showBrackets = true,
  showOperator = true,
  animateEntry = false,
}: {
  // Tamaño de letra en unidades CSS ("2.75rem", "1.25rem"). Va en el
  // contenedor, que es contra lo que se resuelven los `em` de adentro.
  fontSize: string
  // Letras visibles; sin valor, la palabra completa.
  typedCount?: number
  // Tramos visibles del subrayado; sin valor, todos.
  barCount?: number
  // ¿Hay notación alrededor de la palabra? En false no se dibujan ni los
  // corchetes ni el operador —no se ocultan: no existen—, y lo que queda es el
  // logo común de Intervalo. Tienen que salir del DOM y no apagarse con
  // opacidad, porque los dos OCUPAN LUGAR: apagados dejarían la palabra corrida
  // dentro de un hueco del tamaño del lockup entero.
  showNotation?: boolean
  // El lockup se arma de adentro hacia afuera: primero la palabra con su barra,
  // después los corchetes, y al final el operador. Sin valor, todo puesto. No
  // se miran cuando `showNotation` es false: ahí no hay nada que armar.
  showBrackets?: boolean
  showOperator?: boolean
  // Entrada animada de cada letra (solo la usa el splash).
  animateEntry?: boolean
}) {
  const shownChars = typedCount ?? LOGO_WORD.length
  const shownBars = barCount ?? BELT_COLORS.length
  const letters = LOGO_WORD.slice(0, shownChars)

  // La palabra con su subrayado: el logo común de Intervalo. Es el contenido de
  // los corchetes cuando hay notación, y el logo entero cuando no la hay.
  const palabra = (
    <span
      // La presentación lo busca por acá para medir dónde cae la palabra dentro
      // de la caja: con notación, centrar el logo no es centrar la palabra (ver
      // game-intro.tsx :: readWord).
      data-logo-word=""
      className="inline-flex flex-col items-center"
      style={{
        gap: `${GAP_EM}em`,
        // El aire de arriba y de abajo está para que los corchetes pasen por
        // afuera de la palabra sin tocarla. Sin corchetes no rodea nada: solo
        // dejaría el logo flotando en una caja más alta que él.
        padding: showNotation ? `${BRACKET_PAD_EM}em 0` : undefined,
      }}
    >
      <span className="font-heading font-semibold" style={{ lineHeight: 1 }}>
        {/* El espacio duro sostiene la altura de la caja antes de la primera
            letra: sin él el bloque salta cuando arranca el typewriter. */}
        {letters.length === 0 ? " " : null}
        {animateEntry
          ? letters.split("").map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: "0.3em", scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {ch}
              </motion.span>
            ))
          : letters}
      </span>
      <div
        className="flex w-full overflow-hidden rounded-[2px]"
        style={{ height: `${BAR_EM}em` }}
      >
        {BELT_COLORS.map((color, i) => (
          <motion.span
            key={i}
            className="flex-1 origin-left"
            style={{ background: color }}
            initial={false}
            animate={
              i < shownBars ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }
            }
            transition={{ duration: animateEntry ? 0.22 : 0, ease: "easeOut" }}
          />
        ))}
      </div>
    </span>
  )

  // Sin notación el logo es la palabra sola, y no hay más nada que envolver.
  if (!showNotation) {
    return (
      <div
        className="inline-flex items-center text-[#F6F8FC]"
        style={{ fontSize, lineHeight: 1 }}
      >
        {palabra}
      </div>
    )
  }

  return (
    <div
      className="inline-flex items-center text-[#F6F8FC]"
      style={{ fontSize, gap: `${GAP_EM}em`, lineHeight: 1 }}
    >
      {/* d/dx */}
      <motion.span
        className="inline-flex flex-col items-center font-heading font-semibold"
        initial={false}
        // Igual que los corchetes: aparece. Antes entraba deslizándose desde la
        // derecha (`x: 0.35em`), que sobre un logo que acaba de escribirse
        // sumaba un tercer movimiento en la misma dirección.
        animate={showOperator ? PARTE_VISIBLE : PARTE_OCULTA}
        transition={PARTE_TRANSICION}
        style={{ fontSize: `${OP_EM}em`, lineHeight: 1, gap: `${OP_BAR_EM * 1.6}em` }}
      >
        <span>d</span>
        <span
          style={{ height: `${OP_BAR_EM}em`, width: "100%", background: "currentColor" }}
        />
        <span>dx</span>
      </motion.span>

      {/* [ intervalo ] — `items-stretch` es lo que hace que los corchetes midan
          exactamente el alto del bloque de adentro. */}
      <span className="inline-flex items-stretch" style={{ gap: `${BRACKET_PAD_EM}em` }}>
        <Bracket side="left" shown={showBrackets} />
        {palabra}
        <Bracket side="right" shown={showBrackets} />
      </span>
    </div>
  )
}
