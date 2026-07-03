"use client"

import { useEffect, useRef, useState } from "react"

type CommonProps = {
  value: number
  duration?: number
  format?: (n: number) => string
  onDone?: () => void
}

// Variantes:
// - "slot": slot machine (cada dígito parpadea con valores random y se traba izq→der).
// - "ease": conteo numérico de 0 al valor con curva ease-out.
// - "odometer": tipo odómetro pero sin roll — cada dígito recorre 0→9 de forma
//   secuencial (no random) y se traba izq→der; el de la derecha gira más tiempo.
export function CountUp({
  variant = "slot",
  ...props
}: CommonProps & {
  variant?: "slot" | "ease" | "odometer" | "steps"
  flickerMs?: number
  steps?: number
  stepEase?: (x: number) => number
  onStep?: (step: number, total: number) => void
}) {
  if (variant === "ease") {
    return <CountUpEase {...props} />
  }
  if (variant === "odometer") {
    return <CountUpOdometer {...props} />
  }
  if (variant === "steps") {
    return <CountUpSteps {...props} />
  }
  return <CountUpSlot {...props} />
}

// Conteo en pocos saltos (máx. `steps`) repartidos en `duration`, frenando en
// seco en el valor final (sin desaceleración). `stepEase` permite repartir los
// saltos de forma no lineal (mapea fracción-de-pasos → fracción-de-duración; por
// defecto lineal); `onStep` se dispara en cada salto (para sincronizar audio).
function CountUpSteps({
  value,
  duration = 1000,
  format,
  onDone,
  steps: maxSteps = 4,
  stepEase,
  onStep,
}: CommonProps & {
  steps?: number
  stepEase?: (x: number) => number
  onStep?: (step: number, total: number) => void
}) {
  const [n, setN] = useState(0)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  // En refs para que un cambio de identidad de los callbacks/ease no re-dispare
  // el efecto (eso reiniciaría el conteo al re-renderizar).
  const onStepRef = useRef(onStep)
  onStepRef.current = onStep
  const stepEaseRef = useRef(stepEase)
  stepEaseRef.current = stepEase
  useEffect(() => {
    doneRef.current = false
    setN(0)
    const steps = Math.min(maxSteps, Math.max(1, Math.abs(Math.round(value))))
    const ease = stepEaseRef.current ?? ((x: number) => x)
    const timeAt = (k: number) => ease(k / steps) * duration
    const start = performance.now()
    let k = 0
    let timer: ReturnType<typeof setTimeout>
    const run = () => {
      k++
      if (k >= steps) {
        setN(value)
        onStepRef.current?.(k, steps)
        if (!doneRef.current) {
          doneRef.current = true
          onDoneRef.current?.()
        }
        return
      }
      setN(Math.round((value * k) / steps))
      onStepRef.current?.(k, steps)
      schedule()
    }
    const schedule = () => {
      const delay = Math.max(0, timeAt(k + 1) - (performance.now() - start))
      timer = setTimeout(run, delay)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [value, duration, maxSteps])
  return <>{format ? format(n) : n}</>
}

function CountUpOdometer({ value, duration = 1000, format }: CommonProps) {
  const finalStr = format ? format(value) : String(value)
  const [text, setText] = useState(finalStr)
  useEffect(() => {
    const chars = finalStr.split("")
    const digitIdx = chars
      .map((c, i) => (/\d/.test(c) ? i : -1))
      .filter((i) => i >= 0)
    const n = digitIdx.length
    if (n === 0) {
      setText(finalStr)
      return
    }
    const tickMs = 70
    const lockAt = digitIdx.map((_, k) => ((k + 1) / n) * duration) // izq→der
    const start = performance.now()
    const id = setInterval(() => {
      const elapsed = performance.now() - start
      const ticks = Math.floor(elapsed / tickMs)
      const out = chars.slice()
      let allLocked = true
      digitIdx.forEach((pos, k) => {
        if (elapsed >= lockAt[k]) {
          out[pos] = finalStr[pos]
        } else {
          out[pos] = String((ticks + k) % 10) // 0→9 secuencial (sin roll)
          allLocked = false
        }
      })
      setText(out.join(""))
      if (allLocked) {
        setText(finalStr)
        clearInterval(id)
      }
    }, tickMs)
    return () => clearInterval(id)
  }, [finalStr, duration])
  return <>{text}</>
}

function CountUpEase({ value, duration = 1000, format, onDone }: CommonProps) {
  const [n, setN] = useState(0)
  const doneRef = useRef(false)
  // Guardamos onDone en un ref para que un cambio de identidad del callback no
  // re-dispare el efecto (eso reiniciaba la animación al aparecer otra card).
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setN(Math.round(eased * value))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setN(value)
        if (!doneRef.current) {
          doneRef.current = true
          onDoneRef.current?.()
        }
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{format ? format(n) : n}</>
}

// Efecto "slot machine" sin roll: cada dígito parpadea cambiando a valores random
// y se traba de izquierda a derecha hasta el valor final (≈1s).
function CountUpSlot({
  value,
  duration = 1000,
  flickerMs = 60,
  format,
}: CommonProps & { flickerMs?: number }) {
  const finalStr = format ? format(value) : String(value)
  const [text, setText] = useState(finalStr)
  useEffect(() => {
    const chars = finalStr.split("")
    const digitIdx = chars
      .map((c, i) => (/\d/.test(c) ? i : -1))
      .filter((i) => i >= 0)
    const n = digitIdx.length
    if (n === 0) {
      setText(finalStr)
      return
    }
    const lockAt = digitIdx.map((_, k) => ((k + 1) / n) * duration) // izq→der
    const start = performance.now()
    const id = setInterval(() => {
      const elapsed = performance.now() - start
      const out = chars.slice()
      let allLocked = true
      digitIdx.forEach((pos, k) => {
        if (elapsed >= lockAt[k]) {
          out[pos] = finalStr[pos]
        } else {
          out[pos] = String(Math.floor(Math.random() * 10))
          allLocked = false
        }
      })
      setText(out.join(""))
      if (allLocked) {
        setText(finalStr)
        clearInterval(id)
      }
    }, flickerMs)
    return () => clearInterval(id)
  }, [finalStr, duration, flickerMs])
  return <>{text}</>
}
