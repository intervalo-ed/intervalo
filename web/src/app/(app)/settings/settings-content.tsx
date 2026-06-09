"use client"

import { Button } from "@/components/ui/button"
import { InstallDialog } from "@/components/install-dialog"
import { setSoundMuted, useSoundMuted } from "@/lib/audio/sound-settings"
import { SignOutButton } from "@clerk/nextjs"
import {
  AtSignIcon,
  BellIcon,
  LogOutIcon,
  MessageSquareIcon,
  SmartphoneIcon,
  UserIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"

const btnCls = "h-12 w-full justify-start rounded-md"

export function SettingsContent() {
  const muted = useSoundMuted()

  return (
    <div className="mt-auto flex flex-col gap-3">
      <SignOutButton>
        <Button variant="outline" size="lg" className={btnCls}>
          <LogOutIcon className="size-5" />
          Cerrar sesión
        </Button>
      </SignOutButton>

      <Button variant="outline" size="lg" className={btnCls}>
        <UserIcon className="size-5" />
        Cambiar apodo
      </Button>

      <Button variant="outline" size="lg" className={btnCls}>
        <AtSignIcon className="size-5" />
        Cambiar usuario
      </Button>

      <Button variant="outline" size="lg" className={btnCls}>
        <BellIcon className="size-5" />
        Configurar notificaciones
      </Button>

      <Button variant="outline" size="lg" className={btnCls}>
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

      <InstallDialog
        platform="all"
        trigger={
          <Button variant="outline" size="lg" className={btnCls}>
            <SmartphoneIcon className="size-5" />
            Instalar como app
          </Button>
        }
      />
    </div>
  )
}
