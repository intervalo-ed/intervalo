"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { setSoundMuted, useSoundMuted } from "@/lib/audio/sound-settings"
import { useMe } from "@/app/UseMe"
import { EditUsernameDialog } from "./edit-username-dialog"
import { EditApodoDialog } from "./edit-apodo-dialog"
import { NotificationSettings } from "./notification-settings"
import { SignOutButton } from "@clerk/nextjs"
import {
  AtSignIcon,
  LogOutIcon,
  MessageSquareIcon,
  UserIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"

const btnCls = "h-12 w-full justify-start rounded-md"
const signOutCls =
  "h-12 w-full justify-start rounded-md border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"

export function SettingsContent() {
  const muted = useSoundMuted()
  const { data: me } = useMe()
  const [usernameOpen, setUsernameOpen] = useState(false)
  const [apodoOpen, setApodoOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <NotificationSettings />

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

      <Button variant="outline" size="lg" className={btnCls}>
        <MessageSquareIcon className="size-5" />
        Dar feedback
      </Button>

      <Button
        variant="outline"
        size="lg"
        className={btnCls}
        onClick={() => setUsernameOpen(true)}
      >
        <AtSignIcon className="size-5" />
        Cambiar usuario
      </Button>

      <Button
        variant="outline"
        size="lg"
        className={btnCls}
        onClick={() => setApodoOpen(true)}
      >
        <UserIcon className="size-5" />
        Cambiar apodo
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
        current={me?.username ?? ""}
      />
      <EditApodoDialog
        open={apodoOpen}
        onOpenChange={setApodoOpen}
        current={me?.display_name ?? ""}
      />
    </div>
  )
}
