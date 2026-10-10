"use client"

// «Elegí con qué nivel querés practicar»: la palanca de dificultad.
//
// Se abre desde Configuración, en el teléfono y en escritorio. La elección se
// guarda al Continuar —no al mover el slider— porque cada paso movería el
// próximo ejercicio y la persona está mirando, todavía eligiendo. «<» vuelve sin
// guardar.
//
// Qué hace la posición en el servidor está en backend/game/dificultad.py.

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useIsPresent, motion, useReducedMotion } from "motion/react"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronLeft } from "lucide-react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import { Button } from "@/components/ui/button"
import { unwrap } from "@/lib/api/client"

import { KeyCap } from "./exercise-card"
import {
  POSICIONES,
  POSICION_MAX,
  colorDePosicion,
  posicionInicial,
} from "./dificultad"
import { SliderVertical, mezclar } from "./slider-vertical"
import { Salida } from "./slide-salida"
import { enCampoHtml, digitoDe, useTeclas } from "./teclas"
import { useGameApi } from "./UseGameApi"
import { gameKeys, type GamePlayer } from "./UseGamePlayer"

const ctaCls = "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// Lo que ocupa la fila elegida: la fórmula agrandada y dos renglones de texto.
const ALTO_ELEGIDA = 92

const COLORES = POSICIONES.map((_, i) => colorDePosicion(i))
// Los mismos tonos que pinta la barra, para que cada derivada lleve el color de
// su celda.
const TONOS = mezclar(COLORES)
const APAGADO = "#a4b3c6"

// La lista se desliza con la misma curva corta del slider: llega antes que el ojo.
const DESLIZ = { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } as const

