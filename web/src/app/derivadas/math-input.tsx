"use client"

// Wrapper del <math-field> de MathLive. Creación imperativa (createElement +
// append) en vez de JSX: evita pelearse con los tipos del custom element y
// garantiza que toda la configuración ocurre antes del primer render del
// campo. MathLive se importa dinámicamente para que su bundle (~700KB) no
// entre en ninguna otra ruta.

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react"

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

// Cartel del campo vacío. El texto lo pone cada layout porque la respuesta
// correcta depende del aparato: en escritorio lo natural es tipear —la botonera
// queda para lo que no se sabe escribir, como x²— y en el teléfono no hay
// teclado físico, y encima el campo tiene `inputmode="none"`, así que tocarlo no
// abre el del sistema y sin el cartel parece que no hiciera nada.
//
// El cartel lo dibujamos nosotros y no MathLive: su propiedad `placeholder`
// existe en la 0.110 pero no renderiza nada (probado con LaTeX pelado, con
// \text{} y con y sin foco: `.ML__placeholder` nunca aparece en el shadow DOM).
// Los tips de escritorio rotan por ejercicio. Todos salen de las tablas que
// MathLive expone en la instancia viva —`keybindings` e `inlineShortcuts`— y no
// de la documentación:
//
//   ^          exponente (LaTeX puro: "x^2" parsea a Power)
//   /          keybinding en modo math -> \frac{#@}{#?}, el token de antes
//              queda de numerador
//   Tab        keybinding -> moveToNextGroup, salta al hueco siguiente
//   sqrt       inline shortcut -> \sqrt{#?}
//   sen tg     inline shortcuts nuestros (ver más abajo) -> \operatorname{...}
//   cos ln pi  inline shortcuts que ya trae MathLive
//
// Si alguna vez se cambia `inlineShortcuts` o el teclado del juego, revisar que
// estos textos sigan siendo ciertos: un tip que miente es peor que ninguno.
// Los que enseñan a escribir algo se sirven solo cuando ese algo está en juego:
// el de la raíz no aparece en f(x)=4x³, donde no significa nada y encima gasta
// el turno de uno que sí serviría.
//
// La condición se mide contra las teclas que el ejercicio muestra
// (`exercise.keys`) y NO contra las que la derivada realmente exige. Es a
// propósito: el backend arma esa fila con lo necesario MÁS un par de
// distractores plausibles, justamente para que no sea la respuesta servida (ver
// game/keyboard.py). Pedirle al server las teclas exigidas volvería exacto el
// filtro, pero el tip pasaría a delatar cuáles de las que se ven son de verdad
// —"escribí sqrt" sobre una fila con √ y ÷ dice que la raíz va— y eso tira abajo
// la razón de ser de los distractores. Atado a lo visible, el tip nunca dice más
// de lo que el teclado ya muestra: enseña a escribir una tecla que está ahí.
type Tip = { text: string; needs?: readonly string[] }

// Todas las teclas dinámicas cuyo LaTeX abre por lo menos un hueco `#?`, que es
// lo que hace útil a Tab. `sq` no está: inserta □² sin dejar nada que completar.
const CON_HUECOS = ["pow", "sqrt", "frac", "log", "expx", "ln", "sen", "cos", "tg"] as const

export const DESKTOP_TIPS: readonly Tip[] = [
  { text: "Tip: Usá tu teclado, es mucho más rápido 🏃" },
  { text: "Tip: Enter revisa, Shift+Enter saltea ↩️" },
  { text: "Tip: Para el exponente, escribí x^2 ⬆️", needs: ["pow", "sq"] },
  { text: "Tip: La barra / te arma la fracción ➗", needs: ["frac"] },
  { text: "Tip: Escribí sqrt y brota la raíz 🌱", needs: ["sqrt"] },
  { text: "Tip: sen, cos y tg se escriben tal cual 📐", needs: ["sen", "cos", "tg"] },
  { text: "Tip: Tab te lleva al próximo hueco ⏭️", needs: CON_HUECOS },
]

// Cuántos ejercicios se sostiene el primer tip antes de empezar a rotar: el que
// invita a soltar el mouse es el único que hay que ver sí o sí, y quien recién
// llega no sabe todavía que puede tipear.
const PRIMER_TIPS = 3

export function tipFor({
  seed,
  attempted,
  keys,
}: {
  seed: number
  attempted: number
  keys: readonly string[]
}): string {
  if (attempted < PRIMER_TIPS) return DESKTOP_TIPS[0].text
  const elegibles = DESKTOP_TIPS.filter(
    (t) => !t.needs || t.needs.some((k) => keys.includes(k)),
  )
  // Nunca queda vacío: los dos primeros no piden nada.
  // El id del ejercicio como semilla: cambia en cada servida —también al
  // saltear— y no hace falta llevar la cuenta en ningún lado.
  return elegibles[Math.abs(seed) % elegibles.length].text
}

export const HINT_MOBILE = "Tocá el teclado de abajo 👇"

