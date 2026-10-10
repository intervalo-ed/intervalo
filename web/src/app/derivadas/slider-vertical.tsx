"use client"

// El slider de la palanca de dificultad: el del cafecito (cafecito-panel.tsx ::
// Slider) puesto de pie. Misma idea y mismos tiempos —un desplazamiento fugaz,
// un pulgar que respira— pero vertical, de a un paso, y con un relleno
// ACUMULATIVO: crece desde arriba hasta donde se eligió y toma, tramo a tramo,
// el color del nivel que atraviesa.
//
// El cafecito no se tocó: su Slider está acoplado a la tinta del café y a su
// cantidad, y compartirlo habría sido parametrizar la mitad de ese archivo. Lo
// que se comparte es el criterio: el `<input type="range">` sigue siendo quien
// trae el teclado y el lector de pantalla, y las capas animables van encima.

import { useRef } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { cn } from "@/lib/utils"

// El mismo desplazamiento fugaz del cafecito (FUGAZ): 110 ms con salida suave,
// sin rebote, para que el pulgar no parezca pasarse del valor elegido.
const FUGAZ = { duration: 0.11, ease: "easeOut" } as const

// El mismo período del café (RESPIRO_S): a este ritmo no se ve «una animación»,
// se ve que la cosa está viva. Late el aura, nunca el tamaño.
const RESPIRO_S = 5.2

// Cada posición toma un tercio del color de sus vecinas: el cambio de nivel se
// reparte en dos pasos en vez de caer de golpe, y la barra se lee como un
// degradado de calor y no como cuatro bandas.
export function mezclar(colores: readonly string[]): string[] {
  const rgb = (hex: string) => {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255]
  }
  // Una pasada, con el tono propio pesando la mitad: el cambio de nivel se
  // reparte en tres posiciones sin lavar el color de cada nivel.
  const pasada = (cs: number[][]) =>
    cs.map((_, i) => {
      const a = cs[Math.max(0, i - 1)]
      const b = cs[i]
      const c = cs[Math.min(cs.length - 1, i + 1)]
      return [0, 1, 2].map((k) => a[k] * 0.25 + b[k] * 0.5 + c[k] * 0.25)
    })
  return pasada(colores.map(rgb)).map((v) => `rgb(${v.map(Math.round).join(", ")})`)
}

function rgbaDeRgb(color: string, a: number): string {
  const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(color)
  return m ? `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})` : color
}

function Flecha({
  hacia,
  disabled,
  onClick,
}: {
  hacia: "arriba" | "abajo"
  disabled: boolean
  onClick: () => void
}) {
  const Icono = hacia === "arriba" ? ArrowUp : ArrowDown
  return (
    <button
      type="button"
      aria-label={hacia === "arriba" ? "Más suave" : "Más exigente"}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent disabled:opacity-35"
    >
      <Icono size={18} />
    </button>
  )
}

export function SliderVertical({
  ref,
  valor,
  max,
  colores,
  onCambio,
  className,
  ...props
}: {
  ref?: React.Ref<HTMLInputElement>
  valor: number
  max: number
  /** Un color por posición, de 0 a `max`. */
  colores: readonly string[]
  onCambio: (v: number) => void
  className?: string
} & Omit<React.ComponentProps<"input">, "ref" | "value" | "onChange" | "type">) {
  const quieto = !!useReducedMotion()
  const rielRef = useRef<HTMLDivElement>(null)
  const t = valor / max
  const pct = t * 100
  const suaves = mezclar(colores)
  const color = suaves[valor]

  // El relleno es el degradado de toda la barra, recortado hasta donde se
  // eligió: lo que se ve crecer es el calor. Las posiciones donde descansa el
  // pulgar se marcan con puntos vacíos, sin cortar la barra.
  const relleno = `linear-gradient(180deg, ${suaves
    .map((c, i) => `${c} ${(i / max) * 100}%`)
    .join(", ")})`

  const desdeElPuntero = (e: React.PointerEvent) => {
    const r = rielRef.current?.getBoundingClientRect()
    if (!r || r.height === 0) return
    const v = Math.round(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) * max)
    if (v !== valor) onCambio(v)
  }

  return (
    <div className={cn("flex h-full flex-col items-center gap-3", className)}>
      <Flecha hacia="arriba" disabled={valor === 0} onClick={() => onCambio(valor - 1)} />
      <div
        ref={rielRef}
        className="relative w-9 flex-1 cursor-ns-resize touch-none select-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          desdeElPuntero(e)
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) desdeElPuntero(e)
        }}
      >
        {/* Riel */}
        <div className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 rounded-full bg-foreground/12" />
        {/* Lo elegido, con su luz. El resplandor va en el contenedor y el
            recorte en el hijo: un `drop-shadow` sobre algo recortado se
            recortaría con él. Crece con lo que se llena, como el cafecito:
            en lo más suave casi no hay, y en lo más profundo la barra brilla. */}
        <motion.div
          className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2"
          initial={false}
          animate={{
            filter: `drop-shadow(0 0 1px ${rgbaDeRgb(color, 0.03 + 0.1 * t)})`,
          }}
          transition={FUGAZ}
        >
          <motion.div
            className="size-full rounded-full"
            style={{ backgroundImage: relleno }}
            initial={false}
            animate={{ clipPath: `inset(0 0 ${100 - pct}% 0 round 999px)` }}
            transition={FUGAZ}
          />
        </motion.div>
        {/* El pulgar. `top` animado y el centrado en clase: mover `top` con el
            transform propio de motion pisaría el centrado. */}
        <motion.div
          aria-hidden
          className="absolute left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
          style={{ "--tw-ring-color": color } as React.CSSProperties}
          initial={false}
          animate={{
            top: `${pct}%`,
            backgroundColor: color,
            // El aura del pulgar del cafecito (auraPulgar): crece con la posición y
            // respira, y en lo más suave no hay ninguna.
            boxShadow: quieto
              ? `0 0 ${1 + 2 * t}px 0 ${rgbaDeRgb(color, 0.12 * t)}`
              : [1, 1.35, 1].map(
                  (k) =>
                    `0 0 ${((1 + 2 * t) * k).toFixed(1)}px 0 ${rgbaDeRgb(color, 0.12 * t * k)}`,
                ),
          }}
          transition={
            quieto
              ? FUGAZ
              : {
                  ...FUGAZ,
                  boxShadow: { duration: RESPIRO_S, repeat: Infinity, ease: "easeInOut" },
                }
          }
        />
        {/* Quien trae el teclado y el lector de pantalla. No recibe el puntero
            (lo maneja el riel): solo el foco y las flechas. */}
        <input
          ref={ref}
          type="range"
          min={0}
          max={max}
          step={1}
          value={valor}
          onChange={(e) => onCambio(Number(e.target.value))}
          onKeyDown={(e) => {
            // Arriba es más suave y abajo más exigente, como se dibuja. El range
            // nativo lo hace al revés en vertical.
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault()
              const v = Math.min(max, Math.max(0, valor + (e.key === "ArrowDown" ? 1 : -1)))
              if (v !== valor) onCambio(v)
            }
          }}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          {...props}
        />
      </div>
      <Flecha hacia="abajo" disabled={valor === max} onClick={() => onCambio(valor + 1)} />
    </div>
  )
}
