"use client"

// «¿Cada cuánto querés ver el ranking?», en la derivada 15 y una sola vez.
//
// Solo en el teléfono: en escritorio el ranking es la columna de al lado y no
// interrumpe nada, así que allá la pregunta no tiene objeto.
//
// La elección se guarda al tocarla, no al Continuar: la diapo es un aviso de que
// la preferencia existe, y quien la pasa de largo sin tocar nada se queda con lo
// de siempre. Cuándo sale y qué guarda está en ranking-frecuencia.ts.

import { useEffect } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Settings } from "lucide-react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"

import { Salida } from "./slide-salida"
import {
  FRECUENCIAS,
  saveFrecuenciaRanking,
  useFrecuenciaRanking,
  type FrecuenciaRanking,
} from "./ranking-frecuencia"

export function RankingFrecuenciaSlide({
  onContinue,
  slotSalida,
  fullBleed = false,
  className,
}: {
  onContinue: () => void
  slotSalida?: HTMLElement | null
  /** Gemelo del de opinion-slide.tsx: el teléfono pinta el fondo entero. */
  fullBleed?: boolean
  className?: string
}) {
  const sfx = useSfx()
  const reduce = useReducedMotion()
  const elegida = useFrecuenciaRanking()

  useEffect(() => {
    posthog.capture("game_ranking_frecuencia_shown")
  }, [])

  function elegir(valor: FrecuenciaRanking) {
    if (valor === elegida) return
    sfx.select()
    saveFrecuenciaRanking(valor)
    posthog.capture("game_ranking_frecuencia_chosen", { valor, via: "slide" })
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-center gap-6 p-6",
        !fullBleed && "rounded-lg border border-border bg-card",
        className,
      )}
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold">¿Cada cuánto querés ver el ranking?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Hoy aparece después de cada derivada. Elegí cómo seguir.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-xs flex-col gap-2">
        {FRECUENCIAS.map((o, i) => {
          const activa = elegida === o.valor
          return (
            <motion.button
              key={o.valor}
              type="button"
              onClick={() => elegir(o.valor)}
              aria-pressed={activa}
              initial={reduce ? false : { y: 8 }}
              animate={{ opacity: activa ? 1 : 0.6, y: 0 }}
              transition={{
                duration: reduce ? 0 : 0.22,
                delay: reduce ? 0 : 0.05 * i,
                ease: "easeOut",
              }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:border-chart-5 hover:bg-accent/40",
                activa && "border-chart-5 bg-accent/40",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "size-4 flex-none rounded-full border-[1.5px] border-muted-foreground",
                  activa && "border-chart-5 bg-chart-5 shadow-[inset_0_0_0_3px_var(--card)]",
                )}
              />
              <span className="font-medium">{o.texto}</span>
            </motion.button>
          )
        })}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        Podés cambiar esta preferencia cuando quieras desde Ajustes
        <Settings size={14} aria-label="Ajustes" className="flex-none" />
      </p>

      <Salida slot={slotSalida}>
        <button
          type="button"
          onClick={onContinue}
          className={cn(
            "flex w-full items-center justify-center rounded-md bg-white text-base font-semibold text-black transition-colors hover:bg-white/90",
            slotSalida ? "h-[var(--cta-h)]" : "mt-3 px-4 py-3",
          )}
        >
          Continuar
        </button>
      </Salida>
    </div>
  )
}
