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
import { AnswerButton, type AnswerTone } from "./exercise-card"
import { PorQueButton } from "./porque-panel"

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
}: {
  children: React.ReactNode
  icono: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      size="lg"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className="h-[var(--cta-h)] w-full min-w-0 gap-2 rounded-md bg-background font-normal dark:bg-background"
    >
      <span className="truncate">{children}</span>
      {icono}
    </Button>
  )
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
  className?: string
}) {
  const principal = (
    <AnswerButton
      className="flex-1"
      tone={tone}
      seq={seq}
      closed={closed}
      sinFlash={primerIntento}
      disabled={principalDisabled}
      onClick={onPrincipal}
    />
  )

  // Cerrado: nada que saltear ni que consultar antes de responder. Queda el pie
  // de una sola fila, que es el mismo que ve el brazo control.
  if (cerradoVisual) {
    return (
      <div className={cn("relative z-10 flex items-stretch gap-2", className)}>
        {hayPorque && <PorQueButton onClick={onPorque} blanco />}
        {principal}
      </div>
    )
  }

  return (
    <div className={cn("relative z-10 flex flex-col gap-2", className)}>
      <div className="grid grid-cols-2 gap-2">
        <BotonDeAyuda icono={<Table2 size={16} />} onClick={onTabla}>
          Tabla
        </BotonDeAyuda>
        <BotonDeAyuda
          icono={<SkipForward size={16} />}
          onClick={onSkip}
          disabled={skipDisabled}
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
          <PorQueButton onClick={onPorque} plano className="w-full" />
          {principal}
        </div>
      ) : (
        <div className="flex">{principal}</div>
      )}
    </div>
  )
}
