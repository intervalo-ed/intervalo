"use client"

// Las tres reglas que la puerta mínima no dijo, después del primer festejo.
//
// Solo el brazo `derivada-primero` del experimento de la puerta llega acá: el
// control dice las cuatro antes de jugar, en `IntroPanel`.
//
// La lista NO se escribe de nuevo. Es la misma de `IntroParagraphs`, cortada en
// la segunda (`REGLAS_DESDE`) y conservando su numeración: la 1 ya se dio en la
// puerta, en imperativo, y es la derivada que la persona acaba de resolver. Ver
// el bloque del brazo en intro-panel.tsx.
//
// Sale donde sale porque es lo único que la hace legible. Las tres reglas hablan
// del Elo, del ranking y de la tabla; llegando acá, el Elo se acaba de mover, el
// puesto se acaba de ver subir y el @ recién elegido es el que está en esa fila.
// Las mismas tres frases treinta segundos antes son la lista del control, que es
// justamente lo que este brazo saca del camino.

import { useEffect, useRef } from "react"
import posthog from "posthog-js"

import { Button } from "@/components/ui/button"

import { KeyCap } from "./exercise-card"
import { IntroParagraphs } from "./intro-panel"
import { REGLAS_DESDE } from "./reglas-trigger"
import { Salida } from "./slide-salida"
import { enCampoDeTexto, useTeclas } from "./teclas"

// Igual que el Continuar del ranking y el de la intro: es la única acción de la
// pantalla, así que va en blanco y no con el gris de salida de las diapos que
// ofrecen algo (claseDeSalida). Acá no hay nada que declinar.
const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

export function ReglasSlide({
  onContinue,
  slotSalida,
  keyboard = false,
}: {
  onContinue: () => void
  /** Dónde dibujar el Continuar: el pie de la columna, AFUERA de la caja —
   *  mismo trato que «Elegí tu @» y el hito de perfil (slide-salida.tsx). Solo
   *  lo manda `desktop-layout.tsx`; en el teléfono el botón se queda adentro. */
  slotSalida?: HTMLElement | null
  /** Escritorio. El Enter global del juego no llega acá —`enterFocused` solo
   *  cubre el ejercicio y la intro—, así que la pantalla escucha el suyo, como
   *  hacen las diapos de pedido. Sin esto la única pantalla del brazo test que
   *  no se despacha con Enter sería justo la última antes de volver a jugar. */
  keyboard?: boolean
}) {
  const teclas = useTeclas()
  // Un solo Continuar por aparición: el listener vive en `document` y un teclado
  // que repite mandaría dos, y el segundo caería sobre la derivada siguiente.
  const seguidoRef = useRef(false)

  useEffect(() => {
    posthog.capture("game_reglas_shown")
  }, [])

  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      // El aside puede estar volteado al chat: ahí un Enter es un Enter.
      if (enCampoDeTexto(e.target)) return
      e.preventDefault()
      if (seguidoRef.current) return
      seguidoRef.current = true
      onContinue()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [keyboard, onContinue])

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center gap-5">
      {/* El renglón de arriba es lo que explica por qué la lista empieza en 2:
          sin él, tres reglas numeradas de la 2 a la 4 se leen como si faltara
          una. Con él, la que falta es la que la persona acaba de hacer. */}
      <p className="text-center font-semibold text-foreground">
        Listo, esa fue una. El resto es así:
      </p>
      {/* La misma tipografía que la intro del control y que la bienvenida del
          onboarding: acá este texto ES el contenido de la pantalla, no una
          aclaración al pie. */}
      <div className="flex flex-col gap-3 leading-relaxed text-foreground/85">
        <IntroParagraphs desde={REGLAS_DESDE} />
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
