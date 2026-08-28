"use client"

// Orbes de XP: el festejo de acertar en el minijuego de derivadas.
//
// La caja del enunciado es una MESA DE BILLAR vista desde arriba. Al acertar, la
// fórmula se rompe: los orbes salen despedidos desde donde estaba, chocan entre
// ellos y contra las bandas, van perdiendo velocidad y quedan quietos donde se
// les acabó. Después el imán los levanta de a uno y cada llegada suma XP.
//
// Visto desde arriba no hay gravedad: no hay piso, ni caída, ni rebote vertical.
// Lo único que frena es el roce con el paño, y frena PAREJO —desaceleración
// constante, no exponencial— porque eso es lo que hace una bola que rueda: se va
// apagando a ritmo fijo y para en seco, en vez de acercarse eternamente al
// reposo.
//
// Las posiciones finales no se eligen: EMERGEN. No hay puntería ni reparto por
// grilla; los choques y las bandas se encargan solos de que queden desparramados,
// que es la razón por la que este modelo funciona y los anteriores necesitaban
// ayuda para no amontonarse.
//
// Es primo de `Confetti` —comparte el imán y el ritmo del conteo— pero nada de su
// física, y por eso vive aparte en vez de ser una prop más de aquel.
//
// Restricción heredada de confetti.tsx: es `fixed inset-0`, así que NO puede
// renderizarse dentro de un contenedor con transform.

import { useEffect, useRef, useState } from "react"
import { BELT_VIVID_COLORS } from "@/lib/catalog"
import { collectSchedule, easeInOut, SEEK_MS, type Collect } from "./confetti"

// El golpe de salida, en px/s. Rango ancho: en un break ninguna bola sale igual
// que la de al lado, y ahí está la mitad de por qué se ve vivo.
const BREAK_SPEED_MIN = 300
const BREAK_SPEED_SPAN = 600

// Roce del paño, en px/s². Constante y no proporcional a la velocidad: una bola
// que rueda pierde velocidad a ritmo fijo y se detiene, no se va acercando al
// reposo para siempre.
//
// El envión y el roce se eligieron juntos, midiendo contra la mesa de verdad
// (448×196 en escritorio, 343×80 en el teléfono). La primera versión salía a
// 120-500 con roce 780 y la bola más rápida recorría 160 px: menos de lo que hay
// del centro a la banda, o sea que casi ninguna llegaba a rebotar — 1,2 golpes de
// banda por break. Con estos valores son 12 en escritorio y 19 en el teléfono, y
// las bolas ruedan entre medio segundo y un segundo y tres cuartos.
const FRICTION = 520

// px/s. Por debajo de esto la bola está quieta; se la para y listo.
const STOP_SPEED = 12

// Cuánta velocidad conservan los choques. La banda se come más que una bola: el
// paño y la goma absorben, el marfil contra marfil casi no.
const CUSHION_RESTITUTION = 0.82
const BALL_RESTITUTION = 0.94

// Diámetro de los orbes, en px. Todos iguales: en una mesa las bolas son
// idénticas, y ahí está la gracia del modelo — lo único que distingue a una de
// otra es dónde quedó, que es lo que la física decide.
//
// Chicos, además: son pedacitos de una fórmula, no fichas.
const SIZE = 7

// La recolección del juego va más rápido que la del resumen de sesión de
// Intervalo: allá es el final de algo y se mira una vez, acá pasa cada quince
// segundos. Es la MISMA rampa —misma forma, mismo orden, mismo ritmo relativo,
// que es lo que hace que las dos suenen a lo mismo— nada más que escalada. Por
// eso se escala acá y no se tocan las constantes de confetti.tsx, que son las que
// usa el resumen.
const COLLECT_SPEED = 1.7

// Cuánto se sigue midiendo la caja del enunciado después de que aparece el imán.
// Alcanza para cubrir el pase de slide del teléfono (280 ms) con margen. Pasado
// eso el desplazamiento se congela, y eso es lo que importa: la caja del
// ejercicio SIGUIENTE también se llama igual y está en su lugar normal, así que
// seguir midiéndola para siempre haría que las bolas que todavía quedan peguen un
// salto de vuelta al centro de la pantalla.
const FOLLOW_MS = 700

/** Caja rectangular en píxeles de viewport. */
export type Box = { left: number; right: number; top: number; bottom: number }

