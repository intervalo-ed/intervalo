// La palanca de dificultad: las nueve posiciones que la persona puede elegir.
//
// Qué hace cada una en el servidor está en backend/game/dificultad.py: la
// posición fija el θ con el que el selector puntúa los ejercicios, sin tocar el
// θ real que mide el ranking. Este módulo es solo lo que se ve.
//
// Las fórmulas son abstractas a propósito: dicen QUÉ se practica en esa
// posición y no qué ejercicio va a salir. El catálogo cambia, la forma no.
//
// Sin React: el `check:dificultad` (packages/dx-core/scripts/check-dificultad.ts) lo prueba
// sin navegador.

import { levelColor } from "./game-colors"

export type PosicionDificultad = {
  /** La forma que se practica, en notación abstracta. */
  formula: string
  /** Una línea que dice qué es. */
  texto: string
  /** Nivel 0-3 (el color). Espejo de `dificultad.nivel_de_posicion`. */
  nivel: 0 | 1 | 2 | 3
}

export const POSICIONES: readonly PosicionDificultad[] = [
  { formula: "k·xⁿ", texto: "Constantes y potencias simples.", nivel: 0 },
  { formula: "xⁿ + c", texto: "Potencias, eˣ y ln(x).", nivel: 0 },
  { formula: "f(x) + g(x)", texto: "Sumas y las primeras trigonométricas.", nivel: 0 },
  { formula: "f(ax + b)", texto: "Funciones de algo lineal.", nivel: 1 },
  { formula: "x^(p/q)", texto: "Raíces, 1/x y las primeras multiplicaciones.", nivel: 1 },
  { formula: "f(x) · g(x)", texto: "Productos con trigonométricas, eˣ y ln.", nivel: 2 },
  { formula: "f(x) / g(x)", texto: "Cocientes y potencias de algo lineal.", nivel: 2 },
  { formula: "f(p(x))", texto: "La cadena con un polinomio adentro.", nivel: 2 },
  { formula: "f(g(h(x)))", texto: "Cadena anidada y cociente con cadena.", nivel: 3 },
]

export const POSICION_MAX = POSICIONES.length - 1

/** Dónde arranca el slider cuando la persona todavía no eligió ninguna. */
export const POSICION_DEFAULT = 4

export function posicionInicial(valor: number | null | undefined): number {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 0 && valor <= POSICION_MAX
    ? valor
    : POSICION_DEFAULT
}

export function colorDePosicion(posicion: number): string {
  return levelColor(POSICIONES[Math.min(Math.max(posicion, 0), POSICION_MAX)].nivel)
}

/** El texto de la fila de Configuración. */
export function textoDeDificultad(valor: number | null | undefined): string {
  return typeof valor === "number" && valor >= 0 && valor <= POSICION_MAX
    ? POSICIONES[valor].formula
    : "Automática"
}

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

/** Un `rgb(r, g, b)` de `mezclar` con transparencia. Si no lo reconoce, lo
 *  devuelve tal cual. */
export function rgbaDeRgb(color: string, a: number): string {
  const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(color)
  return m ? `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})` : color
}
