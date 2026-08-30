"use client"

// Wrapper del <math-field> de MathLive. Creación imperativa (createElement +
// append) en vez de JSX: evita pelearse con los tipos del custom element y
// garantiza que toda la configuración ocurre antes del primer render del
// campo. MathLive se importa dinámicamente para que su bundle (~700KB) no
// entre en ninguna otra ruta.

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react"
import { CAMPO_MIN_H, KeyCap } from "./exercise-card"
import type { Teclas } from "./teclas"

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
// `text` puede traer el marcador {k}, que el render reemplaza por la tecla
// dibujada como tecla (el <KeyCap> del CTA). Mismo truco que las novedades del
// historial: la oración viaja con un agujero en vez de resolverse acá, porque
// una tecla es un componente y no un carácter.
//
// `caps` es una LISTA y no una tecla sola: los agujeros se llenan en orden, así
// que una frase puede nombrar dos atajos. Era una sola y por eso el tip de
// «enter revisa, alt + enter saltea» escribía los nombres como texto pelado —
// no por una decisión, sino porque no entraban dos.
//
// `needs` es otra cosa y no hay que confundirlas: son teclas del teclado en
// pantalla que tienen que estar VISIBLES para que el tip venga al caso.
type Tip = { text: string; caps?: readonly string[]; needs?: readonly string[] }

const TIP_SLOT = /(\{k\})/

// Todas las teclas dinámicas cuyo LaTeX abre por lo menos un hueco `#?`, que es
// lo que hace útil a Tab. `sq` no está: inserta □² sin dejar nada que completar.
const CON_HUECOS = [
  "pow",
  "sqrt",
  "frac",
  "log",
  "expx",
  "ln",
  "sen",
  "cos",
  "tg",
] as const

// Todos cierran con punto ANTES del emoji: la frase termina y el emoji la
// acompaña, igual que en las novedades del historial (backend/game/events.py).
//
// El de los dos atajos lleva un joystick y no la flecha del Enter: la flecha
// DIBUJA una de las dos teclas que la frase ya nombra —y encima la nombra dos
// veces, porque el chip está ahí al lado—, así que no agregaba nada. El joystick
// no representa ninguna de las dos acciones: dice «esto es cómo se maneja el
// juego», que es de lo que la frase habla. Es además el único del conjunto que
// no compite con otro: 🏃 ⬆️ ➗ 🌱 📐 👀 ⏭️ son todos objetos de la matemática o
// del movimiento.
// Función y no constante: dos de los tips nombran teclas, y en una Mac esas
// teclas se llaman distinto (teclas.ts).
export const tipsDeEscritorio = (t: Teclas): readonly Tip[] => [
  { text: "Usá tu teclado, es mucho más rápido. 🏃" },
  { text: "Tocá {k} para revisar y {k} para saltear. 🕹️", caps: [t.enter, t.altEnter] },
  { text: "Para el exponente, escribí x^2. ⬆️", needs: ["pow", "sq"] },
  { text: "La barra / te arma la fracción. ➗", needs: ["frac"] },
  { text: "Escribí sqrt y brota la raíz. 🌱", needs: ["sqrt"] },
  {
    text: "sen, cos y tan se escriben tal cual. 📐",
    needs: ["sen", "cos", "tg"],
  },
  // El único tip que enseña algo que CUESTA: la consulta baja el XP de este
  // ejercicio (ver `peeked` en desktop-layout.tsx). Se dice igual — esconder una
  // ayuda que existe no la vuelve gratis, solo la vuelve secreta.
  { text: "Mantené {k} para ver la tabla de derivadas. 👀", caps: [t.alt] },
  { text: "Tab te lleva al próximo hueco. ⏭️", needs: CON_HUECOS },
]

// Cuántos ejercicios se sostiene el primer tip antes de empezar a rotar: el que
// invita a soltar el mouse es el único que hay que ver sí o sí, y quien recién
// llega no sabe todavía que puede tipear.
const PRIMER_TIPS = 3