type Orb = {
  id: number
  // px de viewport, centro del orbe.
  x: number
  y: number
  vx: number
  vy: number
  r: number
  // Masa por área. Hoy son todas iguales (ver SIZE), así que el choque queda en
  // el intercambio de siempre; se calcula igual porque es la forma general y es
  // la que hay que tener escrita si algún día los tamaños vuelven a variar.
  m: number
  color: string
  // Está en la cola de recolección (o sea: paró y espera turno).
  queued: boolean
  // Turno de cobro. Es el índice que ve `onArrive`, y tiene que ser el orden de
  // LLEGADA: como todos los viajes duran lo mismo, el orden de salida lo es.
  arrival: number
  seekAt: number | null
  seekFrom: { x: number; y: number } | null
  alive: boolean
}

/** Choque elástico entre dos bolas, con separación previa.
 *
 * La separación va ANTES del impulso y pesada por la masa: al romper, los orbes
 * nacen encimados (la fórmula es angosta y son varios), y sin despegarlos primero
 * el impulso los deja superpuestos empujándose frame tras frame — que es como se
 * ve un montón de bolitas temblando en el lugar. */
function collide(a: Orb, b: Orb) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const min = a.r + b.r
  const d2 = dx * dx + dy * dy
  if (d2 >= min * min) return
  // Nacidos exactamente encima: se los separa en una dirección cualquiera, si no
  // la normal no existe y no hay choque que calcular.
  const d = Math.sqrt(d2) || 0.0001
  const nx = d2 === 0 ? 1 : dx / d
  const ny = d2 === 0 ? 0 : dy / d

  const push = min - d
  const total = a.m + b.m
  a.x -= nx * push * (b.m / total)
  a.y -= ny * push * (b.m / total)
  b.x += nx * push * (a.m / total)
  b.y += ny * push * (a.m / total)

  // Velocidad relativa a lo largo de la normal. Si ya se están separando no hay
  // nada que resolver: sin este control, dos que se tocan de refilón se quedan
  // pegadas rebotando contra sí mismas.
  const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
  if (rvn > 0) return
  const j = (-(1 + BALL_RESTITUTION) * rvn) / (1 / a.m + 1 / b.m)
  a.vx -= (j * nx) / a.m
  a.vy -= (j * ny) / a.m
  b.vx += (j * nx) / b.m
  b.vy += (j * ny) / b.m
}

