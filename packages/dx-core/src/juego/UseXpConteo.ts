// El motor del conteo de XP del festejo: los pasos, el reloj que los empuja en
// el teléfono, la reconciliación con el servidor, el aborto y el número que se
// muestra mientras tanto. Sin DOM: lo usan la web (que le suma el vuelo de los
// orbes de escritorio, ver web/src/app/derivadas/xp-conteo.ts) y la app nativa.
//
// Lo único de cada plataforma entra por argumento: el tick (que suena más agudo
// a medida que avanza el conteo) y el color del número mientras se llena.
//
// El orden importa: primero entra toda la XP y recién ahí el ranking estrena
// orden y la fila sube. Por eso `onComplete` es quien dispara la invalidación
// del ranking, y no la respuesta del servidor.

import { useCallback, useEffect, useRef, useState } from "react"
import type { GameAnswer } from "./UseGameExercise"
import { collectSchedule, pasosDe, repartir } from "./xp-pasos"

// Quién empuja el conteo.
//
// `vuelo` es escritorio: no hay reloj: el ritmo lo ponen las llegadas de los
// orbes, que llaman a `paso` y ya vienen agendadas con la misma rampa.
// `espera` es el teléfono: el conteo queda guardado hasta que `release` lo
// larga, que es cuando la persona pasa a la pantalla donde está el número.
export type ModoDeConteo = "vuelo" | "espera"

// Los "unos momentos" entre el Continuar y el conteo, en el teléfono: la pausa
// que separa el pase de pantalla del número. Sin pausa las dos cosas ocurren
// encimadas y el conteo se pierde adentro del pase. Nadie la espera: el
// Continuar está habilitado desde el primer frame.
const ESPERA_MS = 500

// Cuánto se queda el color después del último paso antes de que el número
// vuelva al suyo. Sin esto se apaga en el mismo frame del último paso y el
// final se lee como si algo se hubiera roto.
const DESCANSO_MS = 700

// Salvavidas del modo vuelo: si a esta altura todavía faltan pasos, se dan por
// dados sin sonido y el conteo se cierra igual. De que el conteo TERMINE cuelga
// el refresco del ranking (mientras `counting` sea true el latido está
// pausado), así que un festejo cortado a la mitad dejaría la tabla congelada.
// El vuelo más largo son unos 1,6 s; esto es casi el doble.
const SALVAVIDAS_MS = 3000

/** El tick de un paso; `rate` arranca en 0,9 y sube hasta 1,5 con el conteo. */
export type TickDelConteo = (rate: number) => void

export type XpConteoMotor = ReturnType<typeof useXpConteo>

