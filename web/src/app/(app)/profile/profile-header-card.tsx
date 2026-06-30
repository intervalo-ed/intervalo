"use client"

import Link from "next/link"
import { PencilIcon } from "lucide-react"
import { useMe } from "@/app/UseMe"
import { badgeWithCrown, CAREER_EMOJI } from "@/lib/career-emoji"
import { findNode } from "@/lib/emoji-tree"
import { cn } from "@/lib/utils"
import { useEmojiState } from "./UseEmojiState"

// Mismo lenguaje visual que los botones outline (rounded-md, border-border, bg).
const surfaceCls =
  "rounded-md border border-border bg-background dark:border-input dark:bg-input/30"

function PencilButton({
  onClick,
  label,
}: {
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 text-primary transition-colors hover:text-primary/70"
    >
      <PencilIcon className="size-3.5" />
    </button>
  )
}

export function ProfileHeaderCard({
  onEditApodo,
  onEditUsername,
}: {
  onEditApodo: () => void
  onEditUsername: () => void
}) {
  const { data: me } = useMe()
  const { data: emoji } = useEmojiState()

  const apodo = me?.display_name || "Apodo"
  const username = me?.username || "usuario"
  const resolvedBadge =
    findNode(emoji?.bucket, emoji?.worn)?.emoji ??
    (emoji?.bucket ? CAREER_EMOJI[emoji.bucket] : undefined)
  const badge =
    badgeWithCrown({
      username: me?.username,
      resolved: resolvedBadge,
      career: emoji?.bucket,
    }) ?? "✦"

  return (
    <div className={cn("flex items-center gap-3 px-4 py-2.5", surfaceCls)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-xl font-bold">{apodo}</span>
          <PencilButton onClick={onEditApodo} label="Cambiar apodo" />
        </div>
        <div className="flex items-center gap-2">
          <span className="truncate text-xs text-muted-foreground">
            @{username}
          </span>
          <PencilButton onClick={onEditUsername} label="Cambiar usuario" />
        </div>
      </div>

      {/* El tile completo es el botón de cambio (cómodo en táctil); el lapicito
          en la esquina es solo el indicador. */}
      <Link
        href="/profile/badges"
        aria-label="Cambiar badge"
        className={cn(
          "group relative flex size-16 shrink-0 items-center justify-center text-3xl transition-colors hover:border-primary",
          surfaceCls,
        )}
      >
        {badge}
        <PencilIcon className="absolute bottom-1 right-1 size-3 text-primary/80 transition-colors group-hover:text-primary" />
      </Link>
    </div>
  )
}
