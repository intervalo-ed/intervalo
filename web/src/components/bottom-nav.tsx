"use client"

import { cn } from "@/lib/utils"
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

  return (
    <nav className="shrink-0 border-t bg-background pb-[var(--nav-safe-pb)]">
      <ul className="mx-auto flex w-full max-w-2xl items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
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
                <Icon className="size-5" />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
