"use client"

import { cn } from "@/lib/utils"
import { useRankingNews } from "@/lib/nav/ranking-news"
import { useBadgesAvailable } from "@/lib/nav/UseBadgesAvailable"
import { HomeIcon, TrophyIcon, UserIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/leaderboard", label: "Ranking", icon: TrophyIcon },
  { href: "/profile", label: "Perfil", icon: UserIcon },
] as const

// Puntito de novedad arriba a la izquierda del ícono.
const RANKING_DOT = "#3b82f6" // azul
const BADGES_DOT = "var(--primary)" // azul avioletado

export function BottomNav() {
  const pathname = usePathname()
  const rankingNews = useRankingNews()
  const badgesAvailable = useBadgesAvailable()

  return (
    <nav className="shrink-0 border-t bg-background pb-[var(--nav-safe-pb)]">
      <ul className="mx-auto flex w-full max-w-2xl items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          const dot =
            href === "/leaderboard" && rankingNews
              ? RANKING_DOT
              : href === "/profile" && badgesAvailable
                ? BADGES_DOT
                : null
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
                      className="absolute -right-1.5 -top-1 size-[7.2px] rounded-full ring-1 ring-background"
                      style={{ backgroundColor: dot }}
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
