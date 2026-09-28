// Chequeo de las dos cuentas que el ranking hace sobre su propia ventana.
//
// Corre con: bun run check:ventana
//
// Existe por una regresión concreta, reportada jugando y medida en producción el
// 2026-09-28 con un invitado nuevo en escritorio: al terminar la animación de la
// primera derivada la lista se iba al final y la fila propia quedaba arriba de la
// vista, sin volver.
//
// La causa era que la lista tiene DOS formas de cambiar y el código usaba una
// sola señal —que bajara el puesto de la primera fila— para distinguirlas:
//
//   · un bache por arriba (`fetchPreviousPage`): las filas que ya estaban siguen
//     todas, corridas hacia abajo;
//   · una ventana nueva (`around_me` después de cambiar de puesto): no comparte
//     ninguna fila con la anterior.
//
// Las dos bajan el puesto de la primera fila. Así que el testigo de la regresión
// —la fórmula vieja, calculada acá abajo— queda fijado: sobre la ventana de un
// jugador nuevo daba +781 px, o sea el final de la lista.

import {
  corrimientoDelBache,
  filaALaVista,
  type FilaMedida,
} from "../src/app/derivadas/ventana-ranking"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

// Espejo de la geometría real de la lista, medida en el navegador: 52 px de tapa
// a tapa de la fila siguiente y 4 px de `py-1` arriba.
const ALTO = 52
const PAD = 4
const filas = (ids: readonly number[]): FilaMedida[] =>
  ids.map((id, i) => ({ id, y: PAD + i * ALTO }))

// La fórmula vieja, para que el bug no pueda volver en silencio: le sumaba al
// scroll lo que la lista creció de alto.
const formulaVieja = (antes: number, ahora: number) => (ahora - antes) * ALTO

console.log("\nel caso que se rompió: la primera derivada de un jugador nuevo")
// Al entrar, la persona está ÚLTIMA: `around_me` pide 31 filas y el final del
// ranking solo tiene 16. Al acertar pasa al puesto 1563 de 1607, así que la
// ventana pasa a estar centrada y trae las 31.
const alFondo = filas([1590, 1591, 1592, 1593, 1594, 1595, 1596, 1597, 1598, 1599,
                       1600, 1601, 1602, 1603, 1604, 1605])
const centrada = filas(Array.from({ length: 31 }, (_, i) => 1548 + i))
check(
  corrimientoDelBache(alFondo[0], centrada) === 0,
  "una ventana que no comparte ninguna fila no corrige el scroll",
)
// 780 acá y 781 en el navegador: las filas miden 44,x px de verdad y el
// redondeo pone ese píxel. La diferencia no importa —el clamp al final de la
// lista se come cualquiera de los dos— y lo que el testigo fija es el orden de
// magnitud: quince filas de alto sumadas a un scroll que estaba en 275.
check(
  formulaVieja(alFondo.length, centrada.length) === 15 * ALTO,
  `y la fórmula vieja le sumaba ${formulaVieja(alFondo.length, centrada.length)} px (781 medidos): el final de la lista`,
)

console.log("\nel bache por arriba, que es para lo que la corrección existe")
const ventana = filas([100, 101, 102, 103, 104])
// `fetchPreviousPage` mete 30 filas antes: las que estaban siguen todas.
const conBache = filas([...Array.from({ length: 30 }, (_, i) => 70 + i), 100, 101, 102, 103, 104])
check(
  corrimientoDelBache(ventana[0], conBache) === 30 * ALTO,
  `un bache de 30 filas corrige ${30 * ALTO} px, que es lo que se corrió el ancla`,
)
check(
  corrimientoDelBache(ventana[0], conBache) ===
    formulaVieja(ventana.length, conBache.length),
  "en este caso la cuenta nueva y la vieja coinciden: es el caso que la vieja acertaba",
)

console.log("\nlos casos de en medio")
check(corrimientoDelBache(null, centrada) === 0, "sin ancla no se corrige nada")
check(
  corrimientoDelBache(ventana[0], ventana) === 0,
  "la misma lista dos veces no corrige nada",
)
// Una ventana nueva PUEDE solaparse con la anterior: la persona subió pocos
// puestos. Ahí el ancla sigue estando y lo que corresponde es lo que se corrió
// ella, que no tiene por qué ser el alto que creció la lista.
// Cinco filas otra vez, dos más arriba y dos menos abajo: el ancla se corrió
// pero la lista NO cambió de alto, así que la fórmula vieja no corregía nada.
const solapada = filas([98, 99, 100, 101, 102])
check(
  corrimientoDelBache(ventana[0], solapada) === 2 * ALTO,
  "una ventana solapada se corrige por lo que se corrió el ancla (2 filas)",
)
check(
  formulaVieja(ventana.length, solapada.length) === 0,
  "y ahí la vieja no corregía nada, porque medía el alto y no el corrimiento",
)
// El otro lado: la ventana se fue hacia ABAJO (te pasaron), el ancla sigue pero
// ahora está más arriba. Corrige negativo, que es lo correcto.
const masAbajo = filas([102, 103, 104, 105, 106])
check(
  corrimientoDelBache(ventana[2], masAbajo) === -2 * ALTO,
  "si el ancla quedó más arriba, la corrección es negativa",
)

console.log("\nsi la fila propia se está viendo")
// La ventana real medida: 558 px de alto, filas de 44 px.
const V = { scroll: 573, alto: 558 }
check(filaALaVista({ y: 785, alto: 44 }, V), "la fila en su posición de descanso se ve")
check(
  !filaALaVista({ y: 785, alto: 44 }, { scroll: 1056, alto: 558 }),
  "con el scroll al final del todo, la misma fila NO se ve (el bug, tal cual se midió)",
)
check(
  !filaALaVista({ y: 100, alto: 44 }, V),
  "una fila por encima del techo de la ventana no se ve",
)
check(
  !filaALaVista({ y: 5000, alto: 44 }, V),
  "ni una muy por debajo del piso",
)
// Los bordes, que son donde una comparación mal puesta se esconde.
check(
  filaALaVista({ y: V.scroll - 43, alto: 44 }, V),
  "asomando un píxel por el techo, se ve",
)
check(
  !filaALaVista({ y: V.scroll - 44, alto: 44 }, V),
  "pegada al techo pero entera afuera, no",
)
check(
  filaALaVista({ y: V.scroll + V.alto - 1, alto: 44 }, V),
  "asomando un píxel por el piso, se ve",
)
check(
  !filaALaVista({ y: V.scroll + V.alto, alto: 44 }, V),
  "apenas debajo del piso, no",
)

console.log(fallos === 0 ? "\nTodo bien.\n" : `\n${fallos} fallo(s).\n`)
process.exit(fallos === 0 ? 0 : 1)
