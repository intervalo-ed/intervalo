"use client"

// Con qué contás, antes de la primera derivada.
//
// Son las dos salidas que el juego ofrece cuando una derivada no sale: mirar la
// tabla y saltearla. Las dos viven en la fila del pie (`pie-rampa.tsx`) y hasta
// acá no se nombraban antes de jugar — la tabla se explicaba DESPUÉS, en la
// diapo de las reglas, y el salteo no se explicaba nunca. Alguien que se trababa
// en su primera derivada tenía los dos botones delante y ninguna razón para
// tocarlos.
//
// **Por qué antes y no después.** La atrición por derivada medida en la camada
// del 14/09 es 20,4% en la PRIMERA y entre 5,7% y 8,9% de la cuarta en adelante:
// el momento en que alguien se va es justo el que esta pantalla cubre. Decirle
// después que podía haber salteado es llegar tarde a la única vez que importaba.
//
// **Solo en los brazos con la fila de ayudas** (`ayudas` y `bienvenida` de
// `dx-rampa-1`). En `control` y en `teclado` el botón de Tabla no está en el
// pie, así que esta pantalla prometería algo que no se puede tocar; esos dos
// brazos siguen con la regla de la tabla en la diapo de después, como siempre
// (reglas-trigger.ts :: reglasDeLaDiapo).
//
// El símbolo es el MISMO del botón, no un emoji: lo que esta pantalla enseña no
// es que la tabla exista sino cuál de los dos botones de abajo la abre, y un 📖
// al lado de un ⊞ es una pista falsa.

import { useEffect, useRef } from "react"
import { useIsPresent } from "motion/react"
import posthog from "posthog-js"
import { SkipForward, Table2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { KeyCap } from "./exercise-card"
import { Salida } from "./slide-salida"
import { enCampoDeTexto, useTeclas } from "./teclas"

// Igual que el Continuar de la intro y el de las reglas: es la única acción de
// la pantalla, así que va en blanco. Acá no hay nada que declinar.
const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

function Fuerte({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>
}

/** El símbolo, con la misma caja que lo lleva en el pie.
 *
 *  Mismo borde, mismo redondeo y mismo gris que `PieDeRampa`: la idea es que al
 *  llegar abajo el botón se reconozca, no que se parezca. */
function Simbolo({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="inline-flex size-[1.625em] shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground"
    >
      {children}
    </span>
  )
}

export function HerramientasSlide({
  onContinue,
  slotSalida,
  keyboard = false,
}: {
  onContinue: () => void
  /** Dónde dibujar el Continuar: el pie de la columna, AFUERA de la caja. Solo
   *  lo manda `desktop-layout.tsx`; en el teléfono el botón se queda adentro. */
  slotSalida?: HTMLElement | null
  /** Escritorio. El Enter global no llega acá, así que la pantalla escucha el
   *  suyo, igual que `ReglasSlide`. */
  keyboard?: boolean
}) {
  const teclas = useTeclas()
  // Un solo Continuar por aparición: el listener vive en `document` y un teclado
  // que repite mandaría dos, y el segundo caería sobre la primera derivada.
  const seguidoRef = useRef(false)

  useEffect(() => {
    posthog.capture("game_herramientas_shown")
  }, [])

  // Saliendo no escucha: la diapo sigue montada mientras se funde (o se
  // desliza, en el teléfono) y un Enter en ese rato era suyo otra vez.
  const presente = useIsPresent()
  useEffect(() => {
    if (!keyboard || !presente) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      if (enCampoDeTexto(e.target)) return
      e.preventDefault()
      if (seguidoRef.current) return
      seguidoRef.current = true
      onContinue()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [keyboard, presente, onContinue])

  return (
    // `slotSalida` distingue escritorio en todo este flujo. Alla la pantalla
    // vive adentro de una card con aire de sobra y al cuerpo normal se leia
    // como una nota al pie; aca pasa lo mismo que en la pantalla de arranque, y
    // lleva las mismas medidas: 512 de ancho y 18 px de cuerpo. El simbolo esta
    // en `em`, asi que crece solo con el texto y sigue centrado.
    <div
      className={cn(
        "mx-auto flex min-h-0 w-full flex-1 flex-col",
        // 17 px y no los 18 de `text-lg`: un escalon entero por encima del
        // cuerpo normal pesaba mas que el enunciado que viene despues, y esta
        // pantalla es de apoyo. Medio escalon se lee mas grande sin competir.
        slotSalida ? "max-w-lg text-[1.0625rem]" : "max-w-md",
      )}
    >
      {/* El texto se queda en el medio y el boton se va al pie, que es donde lo
          tiene la pantalla de antes: en el telefono las dos son la misma columna
          y un Continuar a media altura se lee como otro boton, no como el mismo
          que se viene apretando. En escritorio esto no cambia nada porque el
          boton viaja por portal al pie de la columna (`slotSalida`). */}
      <div className="flex flex-1 flex-col justify-center gap-4 leading-relaxed text-foreground/85">
        <p className="flex items-start gap-3 text-left">
          <Simbolo>
            <Table2 size={16} />
          </Simbolo>
          <span>
            Si te trabás podés mirar la <Fuerte>tabla</Fuerte> de derivadas.
          </span>
        </p>
        <p className="flex items-start gap-3 text-left">
          <Simbolo>
            <SkipForward size={16} />
          </Simbolo>
          <span>
            Y si una no te sale, podés <Fuerte>saltearla</Fuerte> y seguir con
            otra.
          </span>
        </p>
      </div>
      <Salida slot={slotSalida}>
        <Button size="lg" className={ctaCls} onClick={onContinue}>
          Continuar
          {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
        </Button>
      </Salida>
    </div>
  )
}