export function useXpConteo({
  tick,
  color,
  onComplete,
}: {
  tick: TickDelConteo
  // El color del número mientras se llena (el verde del acierto).
  color: string
  onComplete?: () => void
}) {
  // La XP que había antes de este acierto; el conteo arranca acá. Sale de la
  // respuesta (`xp_total - xp_awarded`) y no de la query del jugador.
  const [base, setBase] = useState<number | null>(null)
  const [total, setTotal] = useState(0)
  const [sumado, setSumado] = useState(0)
  // `null` es "el número en su color de siempre": el color solo existe
  // mientras dura el festejo.
  const [xpColor, setXpColor] = useState<string | null>(null)

  const doneRef = useRef(onComplete)
  const tickRef = useRef(tick)
  const colorRef = useRef(color)
  useEffect(() => {
    doneRef.current = onComplete
    tickRef.current = tick
    colorRef.current = color
  })

  // Todos los temporizadores, para poder cancelarlos: un acierto nuevo pisa al
  // anterior, y desmontar en medio del conteo no puede dejar timers escribiendo
  // estado.
  const relojesRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const limpiar = useCallback(() => {
    for (const r of relojesRef.current) clearTimeout(r)
    relojesRef.current = []
  }, [])
  useEffect(() => limpiar, [limpiar])

  const partesRef = useRef<number[]>([])
  // Qué pasos ya se cobraron: lo que hay que garantizar es "una vez cada uno".
  const dadosRef = useRef<Set<number>>(new Set())
  const pendienteRef = useRef(false)

  const terminar = useCallback(() => {
    limpiar()
    relojesRef.current.push(setTimeout(() => setXpColor(null), DESCANSO_MS))
    doneRef.current?.()
  }, [limpiar])

  /** Un paso del conteo: suena, cambia de color y sube el número. Lo llaman los
   *  dos motores (el reloj y los orbes), así que el ritmo y el sonido son los
   *  mismos en todas las pantallas.
   *
   *  Un paso se cobra UNA vez: si un índice entrara dos veces el número
   *  treparía por encima de la XP otorgada y ahí se quedaría, porque el ranking
   *  muestra el mayor entre el conteo y su propio dato. */
  const paso = useCallback(
    (i: number, progreso: number) => {
      const partes = partesRef.current
      if (i < 0 || i >= partes.length || dadosRef.current.has(i)) return
      dadosRef.current.add(i)
      tickRef.current(0.9 + progreso * 0.6)
      // Se enciende con el primer paso y no al disparar el festejo: prenderlo
      // antes sería anunciar lo que está por pasar en vez de acompañarlo.
      setXpColor(colorRef.current)
      setSumado((s) => s + partes[i])
      if (dadosRef.current.size >= partes.length) terminar()
    },
    [terminar],
  )

  const arrancarReloj = useCallback(() => {
    const partes = partesRef.current
    const rampa = collectSchedule(partes.length)
    const ultimo = partes.length - 1
    partes.forEach((_, i) => {
      relojesRef.current.push(
        setTimeout(() => paso(i, i / Math.max(1, ultimo)), ESPERA_MS + rampa[i]),
      )
    })
  }, [paso])

  /** Arranca el festejo con una XP TODAVÍA NO CONFIRMADA por el servidor: la
   *  llama el veredicto local en el instante en que dice "correcto".
   *  `reconcile` ajusta el número real cuando llega `/answer`, y `abort` lo
   *  desarma si el servidor termina en desacuerdo.
   *
   *  `base` queda en `null` hasta que `reconcile` la fija, así que `liveXp` no
   *  muestra nada hasta entonces.
   *
   *  Devuelve en cuántos pasos se va a contar (0 si no arrancó nada). */
  const fireProvisional = useCallback(
    (xp: number, { modo }: { modo: ModoDeConteo }): number => {
      if (xp <= 0) return 0
      limpiar()
      setBase(null)
      setTotal(xp)
      setSumado(0)
      setXpColor(null)
      partesRef.current = repartir(xp, pasosDe(xp))
      dadosRef.current = new Set()

      if (modo === "espera") {
        pendienteRef.current = true
        return partesRef.current.length
      }

      pendienteRef.current = false
      relojesRef.current.push(
        setTimeout(() => {
          const partes = partesRef.current
          if (dadosRef.current.size >= partes.length) return
          // No `xp`: la reconciliación puede haber cambiado el reparto desde
          // que esto se agendó.
          setSumado(partes.reduce((a, b) => a + b, 0))
          for (let i = 0; i < partes.length; i++) dadosRef.current.add(i)
          terminar()
        }, SALVAVIDAS_MS),
      )
      return partesRef.current.length
    },
    [limpiar, terminar],
  )

  /** Ajusta en silencio el conteo ya arrancado a la XP REAL que trajo
   *  `/answer`. Si coinciden solo fija `base`. Si difieren, reparte la
   *  diferencia entre los pasos que todavía no se cobraron: los que ya sonaron
   *  quedan como sonaron, nunca en reversa. */
  const reconcile = useCallback(
    (answer: GameAnswer) => {
      const xp = answer.xp_awarded
      setBase(answer.xp_total - xp)
      // El total pasa a ser el REAL: `counting` es `sumado < total`, y si el
      // servidor paga menos que lo estimado (acertar después del «¿Por qué?»)
      // `counting` quedaría en true para siempre y el ranking, congelado.
      setTotal(xp)
      const partes = partesRef.current
      const totalActual = partes.reduce((a, b) => a + b, 0)
      if (xp === totalActual) return
      const pendientes = partes.map((_, i) => i).filter((i) => !dadosRef.current.has(i))
      const yaSumado = totalActual - pendientes.reduce((acc, i) => acc + partes[i], 0)
      const restante = xp - yaSumado
      // Sin pasos que ajustar, o la estimación ya se pasó de la XP real: no se
      // puede bajar un número ya mostrado sin un salto hacia atrás, así que se
      // cierra directo en el valor real.
      if (pendientes.length === 0 || restante <= 0) {
        limpiar()
        setSumado(xp)
        for (let i = 0; i < partes.length; i++) dadosRef.current.add(i)
        terminar()
        return
      }
      const nuevos = repartir(restante, pendientes.length)
      pendientes.forEach((idx, k) => {
        partes[idx] = nuevos[k]
      })
    },
    [limpiar, terminar],
  )

  /** Desarma un festejo ya arrancado, para el caso rarísimo en que el servidor
   *  termina en desacuerdo con el veredicto local. No llama a `onComplete`: no
   *  pasó nada, no hay ranking que refrescar. */
  const abort = useCallback(() => {
    limpiar()
    pendienteRef.current = false
    dadosRef.current = new Set()
    partesRef.current = []
    setBase(null)
    setTotal(0)
    setSumado(0)
    setXpColor(null)
  }, [limpiar])

  /** Larga el conteo guardado (modo espera). Lo llama la pantalla que TIENE el
   *  número, cuando la persona pasa a ella. Sin nada guardado no hace nada, y
   *  por eso es segura de llamar dos veces (el Continuar y la slide del
   *  ranking al montarse). */
  const release = useCallback(() => {
    if (!pendienteRef.current) return
    pendienteRef.current = false
    arrancarReloj()
  }, [arrancarReloj])

  return {
    // XP a mostrar en la fila propia. Queda en el valor final cuando el conteo
    // termina: si volviera a null habría un parpadeo al valor viejo mientras el
    // ranking se refresca.
    liveXp: base === null ? null : base + sumado,
    // Cuánta XP lleva contada ESTE festejo, sin la base (para sumarla a un
    // total que no es el del jugador, como el de su universidad).
    xpSumada: base === null ? null : sumado,
    // Mientras sea true el conteo MANDA sobre el dato del ranking.
    counting: base !== null && sumado < total,
    // El color del número mientras se llena, o null para el de siempre.
    xpColor,
    fireProvisional,
    reconcile,
    abort,
    release,
    // Para un motor externo (los orbes de escritorio).
    paso,
  }
}
