"use client"

// El cartel del tope diario: lo que ocupa el lugar del ejercicio cuando no
// quedan derivadas por hoy.
//
// **No es una diapo de la escalera de pedidos y por eso no se parece a ninguna.**
// Las de cafecito, reclutas o instalar interrumpen algo que estaba pasando y
// tienen salida; ésta ES lo que está pasando. Mientras el cupo esté agotado, el
// juego vuelve acá: del ranking se vuelve, de la tabla se vuelve, y de recargar
// la página también (el estado viaja en `GamePlayerOut.muro`).
//
// **El tono es de felicitación y no de corte, y eso está medido**: llegar a 30
// resueltas en un día es más de lo que el 82,6% de los jugadores hizo en su
// mejor día (1.285 de 1.555 al 26/09). No es un consuelo escrito para tapar un
// muro: es el dato, y la persona que lo lee acaba de hacer algo que casi nadie
// hace.
//
// Los dos botones están en el orden que pidió el producto y no en el de
// costumbre: primero el de esperar, y el dorado ABAJO. En todas las demás diapos
// la acción de color va arriba y la salida gris en el pie; acá el pie lleva la
// acción que cuesta plata. Es deliberado: la opción por default tiene que ser
// la gratis, y la que cuesta tiene que estar donde el pulgar la encuentra pero
// después de haber leído que mañana vuelve gratis.

import { useEffect, useRef, useState } from "react"
import { motion, useIsPresent, useReducedMotion } from "motion/react"
import { Coffee } from "lucide-react"
import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"

import { KeyCap } from "./exercise-card"
import { useCta } from "./game-telemetry"
import { readTopeVisto, saveTopeVisto } from "./game-storage"
import { Salida } from "./slide-salida"
import { enCampoDeTexto, useTeclas } from "./teclas"
import type { GameMuro } from "./UseGamePlayer"

// Cuántos segundos está apagado el botón de esperar, la PRIMERA vez del día.
//
// Cinco y no los diez del cafecito: allá la espera existe para que el pedido se
// lea antes de descartarlo, y acá lo que hay para leer es más corto. En los
// rebotes siguientes no se cobra —se sale del ranking y se vuelve acá muchas
// veces, y repetir la traba a la tercera vuelta la convierte en un peaje—.
const ESPERA_S = 5

/** Un identificador del día de juego al que pertenece este cupo, "AAAA-MM-DD".
 *
 *  **No es la fecha de hoy del aparato, y no puede serlo.** El «hoy» del juego
 *  es el de Buenos Aires (game/router.py :: `_inicio_del_dia`), así que alguien
 *  jugando desde Madrid tiene un día de calendario distinto del cupo que se le
 *  renueva. Lo que se hace acá es sumarle al instante actual los segundos que el
 *  SERVIDOR dice que faltan hasta la próxima medianoche argentina: el resultado
 *  es el mismo instante para todo el mundo que esté bloqueado en el mismo día de
 *  juego, sin importar desde dónde mire ni qué hora tenga puesta.
 *
 *  Se usa como clave de «ya mostré el cartel hoy», y lo único que necesita es
 *  ser estable dentro del día y distinto entre días. Sin bloqueo no hay cupo del
 *  que hablar y devuelve vacío. */
export function diaDelCupo(libreEnSegundos: number | null | undefined): string {
  if (!libreEnSegundos) return ""
  return new Date(Date.now() + libreEnSegundos * 1000).toISOString().slice(0, 10)
}

/** «6 h 12 min», «48 min», «1 min». Sin segundos: el número corre solo en
 *  pantalla y ver los segundos bajar invita a quedarse mirándolos, que es
 *  exactamente lo contrario de lo que este cartel quiere. */
