"use client"

import { getInstallSteps } from "@/components/install-dialog"
import { usePlatform, type Platform } from "@/lib/platform/detect"

// Pantalla terminal del onboarding: no tiene salida a propósito. La única
// manera de seguir es instalar la app y volver a abrirla desde la pantalla de
// inicio (el último paso), que entra por `/` con el usuario ya matriculado.
export function OnboardingInstallPrompt({
  platformOverride,
}: {
  // Solo para la vista de /dev: en la app real la plataforma se detecta sola.
  platformOverride?: Platform
}) {
  const detected = usePlatform()
  const platform = platformOverride ?? detected

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-sans font-bold tracking-tight">
            ¡Una cosa más!
          </h2>
          <p className="leading-relaxed text-foreground/85">
            Instalá la{" "}
            <strong className="font-semibold text-primary">app</strong> para
            tener una mejor experiencia y poder establecer recordatorios para
            tus repasos.
          </p>
        </div>

        {/* `usePlatform` devuelve null hasta montar (detecta por userAgent, que
            en el server no existe), así que el primer paint va sin pasos. */}
        {platform && (
          <div className="flex flex-col gap-4">
            {getInstallSteps({ platform, withReopenStep: true }).map(
              (step, i) => (
                <p key={i} className="leading-relaxed text-foreground/85">
                  <span className="text-foreground/45 tabular-nums">
                    {i + 1}.
                  </span>{" "}
                  {step.text}
                  {step.icon ? (
                    <span className="ml-1.5 inline-flex align-middle">
                      {step.icon}
                    </span>
                  ) : null}
                </p>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  )
}
