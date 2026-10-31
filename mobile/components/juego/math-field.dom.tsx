"use dom"

// El campo de la respuesta: el `<math-field>` de MathLive adentro de un DOM
// component de Expo. Es el par nativo de web/src/app/derivadas/math-input.tsx y
// copia su configuración (dx-core: juego/campo-matematico.ts).
//
// Cada DOM component es un proceso WebContent propio y montarlo cuesta 0,5–2 s,
// así que este se monta UNA vez y vive entre ejercicios: un ejercicio nuevo es
// `clear()`, nunca un remontaje. Lo usa `MathField` (math-field.tsx), que es lo
// que hay que importar desde una pantalla.

import { useEffect, useRef, useState, type Ref } from "react"
import { MathfieldElement } from "mathlive"
import { useDOMImperativeHandle, type DOMImperativeFactory, type DOMProps } from "expo/dom"
import {
  ATAJOS_EN_LINEA,
  BORDE_POR_TONO,
  CAMPO_FONT_REM,
  CONTENIDO_MIN_EM,
  type TonoDelCampo,
} from "@intervalo/dx-core/juego/campo-matematico"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { mathliveFontFaceCss } from "./mathlive-fonts"

const FONT_CSS = mathliveFontFaceCss()

export interface MathFieldDomHandle extends DOMImperativeFactory {
  insert: (...args: [latex: string] | unknown[]) => void
  command: (...args: [cmd: string] | unknown[]) => void
  setValue: (...args: [latex: string] | unknown[]) => void
  clear: () => void
  focus: () => void
  blur: () => void
}

export type ValorDelCampo = {
  latex: string
  // Lo cambió la persona (tecla, toque, teclado físico) y no un `clear` o un
  // `setValue` del ejercicio nuevo.
  user: boolean
}

type Mathfield = MathfieldElement & { hasFocus: () => boolean }

/** Devuelve el foco DE VERDAD al campo. Mismo arreglo que la web
 *  (math-input.tsx :: recuperarFoco): el `focus()` de MathLive no hace nada
 *  mientras su flag `blurred` diga que ya tiene el foco, aunque el editable que
 *  recibe las teclas lo haya perdido. */
function enfocar(mf: Mathfield | null) {
  if (!mf) return
  try {
    if (document.activeElement === mf) return
    if (!mf.hasFocus()) {
      mf.focus()
      return
    }
    const sink = mf.shadowRoot?.querySelector<HTMLElement>(".ML__keyboard-sink")
    if (sink) sink.focus()
    else mf.focus()
  } catch {
    // MathLive todavía no terminó de construir su interno.
  }
}