// Borde del campo según el feedback. Los hex son los mismos que usa el resto
// del juego (exercise-card.tsx) y que las opciones del session-runner.
const TONE_BORDER = {
  correct: "#22C55E",
  wrong: "#E3690B",
} as const

// El campo lo crea MathLive de forma imperativa y su borde vive en un estilo
// inline, así que el tono se aplica sobre el elemento en vez de con una clase.
// Se llama desde los dos lados —cuando cambia el tono y cuando el campo recién
// se termina de crear— porque el import es asíncrono y cualquiera de los dos
// puede llegar primero.
function applyTone(mf: Mathfield | null, tone: "correct" | "wrong" | null) {
  if (!mf) return
  mf.style.borderColor = tone ? TONE_BORDER[tone] : "var(--ring)"
}

export function MathInput({
  handleRef,
  onChange,
  onEnter,
  tone = null,
  hint,
}: {
  handleRef?: Ref<MathInputHandle>
  onChange?: (latex: string) => void
  // Qué decir cuando el campo está vacío (ver HINT_DESKTOP / HINT_MOBILE).
  hint?: string
  // `shift` distingue revisar de saltear: los dos atajos entran por la misma
  // tecla y MathLive es dueño del keydown mientras el campo tiene el foco.
  onEnter?: (opts: { shift: boolean }) => void
  tone?: "correct" | "wrong" | null
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const fieldRef = useRef<Mathfield | null>(null)
  const onChangeRef = useRef(onChange)
  const onEnterRef = useRef(onEnter)
  const toneRef = useRef(tone)
  useEffect(() => {
    onChangeRef.current = onChange
    onEnterRef.current = onEnter
    toneRef.current = tone
    applyTone(fieldRef.current, tone)
  })

  // Si el campo está vacío, para saber si va el cartel. Se recalcula también
  // después de cada comando imperativo: `deleteBackward` puede dejarlo vacío y
  // `clear()` asigna `.value` directo, que no siempre dispara `input`.
  const [empty, setEmpty] = useState(true)
  const syncEmpty = () => setEmpty((fieldRef.current?.getValue("latex") ?? "").trim() === "")

  useImperativeHandle(handleRef, () => ({
    insert: (latex: string) => {
      fieldRef.current?.executeCommand(["insert", latex])
      fieldRef.current?.focus()
      syncEmpty()
    },
    command: (cmd: string) => {
      fieldRef.current?.executeCommand(cmd)
      fieldRef.current?.focus()
      syncEmpty()
    },
    getLatex: () => fieldRef.current?.getValue("latex") ?? "",
    clear: () => {
      if (fieldRef.current) fieldRef.current.value = ""
      setEmpty(true)
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
      // Los huecos `#?` de las teclas dinámicas (√□, □², ln(□)) se dibujan como
      // \placeholder: el default de MathLive es un azul propio al 40% que no es
      // de ninguna paleta de acá.
      mf.style.setProperty("--placeholder-color", "var(--muted-foreground)")
      mf.style.setProperty("--placeholder-opacity", "0.75")
      mf.style.setProperty("--selection-background-color", "color-mix(in oklab, var(--primary) 35%, transparent)")
      mf.style.setProperty("--contains-highlight-background-color", "transparent")
      // Los dos botones que MathLive dibuja adentro del campo (abrir su teclado
      // virtual y su menú) no van: el teclado es el nuestro y el menú no ofrece
      // nada útil acá. `menuItems = []` vacía el menú pero deja el botón, así
      // que hay que esconderlos por CSS — viven en el shadow DOM y solo se
      // llegan por ::part.
      mf.classList.add("game-mathfield")

      mf.addEventListener("input", () => {
        const latex = mf.getValue("latex")
        setEmpty(latex.trim() === "")
        onChangeRef.current?.(latex)
      })
      mf.addEventListener("keydown", (ev) => {
        const e = ev as KeyboardEvent
        if (e.key !== "Enter") return
        // Sin preventDefault, MathLive mete un salto de línea en el campo.
        // stopPropagation evita el doble disparo: el layout escucha el mismo
        // atajo en `document` para que Enter funcione aunque el foco se haya
        // ido del campo (después de responder, por ejemplo).
        e.preventDefault()
        e.stopPropagation()
        onEnterRef.current?.({ shift: e.shiftKey })
      })

      host.replaceChildren(mf)
      applyTone(mf, toneRef.current)
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
      {/* El cartel va FUERA del div del campo: ese nodo lo maneja MathLive con
          `replaceChildren`, así que cualquier hijo que ponga React ahí lo
          borraría al montar. */}
      <div className="relative">
        <div ref={hostRef} className="min-h-[3.4rem]" aria-label="Tu derivada" />
        {empty && hint && (
          <span
            aria-hidden
            // `left-5` y no el padding del campo (0.75rem): así el cartel
            // arranca después del cursor en vez de abajo de él.
            className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-sm text-muted-foreground/70"
          >
            {hint}
          </span>
        )}
      </div>
    </>
  )
}
