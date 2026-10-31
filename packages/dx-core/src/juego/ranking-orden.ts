// El orden del ranking del juego, sin React ni DOM: la memoria del teléfono
// entre diapos y la aritmética del reacomodo de a un cruce (ver
// `UseStagedOrder.ts`). Vivía en web/src/app/derivadas/game-ranking.tsx.

/** Lo que el ranking del teléfono se acuerda entre una diapo y otra.
 *
 *  Vive en `MobileFlow` y no adentro del ranking, y ese es todo el punto: en el teléfono
 *  el ranking SE REMONTA con cada navegación —`goTo` cambia `slideSeq`, que es la
 *  key del `AnimatePresence`— así que irse al chat y volver construye un ranking
 *  nuevo, con el scroll en cero y sin memoria de nada. Un ref adentro del
 *  componente no puede acordarse de nada que sobreviva a eso, que es por lo que
 *  el arreglo anterior (PR #353) se quedaba corto.
 *
 *  Se reinicia UNA vez por derivada, en el `goTo({ kind: "ranking" })` de
 *  `advanceAfterAnswer`. O sea: el ranking se centra al entrar después de tocar
 *  Continuar, y de ahí en más la lista es de la persona hasta la derivada
 *  siguiente.
 *
 *  Escritorio no la usa: ahí el ranking es la cara de un `FlipCard` que nunca se
 *  desmonta, así que sus refs ya duran lo que tienen que durar. */
export type MemoriaDelRanking = {
  // Movió la lista con la mano. Apaga TODO recentrado automático.
  mano: boolean
  // Dónde la dejó, para devolvérsela igual al volver.
  top: number
}

/** Una memoria en blanco: la de la derivada que recién empieza. */
export function memoriaEnBlanco(): MemoriaDelRanking {
  return { mano: false, top: 0 }
}

/** ¿Las dos listas ya dicen lo mismo, en el mismo orden? Lineal, para poder
 *  descartar el caso normal antes de gastar nada. */
export function mismoOrden(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/** La secuencia de intercambios ENTRE VECINOS que lleva de un orden al otro.
 *
 * Es un bubble sort contra la posición de destino: cada paso devuelve el índice
 * `i` donde hay que cruzar `i` con `i+1`. Se eligió así y no "sacar y meter"
 * porque un cruce entre vecinos es exactamente lo que se lee como "este pasó a
 * aquel" — que es lo que el ranking tiene para contar. */
export function swapsToReach(current: readonly number[], target: readonly number[]): number[] {
  const pos = new Map(target.map((id, i) => [id, i]))
  const arr = [...current]
  const out: number[] = []
  for (let end = arr.length - 1; end > 0; end--) {
    let moved = false
    for (let i = 0; i < end; i++) {
      if ((pos.get(arr[i]) ?? 0) > (pos.get(arr[i + 1]) ?? 0)) {
        const t = arr[i]
        arr[i] = arr[i + 1]
        arr[i + 1] = t
        out.push(i)
        moved = true
      }
    }
    if (!moved) break
  }
  return out
}
