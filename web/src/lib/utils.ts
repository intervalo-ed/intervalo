import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Centro de un elemento en % de viewport — la unidad en la que Confetti
// (session-summary) posiciona sus partículas. Compartido entre los dos
// festejos que explotan "desde" un control (racha y recordatorios).
export function centerInViewportPercent(
  el: Element | null | undefined,
): { x: number; y: number } | null {
  const r = el?.getBoundingClientRect()
  if (!r) return null
  return {
    x: ((r.left + r.width / 2) / window.innerWidth) * 100,
    y: ((r.top + r.height / 2) / window.innerHeight) * 100,
  }
}