export function DificultadSlide({
  player,
  onBack,
  onDone,
  slotSalida,
  keyboard = false,
  fullBleed = false,
  className,
}: {
  player: GamePlayer | null
  onBack: () => void
  onDone: () => void
  slotSalida?: HTMLElement | null
  keyboard?: boolean
  fullBleed?: boolean
  className?: string
}) {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const sfx = useSfx()
  const teclas = useTeclas()
  const reduce = useReducedMotion()
  const presente = useIsPresent()
  const [valor, setValor] = useState(() => posicionInicial(player?.dificultad))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sliderRef = useRef<HTMLInputElement | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)
  const [alto, setAlto] = useState(420)

  // El paso entre filas sale del alto que queda: en la ventana baja de
  // escritorio la lista se aprieta en vez de cortarse.
  useLayoutEffect(() => {
    const el = listaRef.current
    if (!el) return
    const medir = () => setAlto(el.clientHeight)
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Las nueve a la vista, siempre: el paso se reparte para que, con la elegida
  // donde le toca, entren las que quedan arriba y las que quedan abajo. Solo se
  // achica por debajo de lo legible, y ahí las de los extremos se cortan.
  const paso = Math.min(48, Math.max(24, (alto - ALTO_ELEGIDA - 6) / 8))

  useEffect(() => {
    posthog.capture("game_dificultad_shown")
  }, [])

  // Con el teclado, el slider toma el foco al entrar: ahí las flechas ya lo mueven.
  useEffect(() => {
    if (keyboard) sliderRef.current?.focus({ preventScroll: true })
  }, [keyboard])

  function cambiar(v: number) {
    if (v === valor) return
    sfx.select()
    setValor(v)
  }

  async function continuar(nuevo: number | null = valor) {
    if (guardando) return
    setGuardando(true)
    setError(null)
    try {
      unwrap(await api.PATCH("/game/derivemos/me", { body: { dificultad: nuevo } }))
      await queryClient.invalidateQueries({ queryKey: gameKeys.me })
      posthog.capture("game_dificultad_chosen", { valor: nuevo, via: "settings" })
      sfx.continue()
      onDone()
    } catch {
      setError("No se pudo guardar. Probá de nuevo.")
      setGuardando(false)
    }
  }
  const continuarRef = useRef(continuar)
  const valorRef = useRef(valor)
  useEffect(() => {
    continuarRef.current = continuar
    valorRef.current = valor
  })

  useEffect(() => {
    if (!keyboard || !presente) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return
      if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        // Alt+Enter es la segunda acción de la pantalla, como en las demás
        // diapos: acá, «Automático».
        void continuarRef.current(e.altKey ? null : valorRef.current)
        return
      }
      if (e.altKey) return
      if (enCampoHtml(e.target)) return
      const n = digitoDe(e)
      if (n === null) return
      e.preventDefault()
      e.stopPropagation()
      setValor((v) => {
        if (v !== n - 1) sfx.select()
        return n - 1
      })
    }
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [keyboard, presente, sfx])

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        !fullBleed && "rounded-lg border border-border bg-card p-5",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Volver"
        onClick={() => {
          sfx.select()
          onBack()
        }}
        className="-ml-1 w-fit shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <ChevronLeft size={24} />
      </button>

      <p className="mt-12 text-center text-base font-semibold leading-snug text-foreground">
        Elegí con qué nivel querés practicar.
      </p>

      <div className="relative mx-auto my-auto flex max-h-[22rem] min-h-0 w-full max-w-[17.5rem] flex-1 pt-3">
        {/* La lista mide lo mismo que la columna del slider: la primera derivada
            arranca a la altura de la flecha de arriba y la última termina a la de
            la flecha de abajo. */}
        <div ref={listaRef} className="relative min-w-0 flex-1 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0">
            {POSICIONES.map((p, i) => {
              const d = i - valor
              const ad = Math.abs(d)
              const sel = d === 0
              // La elegida se lleva SU lugar —la fórmula grande y la línea de
              // texto— y las de abajo arrancan después de ese bloque: apilar
              // por paso las dejaba pisándose. Y ese lugar SIGUE al slider: la
              // primera pegada al tope, la última pegada al fondo, y las del
              // medio proporcionalmente. Centrarla dejaba un hueco vacío arriba
              // o abajo en los extremos.
              const y0 = (valor / POSICION_MAX) * Math.max(0, alto - ALTO_ELEGIDA)
              const y = sel
                ? y0
                : d < 0
                  ? y0 + d * paso
                  : y0 + ALTO_ELEGIDA + 6 + (d - 1) * paso
              return (
                <motion.button
                  key={p.formula}
                  type="button"
                  onClick={() => cambiar(i)}
                  tabIndex={-1}
                  aria-label={`${p.formula}. ${p.texto}`}
                  className="absolute inset-x-0 top-0 origin-left text-left"
                  initial={false}
                  animate={{ y, opacity: sel ? 1 : Math.max(0.38, 0.85 - ad * 0.1) }}
                  transition={reduce ? { duration: 0 } : DESLIZ}
                >
                  <motion.span
                    className="block origin-left whitespace-nowrap font-mono text-[17px] font-semibold leading-tight"
                    initial={false}
                    // Las que la barra ya recorrió (hasta la elegida) llevan el
                    // color de su celda; las de más abajo siguen apagadas. El
                    // resplandor de la elegida crece con lo que se llenó la barra,
                    // como el de la barra misma.
                    animate={{
                      scale: sel ? 1.6 : 1,
                      color: i <= valor ? TONOS[i] : APAGADO,
                      textShadow: sel
                        ? `0 0 2px ${TONOS[i].replace("rgb", "rgba").replace(")", `, ${(0.04 + 0.08 * (valor / POSICION_MAX)).toFixed(2)})`)}`
                        : "0 0 0px rgba(0, 0, 0, 0)",
                    }}
                    transition={reduce ? { duration: 0 } : DESLIZ}
                  >
                    {p.formula}
                  </motion.span>
                  <motion.span
                    className="mt-3 block max-w-[20ch] overflow-hidden text-sm font-medium leading-snug text-foreground"
                    initial={false}
                    animate={{ opacity: sel ? 1 : 0, height: sel ? "auto" : 0 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
                  >
                    {p.texto}
                  </motion.span>
                </motion.button>
              )
            })}
          </div>
        </div>
        <SliderVertical
          ref={sliderRef}
          valor={valor}
          max={POSICION_MAX}
          colores={COLORES}
          onCambio={cambiar}
          aria-label="Dificultad"
          className="ml-2 shrink-0"
        />
      </div>

      {error && <p className="mt-3 text-center text-sm text-orange-300">{error}</p>}

      <Salida slot={slotSalida}>
        {/* Dos botones partidos: «Automático» devuelve el control al motor y
            «Continuar» guarda la posición elegida. */}
        <div className={cn("flex w-full gap-2", !slotSalida && "mt-3")}>
          <Button
            size="lg"
            variant="outline"
            className="h-[var(--cta-h)] min-w-0 flex-1 rounded-md"
            disabled={guardando}
            onClick={() => void continuar(null)}
          >
            Automático
            {keyboard && <KeyCap>{teclas.altEnter}</KeyCap>}
          </Button>
          <Button
            size="lg"
            className={cn(ctaCls, "min-w-0 flex-1")}
            disabled={guardando}
            onClick={() => void continuar(valor)}
          >
            Continuar
            {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
          </Button>
        </div>
      </Salida>
    </div>
  )
}
