"use client"

import { notFound } from "next/navigation"
import { useEffect, useState } from "react"
import {
  NOTIFY_CTA_COOLDOWN_MS,
  NotifyHintPane,
  type NotifyHintPreview,
} from "@/app/(app)/session/[sessionId]/summary/notify-hint-pane"
import { Button } from "@/components/ui/button"
import { Screen, ScreenBody } from "@/components/ui/screen"

// Cada variante es una combinación de entorno que en la app real no se puede
// elegir: qué dispositivo es, si corre instalada y en qué estado está la
// mutación. `settingsLoading` viaja aparte porque viene del summary, no del
// entorno.
const PWA = { platform: "ios", standalone: true } as const

const VARIANTS: {
  id: string
  label: string
  preview: NotifyHintPreview
  settingsLoading?: boolean
}[] = [
  // El recorrido de una PWA, en orden: el botón Activar → la mutación en vuelo
  // → el selector de hora que lo reemplaza → un cambio de hora guardándose.
  { id: "step-1", label: "1 · Activar", preview: PWA },
  {
    id: "step-2",
    label: "2 · Activando",
    preview: { ...PWA, pending: true },
  },
  {
    id: "step-3",
    label: "3 · Activada",
    preview: { ...PWA, enabled: true },
  },
  {
    id: "step-4",
    label: "4 · Guardando horario",
    preview: { ...PWA, enabled: true, pending: true },
  },
  // El botón arranca gris hasta que responde la consulta de ajustes.
  {
    id: "loading",
    label: "Consultando ajustes",
    preview: PWA,
    settingsLoading: true,
  },
  // Desde el navegador push no funciona: se ofrece instalar. Las tres se ven
  // igual; lo que cambia son los pasos del diálogo que abre "Agregar".
  {
    id: "browser-ios",
    label: "Navegador iOS",
    preview: { platform: "ios", standalone: false },
  },
  {
    id: "browser-android",
    label: "Navegador Android",
    preview: { platform: "android", standalone: false },
  },
  {
    id: "browser-desktop",
    label: "Navegador escritorio",
    preview: { platform: "desktop", standalone: false },
  },
]

// Vista suelta de la pestaña de notificaciones del resumen de sesión. En la app
// aparece una sola vez por dispositivo y solo después de terminar una sesión,
// así que mirarla de verdad implica resetear notify-hint-seen y jugar una
// sesión entera. Solo existe en `next dev`: en producción la ruta es 404.
//
// El envoltorio (Screen + ScreenBody centrado + CTA abajo) replica el del
// summary para que las proporciones se vean como en la pantalla real.
export default function DevNotifyPanePage() {
  const [id, setId] = useState(VARIANTS[0].id)

  // Mismo cooldown que en el summary, para poder cronometrarlo acá. Se reinicia
  // con cada variante porque allá la pestaña recién se monta al entrar.
  const [waiting, setWaiting] = useState(true)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWaiting(true)
    const t = setTimeout(() => setWaiting(false), NOTIFY_CTA_COOLDOWN_MS)
    return () => clearTimeout(t)
  }, [id])

  if (process.env.NODE_ENV === "production") notFound()

  const variant = VARIANTS.find((v) => v.id === id) ?? VARIANTS[0]

  return (
    <div className="flex h-dvh flex-col">
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-white/10 px-3 py-2 text-xs">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={
              v.id === id
                ? "rounded bg-white px-2 py-1 text-black"
                : "rounded px-2 py-1 text-foreground/60 hover:text-foreground"
            }
            onClick={() => setId(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      <Screen className="min-h-0 flex-1">
        <ScreenBody className="items-center justify-center">
          {/* El envoltorio de alto completo hace de `self-stretch` de la grilla
              del summary: sin él la pestaña no tendría contra qué medir su
              `h-full` y los controles no bajarían al pie.
              `key` fuerza el remonte al cambiar de variante: si no, las
              animaciones de entrada (el spring de la campana, el campanazo)
              solo se verían la primera vez. */}
          <div className="flex w-full flex-1 flex-col">
            <NotifyHintPane
              key={variant.id}
              preview={variant.preview}
              settingsLoading={variant.settingsLoading ?? false}
              onEnabled={() => {}}
            />
          </div>
        </ScreenBody>

        <div className="shrink-0 px-5 pt-[var(--cta-pt)] pb-[var(--cta-pb)]">
          <div className="mx-auto w-full max-w-2xl">
            <Button
              size="lg"
              className="h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
              disabled={waiting}
            >
              Continuar
            </Button>
          </div>
        </div>
      </Screen>
    </div>
  )
}
