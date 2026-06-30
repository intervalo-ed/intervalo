"use client"

import { cn } from "@/lib/utils"
import { BELT_HEX } from "@/lib/catalog"
import { useRankingNews } from "@/lib/nav/ranking-news"
import { useBadgesAvailable } from "@/lib/nav/UseBadgesAvailable"
import { HomeIcon, TrophyIcon, UserIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"

const TABS = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/leaderboard", label: "Ranking", icon: TrophyIcon },
  { href: "/profile", label: "Perfil", icon: UserIcon },
] as const

// El puntito de novedad toma un color random de cinturón (azul/violeta/marrón).
const DOT_COLORS = [
  BELT_HEX.blue.onDark,
  BELT_HEX.violet.onDark,
  BELT_HEX.brown.onDark,
]
const randomDot = () =>
  DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)]

export function BottomNav() {
  const pathname = usePathname()
  const rankingNews = useRankingNews()
  const badgesAvailable = useBadgesAvailable()
  // Un color random por tab, estable durante la instancia (no parpadea).
  const dotColors = useMemo<Record<string, string>>(
    () => ({ "/leaderboard": randomDot(), "/profile": randomDot() }),
    [],
  )

  return (
    <nav className="shrink-0 border-t bg-background pb-[var(--nav-safe-pb)]">
      <ul className="mx-auto flex w-full max-w-2xl items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          const showDot =
            (href === "/leaderboard" && rankingNews) ||
            (href === "/profile" && badgesAvailable)
          const dot = showDot ? dotColors[href] : null
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 pt-[var(--nav-pt)] pb-[var(--nav-pb)] text-xs transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative">
                  <Icon className="size-5" />
                  {dot && (
                    <span
                      aria-hidden
                      className="absolute -right-1 -top-1 rounded-full ring-1 ring-background"
                      style={{ width: 7, height: 7, backgroundColor: dot }}
                    />
                  )}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
