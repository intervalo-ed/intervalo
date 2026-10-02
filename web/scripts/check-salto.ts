// Chequeo de la aritmética del salto del ranking.
//
// Corre con: bun run check:salto
//
// Existe por una regresión concreta. La animación anterior subía la fila de a un
// puesto por vez y prometía un tope de 1600 ms en una constante llamada
// `CLIMB_TOTAL_MS`, pero el piso de 140 ms por paso lo rompía: treinta puestos
// duraban 4200 ms. La promesa estaba escrita en el nombre de la constante y en
// un comentario, que es exactamente donde una promesa no se verifica sola.
//
// Así que ahora el tope es una afirmación con prueba, y el testigo de la
// regresión —la fórmula vieja, calculada acá abajo— está fijado para que el bug
// no pueda volver en silencio.

import {
  ABRIR_MS,
  ALTO_FILA_PX,
  CERRAR_MS,
  FILAS_TOPE,
  RAMPA,
  SALTO_MS_MAX,
  SALTO_MS_MIN,
  V_TOPE_PX_S,
  curvaDelSalto,
  duracionDelSalto,
  LENTITUD_MOVIL,
  RAMPA_MOVIL,
  RITMO,
  RITMO_MOVIL,
  curvaConRampa,
  filasConLugar,
  filasDelSalto,
  rampaMovil,
  duracionTotalDelSalto,
  tramosDelSalto,
  velocidadDelSalto,
} from "../src/app/derivadas/salto-ranking"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

console.log("\nel tope de tres segundos")
// La afirmación central del cambio, sobre todo el rango que puede llegar: el
// ranking tiene miles de cuentas y una cuenta nueva puede saltar cientos.
const largos = Array.from({ length: 10_000 }, (_, i) => i + 1)
const peor = Math.max(...largos.map((d) => duracionDelSalto(d)))
check(peor <= SALTO_MS_MAX, `ningún salto pasa de ${SALTO_MS_MAX} ms (el peor dio ${peor})`)
check(duracionDelSalto(1e6) <= SALTO_MS_MAX, "ni uno absurdo de un millón de puestos")

// El testigo: la fórmula de antes, para que quede escrito qué se rompió.
const vieja = (d: number) => Math.max(140, Math.min(220, Math.round(1600 / d))) * d
check(vieja(30) === 4200, `la fórmula vieja daba ${vieja(30)} ms en 30 puestos`)
const primerRoto = largos.find((d) => vieja(d) > SALTO_MS_MAX)
check(primerRoto === 22, `y se pasaba de los 3 s a partir de ${primerRoto} puestos`)

console.log("\nla duración")
check(duracionDelSalto(0) === 0, "bajar no es saltar: distancia 0 → 0 ms")
check(duracionDelSalto(-7) === 0, "una distancia negativa tampoco (motion no acepta duración negativa)")
check(duracionDelSalto(NaN) === 0, "ni un NaN")
check(duracionDelSalto(1) === SALTO_MS_MIN, `un puesto solo dura el piso (${duracionDelSalto(1)} ms)`)
const creciente = largos.slice(1).every((d) => duracionDelSalto(d) >= duracionDelSalto(d - 1))
check(creciente, "no decreciente: más puestos nunca duran menos")
check(
  duracionDelSalto(FILAS_TOPE + 1) === duracionDelSalto(FILAS_TOPE) &&
    duracionDelSalto(FILAS_TOPE + 1000) === duracionDelSalto(FILAS_TOPE),
  `satura en FILAS_TOPE=${FILAS_TOPE} (${duracionDelSalto(FILAS_TOPE)} ms)`,
)

console.log("\nla ventana cargada")
// La lista es infinita por baches: el puesto del que venís puede no estar
// cargado, y entonces el viaje real es más corto que la distancia nominal.
check(
  duracionDelSalto(40, 12) === duracionDelSalto(12),
  "venir de 40 con 12 filas cargadas dura lo que dura un salto de 12",
)
check(duracionDelSalto(5, 40) === duracionDelSalto(5), "tener filas de sobra no cambia nada")
check(duracionDelSalto(30, 0) === 0, "sin filas debajo no hay salto")
const invariante = largos
  .slice(0, 200)
  .every((d) => [0, 3, 12, 41, 90].every((disp) => filasDelSalto(d, disp) <= Math.min(disp, FILAS_TOPE)))
