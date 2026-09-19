"use client"

// Las reglas que la puerta no dijo, después de un festejo.
//
// La misma pantalla sirve a los dos brazos de `dx-puerta-2`, y la diferencia es
// cuántas reglas trae:
//
//   - `control`   las tres juntas, una sola vez, después del primer ranking.
//   - `sin-peaje` de a una, en la 5, la 8 y la 15 (reglas-trigger.ts).
//
// La lista NO se escribe de nuevo: es la de `IntroParagraphs`, y acá solo se
// eligen índices. La regla 1 nunca entra — ya se dio en la puerta, en
// imperativo, y es la derivada que la persona acaba de resolver.
//
// Con tres van numeradas 1, 2 y 3. Con una no lleva número: un «1.» arriba de un
// renglón único promete una lista que no viene.
//
// Sale después del ranking y no antes porque es lo único que la hace legible.
// Las reglas hablan del Elo, del ranking y de la tabla; llegando acá, el Elo se
// acaba de mover y el puesto se acaba de ver subir. Las mismas frases en la
// puerta son la pantalla que `dx-puerta-1` sacó del camino.

import { useEffect, useRef } from "react"
import posthog from "posthog-js"

import { Button } from "@/components/ui/button"

import { KeyCap } from "./exercise-card"
import { IntroParagraphs } from "./intro-panel"
import { Salida } from "./slide-salida"
import { enCampoDeTexto, useTeclas } from "./teclas"

// Igual que el Continuar del ranking y el de la intro: es la única acción de la
// pantalla, así que va en blanco y no con el gris de salida de las diapos que
// ofrecen algo (claseDeSalida). Acá no hay nada que declinar.
const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

export function ReglasSlide({
  cuales,
  onContinue,
  slotSalida,
  keyboard = false,
}: {
  /** Índices de la lista de `IntroParagraphs`. Uno o tres, según el brazo. */
  cuales: number[]
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
    // Con `cuales` adentro: en `sin-peaje` esta pantalla sale tres veces y sin
    // el dato los tres eventos son indistinguibles, que es justo lo que hay que
    // poder mirar — si una de las tres se lleva gente, cuál.
    posthog.capture("game_reglas_shown", { reglas: cuales })
  }, [cuales])

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
      {/* Sin renglón de presentación. Antes había un «Listo, esa fue una. El
          resto es así» arriba de una lista que empezaba en 2, para justificar el
          hueco. Sobraban los dos: tres ítems que arrancan en 2 hacen buscar el 1
          aunque el texto diga dónde quedó, y sin encabezado la pantalla entra
          antes.

          La misma tipografía que la puerta y que la bienvenida del onboarding:
          acá este texto ES el contenido de la pantalla, no una aclaración al
          pie. */}
      <div className="flex flex-col gap-3 leading-relaxed text-foreground/85">
        <IntroParagraphs cuales={cuales} numera={cuales.length > 1} />
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
