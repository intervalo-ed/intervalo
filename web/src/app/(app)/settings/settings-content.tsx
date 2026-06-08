"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { setSoundMuted, useSoundMuted } from "@/lib/audio/sound-settings"
import { SignOutButton } from "@clerk/nextjs"
import {
  AtSignIcon,
  BellIcon,
  LogOutIcon,
  MessageSquareIcon,
  MoreVerticalIcon,
  ShareIcon,
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

      <Dialog>
        <DialogTrigger
          render={<Button variant="outline" size="lg" className={btnCls} />}
        >
          <SmartphoneIcon className="size-5" />
          Instalar como app
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar Intervalo</DialogTitle>
            <DialogDescription>
              Agregá Intervalo a tu pantalla de inicio para abrirlo como una app.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                iPhone / iPad (Safari)
              </p>
              <ol className="flex flex-col gap-1 text-sm/relaxed text-muted-foreground">
                <li className="flex items-center gap-2">
                  1. Tocá el botón Compartir
                  <ShareIcon className="size-4" />
                </li>
                <li>2. Elegí «Agregar a inicio».</li>
                <li>3. Confirmá tocando «Agregar».</li>
              </ol>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                Android (Chrome)
              </p>
              <ol className="flex flex-col gap-1 text-sm/relaxed text-muted-foreground">
                <li className="flex items-center gap-2">
                  1. Abrí el menú
                  <MoreVerticalIcon className="size-4" />
                </li>
                <li>2. Elegí «Agregar a la pantalla principal».</li>
                <li>3. Confirmá tocando «Agregar».</li>
              </ol>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">Computadora</p>
              <p className="text-sm/relaxed text-muted-foreground">
                En Chrome o Edge, tocá el ícono de instalar en la barra de
                direcciones y confirmá.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