check(invariante, "filasDelSalto nunca pasa ni las disponibles ni FILAS_TOPE")

console.log("\nla curva")
check(curvaDelSalto(0) === 0 && curvaDelSalto(1) === 1, "va de 0 a 1")
check(curvaDelSalto(-1) === 0 && curvaDelSalto(2) === 1, "y fuera de rango se acota")
check(Math.abs(curvaDelSalto(0.5) - 0.5) < 1e-12, "simétrica: a mitad de tiempo, mitad de camino")

const N = 1000
const muestras = Array.from({ length: N + 1 }, (_, i) => curvaDelSalto(i / N))
check(
  muestras.every((v, i) => i === 0 || v > muestras[i - 1]),
  "estrictamente creciente: la fila nunca retrocede",
)
check(
  muestras.every((v) => v >= 0 && v <= 1),
  "acotada en [0,1]: sin sobrepaso (un resorte se pasaba, y sobre 2000 px eso son 60 px de ida y vuelta)",
)
// Las dos rodillas del trapecio: donde termina de acelerar y donde empieza a
// frenar. Un salto ahí se vería como un tirón.
for (const t of [RAMPA, 1 - RAMPA]) {
  const salto = Math.abs(curvaDelSalto(t + 1e-9) - curvaDelSalto(t - 1e-9))
  check(salto < 1e-8, `continua en la rodilla t=${t} (salto ${salto.toExponential(1)})`)
}
const h = 1e-3
check(curvaDelSalto(h) / h < 0.05, "arranca quieta: «acelera» dicho con números")
check((1 - curvaDelSalto(1 - h)) / h < 0.05, "y termina quieta: «desacelera» también")

console.log("\nla curva y la duración dicen lo mismo")
// Lo que ata los dos archivos. La fórmula de la duración supone que el pico de
// velocidad es 1/(1-RAMPA) veces la media; si alguien cambia la curva sin tocar
// la fórmula, el tope de px/s deja de ser cierto y en pantalla no se nota.
const pico = Math.max(...muestras.slice(1).map((v, i) => (v - muestras[i]) * N))
check(
  Math.abs(pico - 1 / (1 - RAMPA)) < 1e-3,
  `el pico de velocidad es 1/(1-RAMPA)=${(1 / (1 - RAMPA)).toFixed(3)} (midió ${pico.toFixed(3)})`,
)
const rapido = Math.max(...largos.map((d) => velocidadDelSalto(d)))
check(
  rapido <= V_TOPE_PX_S,
  `ningún salto pasa de ${V_TOPE_PX_S} px/s (el más rápido dio ${rapido.toFixed(1)})`,
)
check(
  FILAS_TOPE === Math.floor(((1 - RAMPA) * V_TOPE_PX_S * SALTO_MS_MAX) / (1000 * ALTO_FILA_PX)),
  `FILAS_TOPE sale de los otros topes, no está elegido a mano (${FILAS_TOPE})`,
)

console.log("\nla tabla, para leerla de un vistazo")
for (const d of [1, 3, 10, 20, 30, FILAS_TOPE, FILAS_TOPE + 50]) {
  console.log(
    `  ${String(d).padStart(3)} puestos → ${String(duracionDelSalto(d)).padStart(4)} ms` +
      ` · ${velocidadDelSalto(d).toFixed(0).padStart(3)} px/s`,
  )
}

