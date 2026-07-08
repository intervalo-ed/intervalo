"use client"

import { cn } from "@/lib/utils"
import { useRankingNews } from "@/lib/nav/ranking-news"
import { useProfileNews } from "@/lib/nav/profile-news"
import { useBadgesAvailable } from "@/lib/nav/UseBadgesAvailable"
import { HomeIcon, TrophyIcon, UserIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/leaderboard", label: "Ranking", icon: TrophyIcon },
  { href: "/profile", label: "Perfil", icon: UserIcon },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const rankingNews = useRankingNews()
  const profileNews = useProfileNews()
  const badgesAvailable = useBadgesAvailable()

  return (
    <nav className="shrink-0 border-t bg-background pb-[var(--nav-safe-pb)]">
      <ul className="mx-auto flex w-full max-w-2xl items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          const showDot =
            (href === "/leaderboard" && rankingNews) ||
            (href === "/profile" && profileNews && badgesAvailable)
          const dotPos =
            href === "/leaderboard" ? "-right-[9px] -top-1" : "-right-1 -top-1"
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
                  {showDot && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute rounded-full ring-1 ring-background",
                        dotPos,
                      )}
                      style={{ width: 7, height: 7, backgroundColor: "#EC4869" }}
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
