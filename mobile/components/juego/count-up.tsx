// El número que «tira» como tragamonedas al aparecer o cambiar: cada dígito
// parpadea con valores al azar y se traba de izquierda a derecha (≈1 s). Es
// `CountUpSlot` de web/src/components/count-up.tsx, la única variante que usa
// el ranking.
//
// Un solo <Text> con un string, nunca un dígito por vista: lo que se dibuja es
// siempre un número entero bien formado. Solo cambian los caracteres que ya eran
// dígitos —los puntos de miles se quedan quietos— y con cifras tabulares el
// ancho no se mueve mientras gira.

import { useEffect, useState } from "react"
import { type StyleProp, type TextStyle } from "react-native"
import { Text } from "@/components/texto"
import { vib } from "@/lib/haptics"
export function CountUp({
  value,
  format,
  duration = 1000,
  flickerMs = 60,
  haptico = false,
  style,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
  flickerMs?: number
  /** Vibra al trabarse cada dígito. Solo para los números que protagonizan la
   *  pantalla: la lista del ranking monta decenas y no debe zumbar. */
  haptico?: boolean
  style?: StyleProp<TextStyle>
}) {
  const finalStr = format ? format(value) : String(value)
  const [text, setText] = useState(finalStr)

  useEffect(() => {
    const chars = finalStr.split("")
    const digitIdx = chars.map((c, i) => (/\d/.test(c) ? i : -1)).filter((i) => i >= 0)
    const n = digitIdx.length
    if (n === 0) {
      setText(finalStr)
      return
    }
    const lockAt = digitIdx.map((_, k) => ((k + 1) / n) * duration)
    const start = performance.now()
    let trabados = 0
    const id = setInterval(() => {
      const elapsed = performance.now() - start
      const out = chars.slice()
      let allLocked = true
      let ahora = 0
      digitIdx.forEach((pos, k) => {
        if (elapsed >= lockAt[k]) {
          out[pos] = finalStr[pos]
          ahora += 1
        } else {
          out[pos] = String(Math.floor(Math.random() * 10))
          allLocked = false
        }
      })
      // Un pulso por dígito que se traba, cada vez más firme; el último, el clac.
      if (haptico && ahora > trabados) {
        if (allLocked) vib.contadorTrabado()
        else vib.digito(ahora / n)
        trabados = ahora
      }
      setText(allLocked ? finalStr : out.join(""))
      if (allLocked) clearInterval(id)
    }, flickerMs)
    return () => clearInterval(id)
  }, [finalStr, duration, flickerMs, haptico])

  return (
    <Text style={[{ fontVariant: ["tabular-nums"] }, style]} numberOfLines={1}>
      {text}
    </Text>
  )
}
