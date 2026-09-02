// Espejo de backend/game/router.py :: _aplicar_elo (líneas 854-856). A
// propósito NO recibe `peeked`: mirar la tabla bloquea el ajuste de Elo pero
// NO la racha ni el contador de intentos — mezclar esa condición acá sería
// repetir el bug que este archivo existe para evitar (la fórmula de XP sí usa
// `peeked`, pero para otra cosa: el bonus de racha, no el número que se
// muestra en la card).
export function comboTrasIntento({
  correct,
  comboAntes,
}: {
  correct: boolean
  comboAntes: number
}): number {
  return correct ? comboAntes + 1 : 0
}