export function tipFor({
  seed,
  attempted,
  keys,
  teclas,
}: {
  seed: number
  attempted: number
  keys: readonly string[]
  teclas: Teclas
}): React.ReactNode {
  const TIPS = tipsDeEscritorio(teclas)
  const elegido =
    attempted < PRIMER_TIPS
      ? TIPS[0]
      : (() => {
          const elegibles = TIPS.filter(
            (t) => !t.needs || t.needs.some((k) => keys.includes(k)),
          )
          // Nunca queda vacío: los dos primeros no piden nada.
          // El id del ejercicio como semilla: cambia en cada servida —también al
          // saltear— y no hace falta llevar la cuenta en ningún lado.
          return elegibles[Math.abs(seed) % elegibles.length]
        })()

  const caps = elegido.caps
  if (!caps) return elegido.text
  // `split` con grupo de captura alterna texto y separador, así que los
  // agujeros son SIEMPRE los índices impares y el agujero número `i` es el
  // `(i-1)/2` de la lista. Sale de la forma del array y no de llevar un contador
  // mutando durante el render.
  const trozos = elegido.text.split(TIP_SLOT)
  return trozos.map((trozo, i) =>
    trozo === "{k}" ? (
      // `mx-1` y no el `ml-2` de fábrica: ese margen está pensado para cuando el
      // chip CIERRA una frase, y acá va en el medio, así que necesita aire de los
      // dos lados. Los espacios del texto solos no alcanzan — la tecla es una
      // caja con borde y queda pegada a las palabras.
      //
      <KeyCap key={i} className="mx-1">
        {caps[(i - 1) / 2]}
      </KeyCap>
    ) : (
      trozo
    ),
  )
}

