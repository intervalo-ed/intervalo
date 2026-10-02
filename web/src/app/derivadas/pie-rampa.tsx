"use client"

// El pie del brazo `ayudas` de `dx-rampa-1` (ver backend/game/rampa.py).
//
// El pie de siempre pone las tres acciones en UNA fila —Revisar ancho, y a los
// costados el «¿Por qué?» y Saltear— y deja la tabla arriba, en la barra, como
// un ícono de 15 px al lado del chat y del cafecito. Medido: la tabla la abre el
// **2,6%** en el primer paso, y abrirla NO predice irse (14,0% contra 18,8%,
// p=0,41). O sea que está invisible, y la usa el que se queda.
//
// Acá son DOS filas: las ayudas arriba, partidas por la mitad, y la acción
// principal abajo ocupando el ancho. El alto extra sale del teclado, que en
// rampa mide una o dos filas en vez de cuatro — por eso las dos mitades del
// tratamiento viajan juntas y no como un factorial: la celda «ayudas sin
// teclado» pediría el teclado completo MÁS esta fila, y ese alto no existe (ver
// el comentario de PROMPT_H en exercise-card.tsx, que ya documenta que en Safari
// el panel se pasaba de largo).
//
// Y si erra, el botón principal se BIFURCA: el «¿Por qué?» entra a su lado y
// queda una grilla de 2×2. Las cuatro salidas posibles quedan a la vista al
// mismo tiempo, y ese es exactamente el momento que importa — de los que no
// aciertan la primera derivada al primer intento se va el 41,5%, contra el 13,1%
// de los que sí.

import { SkipForward, Table2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AnswerButton, KeyCap, type AnswerTone } from "./exercise-card"
import { PorQueButton } from "./porque-panel"
import { useTeclas } from "./teclas"

// Una ayuda: contorno sobre el fondo y el ícono a la DERECHA de la palabra.
//
// A la derecha y no a la izquierda porque lo que se lee primero tiene que ser
// qué hace el botón; el ícono es lo que lo hace reconocible la segunda vez, no
// lo que lo explica la primera. El de la tabla es el mismo `Table2` que ya usa
// el botón de la barra, así que el día que vuelva arriba se reconoce.
function BotonDeAyuda({
  children,
  icono,
  onClick,
  disabled,
  // El chip de la tecla, cuando hay teclado. Va DESPUÉS del ícono y no antes:
  // el orden de lectura es qué hace, con qué se reconoce, y recién después el
  // atajo, que es lo único de los tres que no hace falta para usar el botón.
  atajo,
}: {
  children: React.ReactNode
  icono: React.ReactNode
  onClick: () => void
  disabled?: boolean
  atajo?: React.ReactNode
}) {
  return (
    <Button
      size="lg"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      // La pulsación es la del botón principal (AnswerButton): baja medio píxel
      // al apretar y apenas se atenúa al pasar por encima. Lo que se apaga es lo
      // que traía la variante `outline` y el principal no tiene:
      //   · el cambio de fondo al pasar/apretar (`hover:bg-*`), que con
      //     `transition-all` se veía como un latido de color;
      //   · el 50% de opacidad de `disabled`. Saltear se deshabilita mientras
      //     viaja su propio pedido, o sea que se atenuaba y volvía en cada
      //     toque. El toque doble ya lo frena `onSkip`; no hace falta avisarlo.
      className="h-[var(--cta-h)] w-full min-w-0 gap-2 rounded-md bg-background font-normal transition-colors hover:bg-background hover:opacity-90 disabled:opacity-100 dark:bg-background dark:hover:bg-background"
    >
      <span className="truncate">{children}</span>
      {icono}
      {atajo}
    </Button>
  )
}

/** ¿Este brazo de `dx-rampa-1` ve la fila de Tabla y Saltear?
 *
 * **La regla vive acá y no repetida en los dos layouts**, que es como se rompio:
 * los dos preguntaban `rampa === "ayudas"` y el cuarto brazo se quedaba sin la
 * fila. `dx-rampa-1` es una ESCALERA —cada escalon agrega algo al anterior— y
 * `bienvenida` es `ayudas` MAS la pantalla de intro, no otra cosa; asi lo dice
 * `backend/game/rampa.py :: con_ayudas`, que ya incluia los dos.
 *
 * Lo que costaba: el cuarto brazo corria como «teclado + bienvenida» en vez de
 * «ayudas + bienvenida», o sea dos cambios en direcciones opuestas a la vez, y
 * su contraste contra `ayudas` no medía la pantalla de intro sino la pantalla de
 * intro menos la fila de botones. Un contraste asi no se puede leer.
 *
 * Se compara contra el string que manda el server (`GamePlayerOut.rampa`) y no
 * contra un enum del front a proposito: agregar un brazo alla tiene que ser un
 * lugar donde venir a decidir si lleva la fila, no algo que el cliente adivine.
 */