export default function MathFieldDom({
  ref,
  tone = null,
  hint,
  autoFocus = true,
  onValue,
  onEnter,
  onReady,
  onHeight,
}: {
  ref?: Ref<MathFieldDomHandle>
  tone?: TonoDelCampo
  hint?: string
  autoFocus?: boolean
  onValue?: (valor: ValorDelCampo) => Promise<void>
  onEnter?: (skip: boolean) => Promise<void>
  // `domMs`: ms desde que arrancó la página del WebView hasta que el campo está
  // armado y con las fuentes cargadas (reloj del WebView, no del host).
  onReady?: (info: { domMs: number; height: number }) => Promise<void>
  onHeight?: (height: number) => Promise<void>
  dom?: DOMProps
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const fieldRef = useRef<Mathfield | null>(null)
  const ultimoRef = useRef("")
  const [empty, setEmpty] = useState(true)

  const cb = useRef({ onValue, onEnter, onReady, onHeight })
  cb.current = { onValue, onEnter, onReady, onHeight }

  const calentandoRef = useRef(false)
  const avisar = (user: boolean) => {
    if (calentandoRef.current) return
    const latex = fieldRef.current?.getValue("latex") ?? ""
    setEmpty(latex.trim() === "")
    if (latex === ultimoRef.current) return
    ultimoRef.current = latex
    void cb.current.onValue?.({ latex, user })
  }

  useDOMImperativeHandle(
    // `expo/dom` tipa el ref con su propia copia de @types/react.
    (ref ?? null) as Parameters<typeof useDOMImperativeHandle<MathFieldDomHandle>>[0],
    () => ({
      insert: (latex) => {
        fieldRef.current?.executeCommand(["insert", String(latex)])
        enfocar(fieldRef.current)
        avisar(true)
      },
      command: (cmd) => {
        // Los comandos que usa el teclado son selectores sin argumentos
        // (moveToNextChar, deleteBackward…); el cast es por el tipo de unión
        // cerrado de MathLive.
        fieldRef.current?.executeCommand(String(cmd) as never)
        enfocar(fieldRef.current)
        // `moveToNextGroup` sin hueco adelante le pasa el foco al elemento
        // siguiente después de este handler (ver la web).
        setTimeout(() => enfocar(fieldRef.current), 0)
        avisar(true)
      },
      setValue: (latex) => {
        if (fieldRef.current) fieldRef.current.value = String(latex)
        avisar(false)
      },
      clear: () => {
        if (fieldRef.current) fieldRef.current.value = ""
        avisar(false)
      },
      focus: () => enfocar(fieldRef.current),
      blur: () => fieldRef.current?.blur(),
    }),
    [],
  )

  useEffect(() => {
    const mf = fieldRef.current
    if (mf) mf.style.borderColor = tone ? BORDE_POR_TONO[tone] : TEMA.ring
  }, [tone])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const pkg = MathfieldElement as unknown as {
      fontsDirectory: string | null
      soundsDirectory: string | null
      keypressSound: unknown
      plonkSound: unknown
    }
    pkg.fontsDirectory = null
    pkg.soundsDirectory = null
    pkg.keypressSound = null
    pkg.plonkSound = null

    const mf = new MathfieldElement() as Mathfield
    // El teclado es el nativo (math-keyboard.tsx). El virtual de MathLive va
    // apagado, y el del sistema no sale porque el editable de MathLive ya trae
    // `inputmode=none` y el del host también (ver math-field.tsx).
    mf.mathVirtualKeyboardPolicy = "manual"
    mf.setAttribute("inputmode", "none")
    mf.style.width = "100%"
    mf.style.boxSizing = "border-box"
    mf.style.fontSize = `${CAMPO_FONT_REM}rem`
    mf.style.padding = "0.8rem 0.75rem"
    mf.style.borderRadius = "0.5rem"
    mf.style.border = `1px solid ${tone ? BORDE_POR_TONO[tone] : TEMA.ring}`
    mf.style.background = TEMA.background
    mf.style.color = TEMA.foreground
    mf.style.setProperty("--caret-color", TEMA.ring)
    mf.style.setProperty("--placeholder-color", TEMA.mutedForeground)
    mf.style.setProperty("--placeholder-opacity", "0.75")
    mf.style.setProperty("--selection-background-color", "rgba(84, 87, 229, 0.35)")
    mf.style.setProperty("--contains-highlight-background-color", "transparent")
    mf.classList.add("game-mathfield")

    mf.addEventListener("input", () => avisar(true))
    mf.addEventListener(
      "keydown",
      (ev) => {
        // Solo con teclado físico (un iPad con funda): mismos atajos que la web.
        const e = ev as KeyboardEvent
        if (e.key === "Tab" && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          e.stopPropagation()
          mf.executeCommand(e.shiftKey ? "moveToPreviousGroup" : "moveToNextGroup")
          enfocar(mf)
          return
        }
        if (e.key !== "Enter") return
        e.preventDefault()
        e.stopPropagation()
        void cb.current.onEnter?.(e.altKey)
      },
      { capture: true },
    )
    mf.addEventListener("pointerdown", () => enfocar(mf), { capture: true })

    host.replaceChildren(mf)
    mf.menuItems = []
    mf.inlineShortcuts = { ...mf.inlineShortcuts, ...ATAJOS_EN_LINEA }
    fieldRef.current = mf

    let alto = 0
    const medir = () => {
      const h = Math.ceil(host.getBoundingClientRect().height)
      if (h === alto || h === 0) return
      alto = h
      void cb.current.onHeight?.(h)
    }
    const ro = new ResizeObserver(medir)
    ro.observe(host)

    let vivo = true
    void document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        if (!vivo) return
        // La primera inserción de un MathLive recién armado tarda ~140 ms (el
        // camino de insertar y componer todavía no corrió nunca); las que
        // siguen, ~10. Se paga acá, antes de avisar que está listo, y no en la
        // primera tecla de la persona.
        calentandoRef.current = true
        mf.executeCommand(["insert", "\\cos\\left(\\frac{x^2}{\\sqrt{x}}\\right)\\cdot2"])
        mf.value = ""
        calentandoRef.current = false
        medir()
        if (autoFocus) enfocar(mf)
        void cb.current.onReady?.({ domMs: performance.now(), height: alto })
      })
    })

    return () => {
      vivo = false
      ro.disconnect()
      fieldRef.current = null
      host.replaceChildren()
    }
    // El campo se arma una sola vez: es lo que hace que no se remonte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <style>{`
        html, body { margin: 0; padding: 0; background: transparent; overflow: hidden;
          -webkit-tap-highlight-color: transparent; -webkit-user-select: none; user-select: none;
          touch-action: manipulation; -webkit-text-size-adjust: 100%; }
        :root { --ML__static-fonts: true; }
        .game-mathfield::part(virtual-keyboard-toggle),
        .game-mathfield::part(menu-toggle) { display: none; }
        .game-mathfield::part(content) { min-height: ${CONTENIDO_MIN_EM}em; }
        ${FONT_CSS}
      `}</style>
      <div ref={hostRef} aria-label="Tu derivada" />
      {empty && hint ? (
        <span
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 20,
            display: "flex",
            alignItems: "center",
            fontSize: 14,
            color: TEMA.mutedForeground,
            opacity: 0.7,
            fontFamily: "-apple-system, system-ui, sans-serif",
          }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  )
}
