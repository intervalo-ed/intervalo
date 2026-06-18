import { cn } from "@/lib/utils"

export function Screen({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      {children}
    </div>
  )
}

export function ScreenHeader({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
}) {
  return (
    <header
      className={cn(
        "shrink-0 border-b bg-background px-5 pb-[var(--hdr-pb)] pt-[calc(var(--hdr-pt)_+_env(safe-area-inset-top))]",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-2xl items-center gap-3",
          innerClassName,
        )}
      >
        {children}
      </div>
    </header>
  )
}

export function ScreenBody({
  children,
  className,
  ref,
}: {
  children?: React.ReactNode
  className?: string
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={ref}
      className={cn(
        "mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-y-auto overflow-x-hidden p-5",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ScreenFooter({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
}) {
  return (
    <footer
      className={cn(
        "screen-footer shrink-0 border-t bg-background px-5 pt-[var(--cta-pt)] pb-[var(--cta-pb)]",
        className,
      )}
    >

      <div className={cn("mx-auto w-full max-w-2xl", innerClassName)}>
        {children}
      </div>
    </footer>
  )
}
