"use client"

// Panel de configuración: entra desde la tuerca y se come toda la interfaz.
// Es una sola columna angosta con secciones cortas — cambiar el @, la carrera y
// la universidad, el sonido, compartir, invitar un cafecito y reiniciar el
// progreso.
//
// Las slides de carrera y universidad son las MISMAS del onboarding
// (components/onboarding-fields.tsx), igual que en los hitos del juego.

import { useRef, useState } from "react"
import posthog from "posthog-js"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Coffee, RotateCcw, Share2, Volume2, VolumeX } from "lucide-react"
import { ApiError, unwrap } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { CareerSelect, UniversityGrid } from "@/components/onboarding-fields"
import { setSoundMuted, useSoundMuted } from "@/lib/audio/sound-settings"
import { useSfx } from "@/lib/audio/useSfx"
import { canonicalUniversity } from "@/lib/university-tags"
import { cn } from "@/lib/utils"
import { CAFECITO_URL, SHARE_URL } from "./cafecito-cta"
import { useGameApi } from "./UseGameApi"
import { gameKeys, type GamePlayer } from "./UseGamePlayer"

type Section = "root" | "career" | "university"

const rowCls =
  "flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-white/20"

export function SettingsPanel({
  player,
  onClose,
  onNeedsRegister,
}: {
  player: GamePlayer | null
  onClose: () => void
  // El guest no elige su @: ese es el gancho del registro.
  onNeedsRegister: () => void
}) {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const sfx = useSfx()
  const muted = useSoundMuted()
  const [section, setSection] = useState<Section>("root")
  const [alias, setAlias] = useState(player?.alias ?? "")
  const [aliasError, setAliasError] = useState<string | null>(null)
  const [aliasSaved, setAliasSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [busy, setBusy] = useState(false)
  const [university, setUniversity] = useState(player?.university ?? "")
  const [otherUniversity, setOtherUniversity] = useState("")
  const [showOther, setShowOther] = useState(false)
  const otherRef = useRef<HTMLInputElement>(null)

  // Todo cambio de perfil toca la fila propia del ranking (tag, badge, scope).
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: gameKeys.me })
    queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
  }

  const saveProfile = async (body: { career?: string; university?: string }) => {
    if (busy) return
    setBusy(true)
    try {
      await api.PATCH("/game/derivadas/me", { body })
      refreshAll()
    } catch {
      // Sin drama: el juego sigue y la próxima vuelta lo reintenta.
    }
    setBusy(false)
    setSection("root")
  }

  const saveAlias = async () => {
    const value = alias.trim()
    if (!value || busy) return
    setBusy(true)
    setAliasError(null)
    try {
      unwrap(await api.PATCH("/game/derivadas/me", { body: { alias: value } }))
      posthog.capture("game_alias_edited", { via: "settings" })
      setAliasSaved(true)
      refreshAll()
    } catch (err) {
      setAliasError(err instanceof ApiError ? err.message : "No se pudo guardar.")
    }
    setBusy(false)
  }

  const reset = async () => {
    if (busy) return
    setBusy(true)
    try {
      unwrap(await api.POST("/game/derivadas/reset"))
      posthog.capture("game_reset")
      refreshAll()
      onClose()
    } catch {
      setBusy(false)
      setConfirmReset(false)
    }
  }

  if (section === "career") {
    return (
      <PanelShell title="Carrera" onBack={() => setSection("root")}>
        <CareerSelect
          value={player?.career ?? ""}
          onSelect={(value) => {
            sfx.select()
            void saveProfile({ career: value })
          }}
        />
      </PanelShell>
    )
  }

  if (section === "university") {
    const confirmOther = () => {
      const value = canonicalUniversity(otherUniversity)
      if (!value) return
      void saveProfile({ university: value })
    }
    return (
      <PanelShell title="Universidad" onBack={() => setSection("root")}>
        <UniversityGrid
          university={university}
          showOther={showOther}
          otherValue={otherUniversity}
          onOtherChange={setOtherUniversity}
          onPick={(u) => {
            sfx.select()
            setUniversity(u)
            setShowOther(false)
            void saveProfile({ university: u })
          }}
          onSelectOther={() => {
            sfx.select()
            setUniversity("")
            setShowOther(true)
          }}
          onConfirmOther={confirmOther}
          onPickSuggestion={(key) => {
            sfx.select()
            setOtherUniversity(key)
            otherRef.current?.focus()
          }}
          inputRef={otherRef}
        />
        {showOther && (
          <Button
            size="lg"
            className="mt-4 h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
            disabled={!otherUniversity.trim() || busy}
            onClick={confirmOther}
          >
            Continuar
          </Button>
        )}
      </PanelShell>
    )
  }

  return (
    <PanelShell title="Configuración" onBack={onClose}>
      <div className="flex flex-col gap-2">
        <div className="rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Tu nombre en el ranking</p>
          {player?.is_guest ? (
            <button
              type="button"
              onClick={onNeedsRegister}
              className="mt-1.5 flex w-full items-center justify-between text-left text-sm"
            >
              <span>{player.alias}</span>
              <span className="text-xs text-ring">elegí tu @ →</span>
            </button>
          ) : (
            <form
              className="mt-1.5 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void saveAlias()
              }}
            >
              <span className="text-muted-foreground">@</span>
              <input
                value={alias}
                onChange={(e) => {
                  setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))
                  setAliasSaved(false)
                  setAliasError(null)
                }}
                maxLength={15}
                className="w-full bg-transparent text-sm outline-none"
              />
              <button
                type="submit"
                disabled={busy || alias === player?.alias}
                className="shrink-0 text-xs text-ring disabled:text-muted-foreground"
              >
                {aliasSaved ? "Guardado" : "Guardar"}
              </button>
            </form>
          )}
          {aliasError && <p className="mt-1 text-xs text-orange-300">{aliasError}</p>}
        </div>

        <button type="button" className={rowCls} onClick={() => setSection("career")}>
          <span className="text-muted-foreground">Carrera</span>
          <span>{careerLabel(player?.career)}</span>
        </button>

        <button type="button" className={rowCls} onClick={() => setSection("university")}>
          <span className="text-muted-foreground">Universidad</span>
          <span>{player?.university ?? "Elegir"}</span>
        </button>

        <button
          type="button"
          className={rowCls}
          onClick={() => {
            setSoundMuted(!muted)
            if (muted) sfx.select()
          }}
        >
          <span className="text-muted-foreground">Sonido</span>
          <span className="flex items-center gap-2">
            {muted ? "Apagado" : "Encendido"}
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </span>
        </button>

        <a
          href={SHARE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => posthog.capture("game_share_click", { placement: "settings" })}
          className={rowCls}
        >
          <span className="text-muted-foreground">Compartir</span>
          <Share2 size={16} />
        </a>

        <a
          href={CAFECITO_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => posthog.capture("game_cafecito_click", { placement: "settings" })}
          className={cn(rowCls, "border-[#A8703C]/50 text-[#A8703C]")}
        >
          <span>Invitar un cafecito</span>
          <Coffee size={16} />
        </a>

        {confirmReset ? (
          <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-3">
            <p className="text-sm font-medium text-orange-300">
              ¿Reiniciar el progreso?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/85">
              Volvés a cero en XP, racha y dificultad — el ranking te manda al
              fondo. Tu nombre, carrera y universidad quedan como están.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
                onClick={() => setConfirmReset(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-md bg-orange-500/80 px-3 py-2 text-sm font-medium text-white"
                onClick={() => void reset()}
              >
                Reiniciar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={cn(rowCls, "text-muted-foreground")}
            onClick={() => setConfirmReset(true)}
          >
            <span>Reiniciar progreso</span>
            <RotateCcw size={16} />
          </button>
        )}
      </div>
    </PanelShell>
  )
}

function careerLabel(career: string | null | undefined): string {
  const names: Record<string, string> = {
    E: "Ingeniería",
    S: "Ciencia",
    T: "Tecnología",
    M: "Matemática",
  }
  return career ? (names[career] ?? career) : "Elegir"
}

function PanelShell({
  title,
  onBack,
  children,
}: {
  title: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-4">
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
