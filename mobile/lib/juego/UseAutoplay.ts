// Solo en desarrollo: juega solo, para probar el flujo en el simulador sin
// tocar la pantalla (`xcrun simctl` no toca). Se abre con
// `derivadas://?auto=1`. Usa los mismos caminos que el dedo: las teclas entran
// por `onKey` y los botones llaman a sus mismos handlers. Las herramientas de la
// portada y las diapos de después de responder (ranking, el @, reglas,
// novedades, «próximamente») se pasan con `continuar`, que toca su Continuar o
// Seguir; el @ se deja como está, y el perfil y el registro se saltean con su
// «Ahora no»: nunca se abre Google.
//
// Habla con dos cosas del host, si están: el backend local (la respuesta
// esperada sale de una ruta de desarrollo, `/__dev/respuesta/<id>`) y un
// ayudante en el puerto 8797 que saca la captura cuando se la pide. Sin el
// ayudante, sigue igual y solo deja el log.

import { useEffect, type RefObject } from "react"
import { LogBox } from "react-native"
import { CLEAR_KEY, FIJA_A_TECLAS, type Key } from "@intervalo/dx-core/juego/teclado"
import { env } from "@/lib/env"

export type EstadoDelJuego = {
  slide: string
  // El conteo de XP del ranking sigue corriendo.
  contando: boolean
  exerciseId: number | null
  tone: "correct" | "wrong" | null
  closed: boolean
  ocupado: boolean
  startDisabled: boolean
  porqueListo: boolean
  montajes: number
  statsDisponibles: boolean
}

export type ControlDelJuego = {
  estado: () => EstadoDelJuego
  tecla: (key: Key) => void
  escribir: (latex: string) => void
  principal: () => void
  saltear: () => void
  tabla: () => void
  porque: () => void
  // Los botones de la cabecera; `volver` también cierra la configuración.
  configuracion: () => void
  estadisticas: () => void
  chat: () => void
  volver: () => void
  continuar: () => void
}

const AYUDANTE = "http://localhost:8797"

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms))
const log = (...args: unknown[]) => console.log("[auto]", ...args)

export function useAutoplay({
  auto,
  control,
}: {
  auto?: string
  control: RefObject<ControlDelJuego | null>
}) {
  useEffect(() => {
    if (!__DEV__ || !auto) return
    // Las capturas salen sin los avisos de LogBox tapando el pie (los errores
    // siguen en la consola de Metro).
    LogBox.ignoreAllLogs(true)
    let vivo = true
    void jugar({ control, vivo: () => vivo }).catch((e) => log("se cortó:", String(e)))
    return () => {
      vivo = false
    }
  }, [auto, control])
}

