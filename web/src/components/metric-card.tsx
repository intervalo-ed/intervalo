import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { InfoIcon } from "lucide-react"

// Tarjeta de indicador. Mismo formato/altura en repaso (dashboard) y práctica.
export function Metric({
  label,
  value,
  accent,
  valueColor,
  info,
}: {
  label: string
  value: React.ReactNode
  accent?: string
  // A diferencia de `accent` (tiñe toda la tarjeta), solo colorea el valor —
  // el contenedor queda con su fondo/borde por default.
  valueColor?: string
  // Si se pasa, toda la tarjeta se vuelve clickeable (con un ícono (i) arriba
  // a la derecha) y abre un diálogo explicando el indicador.
  info?: { title: string; body: React.ReactNode }
}) {
  const style = accent
    ? {
        color: accent,
        borderColor: `${accent}99`,
        backgroundColor: `${accent}33`,
      }
    : undefined

  const inner = (
    <>
      <span
        className="text-lg font-semibold tabular-nums leading-none"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </span>
      <span
        className={cn(
          "text-[0.7rem] leading-tight text-balance md:text-pretty",
          info && "pr-3",
          accent ? "opacity-80" : "text-foreground/60",
        )}
      >
        {label}
      </span>
    </>
  )

  if (!info) {
    return (
      <div
        className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3"
        style={style}
      >
        {inner}
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger
        className="relative flex w-full flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3 text-left outline-none"
        style={style}
        aria-label={`Información: ${label}`}
      >
        <InfoIcon className="absolute top-2 right-2 size-3 text-muted-foreground/60" />
        {inner}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="font-sans text-sm font-semibold text-foreground">
            {info.title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/80">
          {info.body}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Vive en dx-core (estadisticas-formato.ts) porque la usa también la app nativa.
export { accuracyColor } from "@intervalo/dx-core/juego/estadisticas-formato"
