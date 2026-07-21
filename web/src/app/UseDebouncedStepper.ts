"use client"

import { useEffect, useRef, useState } from "react"

// Envuelve un valor numérico editado por steppers: aplica el cambio a la UI al
// instante y recién pega al back tras `delayMs` de inactividad, para no
// disparar una mutation por click. `flush` fuerza el commit ya (usado al
// tocar "Listo" o al cerrar el modo editor).
export function useDebouncedStepper({
  serverValue,
  mutate,
  delayMs = 1500,
}: {
  serverValue: number
  mutate: (value: number) => void
  delayMs?: number
}) {
  const [value, setValueState] = useState(serverValue)
  const pendingRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Solo sincroniza desde el server si no hay un cambio local pendiente de
  // commitear (para no pisar lo que el usuario acaba de tocar).
  useEffect(() => {
    if (pendingRef.current === null) setValueState(serverValue)
  }, [serverValue])

  function commit(v: number) {
    pendingRef.current = null
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    mutate(v)
  }

  function setValue(v: number) {
    setValueState(v)
    pendingRef.current = v
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => commit(v), delayMs)
  }

  function flush() {
    if (pendingRef.current !== null) commit(pendingRef.current)
  }

  // Descarta un cambio pendiente sin commitearlo (ej. tras un reset de curso,
  // que ya deja el valor del server en su default y no debe pisarse).
  function cancel() {
    pendingRef.current = null
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return { value, setValue, flush, cancel }
}
