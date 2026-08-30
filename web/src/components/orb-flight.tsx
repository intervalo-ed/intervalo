"use client"

// Orbes de XP: el festejo de acertar del minijuego de derivadas, en escritorio.
//
// Al acertar, la fórmula se rompe y los pedazos salen volando hacia el contador
// de XP del ranking. La explosión y el viaje son EL MISMO movimiento: no hay
// reposo en el medio, ni un imán que venga después a levantar lo que quedó
// tirado. Apenas se abren ya están yendo.
//
// Antes había una mesa de billar: los orbes salían despedidos adentro de la caja
// del enunciado, chocaban entre ellos y contra las bandas, y se detenían donde se
// les acababa el envión; recién entonces un imán los levantaba de a uno. Se veía
// bien, pero el ritmo del conteo lo ponía la física —cada bola se cobraba cuando
// paraba— y eso obligaba a esperar a que la mesa se aquietara antes de que
// entrara el primer punto. El festejo empezaba tarde y duraba lo que tardaran las
// bolas.
//
// Acá las llegadas están AGENDADAS: cada orbe sabe a qué milisegundo tiene que
// llegar —la rampa que acelera de `collectSchedule`, la misma con la que cuenta
// la XP el resumen de sesión— y de ahí sale cuánto dura su vuelo. Salen todos
// juntos y llegan de a uno, en ritmo. Cada llegada es un tick y un pedazo de XP.
//
// Que salgan de la derivada y no del botón es lo que le da sentido al gesto: lo
// que se convierte en puntos es el problema resuelto, no el botón que se apretó.
// Y por eso la fórmula se va: no se desvanece aparte de la explosión, ES la
// explosión.
//
// Restricción heredada de confetti.tsx: es `fixed inset-0`, así que NO puede
// renderizarse dentro de un contenedor con transform.

import { useEffect, useRef, useState } from "react"
import { collectSchedule } from "./confetti"

// Diámetro de los orbes, en px. Todos iguales: son pedacitos de una fórmula, no
// fichas, y lo único que los distingue es por dónde van.
const TAMANO = 7

// Lo que tarda en llegar el PRIMERO. Los demás salen a la vez que él y llegan
// después, cada uno con la demora que le toca en la rampa: el último de un
// acierto normal (ocho orbes) aterriza unos 770 ms más tarde.
//
// Medio segundo es lo que hace falta para que el viaje se lea como un viaje. Por
// debajo, con el contador a unos 600 px, los orbes se ven como un destello que
// cruza; por encima, el festejo empieza a hacerse esperar.
const VUELO_MS = 520

// Cuánto se abre el arco, en fracción de la distancia al contador. El punto de
// control de la curva se planta en la dirección en que el orbe salió despedido,
// así que esto es literalmente cuánto le dura la explosión antes de que el
// destino gane. En cero volarían en línea recta, todos por el mismo pasillo.
const CURVA_MIN = 0.3
const CURVA_SPAN = 0.5

// Si el contador no se puede medir —no está en pantalla, el layout todavía se
// acomoda— los orbes esperan quietos donde nacieron en vez de volar hacia
// ninguna parte. Pasado esto se da por perdido y se los despacha igual: el
// conteo tiene que terminar sí o sí, porque de su final cuelga el refresco del
// ranking (ver xp-conteo.ts).
const SIN_DESTINO_MS = 1200

/** Caja rectangular en píxeles de viewport. */
export type Box = { left: number; right: number; top: number; bottom: number }

type Orb = {
  id: number
  // Dónde nació, en px de viewport.
  x0: number
  y0: number
  // Hacia dónde salió despedido, normalizado. El punto de control de la curva se
  // planta acá, a `curva` × distancia del nacimiento.
  dx: number
  dy: number
  curva: number
  // A qué milisegundo desde el arranque tiene que llegar. Se asigna en el primer
  // frame, cuando ya se sabe dónde está el contador.
  llegaA: number
  // Turno de cobro: el índice que ve `onArrive`. Es el orden de llegada.
  turno: number
  color: string
  vivo: boolean
}

