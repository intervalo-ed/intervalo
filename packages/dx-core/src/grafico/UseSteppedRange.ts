import { useRef } from "react"

// Histéresis: solo se cambia de paso cuando el rango pasa claramente el umbral
// de transición (±5%), para que el ruido de FP no lo haga oscilar justo en el
// valor límite.
export function useSteppedRange(naturalStep: number, range: number, density: number): number {
  const ref = useRef(naturalStep)
  if (naturalStep !== ref.current) {
    const goingUp = naturalStep > ref.current
    const threshold = goingUp ? density * ref.current * 1.05 : density * naturalStep * 0.95
    if (goingUp ? range > threshold : range < threshold) {
      ref.current = naturalStep
    }
  }
  return ref.current
}
