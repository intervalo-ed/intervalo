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
// es lo que se comprueba acá, más los bordes: el cruce de la hora (que es donde
// el chip cambia de formato) y el minuto que falta.

import { fmtRemaining, restanteEnPalabras } from "../src/components/boost-banner"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

console.log("\nel reloj del chip")
check(fmtRemaining(86_400) === "24h 00m", `24 h exactas → ${fmtRemaining(86_400)}`)
check(fmtRemaining(85_140) === "23h 39m", `23 h 39 m → ${fmtRemaining(85_140)}`)
check(fmtRemaining(3600) === "1h 00m", `la hora justa → ${fmtRemaining(3600)}`)
// Un segundo abajo de la hora ya es mm:ss: es el cruce que el paso de la cuenta
// regresiva tiene que acompañar, o el segundero avanza de a 30.
check(fmtRemaining(3599) === "59:59", `un segundo menos → ${fmtRemaining(3599)}`)
check(fmtRemaining(90) === "1:30", `minuto y medio → ${fmtRemaining(90)}`)
check(fmtRemaining(5) === "0:05", `cinco segundos → ${fmtRemaining(5)}`)
check(fmtRemaining(0) === "0:00", `cero → ${fmtRemaining(0)}`)
check(fmtRemaining(-10) === "0:00", `negativo no se muestra → ${fmtRemaining(-10)}`)

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
  p(5400) === "1 hora" && fmtRemaining(5400) === "1h 30m",
  `hora y media: copy "${p(5400)}", chip "${fmtRemaining(5400)}"`,
)
// Y en general: la parte entera de horas que anuncia el copy nunca puede ser
// mayor que la que muestra el reloj.
let coherentes = true
for (let s = 3600; s <= 172_800; s += 37) {
  const delReloj = Number(fmtRemaining(s).split("h")[0])
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
