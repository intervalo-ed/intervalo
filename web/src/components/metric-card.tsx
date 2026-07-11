import { cn } from "@/lib/utils"

// Tarjeta de indicador. Mismo formato/altura en repaso (dashboard) y práctica.
export function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: React.ReactNode
  accent?: string
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-md border border-white/10 bg-white/5 p-3"
      style={
        accent
          ? {
              color: accent,
              borderColor: `${accent}99`,
              backgroundColor: `${accent}33`,
            }
          : undefined
      }
    >
      <span className="text-lg font-semibold tabular-nums leading-none">
        {value}
      </span>
      <span
        className={cn(
          "text-[0.7rem] leading-tight",
          accent ? "opacity-80" : "text-foreground/60",
        )}
      >
        {label}
      </span>
    </div>
  )
}

// Color para un porcentaje de acierto: rojo (0%) → amarillo (50%) → verde maduro
// (100%). Interpola en RGB por tramos.
export function accuracyColor(pct: number): string {
  const p = Math.max(0, Math.min(100, pct)) / 100
  const red = [229, 72, 77] // #E5484D
  const yellow = [230, 184, 0] // #E6B800
  const green = [31, 158, 87] // #1F9E57
  const [from, to, t] =
    p < 0.5 ? [red, yellow, p / 0.5] : [yellow, green, (p - 0.5) / 0.5]
  const ch = (i: number) => Math.round(from[i] + (to[i] - from[i]) * t)
  return `rgb(${ch(0)}, ${ch(1)}, ${ch(2)})`
}
