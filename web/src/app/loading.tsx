import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      <span>Cargando…</span>
    </div>
  )
}
