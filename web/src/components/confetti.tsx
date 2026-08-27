"use client"

// Confeti de la casa (RAF puro, sin dependencias), extraído del resumen de
// sesión para poder reutilizarlo (minijuego de derivadas, futuros festejos).
// Tres piezas: ChargeBall (el cuadradito que carga energía antes del
// estallido), Confetti (explosión radial que se apaga sola) y ConfettiRain
// (lluvia ambiente infinita que la releva).
//
// Restricción de siempre: los tres son `fixed inset-0`, así que NO pueden
// renderizarse dentro de un contenedor con transform (un motion.div animado,
// por ejemplo) — el transform captura el fixed y el confeti queda recortado.

import { useEffect, useRef, useState } from "react"
import { BELT_VIVID_COLORS } from "@/lib/catalog"

// Cuadradito que "carga energía": crece su área en ticks discretos (no
// inflándose suave) desde apenas visible hasta su máximo, repartidos en ~0.8 s,
// justo antes de explotar en el confeti. En cada tick salta de tamaño, rota un
// poco más y cambia de color secuencialmente con los mismos colores del confeti
// (BELT_COLORS). Nace centrado, igual que el confeti.
const CHARGE_SCALES = [
  0.08, 0.13, 0.18, 0.24, 0.3, 0.36, 0.42, 0.48, 0.54, 0.6, 0.66,
]

export function ChargeBall() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const last = CHARGE_SCALES.length - 1
    const stepMs = 800 / last
    let k = 0
    const id = setInterval(() => {
      k++
      setStep(k)
      if (k >= last) clearInterval(id)
    }, stepMs)
    return () => clearInterval(id)
  }, [])
  const i = Math.min(step, CHARGE_SCALES.length - 1)
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      <div
        style={{
          width: 28,
          height: 28,
          background: BELT_COLORS[i % BELT_COLORS.length],
          transform: `scale(${CHARGE_SCALES[i]}) rotate(${i * 35}deg)`,
        }}
      />
    </div>
  )
}

// Colores de los cinturones, avivados para que resalten sobre el fondo oscuro.
const BELT_COLORS = BELT_VIVID_COLORS

// Energía retenida en cada rebote contra los bordes de la pantalla (0-1): más
// bajo = pierde más velocidad por choque, hasta casi frenar en x.
const WALL_RESTITUTION = 0.65

type Particle = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  rot: number
  vrot: number
  grav: number
  fall: number // velocidad final de caída, una vez gastado el envión
  drag: number // fracción de velocidad conservada por segundo
  sway: number
  phase: number
  alive: boolean
  // Recolección (ver la prop `collect`): desde cuándo viaja hacia el destino y
  // desde dónde salió, para interpolar sin depender del estado físico.
  seekAt: number | null
  seekFrom: { x: number; y: number } | null
}

// Recolección: las partículas dejan de flotar y se van una por una hacia un
// punto de la pantalla, como si fuera un imán. El ritmo es el del conteo de XP
// del resumen de sesión (cada llegada = un tick), así que arranca lento y
// acelera hasta un piso.
export type Collect = {
  // Destino en píxeles de viewport. Es una función porque se resuelve en el
  // primer frame: al montar, el nodo destino puede no estar en su lugar final.
  target: () => { x: number; y: number } | null
  // Cuánto flota la explosión antes de que empiece la recolección.
  startDelayMs?: number
  // Una por partícula, en orden de llegada.
  onArrive?: (index: number, progress: number) => void
}

const SEEK_MS = 420
const RAMP_FIRST_MS = 200
const RAMP_DECAY = 0.82
const RAMP_MIN_MS = 45
const COLLECT_START_MS = 300

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// Momento de partida de cada partícula, acumulando la rampa acelerada.
function collectSchedule(count: number): number[] {
  const out: number[] = []
  let delay = RAMP_FIRST_MS
  let acc = 0
  for (let i = 0; i < count; i++) {
    out.push(acc)
    acc += delay
    delay = Math.max(RAMP_MIN_MS, delay * RAMP_DECAY)
  }
  return out
}

