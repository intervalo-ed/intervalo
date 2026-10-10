// La palanca de dificultad: las nueve posiciones que la persona puede elegir.
//
// Qué hace cada una en el servidor está en backend/game/dificultad.py: la
// posición fija el θ con el que el selector puntúa los ejercicios, sin tocar el
// θ real que mide el ranking. Este módulo es solo lo que se ve.
//
// Las fórmulas son abstractas a propósito: dicen QUÉ se practica en esa
// posición y no qué ejercicio va a salir. El catálogo cambia, la forma no.
//
// Sin React: el `check:dificultad` (web/scripts/check-dificultad.ts) lo prueba
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
