"use client"

import { Button } from "@/components/ui/button"
import {
  Screen,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
} from "@/components/ui/screen"
import { Textarea } from "@/components/ui/textarea"
import { Wordmark } from "@/components/wordmark"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  ChevronLeft,
  Lightbulb,
  MessageCircle,
  TriangleAlert,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useFeedback } from "./UseFeedback"

const DISCORD_URL = "https://discord.gg/cqTD7KqPbw"

// El logo de Discord no viene en lucide (no trae marcas); SVG inline.
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  )
}

type Categoria = "error" | "idea" | "comentario"

const CATEGORIES: {
  key: Categoria
  Icon: typeof TriangleAlert
  title: string
  chip: string
  placeholder: string
}[] = [
  {
    key: "error",
    Icon: TriangleAlert,
    title: "Encontré un error",
    chip: "⚠️ Error",
    placeholder: "Describí qué pasó y en qué pantalla estabas",
  },
  {
    key: "idea",
    Icon: Lightbulb,
    title: "Tengo una idea",
    chip: "💡 Idea",
    placeholder: "Contanos qué cambiarías o qué le agregarías",
  },
  {
    key: "comentario",
    Icon: MessageCircle,
    title: "Quiero dejar un comentario",
    chip: "💬 Comentario",
    placeholder: "Lo que quieras",
  },
]

type Step = "select" | "form" | "done"

export function FeedbackFlow() {
  const router = useRouter()
  const feedback = useFeedback()
  const [step, setStep] = useState<Step>("select")
  const [categoria, setCategoria] = useState<Categoria>("error")
  const [mensaje, setMensaje] = useState("")
  const [error, setError] = useState<string | null>(null)

  const cat = CATEGORIES.find((c) => c.key === categoria) ?? CATEGORIES[0]

  function pick(key: Categoria) {
    setCategoria(key)
    setMensaje("")
    setError(null)
    setStep("form")
  }

  function back() {
    if (step === "form") {
      setStep("select")
      return
    }
    router.push("/settings")
  }

  async function submit() {
    if (!mensaje.trim() || feedback.isPending) return
    setError(null)
    try {
      await feedback.mutateAsync({ categoria, mensaje: mensaje.trim() })
      setStep("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar. Probá de nuevo.")
    }
  }

  // ── Estado 3 — confirmación ───────────────────────────────────────────────
  if (step === "done") {
    return (
      <Screen>
        <ScreenBody className="items-center justify-center text-center">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="size-14 text-green-400" />
            <h1 className="text-2xl font-bold tracking-tight">¡Gracias!</h1>
            <p className="text-sm text-muted-foreground">
              Lo recibimos. Te leemos.
            </p>
          </div>
        </ScreenBody>
        <ScreenFooter>
          <Button
            size="lg"
            className="h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
            onClick={() => router.push("/")}
          >
            Volver al inicio
          </Button>
        </ScreenFooter>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader innerClassName="relative justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={back}
          aria-label="Volver"
          className="absolute left-0"
        >
          <ChevronLeft />
        </Button>
        <Link href="/" aria-label="Intervalo">
          <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
        </Link>
      </ScreenHeader>

      {step === "select" ? (
        // ── Estado 1 — selección de categoría ─────────────────────────────────
        <ScreenBody>
          <p className="text-base font-semibold text-foreground">Feedback</p>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">
            Contanos qué pasó o qué tenés en mente.
          </p>

          <div className="flex flex-col gap-3">
            {CATEGORIES.map(({ key, Icon, title }) => (
              <button
                key={key}
                onClick={() => pick(key)}
                className="flex items-center gap-3 rounded-md border bg-white/5 px-4 py-4 text-left transition-colors hover:bg-white/10"
              >
                <Icon className="size-5 shrink-0 text-foreground/70" />
                <span className="text-base">{title}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <p>¿Preferís hablar con la comunidad?</p>
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-2 font-medium text-foreground underline underline-offset-2"
            >
              Uníte al Discord
              <DiscordIcon className="size-4 shrink-0 no-underline" />
            </a>
          </div>
        </ScreenBody>
      ) : (
        // ── Estado 2 — formulario ─────────────────────────────────────────────
        <>
          <ScreenBody>
            <div className="mb-4">
              <span className="inline-flex items-center rounded-full border bg-white/5 px-3 py-1 text-sm text-foreground/80">
                {cat.chip}
              </span>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">¿Qué querés contarnos?</span>
              <Textarea
                autoFocus
                rows={4}
                value={mensaje}
                placeholder={cat.placeholder}
                onChange={(e) => {
                  setMensaje(e.target.value)
                  setError(null)
                }}
                className="min-h-[8rem] rounded-md text-base md:text-sm"
              />
            </label>

            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
          </ScreenBody>

          <ScreenFooter>
            <Button
              size="lg"
              className={cn(
                "h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black",
              )}
              disabled={!mensaje.trim() || feedback.isPending}
              onClick={submit}
            >
              {feedback.isPending ? "Enviando…" : "Enviar"}
            </Button>
          </ScreenFooter>
        </>
      )}
    </Screen>
  )
}