export function OrbScatter({
  count,
  colors = BELT_VIVID_COLORS,
  from,
  area,
  collect,
  onCleared,
}: {
  count: number
  colors?: readonly string[]
  /** El rack: de dónde salen, en píxeles de viewport. Es una CAJA y no un punto,
   * porque los orbes nacen repartidos a lo largo de la expresión que los produjo
   * — así se ve que la expresión se rompió en pedazos y no que algo la escupió
   * desde atrás. */
  from: Box
  /** La mesa. Es una función porque se resuelve en el PRIMER FRAME: cuando el
   * orbe nace, el layout puede estar todavía acomodándose por la misma respuesta
   * que lo disparó. */
  area?: () => Box | null
  collect?: Collect
  /** La ÚLTIMA bola despegó de la mesa. No es que hayan llegado: es que ya no
   * queda ninguna rodando ni esperando turno. Es el momento en que la mesa deja
   * de estar en juego, y por eso es el que habilita seguir. */
  onCleared?: () => void
}) {
  // `useState` perezoso, igual que en Confetti: el array se arma una sola vez y,
  // al ser un valor y no un ref, se puede leer en el render para montar los
  // nodos.
  const [orbs] = useState<Orb[]>(() => {
    const cx = (from.left + from.right) / 2
    const cy = (from.top + from.bottom) / 2
    return Array.from({ length: count }, (_, i) => {
      const x = from.left + Math.random() * Math.max(1, from.right - from.left)
      const y = from.top + Math.random() * Math.max(1, from.bottom - from.top)
      // Hacia AFUERA del rack, con ruido. Un ángulo del todo al azar deja bolas
      // saliendo hacia adentro del montón, que es justo lo que un break no hace:
      // el golpe llega al centro y todo se abre.
      const out = Math.atan2(y - cy, x - cx)
      const angle =
        x === cx && y === cy
          ? Math.random() * Math.PI * 2
          : out + (Math.random() - 0.5) * 1.6
      const speed = BREAK_SPEED_MIN + Math.random() * BREAK_SPEED_SPAN
      const r = SIZE / 2
      return {
        id: i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r,
        m: r * r,
        color: colors[i % colors.length],
        queued: false,
        arrival: 0,
        seekAt: null,
        seekFrom: null,
        alive: true,
      }
    })
  })

  const boxRef = useRef<HTMLDivElement | null>(null)
  const nodesRef = useRef<(HTMLDivElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number | null>(null)

  // En refs para que un padre que re-renderiza (el contador de XP subiendo,
  // justamente) no reinicie la animación a mitad de recolección.
  const collectRef = useRef(collect)
  const areaRef = useRef(area)
  const clearedRef = useRef(onCleared)
  useEffect(() => {
    collectRef.current = collect
    areaRef.current = area
    clearedRef.current = onCleared
  })

  useEffect(() => {
    let width = window.innerWidth
    let height = window.innerHeight
    const measure = () => {
      const rect = boxRef.current?.getBoundingClientRect()
      width = rect?.width ?? window.innerWidth
      height = rect?.height ?? window.innerHeight
    }
    measure()
    window.addEventListener("resize", measure)

    // La mesa: se mide una sola vez, en el primer frame.
    let table: Box | null = null

    // La mesa VIAJA. En el teléfono, la caja del enunciado se va con su slide
    // cuando la persona toca Continuar, y las bolas que todavía no despegaron se
    // van con ella: siguen adentro de la mesa, y la mesa está en esa pantalla.
    //
    // Se resuelve midiendo la caja cada frame y guardando cuánto se corrió desde
    // que se rompió. La física NO se entera: sigue corriendo en las coordenadas
    // originales de la mesa —los choques y las bandas son los mismos, la mesa se
    // mueve entera— y el desplazamiento se suma recién al pintar. Mezclarlo con
    // la física habría hecho que el pase de slide empujara las bolas contra la
    // banda.
    //
    // La que YA despegó no se entera de nada: su viaje al contador es en
    // coordenadas de pantalla, y por eso al despachar se le congela de dónde sale
    // con el desplazamiento ya sumado.
    let mesaOrigen: Box | null = null
    let mesaOff = { x: 0, y: 0 }
    let seguirHasta = Infinity

    // La recolección es INDIVIDUAL: cada bola se va cuando se queda quieta, no
    // cuando se queda quieta la mesa entera. El orden y el ritmo, entonces, no
    // los pone un horario: los pone la física. La primera que para es la primera
    // que se cobra, y mientras tanto las demás siguen rodando.
    //
    // `queue` son las que ya pararon y esperan turno. Una bola encolada que
    // vuelve a moverse —porque otra la golpeó, que en una mesa pasa— sale de la
    // cola y vuelve a entrar cuando pare de nuevo.
    let goal: { x: number; y: number } | null = null
    const queue: number[] = []
    let dispatched = 0
    let lastDispatch = -Infinity
    let avisadoVacia = false

    // Separación MÍNIMA entre una recolección y la siguiente. Es la misma rampa
    // del conteo de XP del resumen de sesión —arranca lenta y acelera— pero usada
    // como piso de separación y no como horario: acá el horario lo pone la mesa,
    // y esto solo evita que dos que pararon en el mismo frame se cobren juntas y
    // el conteo pegue un salto de dos.
    //
    // El primer hueco es CERO: la primera bola que para se va en ese mismo
    // instante, que es justamente lo que se pidió.
    const gaps = (() => {
      const ramp = collectSchedule(orbs.length)
      return ramp.map((v, i) => (i === 0 ? 0 : (v - ramp[i - 1]) / COLLECT_SPEED))
    })()

    const paint = () => {
      for (const o of orbs) {
        const el = nodesRef.current[o.id]
        if (!el) continue
        if (!o.alive) {
          el.style.display = "none"
          continue
        }
        // Las de la mesa llevan el desplazamiento de la mesa; la que despegó ya
        // vive en coordenadas de pantalla y no lo lleva.
        const dx = o.seekAt === null ? mesaOff.x : 0
        const dy = o.seekAt === null ? mesaOff.y : 0
        el.style.transform =
          `translate3d(${o.x + dx - o.r}px, ${o.y + dy - o.r}px, 0)`
      }
    }

    const animate = (ts: number) => {
      if (lastRef.current === null) lastRef.current = ts
      // Tope de 30 ms y no de 50: en un simulador con choques, un salto grande
      // deja bolas atravesando a otras de un frame al otro. Prefiere ir en cámara
      // lenta un instante antes que dejar pasar una a través de la banda.
      const dt = Math.min((ts - lastRef.current) / 1000, 0.03)
      lastRef.current = ts

      if (table === null) {
        // Sin mesa medible, una franja al pie de la pantalla. No es el caso
        // esperado, pero es mejor que dejarlos amontonados en un punto.
        const medida = areaRef.current?.() ?? null
        table = medida ?? {
          left: 8,
          right: width - 8,
          top: height - 120,
          bottom: height - 24,
        }
        // Solo si se pudo medir de verdad: el respaldo es una franja inventada al
        // pie de la pantalla y no hay ninguna caja a la que seguirle el rastro.
        if (medida) mesaOrigen = medida
      }

      // Se lee acá arriba —y no más abajo, donde se usa— porque de esto depende
      // si hace falta medir la mesa en este frame.
      const cfg = collectRef.current

      // ── La mesa se corre con su slide ──────────────────────────────────────
      // Solo mientras el imán está suelto. Medir la caja es un
      // getBoundingClientRect, o sea obligar al navegador a recalcular el layout,
      // y antes de que la persona toque Continuar la mesa no se está yendo a
      // ningún lado: en el teléfono las bolas pueden quedarse ahí esperando
      // varios minutos, y esto corría a 60 Hz todo ese tiempo.
      let mesaSeCorrio = false
      if (mesaOrigen !== null && cfg && ts < seguirHasta) {
        const ahora = areaRef.current?.()
        if (ahora) {
          const x = ahora.left - mesaOrigen.left
          const y = ahora.top - mesaOrigen.top
          mesaSeCorrio = x !== mesaOff.x || y !== mesaOff.y
          mesaOff = { x, y }
        }
      }

      // ── Despacho hacia el imán ─────────────────────────────────────────────
      // El pase de slide arranca con el mismo toque que suelta el imán, así que
      // el rastreo de la mesa se abre acá y se cierra solo.
      if (cfg && seguirHasta === Infinity) seguirHasta = ts + FOLLOW_MS
      if (cfg) {
        // Se REINTENTA hasta que el destino exista, en vez de resolverlo una sola
        // vez. En el teléfono el imán se suelta cuando la persona toca Continuar,
        // y en ese frame la slide del ranking recién se está montando: con un
        // único intento el destino salía null y los orbes se quedaban ahí para
        // siempre.
        if (goal === null) {
          const px = cfg.target()
          if (px) goal = { x: px.x, y: px.y }
        }
        while (goal !== null && queue.length > 0 && ts - lastDispatch >= gaps[dispatched]) {
          const o = orbs[queue[0]]
          // Volvió a rodar mientras esperaba: sale de la cola y ya volverá a
          // entrar cuando pare.
          if (o.vx !== 0 || o.vy !== 0) {
            queue.shift()
            o.queued = false
            continue
          }
          queue.shift()
          o.queued = false
          o.seekAt = ts
          o.seekFrom = { x: o.x + mesaOff.x, y: o.y + mesaOff.y }
          o.arrival = dispatched
          lastDispatch = ts
          dispatched++
        }
        if (dispatched === orbs.length && !avisadoVacia) {
          avisadoVacia = true
          clearedRef.current?.()
        }
      }

      // ── Mesa ───────────────────────────────────────────────────────────────
      // Repintar también cuando lo único que se movió fue la mesa: las bolas
      // están quietas sobre ella, pero en pantalla se corren igual.
      let moved = mesaSeCorrio
      let anyAlive = false
      // ¿Hay alguna bola con velocidad en este frame? Es lo que decide si vale la
      // pena resolver choques: con todas frenadas no hay nada que resolver, y el
      // frame anterior —el último en el que algo se movió— ya las separó.
      let enMovimiento = false
      const rodando: Orb[] = []

      for (const o of orbs) {
        if (!o.alive) continue
        anyAlive = true

        if (o.seekAt !== null && o.seekFrom !== null && goal !== null) {
          moved = true
          const t = Math.min(1, (ts - o.seekAt) / (SEEK_MS / COLLECT_SPEED))
          const k = easeInOut(t)
          if (t >= 1) {
            cfg?.onArrive?.(o.arrival, o.arrival / Math.max(1, orbs.length - 1))
            o.alive = false
            continue
          }
          o.x = o.seekFrom.x + (goal.x - o.seekFrom.x) * k
          o.y = o.seekFrom.y + (goal.y - o.seekFrom.y) * k
          continue
        }

        const speed = Math.hypot(o.vx, o.vy)
        if (speed > 0) {
          moved = true
          enMovimiento = true
          // Roce del paño: frena parejo, en la dirección en que va. El `min` es lo
          // que la deja PARADA en vez de hacerla retroceder cuando el frenado del
          // frame es más grande que lo que le queda de velocidad.
          const brake = Math.min(speed, FRICTION * dt)
          o.vx -= (o.vx / speed) * brake
          o.vy -= (o.vy / speed) * brake
          if (Math.hypot(o.vx, o.vy) < STOP_SPEED) {
            o.vx = 0
            o.vy = 0
          }
          o.x += o.vx * dt
          o.y += o.vy * dt
        }

        // Bandas. Se refleja la posición además de la velocidad: dejarla clavada
        // en el borde hace que la siguiente vuelta la vuelva a detectar adentro y
        // la bola se quede vibrando contra la banda.
        const t = table
        if (o.x - o.r < t.left) {
          o.x = t.left + o.r + (t.left - (o.x - o.r))
          o.vx = Math.abs(o.vx) * CUSHION_RESTITUTION
        } else if (o.x + o.r > t.right) {
          o.x = t.right - o.r - (o.x + o.r - t.right)
          o.vx = -Math.abs(o.vx) * CUSHION_RESTITUTION
        }
        if (o.y - o.r < t.top) {
          o.y = t.top + o.r + (t.top - (o.y - o.r))
          o.vy = Math.abs(o.vy) * CUSHION_RESTITUTION
        } else if (o.y + o.r > t.bottom) {
          o.y = t.bottom - o.r - (o.y + o.r - t.bottom)
          o.vy = -Math.abs(o.vy) * CUSHION_RESTITUTION
        }
        // Una mesa más angosta que la bola dejaría el rebote de arriba tirándola
        // afuera; se la clava en el medio y se termina.
        o.x = Math.min(Math.max(o.x, t.left + o.r), Math.max(t.left + o.r, t.right - o.r))
        o.y = Math.min(Math.max(o.y, t.top + o.r), Math.max(t.top + o.r, t.bottom - o.r))

        rodando.push(o)
      }

      // Choques entre bolas. Todos contra todos: son catorce como mucho, o sea 91
      // pares, y cualquier estructura para acelerarlo costaría más que la cuenta.
      //
      // Con la mesa quieta se saltea entero. No cambia nada —dos bolas frenadas
      // no se pueden chocar, y el último frame con movimiento ya las separó— y es
      // lo que hace que esperar con las bolas en la mesa no cueste nada.
      if (enMovimiento) {
        for (let i = 0; i < rodando.length; i++) {
          for (let j = i + 1; j < rodando.length; j++) {
            const a = rodando[i]
            const b = rodando[j]
            const before = a.vx + a.vy + b.vx + b.vy
            collide(a, b)
            if (a.vx + a.vy + b.vx + b.vy !== before) moved = true
          }
        }
      }

      // La cola se arma DESPUÉS de los choques y no antes: una bola puede haber
      // frenado en el paso anterior y ser golpeada en este mismo frame, y
      // encolarla antes sería cobrarla justo cuando vuelve a arrancar.
      for (const o of rodando) {
        const quieta = o.vx === 0 && o.vy === 0
        if (quieta && !o.queued) {
          o.queued = true
          queue.push(o.id)
        } else if (!quieta && o.queued) {
          o.queued = false
        }
      }

      if (moved) paint()
      // El RAF sigue aunque nada se mueva: es lo que se entera de que apareció el
      // imán. Lo que no sigue es el repintado, que es lo que cuesta.
      if (anyAlive) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener("resize", measure)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [orbs])

  return (
    <div ref={boxRef} className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Relleno plano con un color de cinturón. El color no es decorativo —es el
          mismo del ranking y el de los XpDots— así que lo que queda en la mesa se
          lee como puntos de experiencia.

          SIN `mixBlendMode: screen`, que es lo que usa el confeti del resumen de
          sesión. Esa mezcla anda sobre un fondo siempre oscuro, pero estas bolas
          cruzan cualquier cosa: sobre el botón blanco de Continuar, screen lleva
          el relleno a blanco puro y lo único que queda con color es el borde
          antialiasado — o sea, la bola se ve como un anillo con el centro lavado.
          Opaca no tiene ese problema en ningún lado. */}
      {orbs.map((o) => (
        <div
          key={o.id}
          ref={(el) => {
            nodesRef.current[o.id] = el
          }}
          className="absolute left-0 top-0 rounded-full"
          style={{
            width: o.r * 2,
            height: o.r * 2,
            background: o.color,
            transform: `translate3d(${o.x - o.r}px, ${o.y - o.r}px, 0)`,
            willChange: "transform",
          }}
        />
      ))}
    </div>
  )
}