console.log("\nlos tres tiempos del salto")
// El salto dejó de ser un solo movimiento: la lista abre el lugar, la fila
// viaja, y recién cuando llegó se cierra el hueco de atrás. Que los tres existan
// y estén en ese orden es lo que hace que se entienda qué pasó; antes pasaban a
// la vez y lo que se veía era la lista entera moviéndose.
for (const d of [1, 5, 15, 40, 400]) {
  const t = tramosDelSalto(d)
  check(
    t.abrir === ABRIR_MS && t.cerrar === CERRAR_MS && t.viaje === duracionDelSalto(d),
    `${d} puestos: abre ${t.abrir} ms, viaja ${t.viaje} ms, cierra ${t.cerrar} ms`,
  )
  check(
    t.abrir > 0 && t.viaje > 0 && t.cerrar > 0,
    `  y los tres tramos duran algo (un tramo en cero es un tramo que no se ve)`,
  )
  check(
    duracionTotalDelSalto(d) === t.abrir + t.viaje + t.cerrar,
    `  el total es la suma de los tres`,
  )
}
// Sin salto no hay nada que abrir ni que cerrar: una fila que no se mueve no
// puede pedirle a la lista que le haga lugar.
const quieta = tramosDelSalto(0)
check(
  quieta.abrir === 0 && quieta.viaje === 0 && quieta.cerrar === 0,
  "sin salto, los tres tramos en cero",
)
check(
  tramosDelSalto(10, 0).viaje === 0 && tramosDelSalto(10, 0).abrir === 0,
  "y tampoco cuando no hay filas cargadas por debajo para viajar",
)
// El tope de tres segundos era del VIAJE y sigue siéndolo; abrir y cerrar se
// suman aparte y son cortos a propósito.
check(
  duracionTotalDelSalto(1e6) <= SALTO_MS_MAX + ABRIR_MS + CERRAR_MS,
  `el salto más largo posible dura ${duracionTotalDelSalto(1e6)} ms de punta a punta, ` +
    `y el techo son ${SALTO_MS_MAX + ABRIR_MS + CERRAR_MS}`,
)

console.log("\nel viaje se acorta cuando el puesto de origen no entra en la pantalla")
// Reportado jugando el 2026-09-30: la tarjeta aparecía de golpe pegada al borde
// de abajo del ranking antes de escalar. El puesto de origen caía al final de lo
// cargado, sin lista debajo para dejar la fila donde la persona la estaba
// mirando, y el scroll se mandaba al fondo igual.
{
  // Los números del caso medido: ventana de 31 filas, fila propia centrada a
  // 212 px del techo, viaje pedido de 15 filas → el origen es la última fila.
  const TOPE = 1172
  const DESEADO = 1564 - 212
  check(
    filasConLugar(15, DESEADO, TOPE) === 11,
    `15 filas no entran (faltan ${DESEADO - TOPE} px de lista): viaja ${filasConLugar(15, DESEADO, TOPE)}`,
  )
  const corto = filasConLugar(15, DESEADO, TOPE)
  check(
    DESEADO - (15 - corto) * ALTO_FILA_PX <= TOPE,
    "  y con ese viaje el origen SÍ entra",
  )
  check(
    DESEADO - (15 - corto - 1) * ALTO_FILA_PX > TOPE,
    "  y no se acortó de más: con una fila más ya no entraba",
  )
  check(filasConLugar(9, 1041, TOPE) === 9, "si entra, el viaje no se toca")
  check(filasConLugar(9, TOPE + 1, TOPE) === 9, "un píxel de redondeo no acorta nada")
  // Quien llega último está pegado al pie: el origen es la última fila de la
  // lista y el scroll que la deja ahí es exactamente el tope.
  check(filasConLugar(15, TOPE, TOPE) === 15, "pegado al pie, el viaje entero entra")
  check(
    filasConLugar(3, TOPE + 10_000, TOPE) === 1,
    "y nunca baja de una fila: un salto que no se mueve no es un salto",
  )
}

