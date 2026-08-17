import type { ReactNode } from "react"
import type { Platform } from "@/lib/platform/detect"
import { MoreVerticalIcon, ShareIcon, SquarePlusIcon } from "lucide-react"

// `text` es ReactNode y no string para poder resaltar el nombre exacto del
// control que hay que tocar (ver «Compartir»).
export type Step = { text: ReactNode; icon?: ReactNode }

// Último paso, común a mobile: sin volver a abrirla desde el inicio el usuario
// se queda en la pestaña del navegador y cree que no pasó nada. En escritorio no
// aplica, ahí la instalación ya deja la app abierta.
const REOPEN_STEP: Step = {
  text: "Cerrá tu navegador y abrí Intervalo desde tu pantalla de inicio.",
}

const PLATFORM_STEPS: Record<Platform, Step[]> = {
  ios: [
    {
      text: (
        <>
          Tocá el botón <strong className="font-semibold">Compartir</strong>
        </>
      ),
      icon: <ShareIcon className="size-4" />,
    },
    {
      // El share sheet de iOS muestra ese ícono a la derecha de la fila; el
      // menú de Chrome en Android no, así que ahí el paso va sin ícono.
      text: "Elegí «Agregar a inicio»",
      icon: <SquarePlusIcon className="size-4" />,
    },
    { text: "Confirmá tocando «Agregar»." },
  ],
  android: [
    { text: "Abrí el menú", icon: <MoreVerticalIcon className="size-4" /> },
    { text: "Elegí «Agregar a la pantalla principal»." },
    { text: "Confirmá tocando «Agregar»." },
  ],
  desktop: [
    {
      text: "En Chrome o Edge, tocá el ícono de instalar en la barra de direcciones y confirmá.",
    },
  ],
}

// Los pasos como dato: quien los muestra decide la maqueta. Hoy el único que los
// dibuja es install-hint-pane.tsx, como párrafos numerados.
export function getInstallSteps(platform: Platform): Step[] {
  const steps = PLATFORM_STEPS[platform]
  return platform === "desktop" ? steps : [...steps, REOPEN_STEP]
}
