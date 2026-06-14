"use client"

import { Button } from "@/components/ui/button"
import {
  Screen,
  ScreenBody,
  ScreenFooter,
  ScreenHeader,
} from "@/components/ui/screen"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  CheckCircle2,
  ChevronLeft,
  Lightbulb,
  MessageCircle,
  TriangleAlert,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useFeedback } from "./UseFeedback"

const DISCORD_URL = "https://discord.gg/cqTD7KqPbw"

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
      <ScreenHeader>
        <Button
          variant="ghost"
          size="icon"
          onClick={back}
          aria-label="Volver"
        >
          <ChevronLeft />
        </Button>
        <h1 className="text-base font-semibold">Dar feedback</h1>
      </ScreenHeader>

      {step === "select" ? (
        // ── Estado 1 — selección de categoría ─────────────────────────────────
        <ScreenBody>
          <p className="mb-5 text-sm text-muted-foreground">
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

          <div className="mt-auto pt-8 text-center text-sm text-muted-foreground">
            ¿Preferís hablar con la comunidad?{" "}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-2"
            >
              Uníte al Discord →
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
                className="min-h-[8rem] rounded-md"
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
