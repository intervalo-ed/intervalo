"use client"

import { motion } from "motion/react"
import { getInstallSteps } from "@/components/install-dialog"
import { usePlatform, type Platform } from "@/lib/platform/detect"

// Los pasos para instalar la PWA, como slide del resumen de sesión. Antes eran
// una pantalla sin salida justo después del registro; ahora se llega acá desde
// el botón "Agregar" de notify-hint-pane.tsx, con la sesión ya hecha, y el CTA
// "Continuar" del summary sigue estando.
export function InstallHintPane({
  platformOverride,
}: {
  // Solo para /dev/notify-pane: en la app real la plataforma se detecta sola.
  platformOverride?: Platform
}) {
  const detected = usePlatform()
  const platform = platformOverride ?? detected

  return (
    <div className="flex h-full w-full flex-col justify-center">
      {/* Corrido apenas bajo el centro óptico: centrado exacto se veía alto. */}
      <motion.div
        className="mx-auto flex w-full max-w-sm translate-y-6 flex-col gap-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <p className="leading-relaxed text-foreground/85">
          Agregá Intervalo a tu{" "}
          {/* chart-5 y no primary: el mismo índigo pero más claro, que sobre el
              fondo oscuro resalta bastante más. */}
          <strong className="font-semibold text-chart-5">
            pantalla de inicio
          </strong>{" "}
          para tener una mejor experiencia y poder establecer recordatorios para
          tus repasos.
        </p>

        {/* `usePlatform` devuelve null hasta montar (detecta por userAgent, que
            en el server no existe), así que el primer paint va sin pasos. */}
        {platform && (
          <div className="flex flex-col gap-4">
            {getInstallSteps({ platform, withReopenStep: true }).map(
              (step, i) => (
                <p key={i} className="leading-relaxed text-foreground/85">
                  <span className="tabular-nums text-foreground/45">
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

        {/* Nota al pie, deliberadamente chica y apagada: solo está para que
            nadie piense que va a descargar un archivo. */}
        <p className="text-sm leading-relaxed text-foreground/45">
          No descargás nada, tu navegador sigue corriendo de fondo pero en
          pantalla completa.
        </p>
      </motion.div>
    </div>
  )
}