console.log("\nel ritmo del teléfono: más lento y más blando, con los mismos topes")
// Pedido mirándolo el 2026-10-02: en el teléfono la apertura y la subida se
// sentían bruscas. Lo que se fija acá es que «más lento y más blando» no rompa
// ninguna de las dos promesas del archivo: tres segundos y 900 px/s.
{
  const todas = Array.from({ length: FILAS_TOPE }, (_, i) => i + 1)
  check(
    RITMO.abrir === ABRIR_MS &&
      RITMO.cerrar === CERRAR_MS &&
      todas.every((f) => RITMO.viaje(f) === duracionDelSalto(f)) &&
      todas.every((f) => RITMO.curvaDelViaje(f) === curvaDelSalto) &&
      RITMO.curvaDelLugar === curvaDelSalto,
    "el de escritorio es exactamente el de siempre",
  )
  check(
    [0, 0.1, 0.2, 0.37, 0.5, 0.8, 0.93, 1].every(
      (t) => curvaConRampa(t, RAMPA) === curvaDelSalto(t),
    ),
    "y `curvaConRampa` con la rampa de siempre es la curva de siempre",
  )
  check(
    RITMO_MOVIL.abrir > RITMO.abrir && RITMO_MOVIL.cerrar > RITMO.cerrar,
    `abre en ${RITMO_MOVIL.abrir} ms y cierra en ${RITMO_MOVIL.cerrar} (escritorio: ${RITMO.abrir} y ${RITMO.cerrar})`,
  )
  check(
    todas.every((f) => RITMO_MOVIL.viaje(f) >= RITMO.viaje(f)),
    "ningún viaje dura menos que en escritorio",
  )
  check(
    RITMO_MOVIL.viaje(1) === Math.ceil(SALTO_MS_MIN * LENTITUD_MOVIL),
    `un puesto solo dura ${RITMO_MOVIL.viaje(1)} ms (escritorio: ${RITMO.viaje(1)})`,
  )
  check(
    todas.every((f) => RITMO_MOVIL.viaje(f) <= SALTO_MS_MAX),
    `y ninguno pasa de ${SALTO_MS_MAX} ms: el tope es el mismo`,
  )
  check(
    todas.slice(1).every((f) => RITMO_MOVIL.viaje(f) >= RITMO_MOVIL.viaje(f - 1)),
    "no decreciente: más filas nunca duran menos",
  )
  check(RITMO_MOVIL.viaje(0) === 0, "sin filas no hay viaje");
  check(
    todas.every((f) => rampaMovil(f) >= RAMPA && rampaMovil(f) <= RAMPA_MOVIL),
    `la rampa queda entre la de siempre (${RAMPA}) y la del teléfono (${RAMPA_MOVIL})`,
  )
  check(
    rampaMovil(1) === RAMPA_MOVIL && rampaMovil(FILAS_TOPE) < RAMPA_MOVIL,
    `un viaje corto toma toda la rampa (${rampaMovil(1)}); uno largo no le sobra tiempo (${rampaMovil(FILAS_TOPE)})`,
  )
  // El pico de velocidad, medido sobre la curva de verdad y no deducido.
  const picoPxS = (f: number) => {
    const c = RITMO_MOVIL.curvaDelViaje(f)
    const M = 2000
    let pico = 0
    for (let i = 1; i <= M; i++) pico = Math.max(pico, (c(i / M) - c((i - 1) / M)) * M)
    return (pico * f * ALTO_FILA_PX * 1000) / RITMO_MOVIL.viaje(f)
  }
  const masRapido = Math.max(...todas.map(picoPxS))
  check(
    masRapido <= V_TOPE_PX_S + 0.5,
    `ningún viaje del teléfono pasa de ${V_TOPE_PX_S} px/s (el más rápido midió ${masRapido.toFixed(1)})`,
  )
  check(
    todas.every((f) => {
      const c = RITMO_MOVIL.curvaDelViaje(f)
      let ok = c(0) === 0 && c(1) === 1
      for (let i = 1; i <= 200; i++) ok = ok && c(i / 200) > c((i - 1) / 200)
      return ok
    }),
    "todas sus curvas van de 0 a 1 sin retroceder",
  )
  check(
    RITMO_MOVIL.curvaDelViaje(3) === RITMO_MOVIL.curvaDelViaje(3),
    "y la curva de un viaje es siempre la MISMA función (es la `ease` de un tween)",
  )
  console.log("\n  la tabla del teléfono")
  for (const f of [1, 3, 10, 20, 30, FILAS_TOPE]) {
    console.log(
      `  ${String(f).padStart(3)} filas → ${String(RITMO_MOVIL.viaje(f)).padStart(4)} ms` +
        ` · rampa ${rampaMovil(f).toFixed(2)} · ${picoPxS(f).toFixed(0).padStart(3)} px/s`,
    )
  }
}

console.log(fallos === 0 ? "\ntodo ok" : `\n${fallos} fallos`)
process.exit(fallos === 0 ? 0 : 1)