/** Rápido al salir, lento en el medio, rápido al entrar.
 *
 * Es al revés que el `easeInOut` de siempre, y a propósito. Los dos extremos son
 * los dos momentos que tienen que leerse: el estallido —que es un golpe, no un
 * arranque suave— y la entrada al contador, que cae junto con el tick. Lo del
 * medio es traslado y puede pasar más despacio.
 *
 * Mezclada con un tramo recto para que en el medio afloje sin llegar a frenar:
 * sola, la curva tiene velocidad cero justo en la mitad del viaje y los orbes se
 * quedaban colgados un instante a mitad de camino. */
const MEZCLA_RECTA = 0.4
function salidaYEntrada(t: number): number {
  const s = t < 0.5 ? 1 - (1 - 2 * t) ** 2 : 1 + (2 * t - 1) ** 2
  return MEZCLA_RECTA * t + (1 - MEZCLA_RECTA) * (s / 2)
}

export function OrbFlight({
  count,
  colors,
  from,
  target,
  onArrive,
  onCleared,
}: {
  count: number
  /** Uno por orbe. Los arma quien sabe cómo salió el ejercicio: son una rampa
   * entre amarillo y verde según cuánta XP pagó y cuántos intentos costó (ver
   * coloresDelFestejo en app/derivadas/xp-pasos.ts). */
  colors: readonly string[]
  /** De dónde salen, en píxeles de viewport. Es una CAJA y no un punto porque los
   * orbes nacen repartidos a lo largo de la expresión que los produjo — así se ve
   * que la expresión se rompió en pedazos y no que algo la escupió desde atrás. */
  from: Box
  /** El contador de XP, en píxeles de viewport. Es una función y se consulta cada
   * frame: la fila propia puede moverse mientras los orbes vuelan (el ranking la
   * está recentrando por esta misma respuesta), y lo que tiene que quedar clavado
   * es el destino, no la posición que tenía cuando salieron. */
  target: () => { x: number; y: number } | null
  /** Una por orbe, en orden de llegada. */
  onArrive?: (index: number, progress: number) => void
  /** Llegó el último. */
  onCleared?: () => void
}) {
  // `useState` perezoso, igual que en Confetti: el array se arma una sola vez y,
  // al ser un valor y no un ref, se puede leer en el render para montar los
  // nodos.
  const [orbs] = useState<Orb[]>(() => {
    const cx = (from.left + from.right) / 2
    const cy = (from.top + from.bottom) / 2
    return Array.from({ length: count }, (_, i) => {
      const x0 = from.left + Math.random() * Math.max(1, from.right - from.left)
      const y0 = from.top + Math.random() * Math.max(1, from.bottom - from.top)
      // Hacia AFUERA de la fórmula, con ruido. Un ángulo del todo al azar deja
      // orbes saliendo hacia adentro del montón, que es justo lo que una cosa que
      // estalla no hace: el golpe llega al centro y todo se abre.
      const fuera = Math.atan2(y0 - cy, x0 - cx)
      const angulo =
        x0 === cx && y0 === cy
          ? Math.random() * Math.PI * 2
          : fuera + (Math.random() - 0.5) * 1.6
      return {
        id: i,
        x0,
        y0,
        dx: Math.cos(angulo),
        dy: Math.sin(angulo),
        curva: CURVA_MIN + Math.random() * CURVA_SPAN,
        llegaA: 0,
        turno: 0,
        color: colors[i % colors.length],
        vivo: true,
      }
    })
  })

  const nodosRef = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number | null>(null)

  // En refs para que un padre que re-renderiza —el contador de XP subiendo,
  // justamente— no reinicie la animación a mitad de vuelo.
  const targetRef = useRef(target)
  const arriveRef = useRef(onArrive)
  const clearedRef = useRef(onCleared)
  useEffect(() => {
    targetRef.current = target
    arriveRef.current = onArrive
    clearedRef.current = onCleared
  })

  useEffect(() => {
    let inicio: number | null = null
    let esperandoDesde: number | null = null
    let vivos = orbs.length

    const pintar = (o: Orb, x: number, y: number) => {
      const nodo = nodosRef.current[o.id]
      if (!nodo) return
      const r = TAMANO / 2
      nodo.style.transform = `translate3d(${x - r}px, ${y - r}px, 0)`
    }

    const animar = (ts: number) => {
      const destino = targetRef.current()

      // Sin destino medible todavía: los orbes se quedan donde nacieron y el
      // reloj no arranca, así que la rampa de llegadas queda intacta.
      if (destino === null && inicio === null) {
        esperandoDesde ??= ts
        if (ts - esperandoDesde < SIN_DESTINO_MS) {
          rafRef.current = requestAnimationFrame(animar)
          return
        }
        // Se acabó la paciencia: se dan por llegados todos de una, para que el
        // conteo termine igual y el ranking se refresque.
        for (const o of orbs) {
          if (!o.vivo) continue
          o.vivo = false
          const nodo = nodosRef.current[o.id]
          if (nodo) nodo.style.opacity = "0"
        }
        for (let i = 0; i < orbs.length; i++) {
          arriveRef.current?.(i, i / Math.max(1, orbs.length - 1))
        }
        clearedRef.current?.()
        return
      }

      // Primer frame con destino: se reparten los turnos. El más cercano al
      // contador llega primero, así ninguno tiene que cruzar la pantalla más
      // rápido que el que salió de al lado — y de paso se lee como un reguero que
      // entra, no como un sorteo.
      if (inicio === null && destino !== null) {
        inicio = ts
        const rampa = collectSchedule(orbs.length)
        const porCercania = [...orbs].sort(
          (a, b) =>
            Math.hypot(a.x0 - destino.x, a.y0 - destino.y) -
            Math.hypot(b.x0 - destino.x, b.y0 - destino.y),
        )
        porCercania.forEach((o, i) => {
          o.turno = i
          o.llegaA = VUELO_MS + rampa[i]
        })
      }

      const t = ts - (inicio as number)
      for (const o of orbs) {
        if (!o.vivo) continue
        const u = Math.min(1, t / o.llegaA)
        if (u >= 1) {
          o.vivo = false
          vivos--
          const nodo = nodosRef.current[o.id]
          if (nodo) nodo.style.opacity = "0"
          arriveRef.current?.(o.turno, o.turno / Math.max(1, orbs.length - 1))
          continue
        }
        // El destino se relee cada frame, así que la curva se recalcula entera:
        // es una Bézier cuadrática de tres puntos y son seis multiplicaciones.
        const meta = destino ?? { x: o.x0, y: o.y0 }
        const dist = Math.hypot(meta.x - o.x0, meta.y - o.y0)
        const cx = o.x0 + o.dx * dist * o.curva
        const cy = o.y0 + o.dy * dist * o.curva
        const e = salidaYEntrada(u)
        const inv = 1 - e
        pintar(
          o,
          inv * inv * o.x0 + 2 * inv * e * cx + e * e * meta.x,
          inv * inv * o.y0 + 2 * inv * e * cy + e * e * meta.y,
        )
      }

      if (vivos > 0) {
        rafRef.current = requestAnimationFrame(animar)
        return
      }
      clearedRef.current?.()
    }

    rafRef.current = requestAnimationFrame(animar)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [orbs])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Relleno plano. El color no es decorativo: dice cómo salió el ejercicio
          —maduro y parejo si salió de una, amarillento y disparejo si costó— y
          el extremo verde de esa rampa es el mismo verde del que se prende el
          contador cuando los orbes llegan.

          SIN `mixBlendMode: screen`, que es lo que usa el confeti del resumen de
          sesión. Esa mezcla anda sobre un fondo siempre oscuro, pero estos orbes
          cruzan cualquier cosa: sobre el botón blanco de Continuar, screen lleva
          el relleno a blanco puro y lo único que queda con color es el borde
          antialiasado — o sea, el orbe se ve como un anillo con el centro lavado.
          Opaco no tiene ese problema en ningún lado. */}
      {orbs.map((o) => (
        <div
          key={o.id}
          ref={(el) => {
            nodosRef.current[o.id] = el
          }}
          className="absolute left-0 top-0 rounded-full"
          style={{
            width: TAMANO,
            height: TAMANO,
            background: o.color,
            transform: `translate3d(${o.x0 - TAMANO / 2}px, ${o.y0 - TAMANO / 2}px, 0)`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  )
}
