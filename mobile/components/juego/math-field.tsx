// El campo de la respuesta, del lado nativo. Envuelve al DOM component
// (math-field.dom.tsx) y le pone lo que el WebView no puede resolver solo:
//
//   · El alto. `matchContents` no mide bien con @expo/dom-webview, así que el
//     DOM avisa su alto y se aplica como `containerStyle` con `flex: 0` (el
//     contenedor trae `flex: 1` y le gana al alto).
//   · La cola. Los métodos imperativos de un DOM component recién existen
//     cuando la página se registró; lo que se mande antes se perdería, así que
//     se guarda y se manda al estar listo.
//   · El valor. Un método imperativo no devuelve nada, así que `getLatex()` lee
//     la última copia que mandó el DOM.
//
// Se monta UNA vez por pantalla y vive entre ejercicios (`clear()` al cambiar);
// `oculto` lo deja montado y caliente sin dibujarlo, para armarlo antes de que
// llegue el primer ejercicio.

import { useImperativeHandle, useRef, useState, type Ref } from "react"
import { View, type StyleProp, type ViewStyle } from "react-native"
import type { TonoDelCampo } from "@intervalo/dx-core/juego/campo-matematico"
import { accionDeTecla, type Key } from "@intervalo/dx-core/juego/teclado"
import MathFieldDom, { type MathFieldDomHandle, type ValorDelCampo } from "./math-field.dom"

/** Mismo contrato que `MathInputHandle` de la web, más `press` (una tecla del
 *  teclado nativo tal cual) y `setValue`. */
export type MathFieldHandle = {
  insert: (latex: string) => void
  command: (cmd: string) => void
  getLatex: () => string
  clear: () => void
  setValue: (latex: string) => void
  focus: () => void
  press: (key: Key) => void
}

export type MathFieldReady = {
  // ms del reloj del host desde que se montó `MathField` hasta que avisó.
  mountToReadyMs: number
  // ms del reloj del WebView desde que arrancó su página.
  domMs: number
}

// 80 px: el `min-h-20` de la web (exercise-card.tsx :: CAMPO_MIN_H). Es el
// alto antes del primer aviso, para que el teclado de abajo no salte.
const ALTO_INICIAL = 80

type Pendiente = { metodo: keyof MathFieldDomHandle; arg?: string }

export function MathField({
  ref,
  tone = null,
  hint,
  autoFocus = true,
  oculto = false,
  onChange,
  onEnter,
  onReady,
  style,
}: {
  ref?: Ref<MathFieldHandle>
  tone?: TonoDelCampo
  hint?: string
  autoFocus?: boolean
  oculto?: boolean
  // Solo lo que cambia la persona, como la web: `clear` y `setValue` no avisan.
  onChange?: (latex: string) => void
  // Enter de un teclado físico (iPad). `skip` es Alt+Enter.
  onEnter?: (opts: { skip: boolean }) => void
  onReady?: (info: MathFieldReady) => void
  style?: StyleProp<ViewStyle>
}) {
  const domRef = useRef<MathFieldDomHandle>(null)
  const [alto, setAlto] = useState(ALTO_INICIAL)
  const listoRef = useRef(false)
  const colaRef = useRef<Pendiente[]>([])
  const latexRef = useRef("")
  const montadoEnRef = useRef(performance.now())

  const mandar = (p: Pendiente) => {
    const dom = domRef.current
    if (!listoRef.current || !dom) {
      // Un `clear` o `setValue` pisa todo lo anterior que no se mandó.
      if (p.metodo === "clear" || p.metodo === "setValue") colaRef.current = []
      colaRef.current.push(p)
      return
    }
    if (p.arg === undefined) dom[p.metodo]()
    else dom[p.metodo](p.arg)
  }

  useImperativeHandle(ref, () => ({
    insert: (latex) => mandar({ metodo: "insert", arg: latex }),
    command: (cmd) => mandar({ metodo: "command", arg: cmd }),
    getLatex: () => latexRef.current,
    clear: () => {
      latexRef.current = ""
      mandar({ metodo: "clear" })
    },
    setValue: (latex) => {
      latexRef.current = latex
      mandar({ metodo: "setValue", arg: latex })
    },
    focus: () => mandar({ metodo: "focus" }),
    press: (key) => {
      const accion = accionDeTecla({ key })
      if (accion?.tipo === "clear") {
        latexRef.current = ""
        mandar({ metodo: "clear" })
        mandar({ metodo: "focus" })
      } else if (accion?.tipo === "cmd") mandar({ metodo: "command", arg: accion.cmd })
      else if (accion?.tipo === "insert") mandar({ metodo: "insert", arg: accion.latex })
    },
  }))

  return (
    <View
      style={[style, oculto && { position: "absolute", opacity: 0, left: -10000 }]}
      pointerEvents={oculto ? "none" : "auto"}
    >
      <MathFieldDom
        ref={domRef}
        tone={tone}
        hint={hint}
        autoFocus={autoFocus}
        dom={{
          containerStyle: { flex: 0, height: alto },
          scrollEnabled: false,
          bounces: false,
          // La barra gris de «‹ › Listo» que iOS pone arriba del teclado del
          // sistema. El teclado no sale (inputmode=none), pero la barra sí
          // saldría sola con el foco en un editable.
          hideKeyboardAccessoryView: true,
          style: { backgroundColor: "transparent" },
        }}
        onValue={async ({ latex, user }: ValorDelCampo) => {
          latexRef.current = latex
          if (user) onChange?.(latex)
        }}
        onEnter={async (skip) => onEnter?.({ skip })}
        onHeight={async (h) => setAlto(h)}
        onReady={async ({ domMs, height }) => {
          if (height > 0) setAlto(height)
          listoRef.current = true
          const cola = colaRef.current
          colaRef.current = []
          cola.forEach(mandar)
          onReady?.({ mountToReadyMs: performance.now() - montadoEnRef.current, domMs })
        }}
      />
    </View>
  )
}