export function conAyudasDe(rampa: string | null | undefined): boolean {
  return rampa === "ayudas" || rampa === "bienvenida"
}

export function PieDeRampa({
  tone,
  seq,
  cerradoVisual,
  closed,
  hayPorque,
  primerIntento,
  principalDisabled,
  skipDisabled,
  onPrincipal,
  onSkip,
  onTabla,
  onPorque,
  keyboard = true,
  ayudasFijas = false,
  className,
}: {
  tone: AnswerTone
  seq: number
  // El ejercicio ya se cerró y la pantalla lo muestra así. Con esto puesto las
  // ayudas se van: saltear algo ya resuelto no existe, y el pie queda con la
  // sola acción de continuar, igual que el de siempre.
  cerradoVisual: boolean
  closed: boolean
  hayPorque: boolean
  primerIntento: boolean
  principalDisabled?: boolean
  skipDisabled?: boolean
  onPrincipal: () => void
  onSkip: () => void
  onTabla: () => void
  onPorque: () => void
  // Hay teclado físico. En el teléfono se toca y un chip con «alt + enter» al
  // lado sería prometer un atajo que no existe — misma convención y mismo
  // nombre que `TableButton` y `ChatButton`.
  keyboard?: boolean
  // Cerrado el ejercicio, la fila de Tabla y Saltear CONSERVA SU LUGAR en vez
  // de irse. Solo el teléfono: ahí el pie está apilado debajo del teclado en
  // pantalla, y al perder una fila todo lo de arriba —teclado incluido— se
  // corría hacia abajo justo al responder. La fila queda `invisible`: ocupa su
  // lugar sin dibujarse. Dibujada se veía A TRAVÉS del cartel del resultado,
  // que es traslúcido y cae justo encima.
  ayudasFijas?: boolean
  className?: string
}) {
  const teclas = useTeclas()
  const principal = (
    <AnswerButton
      className="flex-1"
      tone={tone}
      seq={seq}
      closed={closed}
      sinFlash={primerIntento}
      showKeyHint={keyboard}
      disabled={principalDisabled}
      onClick={onPrincipal}
    />
  )

  // Cerrado: nada que saltear ni que consultar antes de responder. Queda el pie
  // de una sola fila, que es el mismo que ve el brazo control.
  if (cerradoVisual) {
    const fila = (
      <>
        {hayPorque && (
          <PorQueButton onClick={onPorque} showKeyHint={keyboard} blanco />
        )}
        {principal}
      </>
    )
    if (!ayudasFijas) {
      return (
        <div className={cn("relative z-10 flex w-full items-stretch gap-2", className)}>
          {fila}
        </div>
      )
    }
    return (
      // La fila de ayudas va `invisible`: reserva el alto y no se dibuja. El
      // `relative z-10` lo lleva la fila del botón principal, que tiene que
      // quedar por encima del cartel.
      <div className={cn("flex w-full flex-col gap-2", className)}>
        <div className="invisible grid grid-cols-2 gap-2" aria-hidden>
          <BotonDeAyuda icono={<Table2 size={16} />} onClick={onTabla} disabled>
            Tabla
          </BotonDeAyuda>
          <BotonDeAyuda icono={<SkipForward size={16} />} onClick={onSkip} disabled>
            Saltear
          </BotonDeAyuda>
        </div>
        <div className="relative z-10 flex w-full items-stretch gap-2">{fila}</div>
      </div>
    )
  }

  return (
    <div className={cn("relative z-10 flex w-full flex-col gap-2", className)}>
      <div className="grid grid-cols-2 gap-2">
        <BotonDeAyuda
          icono={<Table2 size={16} />}
          onClick={onTabla}
          atajo={keyboard ? <KeyCap>{teclas.alt}</KeyCap> : null}
        >
          Tabla
        </BotonDeAyuda>
        <BotonDeAyuda
          icono={<SkipForward size={16} />}
          onClick={onSkip}
          disabled={skipDisabled}
          atajo={keyboard ? <KeyCap>{teclas.altEnter}</KeyCap> : null}
        >
          Saltear
        </BotonDeAyuda>
      </div>
      {hayPorque ? (
        <div className="grid grid-cols-2 gap-2">
          {/* Sin relleno y sin color de veredicto: se distingue de las dos
              ayudas de arriba por PESO —borde grueso y negrita— y no por tinte.
              El veredicto ya lo dicen el borde del campo y el cartel de abajo;
              decirlo una tercera vez en el botón era ruido. */}
          <PorQueButton
            onClick={onPorque}
            showKeyHint={keyboard}
            plano
            className="w-full"
          />
          {principal}
        </div>
      ) : (
        <div className="flex">{principal}</div>
      )}
    </div>
  )
}
