import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDownIcon, ChevronUpIcon, InfoIcon, LockIcon } from "lucide-react"
import Image from "next/image"
import { AccordionContent, AccordionItem } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import type { TopicStates } from "@/lib/api/types"
import {
  beltAssetPath,
  beltInfo,
  beltLabel,
  topicLabel,
  type BeltKey,
} from "@/lib/catalog"
import {
  beltStats,
  beltTopicStats,
  type TopicCounts,
} from "@/lib/catalog/stats"
import ExerciseTypePills from "./exercise-type-pills"

export default function BeltCard({
  belt,
  topicStates,
}: {
  belt: BeltKey
  topicStates: TopicStates
}) {
  const stats = beltStats({ belt, topicStates })
  const isActive = stats.unlocked > 0
  const topics = beltTopicStats({ belt, topicStates })
  const info = beltInfo({ belt })

  return (
    <AccordionItem value={belt} disabled={!isActive} className="border-none">
      <AccordionPrimitive.Header className="flex items-center gap-1">
        <AccordionPrimitive.Trigger
          data-slot="accordion-trigger"
          className="group/accordion-trigger flex flex-1 items-center gap-4 rounded-none border border-transparent py-3 text-left outline-none hover:underline focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          <Image
            src={beltAssetPath({ belt })}
            alt={beltLabel({ belt })}
            width={56}
            height={56}
            className={isActive ? "" : "opacity-30"}
          />
          <div className="flex flex-1 flex-col gap-2 font-sans">
            <span className="text-lg font-semibold leading-tight">
              Cinturón {beltLabel({ belt })}
            </span>
            {isActive && <ProgressRow counts={stats} />}
          </div>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground group-aria-expanded/accordion-trigger:hidden" />
          <ChevronUpIcon className="hidden size-4 shrink-0 text-muted-foreground group-aria-expanded/accordion-trigger:inline" />
        </AccordionPrimitive.Trigger>
        <BeltInfoDialog
          beltName={beltLabel({ belt })}
          headline={info.headline}
          description={info.description}
        />
      </AccordionPrimitive.Header>

      {topics.length > 0 && (
        <AccordionContent>
          <ul className="flex flex-col gap-5 pt-2 pb-2">
            {topics.map((t) => (
              <li
                key={t.topic}
                className={`flex flex-col gap-2 ${t.unlocked === 0 ? "opacity-50" : ""}`}
              >
                <span className="flex items-center gap-1.5 text-sm">
                  {t.unlocked === 0 && (
                    <LockIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  {topicLabel({ topic: t.topic })}
                </span>
                {(() => {
                  const units = topicStates[t.topic]?.units ?? []
                  return units.length > 0 ? (
                    <ExerciseTypePills units={units} />
                  ) : null
                })()}
              </li>
            ))}
          </ul>
        </AccordionContent>
      )}
    </AccordionItem>
  )
}

function BeltInfoDialog({
  beltName,
  headline,
  description,
}: {
  beltName: string
  headline: string
  description: string
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" />}
        aria-label={`Información del cinturón ${beltName}`}
      >
        <InfoIcon className="size-4 text-muted-foreground" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Cinturón {beltName} · {headline}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>{description}</DialogDescription>
      </DialogContent>
    </Dialog>
  )
}

function ProgressRow({ counts }: { counts: TopicCounts }) {
  const pct =
    counts.total === 0 ? 0 : Math.round((counts.dominados / counts.total) * 100)
  return (
    <div className="flex items-center gap-2">
      <Progress value={pct} className="flex-1" />
      <span className="text-xs tabular-nums text-muted-foreground">
        {counts.dominados}/{counts.total}
      </span>
    </div>
  )
}
