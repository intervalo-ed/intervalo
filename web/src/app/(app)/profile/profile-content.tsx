"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { setSoundMuted, useSoundMuted } from "@/lib/audio/sound-settings"
import { useMe } from "@/app/UseMe"
import { ProfileHeaderCard } from "./profile-header-card"
import { EditUsernameDialog } from "./edit-username-dialog"
import { EditApodoDialog } from "./edit-apodo-dialog"
import { NotificationSettings } from "./notification-settings"
import { useEmojiState } from "./UseEmojiState"
import { useNotificationSettingsQuery } from "./UseNotificationSettings"
import { SignOutButton } from "@clerk/nextjs"
import Link from "next/link"
import {
  LogOutIcon,
  MessageSquareIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"

const btnCls = "h-12 w-full justify-start rounded-md"
const signOutCls =
  "h-12 w-full justify-start rounded-md border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"

export function ProfileContent() {
  const muted = useSoundMuted()
  const me = useMe()
  const emoji = useEmojiState()
  const notif = useNotificationSettingsQuery()
  const [usernameOpen, setUsernameOpen] = useState(false)
  const [apodoOpen, setApodoOpen] = useState(false)

  if (me.isPending || emoji.isPending || notif.isPending) {
    return <ProfileSkeleton />
  }

  return (
    <div className="flex flex-col gap-3">
      <ProfileHeaderCard
        onEditApodo={() => setApodoOpen(true)}
        onEditUsername={() => setUsernameOpen(true)}
      />

      <NotificationSettings />

      <Button
        variant="outline"
        size="lg"
        className={btnCls}
        nativeButton={false}
        render={<Link href="/profile/feedback" />}
      >
        <MessageSquareIcon className="size-5" />
        Dar feedback
      </Button>

      <Button
        variant="outline"
        size="lg"
        className={btnCls}
        aria-pressed={muted}
        onClick={() => setSoundMuted(!muted)}
      >
        {muted ? (
          <Volume2Icon className="size-5" />
        ) : (
          <VolumeXIcon className="size-5" />
        )}
        {muted ? "Activar sonidos" : "Desactivar sonidos"}
      </Button>

      <SignOutButton>
        <Button variant="outline" size="lg" className={signOutCls}>
          <LogOutIcon className="size-5" />
          Cerrar sesión
        </Button>
      </SignOutButton>

      <EditUsernameDialog
        open={usernameOpen}
        onOpenChange={setUsernameOpen}
        current={me.data?.username ?? ""}
      />
      <EditApodoDialog
        open={apodoOpen}
        onOpenChange={setApodoOpen}
        current={me.data?.display_name ?? ""}
      />
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-md border border-border px-4 py-2.5">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="size-16 shrink-0" />
      </div>
      <Skeleton className="h-12 w-full rounded-md" />
      <Skeleton className="h-12 w-full rounded-md" />
      <Skeleton className="h-12 w-full rounded-md" />
      <Skeleton className="h-12 w-full rounded-md" />
    </div>
  )
}
