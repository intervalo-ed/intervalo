"use client"

// Wrapper del <math-field> de MathLive. Creación imperativa (createElement +
// append) en vez de JSX: evita pelearse con los tipos del custom element y
// garantiza que toda la configuración ocurre antes del primer render del
// campo. MathLive se importa dinámicamente para que su bundle (~700KB) no
// entre en ninguna otra ruta.

import { useEffect, useImperativeHandle, useRef, type Ref } from "react"

export type MathInputHandle = {
  insert: (latex: string) => void
  command: (cmd: string) => void
  getLatex: () => string
  clear: () => void
  focus: () => void
}

// Interfaz mínima del MathfieldElement que usamos (evita depender de los tipos
// del paquete en tiempo de build).
type Mathfield = HTMLElement & {
  value: string
  mathVirtualKeyboardPolicy: string
  menuItems: unknown[]
  inlineShortcuts: Record<string, string>
  getValue: (format?: string) => string
  executeCommand: (cmd: string | [string, ...unknown[]]) => boolean
  focus: () => void
}

export function MathInput({
  handleRef,
  onChange,
  onEnter,
}: {
  handleRef?: Ref<MathInputHandle>
  onChange?: (latex: string) => void
  onEnter?: () => void
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const fieldRef = useRef<Mathfield | null>(null)
  const onChangeRef = useRef(onChange)
  const onEnterRef = useRef(onEnter)
  useEffect(() => {
    onChangeRef.current = onChange
    onEnterRef.current = onEnter
  })

  useImperativeHandle(handleRef, () => ({
    insert: (latex: string) => {
      fieldRef.current?.executeCommand(["insert", latex])
      fieldRef.current?.focus()
    },
    command: (cmd: string) => {
      fieldRef.current?.executeCommand(cmd)
      fieldRef.current?.focus()
    },
    getLatex: () => fieldRef.current?.getValue("latex") ?? "",
    clear: () => {
      if (fieldRef.current) fieldRef.current.value = ""
    },
    focus: () => fieldRef.current?.focus(),
  }))

  useEffect(() => {
    let cancelled = false
    const host = hostRef.current
    if (!host) return

    void import("mathlive").then(({ MathfieldElement }) => {
      if (cancelled || !hostRef.current) return
      // Config global del paquete, antes de crear la primera instancia.
      const pkg = MathfieldElement as unknown as {
        fontsDirectory: string | null
        soundsDirectory: string | null
      }
      pkg.fontsDirectory = "/mathlive/fonts"
      pkg.soundsDirectory = null

      const mf = new MathfieldElement() as unknown as Mathfield
      // El teclado es el nuestro (math-keyboard.tsx); el virtual de MathLive
      // queda apagado y el del sistema operativo también.
      mf.mathVirtualKeyboardPolicy = "manual"
      mf.setAttribute("inputmode", "none")
      mf.style.width = "100%"
      mf.style.fontSize = "1.35rem"
      mf.style.padding = "0.6rem 0.75rem"
      mf.style.borderRadius = "0.5rem"
      mf.style.border = "1px solid var(--ring)"
      mf.style.background = "var(--background)"
      mf.style.color = "var(--foreground)"
      mf.style.setProperty("--caret-color", "var(--ring)")
      mf.style.setProperty("--selection-background-color", "color-mix(in oklab, var(--primary) 35%, transparent)")
      mf.style.setProperty("--contains-highlight-background-color", "transparent")
      // Los dos botones que MathLive dibuja adentro del campo (abrir su teclado
      // virtual y su menú) no van: el teclado es el nuestro y el menú no ofrece
      // nada útil acá. `menuItems = []` vacía el menú pero deja el botón, así
      // que hay que esconderlos por CSS — viven en el shadow DOM y solo se
      // llegan por ::part.
      mf.classList.add("game-mathfield")

      mf.addEventListener("input", () => {
        onChangeRef.current?.(mf.getValue("latex"))
      })
      mf.addEventListener("keydown", (ev) => {
        if ((ev as KeyboardEvent).key === "Enter") {
          ev.preventDefault()
          onEnterRef.current?.()
        }
      })

      host.replaceChildren(mf)
      // menuItems e inlineShortcuts exigen el elemento ya montado.
      mf.menuItems = []
      mf.inlineShortcuts = {
        ...mf.inlineShortcuts,
        sen: "\\operatorname{sen}",
        tg: "\\operatorname{tg}",
      }
      fieldRef.current = mf
    })

    return () => {
      cancelled = true
      fieldRef.current = null
      host.replaceChildren()
    }
  }, [])

  return (
    <>
      {/* href + precedence: React 19 lo iza al head y lo deduplica. */}
      <style href="game-mathfield" precedence="default">{`
        .game-mathfield::part(virtual-keyboard-toggle),
        .game-mathfield::part(menu-toggle) { display: none; }
      `}</style>
      <div ref={hostRef} className="min-h-[3.4rem]" aria-label="Tu derivada" />
    </>
  )
}
