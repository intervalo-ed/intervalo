"use client"

// La tabla de derivadas: el dorso del panel del RANKING. Se da vuelta con el
// botón de la cabecera o manteniendo Alt / Option (ver desktop-layout.tsx).
//
// Vivía detrás de la card del ejercicio y se mudó acá por una razón práctica: en
// esa card el dorso tenía que medir lo mismo que el frente —enunciado, campo y
// teclado— y era la cara MÁS ALTA de las dos, así que era la tabla la que fijaba
// el alto de toda la columna izquierda. Del lado del ranking eso no pasa: la
// columna ya es alta y angosta, que es justo la forma de una tabla de catorce
// renglones. Y de paso el ejercicio queda intacto mientras se consulta.
//
// Las filas son las funciones que el juego SIRVE, no una tabla genérica de
// libro: cada plantilla de backend/game/templates.py tiene su renglón acá y
// nada más. Las de la foto que el juego nunca pide —|x|, la raíz n-ésima— no
// están: en una tabla que se mira contrarreloj, un renglón que no va a hacer
// falta es una fila más para descartar con la vista.
//
// Las dos reglas del final no son decoración: los tiers 4 y 5 son productos y
// cocientes, y sin ellas la tabla no sirve justo donde más se la necesita.

import { useState } from "react"
import { motion } from "motion/react"
import { Table2 as TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import MathText from "@/components/math-text"
import { KeyCap } from "./exercise-card"
import { useTeclas } from "./teclas"

// Todas las fórmulas se dibujan en `\displaystyle`, y no es cosmético: en
// modo texto —el de `$...$`— KaTeX arma las fracciones con numerador y
// denominador en `scriptstyle`, o sea al 70%. Una tabla mitad fracciones y
// mitad no terminaba con dos tamaños de letra conviviendo, y las que hay que
// leer con más cuidado eran justo las chiquitas. En display, el numerador y el
// denominador van al mismo cuerpo que el resto.
//
// El precio es alto: una fracción en display ocupa casi el doble. Se paga con
// gusto, porque los renglones NO miden todos lo mismo (ver `Renglon`): cada uno
// pide lo que su fórmula necesita y el bloque se acomoda solo.
const mate = (latex: string) => `$\\displaystyle ${latex}$`

type Fila = { f: string; d: string }

// Una sola tabla de dos columnas. Las dos reglas —producto y cociente— entran
// como dos filas más y no en una tabla aparte: son lo mismo que el resto
// (algo y su derivada) y separarlas obligaba a una segunda cabecera que repetía
// las mismas dos palabras.
// Las fracciones SIMPLES —las que tienen un 1 arriba y un factor abajo— van
// escritas en una sola línea. Apiladas, cada una de esas filas medía 65 px
// contra los 41 de un renglón normal, y seis de ellas eran 150 px que la tabla
// no tiene: en una ventana de las comunes la tabla se cortaba antes de llegar a
// las reglas, que son justo las que más se consultan.
//
// TODAS, incluida la del cociente: con los paréntesis puestos —(u'v − uv')/v²—
// no queda ambigüedad, y a cambio los catorce renglones miden lo mismo. Una
// tabla de renglones parejos se recorre con la vista de un tirón; una con seis
// filas al doble de alto obliga a saltar.
//
// Se pierde algo: `1/x^2` en línea admite leerse mal como `(1/x)^2`. Es un
// precio aceptable en una tabla que se consulta contrarreloj y que ya se está
// mirando con las dos columnas al lado.
const FILAS: Fila[] = [
  { f: "a", d: "0" },
  { f: "x", d: "1" },
  { f: "x^n", d: "n\\,x^{n-1}" },
  { f: "1/x", d: "-1/x^{2}" },
  { f: "\\sqrt{x}", d: "1/\\left(2\\sqrt{x}\\right)" },
  { f: "e^{x}", d: "e^{x}" },
  { f: "a^{x}", d: "a^{x}\\ln a" },
  { f: "\\ln x", d: "1/x" },
  { f: "\\log_a x", d: "1/\\left(x\\ln a\\right)" },
  { f: "\\operatorname{sen} x", d: "\\cos x" },
  { f: "\\cos x", d: "-\\operatorname{sen} x" },
  { f: "\\tan x", d: "1/\\cos^{2} x" },
  { f: "u \\cdot v", d: "u'v + uv'" },
  { f: "u/v", d: "\\left(u'v - uv'\\right)/v^{2}" },
]

// El renglón no tiene alto fijo: mide lo que mide su fórmula más un aire
// parejo. Con `\displaystyle` las que tienen fracción son casi el doble de
// altas que un `0` pelado, y forzarlas a todas al mismo alto significaba o
// dejar media tabla con aire de sobra o apretar las fracciones. Repartido así,
// el bloque llena la columna sin huecos y cada fórmula respira lo suyo.
const CELDA = "flex items-center justify-center px-3 py-2 text-center leading-none"

function Renglon({ fila }: { fila: Fila }) {
  return (
    // `flex-auto` —o sea `flex: 1 1 auto`— es lo que reparte el sobrante de la
    // columna entre los catorce renglones en vez de dejarlo todo junto al pie.
    // El reparto es proporcional a lo que cada uno mide, así que el que tiene
    // una raíz sigue siendo un poco más alto que el que tiene un 0: se gana
    // aire sin aplanar las diferencias. Y como el reparto se recalcula con el
    // alto disponible, el margen de abajo iguala al de arriba en cualquier
    // ventana, sin ningún número escrito a mano.
    <div className="grid flex-auto grid-cols-2 border-t border-white/10">
      <div className={cn(CELDA, "border-r border-white/10")}>
        <MathText text={mate(fila.f)} />
      </div>
      <div className={CELDA}>
        <MathText text={mate(fila.d)} />
      </div>
    </div>
  )
}

export function DerivativesTable() {
  return (
    // Scrollea adentro: en una ventana baja la tabla no tiene que empujar el
    // panel ni salirse por abajo.
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto text-[0.95rem]">
      {/* `min-h-full`: cuando sobra alto, la tabla se estira hasta el fondo del
          contenedor y son los renglones los que se lo reparten (ver `Renglon`).
          Cuando falta, no encoge — scrollea, que es lo que corresponde. */}
      <div className="flex min-h-full flex-col overflow-hidden rounded-md border border-white/10">
        <div className="grid shrink-0 grid-cols-2 bg-white/[0.07] text-center text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          <div className="border-r border-white/10 py-1">función</div>
          <div className="py-1">derivada</div>
        </div>
        {FILAS.map((fila) => (
          <Renglon key={fila.f} fila={fila} />
        ))}
      </div>
    </div>
  )
}

// El botón de la cabecera: el ícono de tabla y el chip de la tecla, sin la
// palabra. El rótulo estaba porque era el único botón de esa esquina que hacía
// algo DENTRO del juego —y que además cuesta Elo— pero con el chip `alt` al
// lado ya se entiende que abre algo, y el nombre lo dice el `aria-label` para
// quien lo necesita. Tres botones con texto en una esquina de 440 px se pisaban
// entre sí.
export function TableButton({
  open,
  onToggle,
  keyboard = true,
  className,
}: {
  open: boolean
  onToggle: () => void
  // El chip de la tecla solo donde hay tecla. En el teléfono se toca, y un
  // "alt" impreso al lado sería prometer un atajo que no existe.
  keyboard?: boolean
  className?: string
}) {
  const teclas = useTeclas()
  return (
    <button
      type="button"
      aria-label={open ? "Volver al ranking" : "Ver la tabla de derivadas"}
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
      <TableIcon size={15} />
      {keyboard && <KeyCap className="ml-0">{teclas.alt}</KeyCap>}
    </button>
  )
}

// El volteo. Las dos caras viven superpuestas dentro de un contenedor que gira
// en 3D: la de atrás nace ya girada 180°, así que al girar el contenedor queda
// derecha y la de adelante se va.
//
// `backfaceVisibility: hidden` en las dos es lo que evita ver la cara de atrás
// espejada durante el giro. Y el `perspective` va en un contenedor APARTE del
// que rota: si van juntos, el navegador aplica la perspectiva antes de la
// rotación y el giro se ve plano.
//
// Se probó reemplazarlo por una persiana (translateY, sin 3D) y se volvió acá a
// propósito: el volteo es el gesto que se quiere. Si alguna vez se ve plano o
// espejado, la causa casi seguro es un ancestro nuevo con overflow, filter u
// opacity —cualquiera de los tres aplana el contexto 3D—; el arreglo es sacar
// esa propiedad del camino, no cambiar la animación.
// Acá el giro es UNA sola animación de 180° sobre un mismo elemento, así que no
// hay tranco que arreglar en el medio y alcanza con una ease-in-out. Baja de
// 0.5 a 0.4 para ir al ritmo del volteo entre ejercicios (slide-flip.tsx).
const FLIP_S = 0.4
const FLIP_EASE = [0.65, 0, 0.35, 1] as const

export function FlipCard({
  flipped,
  front,
  back,
  className,
}: {
  flipped: boolean
  front: React.ReactNode
  back: React.ReactNode
  className?: string
}) {
  // Media vuelta MÁS en cada cambio, en vez de ir y volver entre 0 y 180. Yendo
  // y viniendo, cerrar era la película de abrir pasada al revés: la card
  // desandaba el camino y el gesto se leía como "deshacer" en lugar de como
  // seguir. Sumando siempre, la card gira siempre para el mismo lado y cada cara
  // entra por donde salió la anterior.
  //
  // El ajuste se hace DURANTE el render y no en un efecto: es el patrón que
  // React documenta para acomodar estado cuando cambia una prop, no dispara un
  // render de más —React lo resuelve antes de pintar— y el lint del compilador
  // no acepta un setState sincrónico adentro de un efecto.
  const [medias, setMedias] = useState(flipped ? 1 : 0)
  const [visto, setVisto] = useState(flipped)
  if (visto !== flipped) {
    setVisto(flipped)
    setMedias((n) => n + 1)
  }

  // `willChange` solo mientras gira. `preserve-3d` no se puede sacar —es lo que
  // hace que las dos caras existan en el espacio— pero pedir capa de compositor
  // de forma permanente para una card que gira dos veces por partida es
  // sostener memoria de video todo el tiempo a cambio de nada.
  const [girando, setGirando] = useState(false)

  return (
    <div className={cn("relative", className)} style={{ perspective: 1600 }}>
      <motion.div
        className="relative h-full w-full"
        style={{
          transformStyle: "preserve-3d",
          willChange: girando ? "transform" : undefined,
        }}
        animate={{ rotateY: medias * 180 }}
        onAnimationStart={() => setGirando(true)}
        onAnimationComplete={() => setGirando(false)}
        transition={{ duration: FLIP_S, ease: FLIP_EASE }}
      >
        {/* `inert` en la cara que no se ve: si no, se puede tabular hasta el
            campo de respuesta que está del otro lado de la card. */}
        <div
          className="flex h-full w-full flex-col"
          style={{ backfaceVisibility: "hidden" }}
          inert={flipped}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          inert={!flipped}
        >
          {back}
        </div>
      </motion.div>
    </div>
  )
}
