"use client"

// Prepara el veredicto local del ejercicio en pantalla y lo deja listo para
// cuando la persona toque Verificar.
//
// El trabajo caro —parsear el enunciado y derivarlo en los diez puntos de la
// grilla— se hace APENAS LLEGA el ejercicio, que es tiempo muerto: la persona
// todavía lo está leyendo. Cuando responde, lo único que queda por hacer son
// diez evaluaciones de punto flotante.
//
// La lógica está en local-verdict.ts; acá solo vive el ciclo de vida.

import { useCallback, useEffect, useRef } from "react"
import {
  muestrasEsperadas,
  veredictoLocal,
  type MuestrasEsperadas,
} from "./local-verdict"

/** Devuelve una función que juzga una respuesta ya parseada a MathJSON:
 *  `true`/`false` si se puede decidir con confianza, `null` si hay que esperar
 *  al servidor. */
export function useLocalVerdict(promptLatex: string | null) {
  const muestras = useRef<MuestrasEsperadas | null>(null)

  useEffect(() => {
    // Se limpia primero: si el ejercicio cambió y las muestras nuevas todavía no
    // están, hay que callarse, no juzgar con las del enunciado anterior.
    muestras.current = null
    if (promptLatex === null) return
    let vigente = true
    void muestrasEsperadas(promptLatex).then((listas) => {
      if (vigente) muestras.current = listas
    })
    return () => {
      vigente = false
    }
  }, [promptLatex])

  return useCallback(
    (respuesta: unknown) => veredictoLocal(muestras.current, respuesta),
    [],
  )
}
