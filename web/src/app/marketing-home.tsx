"use client"

import { useSplash } from "@/app/splash-context"
import { Wordmark } from "@/components/wordmark"
import { BELT_BAR_COLORS } from "@/lib/catalog"
import katex from "katex"
import "katex/dist/katex.min.css"
import { ChevronDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const STAGES: { name: string; color: string; exprs: string[] }[] = [
  {
    name: "Funciones",
    color: BELT_BAR_COLORS[0],
    exprs: [
      "f(x) = x^2 - 3x + 2",
      "y = \\sqrt{x^2 + 1}",
      "f(x) = \\dfrac{1}{x - 2}",
      "g(x) = e^x \\cdot \\ln(x)",
      "h(x) = \\sin(x) + \\cos(2x)",
    ],
  },
  {
    name: "Límites",
    color: BELT_BAR_COLORS[1],
    exprs: [
      "\\lim_{x \\to 0} \\dfrac{\\sin x}{x} = 1",
      "\\lim_{x \\to \\infty} \\left(1 + \\dfrac{1}{x}\\right)^x = e",
      "\\lim_{x \\to 2} \\dfrac{x^2 - 4}{x - 2}",
      "\\lim_{x \\to 0^+} \\ln(x) = -\\infty",
    ],
  },
  {
    name: "Derivadas",
    color: BELT_BAR_COLORS[2],
    exprs: [
      "f'(x) = 2x - 3",
      "\\dfrac{d}{dx}\\left[x^n\\right] = nx^{n-1}",
      "\\dfrac{\\partial f}{\\partial x}",
      "\\dfrac{dy}{dx} = \\cos(x)",
      "(fg)' = f'g + fg'",
    ],
  },
  {
    name: "Integrales",
    color: BELT_BAR_COLORS[3],
    exprs: [
      "\\int x^2 \\, dx = \\dfrac{x^3}{3} + C",
      "\\displaystyle\\int_0^1 x^2 \\, dx = \\dfrac{1}{3}",
      "\\int \\dfrac{1}{x} \\, dx = \\ln|x| + C",
      "\\displaystyle\\int_a^b f(x) \\, dx = F(b) - F(a)",
    ],
  },
]

const Q_ITEMS: {
  color: string
  t1: string
  t2: string
  t3: string
  qt: string
  q: string
}[] = [
  {
    color: BELT_BAR_COLORS[0],
    t1: "Funciones",
    t2: "Polinomios",
    t3: "Léxico",
    qt: "¿Cuál es el grado del siguiente polinomio?",
    q: "3x^4 - 2x + 1",
  },
  {
    color: BELT_BAR_COLORS[0],
    t1: "Funciones",
    t2: "Lineales",
    t3: "Formulación",
    qt: "¿Cuál es la pendiente de la siguiente función?",
    q: "y = 3x - 5",
  },
  {
    color: BELT_BAR_COLORS[0],
    t1: "Funciones",
    t2: "Cuadráticas",
    t3: "Clasificación",
    qt: "¿Cuántas raíces reales tiene la siguiente ecuación?",
    q: "x^2 - 4 = 0",
  },
  {
    color: BELT_BAR_COLORS[1],
    t1: "Límites",
    t2: "Directa",
    t3: "Resolución",
    qt: "¿Cuál es el resultado del siguiente límite?",
    q: "\\lim_{x \\to 3}(x^2 + 1)",
  },
  {
    color: BELT_BAR_COLORS[1],
    t1: "Límites",
    t2: "Notable",
    t3: "Formulación",
    qt: "¿Cuánto vale este límite notable?",
    q: "\\lim_{x \\to 0}\\dfrac{\\sin x}{x}",
  },
  {
    color: BELT_BAR_COLORS[1],
    t1: "Límites",
    t2: "Indeterm.",
    t3: "Resolución",
    qt: "¿Cuánto vale el siguiente límite?",
    q: "\\lim_{x \\to 2}\\dfrac{x^2 - 4}{x - 2}",
  },
  {
    color: BELT_BAR_COLORS[2],
    t1: "Derivadas",
    t2: "Potencia",
    t3: "Derivación",
    qt: "¿Cuál es la derivada de la siguiente función?",
    q: "f(x) = x^5",
  },
  {
    color: BELT_BAR_COLORS[2],
    t1: "Derivadas",
    t2: "Cadena",
    t3: "Derivación",
    qt: "¿Cuál es la derivada de la siguiente función compuesta?",
    q: "h(x) = (3x^2 + 1)^4",
  },
  {
    color: BELT_BAR_COLORS[2],
    t1: "Derivadas",
    t2: "Exponencial",
    t3: "Formulación",
    qt: "¿Cuál es la derivada de la siguiente función?",
    q: "f(x) = e^{2x}",
  },
  {
    color: BELT_BAR_COLORS[3],
    t1: "Integrales",
    t2: "Potencia",
    t3: "Integración",
    qt: "¿Cuál es la integral de la siguiente función?",
    q: "\\int x^4 \\, dx",
  },
  {
    color: BELT_BAR_COLORS[3],
    t1: "Integrales",
    t2: "Definida",
    t3: "Resolución",
    qt: "¿Cuánto vale la siguiente integral definida?",
    q: "\\int_0^1 x^2 \\, dx",
  },
  {
    color: BELT_BAR_COLORS[3],
    t1: "Integrales",
    t2: "Trigo",
    t3: "Formulación",
    qt: "¿Cuál es la integral de la siguiente función?",
    q: "\\int \\cos(x)\\,dx",
  },
]

const GRID_BG_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
}

