// La fila de ayudas del pie del ejercicio (Tabla y Saltear), sin dibujo. La
// dibujan web/src/app/derivadas/pie-rampa.tsx y
// mobile/components/juego/pie-rampa.tsx.

/** Cómo va la fila de ayudas.
 *
 *  · `visibles`: el ejercicio está abierto.
 *  · `reservadas`: se cerró, pero la fila CONSERVA SU LUGAR sin dibujarse (solo
 *    el teléfono, `ayudasFijas`): ahí el pie está apilado debajo del teclado, y
 *    al perder una fila todo lo de arriba se corría hacia abajo justo al
 *    responder. Dibujada se veía A TRAVÉS del cartel del resultado.
 *  · `ninguna`: se cerró, y saltear algo ya resuelto no existe. */
export type FilaDeAyudas = "visibles" | "reservadas" | "ninguna"

export function filaDeAyudas({
  cerradoVisual,
  ayudasFijas,
}: {
  cerradoVisual: boolean
  ayudasFijas: boolean
}): FilaDeAyudas {
  if (!cerradoVisual) return "visibles"
  return ayudasFijas ? "reservadas" : "ninguna"
}
