// Corrido entre las pestañas del resumen: la que entra viene desde la derecha
// y la que sale se va por la izquierda. Vive aparte de session-summary.tsx para
// que /dev/notify-pane pueda previsualizar la misma transición sin arrastrar
// todo el resumen.
export const slideVariants = {
  enter: { x: "100%", opacity: 1 },
  center: { x: "0%", opacity: 1 },
  exit: { x: "-100%", opacity: 1 },
}

export const SLIDE_TRANSITION = { duration: 0.28, ease: "easeInOut" } as const