// "de abajo" sobra: la flecha ya dice dónde, y ahora el teclado está en la misma
// card que este campo, justo debajo.
export const HINT_MOBILE = "Usá el teclado 👇"

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
// Piso del alto del CONTENIDO del campo, en em contra su propio tamaño de letra
// (`::part(content)`, que MathLive expone y que es un flex centrado: lo que entra
// abajo de este piso queda en el medio de la caja y no arriba).
//
// Existe porque la caja crecía sola: MathLive mide el alto de lo que hay escrito,
// y una `(` o un exponente son un par de píxeles más altos que una `x`, así que
// escribir movía la caja —y con ella el teclado de abajo— un poquito todo el
// tiempo. Con un piso, todo lo que entra en UN RENGLÓN da exactamente el mismo
// alto y la caja se queda quieta.
//
// El número está puesto entre los dos casos: una expresión de un renglón mide
// ~1,4 em y llega a ~1,7 con paréntesis y exponentes; una fracción anda por 2,4.
// A 1,9 em, lo de un renglón nunca la mueve y una fracción sí — que es
// justamente cuando hace falta el lugar.
const CONTENIDO_MIN_EM = 1.9

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
  autoFocus = false,
}: {
  handleRef?: Ref<MathInputHandle>
  onChange?: (latex: string) => void
  // Qué decir cuando el campo está vacío (ver tipFor / HINT_MOBILE). Nodo y no
  // string: los tips dibujan teclas de verdad.
  hint?: React.ReactNode
  // `skip` distingue revisar de saltear: los dos atajos entran por la misma
  // tecla y MathLive es dueño del keydown mientras el campo tiene el foco.
  onEnter?: (opts: { skip: boolean }) => void
  tone?: "correct" | "wrong" | null
  // Toma el foco apenas el campo existe. Hace falta porque este campo se
  // desmonta al acertar —su lugar lo ocupa el botón del «¿Por qué?»— y vuelve
  // con la derivada siguiente: el `focus()` que el layout dispara al recibirla
  // corre ANTES de que exista, así que iría al que se está yendo.
  autoFocus?: boolean
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const fieldRef = useRef<Mathfield | null>(null)
  const onChangeRef = useRef(onChange)
  const onEnterRef = useRef(onEnter)
  const toneRef = useRef(tone)
  const autoFocusRef = useRef(autoFocus)
  useEffect(() => {
    onChangeRef.current = onChange
    onEnterRef.current = onEnter
    toneRef.current = tone
    autoFocusRef.current = autoFocus
    applyTone(fieldRef.current, tone)
  })

  // Si el campo está vacío, para saber si va el cartel. Se recalcula también
  // después de cada comando imperativo: `deleteBackward` puede dejarlo vacío y
  // `clear()` asigna `.value` directo, que no siempre dispara `input`.
  const [empty, setEmpty] = useState(true)

  const syncEmpty = () =>
    setEmpty((fieldRef.current?.getValue("latex") ?? "").trim() === "")

  // Se publica con `useImperativeHandle`, que al desmontar deja el ref en null.
  // Eso importa cuando dos paneles conviven durante una transición y hay dos
  // campos montados a la vez: quien recibe este ref tiene que IGNORAR el null,
  // porque llega del que se va y borraría el que el otro ya publicó (ver
  // `attachInput` en desktop-layout.tsx).
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
      // El aire de la caja. Sube con CAMPO_MIN_H (exercise-card.tsx): el
      // mathfield es quien dibuja la caja, así que el alto de verdad sale de
      // acá y de CONTENIDO_MIN_EM.
      mf.style.padding = "0.8rem 0.75rem"
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
      mf.style.setProperty(
        "--selection-background-color",
        "color-mix(in oklab, var(--primary) 35%, transparent)",
      )
      mf.style.setProperty(
        "--contains-highlight-background-color",
        "transparent",
      )
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
      // EN CAPTURA, y ese detalle es el arreglo de un bug: MathLive recibe las
      // teclas en un editable que vive en su shadow DOM, o sea DEBAJO del host.
      // Escuchando en burbujeo llegábamos después de él, y para cuando corría
      // nuestro `preventDefault` el comando ya se había ejecutado: con Alt+Enter
      // —que en MathLive inserta un renglón— el salto de línea quedaba escrito en
      // el campo aunque el salteo funcionara bien. En captura pasamos antes, y el
      // `stopPropagation` hace que la tecla no le llegue nunca.
      mf.addEventListener(
        "keydown",
        (ev) => {
          const e = ev as KeyboardEvent
          if (e.key !== "Enter") return
          // stopPropagation evita además el doble disparo: el layout escucha el
          // mismo atajo en `document` para que Enter funcione aunque el foco se
          // haya ido del campo (después de responder, por ejemplo).
          e.preventDefault()
          e.stopPropagation()
          // Alt+Enter saltea. Es la misma tecla con la que se espía la tabla, y
          // eso es a propósito: Alt es "lo que hago cuando esta derivada me está
          // costando". Sin Ctrl ni ⌘, que en un campo de texto se los queda el
          // navegador (⌘+Enter abre en pestaña nueva, Ctrl+Enter envía en varios
          // clientes).
          onEnterRef.current?.({ skip: e.altKey })
        },
        { capture: true },
      )

      host.replaceChildren(mf)
      applyTone(mf, toneRef.current)
      // menuItems e inlineShortcuts exigen el elemento ya montado.
      mf.menuItems = []
      mf.inlineShortcuts = {
        ...mf.inlineShortcuts,
        sen: "\\operatorname{sen}",
        // "tan" es lo que ya entiende MathLive de fábrica; el atajo queda igual
        // para que escribir "tg" siga funcionando, que es como lo escribe medio
        // país aunque la tecla diga otra cosa.
        tan: "\\tan",
        tg: "\\tan",
      }
      fieldRef.current = mf
      if (autoFocusRef.current) mf.focus()
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
        .game-mathfield::part(content) { min-height: ${CONTENIDO_MIN_EM}em; }
      `}</style>
      {/* El cartel va FUERA del div del campo: ese nodo lo maneja MathLive con
          `replaceChildren`, así que cualquier hijo que ponga React ahí lo
          borraría al montar. */}
      <div className="relative">
        <div
          ref={hostRef}
          className={CAMPO_MIN_H}
          aria-label="Tu derivada"
        />
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
