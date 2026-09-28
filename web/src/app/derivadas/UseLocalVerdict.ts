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
    // Sin carrera que cuidar desde que el parseo es sincrónico: las muestras del
    // enunciado nuevo se calculan acá mismo, así que no existe el momento en que
    // las viejas seguían puestas esperando a las nuevas. Antes eso pedía un
    // `vigente` y una limpieza previa.
    muestras.current = promptLatex === null ? null : muestrasEsperadas(promptLatex)
  }, [promptLatex])

  return useCallback(
    (respuesta: unknown) => veredictoLocal(muestras.current, respuesta),
    [],
  )
}