// Velocidad de salida, en % de viewport por segundo. El piso es alto a
// propósito: con un mínimo bajo quedaban partículas que apenas se despegaban
// del origen y se leían como un error de render, no como confeti. El exponente
// sesga el reparto hacia abajo (>1 = más partículas lentas, pocas muy rápidas),
// que es lo que ensancha la varianza sin volver frenética a la mayoría.
const BURST_SPEED_MIN = 80
const BURST_SPEED_SPAN = 520
const BURST_SPEED_BIAS = 1.8

// Velocidad de caída en reposo, compartida por la lluvia y por las partículas
// de la explosión cuando se les gasta el envión.
const RAIN_FALL_MIN = 8
const RAIN_FALL_SPAN = 14

// Explosión radial: todas las partículas (cuadraditos) nacen en `origin` (por
// defecto el centro de la pantalla, en % de viewport) y salen disparadas
// mayormente hacia arriba y a los costados (unas pocas también hacia abajo) a
// velocidad variable, con gravedad bien despareja y algo de rotación. RAF puro,
// sin dependencias.
export function Confetti({
  count,
  colors = BELT_COLORS,
  origin = { x: 50, y: 50 },
  shape = "square",
  collect,
}: {
  count: number
  colors?: readonly string[]
  origin?: { x: number; y: number }
  shape?: "square" | "circle"
  collect?: Collect
}) {
  // `useState` perezoso y no `useRef(Array.from(...))`: el array se arma una
  // sola vez (con useRef se regeneraba entero en cada render para tirarlo) y,
  // al ser un valor y no un ref, se puede leer en el render para montar los
  // nodos.
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => {
      // Radial puro: cualquier dirección con la misma probabilidad, sin sesgo
      // hacia arriba ni hacia abajo.
      const angle = Math.random() * Math.PI * 2
      // Curva de potencia en vez de uniforme: la mayoría sale con fuerza
      // media y unas pocas se van muy lejos, que es lo que da la sensación de
      // estallido despatarrado. El piso igual es alto para que ninguna se
      // quede pegada al origen.
      const speed =
        BURST_SPEED_MIN + Math.pow(Math.random(), BURST_SPEED_BIAS) * BURST_SPEED_SPAN
      return {
        id: i,
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        size: 6 + Math.random() * 9,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 900,
        // Gravedad propia de cada partícula, con mucha varianza: unas caen
        // como piedra, otras casi flotan.
        grav: 30 + Math.random() * 180,
        // Al apagarse el envión inicial, la partícula deja de acelerar y pasa
        // a caer como las de la lluvia: velocidad final propia + vaivén.
        fall: RAIN_FALL_MIN + Math.random() * RAIN_FALL_SPAN,
        // Frenado del aire propio de cada una (fracción de velocidad que
        // conserva por segundo). Es lo que hace que no todas pasen a planear
        // al mismo tiempo: con 0.03 el envión se apaga casi enseguida, con
        // 0.45 la partícula sigue de largo un buen rato.
        drag: 0.03 + Math.random() * 0.42,
        sway: 1.5 + Math.random() * 4,
        phase: Math.random() * Math.PI * 2,
        alive: true,
        seekAt: null,
        seekFrom: null,
      }
    }),
  )
  const stateRef = useRef<Particle[]>(particles)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number | null>(null)
  const tRef = useRef(0)
  // Los nodos se montan una sola vez en su posición de nacimiento y el RAF les
  // escribe el `transform` directo: pasar por setState re-conciliaba hasta 140
  // divs (más los de la lluvia) en cada frame a 60fps. La posición base queda
  // congelada acá para que un re-render del padre no la recalcule contra el
  // estado ya avanzado y las partículas peguen un salto.
  const boxRef = useRef<HTMLDivElement | null>(null)
  const nodesRef = useRef<(HTMLDivElement | null)[]>([])
  const [bases] = useState(() =>
    particles.map((p) => ({ x: p.x + Math.sin(p.phase) * p.sway, y: p.y })),
  )

  // En un ref para que un padre que re-renderiza (el contador de XP subiendo,
  // justamente) no reinicie la animación a mitad de recolección.
  const collectRef = useRef(collect)
  useEffect(() => {
    collectRef.current = collect
  })

  useEffect(() => {
    let width = window.innerWidth
    let height = window.innerHeight
    // El contenedor es `fixed inset-0`, así que su caja es el viewport sin la
    // scrollbar — no se puede usar vw/vh, que sí la incluyen.
    const measure = () => {
      const rect = boxRef.current?.getBoundingClientRect()
      width = rect?.width ?? window.innerWidth
      height = rect?.height ?? window.innerHeight
    }
    measure()
    window.addEventListener("resize", measure)

    // Estado de la recolección: destino en %, orden de salida y hasta dónde se
    // despachó. Se resuelve en el primer frame que la necesita.
    let goal: { x: number; y: number } | null = null
    let goalTried = false
    let order: number[] | null = null
    let dispatched = 0
    let startTs: number | null = null
    const schedule = collectRef.current ? collectSchedule(particles.length) : []

    const paint = () => {
      for (const p of stateRef.current) {
        const el = nodesRef.current[p.id]
        if (!el) continue
        if (!p.alive) {
          el.style.display = "none"
          continue
        }
        // El vaivén se suma acá y no al estado: así no acumula deriva y la
        // partícula planea en vez de irse de lado. Mientras viaja al imán se
        // apaga, si no la partícula no aterrizaría en el punto exacto.
        const left = p.seekAt === null ? p.x + Math.sin(tRef.current + p.phase) * p.sway : p.x
        const dx = ((left - bases[p.id].x) / 100) * width
        const dy = ((p.y - bases[p.id].y) / 100) * height
        el.style.transform = `translate(${dx}px, ${dy}px) rotate(${p.rot}deg)`
      }
    }

    const animate = (ts: number) => {
      if (lastRef.current === null) lastRef.current = ts
      if (startTs === null) startTs = ts
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05)
      lastRef.current = ts
      tRef.current += dt

      // ── Despacho hacia el imán ─────────────────────────────────────────────
      const cfg = collectRef.current
      const elapsed = ts - startTs
      const collectFrom = cfg?.startDelayMs ?? COLLECT_START_MS
      if (cfg && elapsed >= collectFrom) {
        if (!goalTried) {
          goalTried = true
          const px = cfg.target()
          // Sin destino medible no hay imán: las partículas siguen cayendo.
          goal = px ? { x: (px.x / width) * 100, y: (px.y / height) * 100 } : null
          if (goal) {
            // Salen de la más cercana a la más lejana: se lee como un imán que
            // va levantando lo que tiene al lado, no como un sorteo.
            const g = goal
            order = stateRef.current
              .map((p) => p.id)
              .sort(
                (a, b) =>
                  Math.hypot(stateRef.current[a].x - g.x, stateRef.current[a].y - g.y) -
                  Math.hypot(stateRef.current[b].x - g.x, stateRef.current[b].y - g.y),
              )
          }
        }
        while (
          order !== null &&
          dispatched < order.length &&
          elapsed >= collectFrom + schedule[dispatched]
        ) {
          const p = stateRef.current[order[dispatched]]
          p.seekAt = ts
          p.seekFrom = { x: p.x, y: p.y }
          dispatched++
        }
      }

      let anyAlive = false
      stateRef.current = stateRef.current.map((p) => {
        if (!p.alive) return p

        if (p.seekAt !== null && p.seekFrom !== null && goal !== null) {
          const t = Math.min(1, (ts - p.seekAt) / SEEK_MS)
          const k = easeInOut(t)
          if (t >= 1) {
            const arrivalIndex = order?.indexOf(p.id) ?? 0
            const total = Math.max(1, particles.length - 1)
            cfg?.onArrive?.(arrivalIndex, arrivalIndex / total)
            return { ...p, alive: false }
          }
          anyAlive = true
          return {
            ...p,
            x: p.seekFrom.x + (goal.x - p.seekFrom.x) * k,
            y: p.seekFrom.y + (goal.y - p.seekFrom.y) * k,
            // Se van frenando de girar a medida que llegan.
            rot: p.rot + p.vrot * dt * (1 - k),
          }
        }

        let nx = p.x + p.vx * dt
        let ny = p.y + p.vy * dt
        // Frenado del aire para que la explosión sea veloz al inicio y se
        // calme. Propio de cada partícula (ver Particle.drag), así cada una
        // pasa a planear en su momento y no todas juntas.
        const drag = Math.pow(p.drag, dt)
        let vx = p.vx * drag
        // Rebote en las paredes (bordes de la pantalla): refleja posición y
        // velocidad, perdiendo energía en cada choque (WALL_RESTITUTION) para
        // que no rebote para siempre.
        if (nx < 0) {
          nx = -nx
          vx = -vx * WALL_RESTITUTION
        } else if (nx > 100) {
          nx = 200 - nx
          vx = -vx * WALL_RESTITUTION
        }
        // Con imán nadie se pierde: a la que se iba por abajo se la retiene en
        // el borde hasta que le toque el turno. Sin imán —o si el destino no se
        // pudo medir— salir de pantalla es el final natural de la partícula.
        let alive = true
        if (cfg && (goal !== null || !goalTried)) {
          ny = Math.min(ny, 112)
        } else {
          alive = ny < 120
        }
        if (alive) anyAlive = true
        // Dos regímenes, según si a la partícula todavía le queda envión:
        // mientras baje más rápido que su velocidad final solo la frena el
        // aire (un tope duro acá le cortaría el tiro en seco a las que salen
        // disparadas hacia abajo); una vez por debajo, la gravedad la lleva
        // hasta esa velocidad final y no más. De ahí en adelante planea, y el
        // vaivén del render la termina de volver hoja.
        const decayed = p.vy * drag
        const vy =
          decayed >= p.fall ? decayed : Math.min(p.fall, decayed + p.grav * dt)
        // La rotación también se va calmando, si no bajarían trompeando.
        const vrot = p.vrot * Math.pow(0.35, dt)
        return {
          ...p,
          x: nx,
          y: ny,
          vx,
          vy,
          vrot,
          rot: p.rot + p.vrot * dt,
          alive,
        }
      })
      paint()
      if (anyAlive) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener("resize", measure)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [bases, particles.length])

  return (
    <div
      ref={boxRef}
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {particles.map((p, i) => (
        <div
          key={p.id}
          ref={(el) => {
            nodesRef.current[p.id] = el
          }}
          className="absolute"
          style={{
            left: `${bases[i].x}%`,
            top: `${bases[i].y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: shape === "circle" ? "50%" : 2,
            mixBlendMode: "screen",
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  )
}

// Pocas partículas: es un fondo ambiente, no un segundo festejo. Con más, la
// pantalla compite con el contenido en vez de acompañarlo.
const RAIN_COUNT = 14

// La lluvia no acompaña a la explosión: la releva. Espera a que el estallido se
// esté apagando y recién ahí empieza a entrar por el borde de arriba, así se
// leen como dos momentos y no como una sola nube encimada.
const RAIN_DELAY_MS = 2000

// Alto de la franja (en % de viewport) por encima de la pantalla donde nacen
// las partículas. Al montar es ancha para que entren escalonadas en vez de
// aparecer las 14 como una fila; en los renacimientos alcanza con poco.
const RAIN_SPAWN_BAND_INITIAL = 60
const RAIN_SPAWN_BAND_RECYCLE = 15

type RainParticle = {
  id: number
  x: number
  y: number
  vy: number
  sway: number // amplitud del vaivén horizontal, en % de viewport
  phase: number // desfasaje del vaivén, para que no caigan todas sincronizadas
  color: string
  size: number
  rot: number
  vrot: number
}

// Siempre nace por encima del borde superior, a una altura al azar dentro de
// una franja: la lluvia se ve entrar por arriba en vez de materializarse en
// medio de la pantalla, y las partículas llegan escalonadas.
function newRainParticle(
  id: number,
  colors: readonly string[],
  initial: boolean,
): RainParticle {
  const band = initial ? RAIN_SPAWN_BAND_INITIAL : RAIN_SPAWN_BAND_RECYCLE
  return {
    id,
    x: Math.random() * 100,
    y: -10 - Math.random() * band,
    vy: RAIN_FALL_MIN + Math.random() * RAIN_FALL_SPAN, // % de viewport/s
    sway: 1.5 + Math.random() * 4,
    phase: Math.random() * Math.PI * 2,
    color: colors[id % colors.length],
    size: 5 + Math.random() * 7,
    rot: Math.random() * 360,
    vrot: (Math.random() - 0.5) * 220,
  }
}

// Lluvia continua e infinita: a diferencia de Confetti —que es una explosión y
// se apaga cuando la última partícula sale de pantalla— acá cada partícula que
// cruza el borde inferior vuelve a nacer arriba, así que no termina nunca
// mientras el componente esté montado.
export function ConfettiRain({ colors = BELT_COLORS }: { colors?: readonly string[] }) {
  const [particles] = useState<RainParticle[]>(() =>
    Array.from({ length: RAIN_COUNT }, (_, i) =>
      newRainParticle(i, colors, true),
    ),
  )
  const stateRef = useRef<RainParticle[]>(particles)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number | null>(null)
  const tRef = useRef(0)
  // Ídem Confetti: nodos montados una vez y `transform` escrito desde el RAF.
  // Acá además hay que reescribir el tamaño, porque una partícula que renace
  // arriba estrena tamaño (ver newRainParticle).
  const boxRef = useRef<HTMLDivElement | null>(null)
  const nodesRef = useRef<(HTMLDivElement | null)[]>([])
  const [bases] = useState(() =>
    particles.map((p) => ({ x: p.x + Math.sin(p.phase) * p.sway, y: p.y })),
  )
  const sizesRef = useRef(particles.map((p) => p.size))
  // Se monta junto con la explosión pero no corre ni se dibuja hasta que pasa
  // la espera: así el componente puede vivir atado a su fase y el retraso queda
  // acá adentro, sin timers en cada lugar donde se usa.
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), RAIN_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!started) return
    let width = window.innerWidth
    let height = window.innerHeight
    const measure = () => {
      const rect = boxRef.current?.getBoundingClientRect()
      width = rect?.width ?? window.innerWidth
      height = rect?.height ?? window.innerHeight
    }
    measure()
    window.addEventListener("resize", measure)

    const paint = () => {
      for (const p of stateRef.current) {
        const el = nodesRef.current[p.id]
        if (!el) continue
        if (sizesRef.current[p.id] !== p.size) {
          sizesRef.current[p.id] = p.size
          el.style.width = `${p.size}px`
          el.style.height = `${p.size}px`
        }
        const left = p.x + Math.sin(tRef.current + p.phase) * p.sway
        const dx = ((left - bases[p.id].x) / 100) * width
        const dy = ((p.y - bases[p.id].y) / 100) * height
        el.style.transform = `translate(${dx}px, ${dy}px) rotate(${p.rot}deg)`
      }
    }

    const animate = (ts: number) => {
      if (lastRef.current === null) lastRef.current = ts
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05)
      lastRef.current = ts
      tRef.current += dt
      stateRef.current = stateRef.current.map((p) => {
        const ny = p.y + p.vy * dt
        if (ny > 110) return newRainParticle(p.id, colors, false)
        return { ...p, y: ny, rot: p.rot + p.vrot * dt }
      })
      paint()
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener("resize", measure)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [bases, colors, started])

  if (!started) return null

  return (
    <div
      ref={boxRef}
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      {particles.map((p, i) => (
        <div
          key={p.id}
          ref={(el) => {
            nodesRef.current[p.id] = el
          }}
          className="absolute rounded-[2px]"
          style={{
            // El vaivén va en el transform y no en el estado para que la caída
            // sea una función pura del tiempo: sin acumular deriva ni salirse
            // de pantalla por más que la partícula viva indefinidamente.
            left: `${bases[i].x}%`,
            top: `${bases[i].y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            mixBlendMode: "screen",
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  )
}