function renderMath(expr: string) {
  return katex.renderToString(expr, { throwOnError: false, displayMode: true })
}

function NotationCycler() {
  const [state, setState] = useState({ stageIdx: 0, exprIdx: 0 })
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => {
        const stageIdx = (s.stageIdx + 1) % STAGES.length
        const exprIdx = Math.floor(
          Math.random() * STAGES[stageIdx].exprs.length,
        )
        return { stageIdx, exprIdx }
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const stage = STAGES[state.stageIdx]
  const expr = stage.exprs[state.exprIdx]

  return (
    <div className="flex w-[90%] max-w-[480px] flex-col items-center gap-2">
      <div className="flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[#768899]">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-[2px] transition-colors duration-300"
          style={{ background: stage.color }}
        />
        <span>{stage.name}</span>
      </div>
      <div
        className="flex h-[72px] shrink-0 items-center justify-center text-[1.45rem] leading-none text-[#F6F8FC] [&_.katex-display]:m-0"
        dangerouslySetInnerHTML={{ __html: renderMath(expr) }}
      />
    </div>
  )
}

function QuestionLoop() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % Q_ITEMS.length), 2500)
    return () => clearInterval(id)
  }, [])

  const item = Q_ITEMS[idx]

  return (
    <div className="mx-auto grid h-[160px] max-w-[600px] grid-rows-[40px_40px_40px_1fr] text-center">
      {/* Tags: 1º renglón de la grilla */}
      <div className="row-start-1 flex flex-wrap items-center justify-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-[2px] transition-colors duration-300"
          style={{ background: item.color }}
        />
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-[#768899]">
          {item.t1.toUpperCase()}
        </span>
        <span aria-hidden className="text-[0.5rem] text-[#38385A]">
          ◆
        </span>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-[#768899]">
          {item.t2.toUpperCase()}
        </span>
        <span aria-hidden className="text-[0.5rem] text-[#38385A]">
          ◆
        </span>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-[#768899]">
          {item.t3.toUpperCase()}
        </span>
      </div>
      {/* Pregunta: 3º renglón, pegada a la fórmula */}
      <div className="row-start-3 flex items-center justify-center text-[clamp(1.1rem,3.6vw,1.45rem)] leading-[1.4] text-[#F6F8FC]">
        {item.qt}
      </div>
      {/* Fórmula: arriba del espacio restante, cerca de la pregunta */}
      <div
        className="row-start-4 mx-auto flex max-w-[520px] items-start justify-center pt-2 font-medium leading-[1.5] text-[#F6F8FC] [&_.katex-display]:m-0 [&_.katex]:text-[clamp(1.25rem,4vw,1.5rem)]"
        dangerouslySetInnerHTML={{ __html: renderMath(item.q) }}
      />
    </div>
  )
}

function ProgressGrid() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const COLS = 26
    const ROWS = 40
    const TOTAL = COLS * ROWS
    const COLORS = BELT_BAR_COLORS
    const WP: number[][] = [
      [0.0, 1.0, 0.0, 0.0, 0.0, 0.0],
      [0.15, 0.8, 0.2, 0.0, 0.0, 0.0],
      [0.3, 0.5, 0.35, 0.15, 0.0, 0.0],
      [0.45, 0.25, 0.3, 0.35, 0.1, 0.0],
      [0.6, 0.1, 0.15, 0.35, 0.3, 0.1],
      [0.75, 0.05, 0.08, 0.2, 0.37, 0.3],
      [1.0, 0.02, 0.05, 0.1, 0.25, 0.58],
    ]

    function pickColor(p: number) {
      let i = 0
      while (i < WP.length - 2 && WP[i + 1][0] <= p) i++
      const t = (p - WP[i][0]) / (WP[i + 1][0] - WP[i][0])
      const probs = WP[i].slice(1).map((v, j) => v + (WP[i + 1][j + 1] - v) * t)
      const r = Math.random()
      let cum = 0
      for (let j = 0; j < probs.length; j++) {
        cum += probs[j]
        if (r < cum) return COLORS[j]
      }
      return COLORS[COLORS.length - 1]
    }

    const grid = gridRef.current
    const section = sectionRef.current
    if (!grid || !section) return

    const sqs = Array.from(grid.querySelectorAll<HTMLDivElement>(".sq"))
    const colHeights = new Array(COLS).fill(0)
    let fillIdx = 0
    let batchLeft = 0
    let pauseLeft = 0
    let batchToggle = false
    let animated = false
    let rafId = 0

    function spawnSquare() {
      const avail: number[] = []
      for (let c = 0; c < COLS; c++) {
        if (colHeights[c] < ROWS) avail.push(c)
      }
      if (!avail.length) return
      const col = avail[Math.floor(Math.random() * avail.length)]
      const row = colHeights[col]
      sqs[row * COLS + col].style.background = pickColor(fillIdx / (TOTAL - 1))
      colHeights[col]++
      fillIdx++
    }

    function step() {
      if (fillIdx >= TOTAL) return
      if (pauseLeft > 0) {
        pauseLeft--
        rafId = requestAnimationFrame(step)
        return
      }
      if (batchLeft === 0) {
        batchLeft = Math.floor(Math.random() * 6) + 15
        pauseLeft = Math.floor(Math.random() * 9) + 12
        rafId = requestAnimationFrame(step)
        return
      }
      batchToggle = !batchToggle
      if (batchToggle) {
        spawnSquare()
        batchLeft--
      }
      rafId = requestAnimationFrame(step)
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !animated) {
          animated = true
          rafId = requestAnimationFrame(step)
        }
      },
      { threshold: 0.1 },
    )
    obs.observe(section)

    return () => {
      obs.disconnect()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  const legend = [
    { color: BELT_BAR_COLORS[0], label: "Funciones" },
    { color: BELT_BAR_COLORS[1], label: "Límites" },
    { color: BELT_BAR_COLORS[2], label: "Derivadas" },
    { color: BELT_BAR_COLORS[3], label: "Integrales" },
    { color: BELT_BAR_COLORS[4], label: "Aplicaciones", border: true },
  ]

  return (
    <div ref={sectionRef} className="px-10 py-12" style={GRID_BG_STYLE}>
      <div className="mx-auto w-fit">
        <div className="mb-5 flex flex-col gap-[0.55rem]">
          {legend.map((l) => (
            <div
              key={l.label}
              className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[#768899]"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{
                  background: l.color,
                  border: l.border
                    ? "1px solid rgba(255,255,255,0.12)"
                    : undefined,
                }}
              />
              {l.label}
            </div>
          ))}
        </div>
        <div
          ref={gridRef}
          className="grid w-fit gap-px"
          style={{ gridTemplateColumns: "repeat(26, 10px)" }}
        >
          {Array.from({ length: 26 * 40 }).map((_, i) => (
            <div key={i} className="sq h-2.5 w-2.5 rounded-[1px]" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MarketingHome() {
  const { markReady } = useSplash()
  useEffect(() => markReady(), [markReady])

  return (
    <main className="bg-[#131324] font-sans text-[#F6F8FC]">
      <section
        id="hero"
        className="relative flex min-h-[100svh] flex-col items-center justify-center gap-6 overflow-hidden border-b border-[#38385A] px-5 py-10 text-center"
        style={GRID_BG_STYLE}
      >
        <Wordmark
          textClass="text-[clamp(1.7rem,6vw,2.2rem)]"
          barClass="h-[3px]"
        />

        <h1 className="font-sans text-[clamp(1.6rem,6vw,2.25rem)] font-bold leading-[1.2] tracking-[-0.01em] text-[#F6F8FC]">
          Repasá un poco todos los días.
        </h1>
        <p className="max-w-[28rem] text-[clamp(1.1rem,3.5vw,1.35rem)] leading-[1.75] text-[#A4B3C6] max-md:text-[0.93rem]">
          Ejercitá las definiciones y propiedades que tanto cuestan entender de
          forma efectiva.
        </p>
        <NotationCycler />

        <Link
          href="/onboarding"
          className="inline-flex animate-[cta-breathe_3s_ease-in-out_infinite] items-center gap-2 rounded-[4px] bg-[#5457E5] px-8 py-[0.9rem] font-mono text-[0.95rem] font-medium uppercase tracking-[0.1em] text-[#F6F8FC] transition-[transform,background] duration-150 hover:-translate-y-0.5 hover:animate-none hover:bg-[#7E80F7] hover:shadow-[0_10px_36px_rgba(84,87,229,0.4)] active:translate-y-0 max-md:w-full max-md:max-w-[340px] max-md:justify-center max-md:px-8 max-md:py-4 max-md:text-base"
        >
          Probar ahora
        </Link>
        <div className="flex items-center text-[#768899] opacity-60">
          <ChevronDown className="size-[34px] animate-[bounce-down_1.8s_ease-in-out_infinite]" />
        </div>

        <style>{`
          @keyframes cta-breathe {
            0%, 100% { box-shadow: 0 4px 20px rgba(84,87,229,0.25), 0 0 0 0 rgba(84,87,229,0.2); }
            50% { box-shadow: 0 8px 32px rgba(84,87,229,0.40), 0 0 0 10px rgba(84,87,229,0); }
          }
          @keyframes bounce-down {
            0%, 100% { transform: translateY(0); opacity: 0.4; }
            50% { transform: translateY(6px); opacity: 1; }
          }
        `}</style>
      </section>

      <section className="border-b border-[#38385A] bg-[#1A1A2A] px-6 py-16">
        <div className="mx-auto flex max-w-[960px] flex-col gap-4">
          <h2 className="max-w-[28rem] font-sans text-[clamp(1.6rem,6vw,2.25rem)] font-bold leading-[1.2] tracking-[-0.01em] text-[#F6F8FC]">
            Mantenete en contacto constante con los contenidos
          </h2>
          <p className="max-w-[26rem] text-[clamp(0.95rem,3vw,1.1rem)] leading-[1.7] text-[#A4B3C6]">
            Un repositorio de ejercicios enfocado en los conceptos
            fundamentales, organizado por niveles, temas y habilidades.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20 pt-10" style={GRID_BG_STYLE}>
        <QuestionLoop />
      </section>

      <section className="border-y border-[#38385A] bg-[#1A1A2A] px-6 py-12">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-2.5 font-sans text-[clamp(1.45rem,5vw,2rem)] font-bold leading-[1.2] tracking-[-0.01em] text-[#F6F8FC]">
            Progreso acorde al plan de estudios
          </h2>
          <p className="max-w-[520px] text-[clamp(0.875rem,2.5vw,1rem)] leading-[1.75] text-[#A4B3C6]">
            Un sistema que incorpora contenido nuevo a medida que lo anterior se
            consolida, logrando un progreso orgánico que prioriza lo que más
            necesitás reforzar.
          </p>
        </div>
      </section>

      <ProgressGrid />

      <footer>
        <div className="flex flex-col items-center gap-5 bg-[#7E80F7] px-6 py-16 text-center">
          <h2 className="max-w-[28rem] font-sans text-[clamp(1.5rem,4vw,2rem)] font-semibold leading-[1.25] text-[#131324]">
            No pierdas lo que ya entendiste.
          </h2>
          <p className="text-[0.875rem] text-[rgba(19,19,36,0.65)]">
            Repasá de forma inteligente haciendo un poco todos los días.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/about"
              className="inline-flex h-[52px] items-center justify-center rounded-[4px] border-[1.5px] border-[rgba(19,19,36,0.35)] px-8 font-mono text-[0.9rem] font-medium uppercase tracking-[0.1em] text-[#131324] transition-colors duration-150 hover:border-[rgba(19,19,36,0.5)] hover:bg-[rgba(19,19,36,0.08)]"
            >
              Conocer más
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex h-[52px] items-center justify-center rounded-[4px] bg-[#131324] px-8 font-mono text-[0.9rem] font-medium uppercase tracking-[0.1em] text-[#7E80F7] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(0,0,0,0.4)]"
            >
              Probar ahora
            </Link>
          </div>
        </div>

        <div className="bg-[#1A1A2A] px-5 py-10">
          <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/nvranco"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                <Image
                  src="https://avatars.githubusercontent.com/nvranco"
                  alt="Nicolás Vrancovich"
                  width={44}
                  height={44}
                  unoptimized
                  className="rounded-md object-cover grayscale brightness-[0.85]"
                />
                <div className="flex flex-col gap-px">
                  <span className="text-[0.85rem] font-medium text-[#F6F8FC]">
                    Nicolás Vrancovich
                  </span>
                  <span className="font-mono text-[0.7rem] text-[#768899]">
                    @nvranco
                  </span>
                </div>
              </a>
            </div>
            <div className="pr-12 max-md:pr-6">
              <Wordmark textClass="text-[1.1rem]" barClass="h-[2px]" />
            </div>
          </div>
          <div className="mx-auto max-w-[960px] pt-6 text-center text-[0.68rem] text-[#768899]">
            <p>
              Intervalo 2026. Desarrollado por y para estudiantes.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