function faltan(segundos: number): string {
  const total = Math.max(0, Math.ceil(segundos / 60))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

export function TopePanel({
  muro,
  dia,
  onEsperar,
  onSeguir,
  slotSalida,
  slotAccion,
  keyboard = false,
  fullBleed = false,
  className,
}: {
  /** El estado del tope, tal como lo mandó el servidor. */
  muro: GameMuro
  /** El día del juego (hora argentina) al que pertenece este cupo, "AAAA-MM-DD".
   *  Lo usa la guarda de «una impresión por día»: sin él, el cliente tendría que
   *  decidir cuándo empieza el día con su propio reloj, y quien juega desde otro
   *  huso tendría un día distinto del ranking con el que se compara. */
  dia: string
  /** Al ranking. Se vuelve acá desde allá mientras el cupo siga agotado. */
  onEsperar: () => void
  /** A la diapo del cafecito, con el trigger `tope`. */
  onSeguir: () => void
  slotSalida?: HTMLElement | null
  slotAccion?: HTMLElement | null
  keyboard?: boolean
  fullBleed?: boolean
  className?: string
}) {
  const cta = useCta()
  const sfx = useSfx()
  const teclas = useTeclas()
  const reduce = useReducedMotion()

  // Si es la primera vez del día, la espera se cobra; si se está volviendo del
  // ranking, no. Se resuelve UNA vez al montar y se guarda en estado: leerlo en
  // cada render haría que el botón se prendiera solo al guardar la marca.
  const [primera] = useState(() => readTopeVisto() !== dia)
  const [resta, setResta] = useState(() => (primera ? ESPERA_S : 0))
  const listo = resta === 0

  useEffect(() => {
    if (!primera) return
    // La impresión se anota una sola vez por día por persona, que es lo que
    // hace que el CTR del experimento signifique algo: con el rebote al ranking
    // este componente se monta muchas veces por día.
    // `useCta` ya emite `game_cafecito_impression` con `placement: "muro"`,
    // así que no hace falta un evento propio: en PostHog el cartel se corta
    // por lugar igual que los otros cinco.
    cta("cafecito", "impression", { placement: "muro", solved: muro.hechas_hoy })
    saveTopeVisto(dia)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (resta === 0) return
    const t = setInterval(() => setResta((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [resta])

  // La cuenta regresiva hasta la medianoche. Arranca del número del servidor y
  // baja sola: pedirlo de nuevo cada minuto sería una llamada por minuto para
  // mover un texto.
  const [faltaS, setFaltaS] = useState(muro.libre_en_segundos ?? 0)
  useEffect(() => {
    setFaltaS(muro.libre_en_segundos ?? 0)
  }, [muro.libre_en_segundos])
  useEffect(() => {
    const t = setInterval(() => setFaltaS((s) => Math.max(0, s - 30)), 30_000)
    return () => clearInterval(t)
  }, [])

  const seguir = () => {
    sfx.select()
    cta("cafecito", "click", { placement: "muro", solved: muro.hechas_hoy })
    onSeguir()
  }

  // Los dos por ref, por lo mismo que la diapo de opinión: el listener vive en
  // `document` y las funciones se redefinen en cada render.
  const seguirRef = useRef(seguir)
  const esperarRef = useRef(onEsperar)
  useEffect(() => {
    seguirRef.current = seguir
    esperarRef.current = onEsperar
  })
  const listoRef = useRef(listo)
  useEffect(() => {
    listoRef.current = listo
  })

  // Saliendo no escucha: la diapo sigue montada mientras se funde (o se
  // desliza, en el teléfono) y un Enter en ese rato era suyo otra vez.
  const presente = useIsPresent()
  useEffect(() => {
    if (!keyboard || !presente) return
    const onKey = (e: KeyboardEvent) => {
      if (enCampoDeTexto(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault()
        seguirRef.current()
        return
      }
      if (e.key === "Enter") {
        e.preventDefault()
        // El Enter no puede saltear la espera: si pudiera, los cinco segundos
        // existirían solo para el mouse.
        if (listoRef.current) esperarRef.current()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [keyboard, presente])

  const esperar = (
    <button
      type="button"
      disabled={!listo}
      onClick={() => {
        sfx.select()
        posthog.capture("game_tope_esperar")
        onEsperar()
      }}
      className={cn(
        "flex w-full items-center justify-center rounded-md border border-border",
        "text-base font-medium text-muted-foreground transition-colors",
        "hover:bg-accent/30 disabled:opacity-60",
        slotSalida ? "h-[var(--cta-h)]" : "px-4 py-3",
      )}
    >
      {listo ? "Esperar hasta mañana" : `Esperar hasta mañana (${resta})`}
      {keyboard && listo && <KeyCap>{teclas.enter}</KeyCap>}
    </button>
  )

  const continuar = (
    <motion.button
      type="button"
      onClick={seguir}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-md px-4 py-3",
        "text-base font-semibold transition-opacity hover:opacity-90",
        slotAccion && "h-[var(--cta-h)] px-4 py-0",
      )}
      // El dorado del extremo de la rampa de café, el mismo que pinta el botón
      // de pagar cuando el slider está al máximo. Que sean el mismo color no es
      // casualidad: es el hilo que une este botón con la pantalla a la que lleva.
      style={{ backgroundColor: "#EABB74", color: "#1D1206" }}
    >
      Continuar derivando ahora
      <Coffee size={18} />
      {keyboard && <KeyCap>{teclas.shiftEnter}</KeyCap>}
    </motion.button>
  )

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-center gap-5 p-6",
        !fullBleed && "rounded-lg border border-border bg-card",
        className,
      )}
    >
      <div className="space-y-3 text-center">
        <motion.div
          className="mx-auto w-fit"
          initial={reduce ? false : { scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
        >
          <Coffee size={34} style={{ color: "#EABB74" }} />
        </motion.div>

        <h2 className="text-2xl font-semibold">¡Sólido!</h2>

        <p className="mx-auto max-w-sm text-sm leading-relaxed">
          Resolviste{" "}
          <span className="font-semibold tabular-nums" style={{ color: "#EABB74" }}>
            {muro.hechas_hoy === 1 ? "1 derivada" : `${muro.hechas_hoy} derivadas`}
          </span>
          {/* Los minutos salen solo si el servidor pudo calcularlos. Con cero
              —una sola respuesta, o un historial raro— la frase se acorta en vez
              de decir «en 0 minutos», que se leería como una burla.

              Y el singular se escribe: visto en producción, con el cupo hecho
              rápido la frase decía «en 1 minutos». Es la misma regla que ya
              aplican `cafecito-panel.tsx` con las horas y la diapo de reclutas
              con las personas. */}
          {muro.minutos_jugando > 0 && (
            <>
              {" "}en{" "}
              <span className="font-semibold tabular-nums" style={{ color: "#EABB74" }}>
                {muro.minutos_jugando === 1 ? "1 minuto" : `${muro.minutos_jugando} minutos`}
              </span>
            </>
          )}{" "}
          hoy.{" "}
          {/* La primera vez del día se compara contra TODOS —«más que el 82,6%»—
              y en las vueltas siguientes contra los que llegaron hasta acá, por
              velocidad. El primero es un número constante (todos los que ven
              este cartel hicieron lo mismo) y repetirlo en cada rebote lo
              convertiría en ruido; el segundo cambia según lo que hizo cada uno. */}
          {primera || !muro.pct_mas_rapido ? (
            <>
              Más que el{" "}
              <span className="font-semibold tabular-nums" style={{ color: "#EABB74" }}>
                {muro.pct_mas_que.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%
              </span>{" "}
              de los jugadores en su mejor día.
            </>
          ) : (
            <>
              Más rápido que el{" "}
              <span className="font-semibold tabular-nums" style={{ color: "#EABB74" }}>
                {muro.pct_mas_rapido}%
              </span>{" "}
              de los que llegan hasta acá.
            </>
          )}
        </p>

        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Volvés a tener {muro.tope ?? 30} nuevas disponibles dentro de{" "}
          <span className="font-medium tabular-nums text-foreground">{faltan(faltaS)}</span>.
        </p>
      </div>

      {/* En el teléfono los dos botones viven adentro de la diapo, uno arriba
          del otro. En escritorio el dorado se va al pie portalado —que es donde
          el juego pone el botón que cierra una pantalla— y el de esperar se
          queda acá arriba, así que el orden se conserva en los dos layouts: la
          opción gratis primero, la que cuesta después.

          La caja se dibuja siempre: cuando los dos se portan afuera queda vacía
          y sin alto, porque el `gap` solo separa hijos que existen. */}
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <Salida slot={slotSalida}>{esperar}</Salida>
        <Salida slot={slotAccion}>{continuar}</Salida>
      </div>
    </div>
  )
}
