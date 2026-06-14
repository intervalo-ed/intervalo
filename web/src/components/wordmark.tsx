import { BELT_BAR_COLORS } from "@/lib/catalog"
import { cn } from "@/lib/utils"

const BELT_COLORS = BELT_BAR_COLORS

export function Wordmark({
  textClass,
  barClass,
}: {
  textClass?: string
  barClass?: string
}) {
  return (
    <div className="inline-flex flex-col items-center gap-[5px] leading-none">
      <span className={cn("font-heading font-semibold text-[#F6F8FC]", textClass)}>
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
