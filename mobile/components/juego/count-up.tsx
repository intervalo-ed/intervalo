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
import { Text, type StyleProp, type TextStyle } from "react-native"

export function CountUp({
  value,
  format,
  duration = 1000,
  flickerMs = 60,
  style,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
  flickerMs?: number
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
    const id = setInterval(() => {
      const elapsed = performance.now() - start
      const out = chars.slice()
      let allLocked = true
      digitIdx.forEach((pos, k) => {
        if (elapsed >= lockAt[k]) {
          out[pos] = finalStr[pos]
        } else {
          out[pos] = String(Math.floor(Math.random() * 10))
          allLocked = false
        }
      })
      setText(allLocked ? finalStr : out.join(""))
      if (allLocked) clearInterval(id)
    }, flickerMs)
    return () => clearInterval(id)
  }, [finalStr, duration, flickerMs])

  return (
    <Text style={[{ fontVariant: ["tabular-nums"] }, style]} numberOfLines={1}>
      {text}
    </Text>
  )
}
