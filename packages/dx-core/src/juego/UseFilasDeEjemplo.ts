import { useState } from "react"
import { EJEMPLOS_COUNT, filasDeEjemplo, type FilaRecluta } from "./reclutas"
import { sortearAliasDeEjemplo } from "./reclutas-ejemplos"

/** Las filas de ejemplo con los @ ya sorteados, estables mientras el panel siga
 *  montado.
 *
 *  El sorteo va en el inicializador perezoso de `useState` y NO en el cuerpo del
 *  componente: ahí correría en cada render y los nombres cambiarían solos
 *  mientras la lista está a la vista.
 *
 *  Y va en un estado y no en una constante de módulo por la hidratación: esta
 *  lista también la usa el ranking de Intervalo clásico, que sí se renderiza en
 *  el servidor, y un sorteo de módulo daría nombres distintos de los dos lados.
 *  Sorteando los CINCO siempre —y recortando después— la diapo de tres y el
 *  panel de cinco eligen del mismo pozo sin que el número cambie el sorteo. */
export function useFilasDeEjemplo(
  university: string | null = null,
  cuantas: number = EJEMPLOS_COUNT,
): FilaRecluta[] {
  const [alias] = useState(() => sortearAliasDeEjemplo(EJEMPLOS_COUNT))
  return filasDeEjemplo({ university, cuantas, alias })
}
