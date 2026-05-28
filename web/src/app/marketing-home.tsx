"use client"

import { Wordmark } from "@/components/wordmark"
import katex from "katex"
import "katex/dist/katex.min.css"
import { ChevronDown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const STAGES: { name: string; color: string; exprs: string[] }[] = [
  {
    name: "Funciones",
    color: "#E0DDD0",
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
    color: "#1C3A8B",
    exprs: [
      "\\lim_{x \\to 0} \\dfrac{\\sin x}{x} = 1",
      "\\lim_{x \\to \\infty} \\left(1 + \\dfrac{1}{x}\\right)^x = e",
      "\\lim_{x \\to 2} \\dfrac{x^2 - 4}{x - 2}",
      "\\lim_{x \\to 0^+} \\ln(x) = -\\infty",
    ],
  },
  {
    name: "Derivadas",
    color: "#6B2D8B",
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
    color: "#6B3A1F",
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
    color: "#E0DDD0",
    t1: "Funciones",
    t2: "Polinomios",
    t3: "Léxico",
    qt: "¿Cuál es el grado del siguiente polinomio?",
    q: "3x^4 - 2x + 1",
  },
  {
    color: "#E0DDD0",
    t1: "Funciones",
    t2: "Lineales",
    t3: "Formulación",
    qt: "¿Cuál es la pendiente de la siguiente función?",
    q: "y = 3x - 5",
  },
  {
    color: "#E0DDD0",
    t1: "Funciones",
    t2: "Cuadráticas",
    t3: "Clasificación",
    qt: "¿Cuántas raíces reales tiene la siguiente ecuación?",
    q: "x^2 - 4 = 0",
  },
  {
    color: "#1C3A8B",
    t1: "Límites",
    t2: "Directa",
    t3: "Resolución",
    qt: "¿Cuál es el resultado del siguiente límite?",
    q: "\\lim_{x \\to 3}(x^2 + 1)",
  },
  {
    color: "#1C3A8B",
    t1: "Límites",
    t2: "Notable",
    t3: "Formulación",
    qt: "¿Cuánto vale este límite notable?",
    q: "\\lim_{x \\to 0}\\dfrac{\\sin x}{x}",
  },
  {
    color: "#1C3A8B",
    t1: "Límites",
    t2: "Indeterminación",
    t3: "Resolución",
    qt: "¿Cuánto vale el siguiente límite?",
    q: "\\lim_{x \\to 2}\\dfrac{x^2 - 4}{x - 2}",
  },
  {
    color: "#6B2D8B",
    t1: "Derivadas",
    t2: "Potencia",
    t3: "Derivación",
    qt: "¿Cuál es la derivada de la siguiente función?",
    q: "f(x) = x^5",
  },
  {
    color: "#6B2D8B",
    t1: "Derivadas",
    t2: "Regla de la cadena",
    t3: "Derivación",
    qt: "¿Cuál es la derivada de la siguiente función compuesta?",
    q: "h(x) = (3x^2 + 1)^4",
  },
  {
    color: "#6B2D8B",
    t1: "Derivadas",
    t2: "Exponencial",
    t3: "Formulación",
    qt: "¿Cuál es la derivada de la siguiente función?",
    q: "f(x) = e^{2x}",
  },
  {
    color: "#6B3A1F",
    t1: "Integrales",
    t2: "Potencia",
    t3: "Integración",
    qt: "¿Cuál es la integral de la siguiente función?",
    q: "\\int x^4 \\, dx",
  },
  {
    color: "#6B3A1F",
    t1: "Integrales",
    t2: "Definida",
    t3: "Resolución",
    qt: "¿Cuánto vale la siguiente integral definida?",
    q: "\\int_0^1 x^2 \\, dx",
  },
  {
    color: "#6B3A1F",
    t1: "Integrales",
    t2: "Trigonométricas",
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
    <div className="mx-auto flex max-w-[600px] flex-col items-center gap-4 text-center">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-[2px] transition-colors duration-300"
          style={{ background: item.color }}
        />
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-[#768899]">
          {item.t1.toUpperCase()}
        </span>
        <span aria-hidden className="text-[0.5rem] text-[#38385A]">◆</span>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-[#768899]">
          {item.t2.toUpperCase()}
        </span>
        <span aria-hidden className="text-[0.5rem] text-[#38385A]">◆</span>
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.13em] text-[#768899]">
          {item.t3.toUpperCase()}
        </span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <div className="text-[clamp(0.85rem,2.6vw,1rem)] text-[#F6F8FC]">
          {item.qt}
        </div>
        <div
          className="flex min-h-[72px] max-w-[520px] items-center justify-center font-medium leading-[1.5] text-[#F6F8FC] [&_.katex-display]:m-0 [&_.katex]:text-[clamp(1.25rem,4vw,1.5rem)]"
          dangerouslySetInnerHTML={{ __html: renderMath(item.q) }}
        />
      </div>
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
    const COLORS = ["#E0DDD0", "#1C3A8B", "#6B2D8B", "#6B3A1F", "#3a3a3a"]
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
    { color: "#E0DDD0", label: "Funciones" },
    { color: "#1C3A8B", label: "Límites" },
    { color: "#6B2D8B", label: "Derivadas" },
    { color: "#6B3A1F", label: "Integrales" },
    { color: "#3a3a3a", label: "Aplicaciones", border: true },
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
  return (
    <main className="bg-[#131324] font-sans text-[#F6F8FC]">
      <section
        id="hero"
        className="relative flex h-[100svh] min-h-[100vh] flex-col items-center overflow-hidden border-b border-[#38385A] px-5 pt-8 text-center max-md:px-5 max-md:pb-[4.5rem]"
        style={GRID_BG_STYLE}
      >
        <div className="shrink-0 pb-2 pt-8">
          <Wordmark
            textClass="text-[clamp(1.7rem,6vw,2.2rem)]"
            barClass="h-[3px]"
          />
        </div>

        <div className="flex w-full max-w-[36rem] flex-1 flex-col items-center justify-center gap-5 px-6">
          <h1 className="text-[clamp(1.6rem,6vw,2.25rem)] font-bold leading-[1.2] tracking-[-0.01em] text-[#F6F8FC]">
            Repasá un poco todos los días.
          </h1>
          <p className="max-w-[28rem] text-[clamp(1.1rem,3.5vw,1.35rem)] leading-[1.75] text-[#A4B3C6] max-md:text-[0.93rem]">
            Ejercitá las definiciones y propiedades que tanto cuestan entender
            de forma efectiva.
          </p>
          <NotationCycler />
        </div>

        <div className="flex w-full shrink-0 flex-col items-center gap-3">
          <Link
            href="/sign-in"
            className="inline-flex animate-[cta-breathe_3s_ease-in-out_infinite] items-center gap-2 rounded-[4px] bg-[#7E80F7] px-8 py-[0.9rem] font-mono text-[0.95rem] font-medium uppercase tracking-[0.1em] text-[#131324] transition-[transform,background] duration-150 hover:-translate-y-0.5 hover:animate-none hover:bg-[#9698FA] hover:shadow-[0_10px_36px_rgba(126,128,247,0.4)] active:translate-y-0 max-md:w-full max-md:max-w-[340px] max-md:justify-center max-md:px-8 max-md:py-4 max-md:text-base"
          >
            Empezar ahora
          </Link>
          <div className="flex items-center text-[#768899] opacity-60">
            <ChevronDown className="size-[34px] animate-[bounce-down_1.8s_ease-in-out_infinite]" />
          </div>
        </div>

        <style>{`
          @keyframes cta-breathe {
            0%, 100% { box-shadow: 0 4px 20px rgba(126,128,247,0.25), 0 0 0 0 rgba(126,128,247,0.2); }
            50% { box-shadow: 0 8px 32px rgba(126,128,247,0.40), 0 0 0 10px rgba(126,128,247,0); }
          }
          @keyframes bounce-down {
            0%, 100% { transform: translateY(0); opacity: 0.4; }
            50% { transform: translateY(6px); opacity: 1; }
          }
        `}</style>
      </section>

      <section className="border-b border-[#38385A] bg-[#1A1A2A] px-6 py-16">
        <div className="mx-auto flex max-w-[960px] flex-col gap-4">
          <h2 className="max-w-[28rem] text-[clamp(1.6rem,6vw,2.25rem)] font-bold leading-[1.2] tracking-[-0.01em] text-[#F6F8FC]">
            Mantenete en contacto constante con los contenidos
          </h2>
          <p className="max-w-[26rem] text-[clamp(0.95rem,3vw,1.1rem)] leading-[1.7] text-[#A4B3C6]">
            Un repositorio de ejercicios enfocado en los conceptos
            fundamentales, organizado por niveles, temas y habilidades.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20 pt-20" style={GRID_BG_STYLE}>
        <QuestionLoop />
      </section>

      <section className="border-y border-[#38385A] bg-[#1A1A2A] px-6 py-12">
        <div className="mx-auto max-w-[960px]">
          <h2 className="mb-2.5 text-[clamp(1.45rem,5vw,2rem)] font-bold leading-[1.2] tracking-[-0.01em] text-[#F6F8FC]">
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
          <h2 className="max-w-[28rem] text-[clamp(1.5rem,4vw,2rem)] font-semibold leading-[1.25] text-[#131324]">
            Retené lo que ya entendiste.
          </h2>
          <p className="text-[0.875rem] text-[rgba(19,19,36,0.65)]">
            Repasá de forma inteligente haciendo un poco todos los días.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center rounded-[4px] bg-[#131324] px-8 py-[0.9rem] font-mono text-[0.9rem] font-medium uppercase tracking-[0.1em] text-[#7E80F7] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_6px_22px_rgba(0,0,0,0.4)]"
            >
              Empezar ahora
            </Link>
          </div>
        </div>

        <div className="bg-[#1A1A2A] px-5 py-10">
          <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-6 max-md:flex-col max-md:items-start">
            <Wordmark textClass="text-[1.1rem]" barClass="h-[2px]" />
            <div className="flex items-center gap-6 max-md:items-start">
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
              <a
                href="https://github.com/sgalanb"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                <Image
                  src="https://avatars.githubusercontent.com/sgalanb"
                  alt="Santiago Galán"
                  width={44}
                  height={44}
                  unoptimized
                  className="rounded-md object-cover grayscale brightness-[0.85]"
                />
                <div className="flex flex-col gap-px">
                  <span className="text-[0.85rem] font-medium text-[#F6F8FC]">
                    Santiago Galán
                  </span>
                  <span className="font-mono text-[0.7rem] text-[#768899]">
                    @sgalanb
                  </span>
                </div>
              </a>
            </div>
          </div>
          <div className="mx-auto max-w-[960px] pt-6 text-center text-[0.68rem] text-[#768899]">
            <p>
              2026 Intervalo. Desarrollado por y para estudiantes de carreras
              STEM.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
