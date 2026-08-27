import type { CSSProperties } from "react"

// Papel cuadriculado de las superficies de marca: landing, /about, legales y el
// minijuego de derivadas. Estaba copiado idéntico en los cuatro lugares.
export const GRID_BG_STYLE: CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
}
