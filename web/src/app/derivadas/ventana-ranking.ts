// Las dos cuentas que el ranking hace sobre su propia ventana: cuánto se corrió
// la lista bajo el cursor, y si la fila propia se está viendo.
//
// Viven acá y no adentro del componente por el mismo motivo que `salto-ranking.ts`:
// son lo único de todo el manejo de scroll que se puede comprobar sin un
// navegador, y las dos decidieron mal en producción. Ver `web/scripts/check-ventana.ts`.
//
// ## Qué se rompió
//
// La lista del ranking individual es infinita por baches (`fetchPreviousPage`) Y
// además se REEMPLAZA entera cada vez que la persona cambia de puesto, porque la
// primera página se pide con `around_me` y esa ventana se mueve con ella. Son dos
// cosas distintas y el código las confundía:
//
//   · un bache por arriba deja todas las filas que ya estaban, corridas hacia
//     abajo, así que hay que sumarle al scroll lo que crecieron o el contenido
//     salta bajo el cursor;
//   · una ventana nueva no comparte filas con la anterior. No hay nada que
//     compensar: el scroll viejo no apunta a ninguna de las filas que hay ahora.
//
// La señal que se usaba para distinguirlas era el PUESTO de la primera fila: si
// bajaba, se sumaba la diferencia de alto de la lista. Las dos cosas bajan el
// puesto de la primera fila. Y el caso donde la diferencia de alto es enorme es
// justo el que le toca a TODOS los jugadores nuevos: la primera derivada los
// saca del fondo del ranking, así que la ventana pasa de las 16 filas que caben
// abajo del todo a las 31 de una ventana centrada. Medido en producción el
// 2026-09-28 con un invitado nuevo: `scrollTop` 275 → 1836, acotado a 1056, o
// sea el final de la lista, con la fila propia 271 px ARRIBA de la vista.

/** Una fila, para las dos cuentas de acá: quién es y a qué altura está dentro
 *  de la lista (`offsetTop`, que no depende del scroll). */
export type FilaMedida = { id: number; y: number }

/** Cuánto hay que corregirle al scroll después de que la lista cambió.
 *
 * `ancla` es la primera fila del commit anterior, medida en ese momento. Si
 * sigue estando, se compensa por lo que se corrió DE VERDAD —que es lo que un
 * bache por arriba produce—; si no está, la ventana es otra y no hay nada que
 * compensar.
 *
 * Que el ancla tenga que seguir existiendo es todo el arreglo: es lo que separa
 * «creció hacia atrás» de «es otra lista», que por el alto no se distinguen. */
export function corrimientoDelBache(
  ancla: FilaMedida | null,
  filas: readonly FilaMedida[],
): number {
  if (ancla === null) return 0
  const ahora = filas.find((f) => f.id === ancla.id)
  return ahora === undefined ? 0 : ahora.y - ancla.y
}

/** ¿Se ve, aunque sea un pedazo, la fila propia?
 *
 * Decide si recentrar es un acomodo cosmético o una corrección, y de eso depende
 * si el viaje puede ser suave. `behavior: "smooth"` lo maneja el navegador con
 * fotogramas, y sin fotogramas —la ventana tapada por otra, la pestaña en
 * segundo plano, `prefers-reduced-motion`— no se mueve nada y el pedido se
 * descarta en silencio: medido, el scroll se quedó donde estaba varios minutos
 * con la fila propia fuera de la vista. Una corrección no se puede perder, y
 * además animar un viaje que la persona no puede ver no le muestra nada: lo
 * único que hace es demorar que la fila aparezca. */
export function filaALaVista(
  fila: { y: number; alto: number },
  ventana: { scroll: number; alto: number },
): boolean {
  return (
    fila.y + fila.alto > ventana.scroll && fila.y < ventana.scroll + ventana.alto
  )
}
