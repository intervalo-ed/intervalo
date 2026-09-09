// Chequeo de los dos formatos de "cuánto le queda al empuje".
//
// Corre con: bun run check:restante
//
// Existen dos porque se leen en lugares distintos —un chip que es un reloj y un
// párrafo de copy— pero tienen que decir el MISMO número. Estaban escritos tres
// veces, dos de ellas con `Math.round`: con hora y media restante el copy decía
// "2 horas" mientras el chip decía "1h 30m", en la misma pantalla del producto.
//
// Redondear para arriba promete tiempo que no hay, así que las dos truncan. Eso
// es lo que se comprueba acá, más los bordes.
//
// El reloj es SIEMPRE HH:MM:SS. Antes cambiaba de formato al cruzar la hora
// ("23h 40m" arriba, "18:24" abajo) y eso hacía dudar del número: el mismo
// empuje se leía de dos maneras según cuándo lo mirabas. El copy sigue hablando
// en palabras, que es otra cosa y se lee en un párrafo.

import { fmtRemaining, restanteEnPalabras } from "../src/components/boost-banner"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

console.log("\nel reloj del chip")
check(fmtRemaining(86_400) === "24:00:00", `24 h exactas → ${fmtRemaining(86_400)}`)
check(fmtRemaining(85_140) === "23:39:00", `23 h 39 m → ${fmtRemaining(85_140)}`)
check(fmtRemaining(3600) === "01:00:00", `la hora justa → ${fmtRemaining(3600)}`)
// El cruce de la hora ya no cambia nada: es el mismo formato de un lado y del
// otro, que es justamente el punto.
check(fmtRemaining(3599) === "00:59:59", `un segundo menos → ${fmtRemaining(3599)}`)
check(fmtRemaining(90) === "00:01:30", `minuto y medio → ${fmtRemaining(90)}`)
check(fmtRemaining(5) === "00:00:05", `cinco segundos → ${fmtRemaining(5)}`)
check(fmtRemaining(0) === "00:00:00", `cero → ${fmtRemaining(0)}`)
check(fmtRemaining(-10) === "00:00:00", `negativo no se muestra → ${fmtRemaining(-10)}`)
// El ancho no puede saltar: los cuatro chips del cartel están en una grilla y se
// leen como una vertical. Con dos formatos, cruzar la hora los descolocaba.
const anchos = new Set(
  [0, 5, 90, 3599, 3600, 85_140, 86_400].map((s) => fmtRemaining(s).length),
)
check(anchos.size === 1, `siempre el mismo ancho (${[...anchos].join(", ")})`)

console.log("\nlas palabras del copy")
const p = (s: number) => restanteEnPalabras(s).texto
check(p(85_140) === "23 horas", `23 h 39 m → ${p(85_140)}`)
check(p(3600) === "1 hora", `la hora justa, en singular → ${p(3600)}`)
check(p(2400) === "40 minutos", `40 minutos → ${p(2400)}`)
check(p(60) === "1 minuto", `un minuto, en singular → ${p(60)}`)
// El piso: quedando 20 segundos, "0 minutos" sería decir que ya se terminó.
check(p(20) === "1 minuto", `veinte segundos redondean a uno → ${p(20)}`)
check(restanteEnPalabras(3600).enHoras, "la hora justa va con artículo de horas")
check(!restanteEnPalabras(3599).enHoras, "un segundo menos, con el de minutos")

console.log("\nlos dos formatos no se contradicen")
// El caso que motivó unificarlos: hora y media. Con `Math.round` el copy decía
// "2 horas" y el chip "1h 30m".
check(
  p(5400) === "1 hora" && fmtRemaining(5400) === "01:30:00",
  `hora y media: copy "${p(5400)}", chip "${fmtRemaining(5400)}"`,
)
// Y en general: la parte entera de horas que anuncia el copy nunca puede ser
// mayor que la que muestra el reloj.
let coherentes = true
for (let s = 3600; s <= 172_800; s += 37) {
  const delReloj = Number(fmtRemaining(s).split(":")[0])
  const delCopy = Number(p(s).split(" ")[0])
  if (delCopy > delReloj) coherentes = false
}
check(coherentes, "el copy nunca anuncia más horas que el reloj")

console.log()
if (fallos > 0) {
  console.log(`${fallos} chequeo(s) fallaron`)
  process.exit(1)
}
console.log("todo ok")