async function jugar({
  control,
  vivo,
}: {
  control: RefObject<ControlDelJuego | null>
  vivo: () => boolean
}) {
  const c = () => {
    if (!vivo() || !control.current) throw new Error("sin control")
    return control.current
  }
  const esperar = async (cond: (e: EstadoDelJuego) => boolean, que: string, ms = 20000) => {
    const hasta = Date.now() + ms
    while (Date.now() < hasta) {
      if (control.current && cond(control.current.estado())) return
      await pausa(100)
    }
    throw new Error(`no llegó: ${que} (${JSON.stringify(control.current?.estado())})`)
  }
  const captura = async (nombre: string) => {
    await pausa(450)
    await fetch(`${AYUDANTE}/captura?nombre=${nombre}`).catch(() => {})
    log("captura", nombre)
  }
  const teclear = async (keys: Key[]) => {
    for (const k of keys) {
      c().tecla(k)
      await pausa(140)
    }
  }
  // Una captura por diapo nueva (`08-ranking`, `09-reglas`…), la primera vez
  // que aparece cada una.
  const capturadas = new Set<string>()
  // Las diapos que ya pasaron, capturadas o no: el juego sigue hasta el registro.
  const vistas = new Set<string>()
  const pasarPendientes = async ({ capturar = false }: { capturar?: boolean } = {}) => {
    for (;;) {
      await esperar((e) => e.slide === "exercise" || !e.ocupado, "diapo")
      if (c().estado().slide === "ranking") {
        // Que el número termine de subir antes de seguir.
        await esperar((e) => !e.contando, "fin del conteo", 15000)
        await pausa(600)
      }
      const e = c().estado()
      if (e.slide === "exercise") return
      if (capturar && !capturadas.has(e.slide)) {
        capturadas.add(e.slide)
        await captura(`${String(7 + capturadas.size).padStart(2, "0")}-${e.slide.replace(":", "-")}`)
      }
      if (e.slide === "profile") log("diapo profile · se saltea")
      else if (e.slide === "register") log("diapo register · «Ahora no», sin Google")
      else log("diapo", e.slide)
      vistas.add(e.slide)
      c().continuar()
      await esperar((d) => d.slide !== e.slide, `salir de ${e.slide}`, 8000)
      await pausa(400)
    }
  }
  const responderBien = async () => {
    const id = c().estado().exerciseId
    const { expected: esperada, latex } = await respuesta(id)
    const teclas = esperada === null ? null : teclasDe(esperada)
    log("ejercicio", id, "esperada", esperada, teclas ? "(teclas)" : `(setValue ${latex})`)
    c().tecla(CLEAR_KEY)
    if (teclas) await teclear(teclas)
    else if (latex !== null) c().escribir(latex)
    await pausa(300)
    c().principal()
    await esperar((e) => e.closed, "correcto")
  }

  await esperar((e) => e.slide === "intro" && !e.startDisabled, "portada")
  await captura("01-intro")
  c().continuar()
  await esperar((e) => e.slide !== "intro", "salir de la portada")
  await pasarPendientes()
  await esperar((e) => e.exerciseId !== null && e.montajes > 0, "primer ejercicio")
  await pausa(1000)
  await captura("02-ejercicio-vacio")

  // Una errada, por el teclado: un dígito que no sea la respuesta.
  const esperada1 = (await respuesta(c().estado().exerciseId)).expected
  const mal = esperada1?.trim() === "2" ? "3" : "2"
  await teclear([FIJA_A_TECLAS[`f:${mal}`][0]])
  await captura("03-respuesta-escrita")
  c().principal()
  await esperar((e) => e.tone === "wrong", "incorrecto")
  await captura("05-incorrecto")

  c().porque()
  await esperar((e) => e.slide === "porque" && e.porqueListo, "porque")
  await pausa(2500)
  await captura("07-porque")
  c().volver()
  await esperar((e) => e.slide === "exercise", "vuelta del porque")
  await pausa(500)

  c().tabla()
  await esperar((e) => e.slide === "tabla", "tabla")
  await captura("06-tabla")
  c().volver()
  await esperar((e) => e.slide === "exercise", "vuelta de la tabla")
  await pausa(500)

  await responderBien()
  await captura("04-correcto")
  c().principal()
  await esperar((e) => e.slide !== "exercise", "salir del ejercicio")
  await pasarPendientes({ capturar: true })

  // Una salteada.
  await esperar((e) => e.slide === "exercise" && !e.ocupado, "segundo ejercicio")
  const antes = c().estado().exerciseId
  await pausa(600)
  c().saltear()
  await esperar((e) => e.exerciseId !== antes && !e.ocupado, "salteado")
  log("salteado", antes, "→", c().estado().exerciseId)
  await pausa(800)

  // Hasta pasar el registro (su hito es la 10.ª correcta), con un tope.
  for (let i = 0; !vistas.has("register"); i++) {
    if (i >= 14) {
      log("el registro no salió en 14 ejercicios; sigo igual")
      break
    }
    await esperar((e) => e.slide === "exercise" && !e.ocupado, `ejercicio ${i + 3}`)
    await pausa(600)
    await responderBien()
    await pausa(500)
    c().principal()
    await esperar((e) => e.slide !== "exercise", "salir del ejercicio")
    await pasarPendientes({ capturar: true })
  }
  await esperar((e) => e.slide === "exercise" && !e.ocupado, "último")
  await pausa(600)

  // Las pantallas de la cabecera, desde el ejercicio. Nunca Google, ni cerrar
  // sesión, ni reiniciar: solo abrir, mirar y volver.
  const cabecera: { slide: string; captura: string; abrir: () => void }[] = [
    { slide: "settings", captura: "20-settings", abrir: () => c().configuracion() },
    ...(c().estado().statsDisponibles
      ? [{ slide: "stats", captura: "21-stats", abrir: () => c().estadisticas() }]
      : []),
    { slide: "chat", captura: "22-chat", abrir: () => c().chat() },
  ]
  for (const p of cabecera) {
    log("cabecera", p.slide)
    p.abrir()
    await esperar((e) => e.slide === p.slide, p.slide)
    await pausa(1500)
    await captura(p.captura)
    c().volver()
    await esperar((e) => e.slide === "exercise", `vuelta de ${p.slide}`)
    await pausa(500)
  }
  log("listo · montajes del campo:", c().estado().montajes)
  await fetch(`${AYUDANTE}/fin?montajes=${c().estado().montajes}`).catch(() => {})
}

// `expected` es la derivada como la guarda el server (sympy); `latex`, la
// misma pasada por `sympy.latex`.
async function respuesta(id: number | null): Promise<{ expected: string | null; latex: string | null }> {
  const nada = { expected: null, latex: null }
  if (id === null) return nada
  try {
    const r = await fetch(`${env.apiUrl}/__dev/respuesta/${id}`)
    return (await r.json()) as { expected: string | null; latex: string | null }
  } catch {
    return nada
  }
}

// Una respuesta que se escribe solo con números, x, +, -, * y paréntesis va
// tecla por tecla; cualquier otra cosa (potencias, fracciones, funciones)
// entra con `setValue`.
function teclasDe(expr: string): Key[] | null {
  if (expr.includes("**") || expr.includes("/")) return null
  const tokens = expr.replace(/\s+/g, "")
  const keys: Key[] = []
  for (const t of tokens) {
    const fija =
      t === "(" || t === ")" ? FIJA_A_TECLAS["f:()"][t === "(" ? 0 : 1] : FIJA_A_TECLAS[`f:${t}`]?.[0]
    if (!fija) return null
    keys.push(fija)
  }
  return keys
}
