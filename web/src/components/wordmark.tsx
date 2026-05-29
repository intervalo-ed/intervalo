import { cn } from "@/lib/utils"

const BELT_COLORS = ["#E0DDD0", "#1C3A8B", "#6B2D8B", "#6B3A1F", "#111111"]

export function Wordmark({
  textClass,
  barClass,
}: {
  textClass?: string
  barClass?: string
}) {
  return (
    <div className="inline-flex flex-col items-center gap-[5px] leading-none">
      <span className={cn("font-heading font-bold text-[#F6F8FC]", textClass)}>
        intervalo
      </span>
      <div className={cn("flex w-full overflow-hidden rounded-[2px]", barClass)}>
        {BELT_COLORS.map((c, i) => (
          <span key={i} className="flex-1" style={{ background: c }} />
        ))}
      </div>
    </div>
  )
}
