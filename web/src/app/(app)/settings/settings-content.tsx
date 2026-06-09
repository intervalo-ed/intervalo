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
import { SignOutButton } from "@clerk/nextjs"
import {
  LogOutIcon,
  MoreVerticalIcon,
  ShareIcon,
  SmartphoneIcon,
} from "lucide-react"
import { NotificationSettings } from "./notification-settings"

export function SettingsContent() {
  return (
    <div className="flex flex-col gap-3">
      <NotificationSettings />
      <Dialog>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="lg"
              className="h-12 justify-start"
            />
          }
        >
          <SmartphoneIcon className="size-5" />
          Instalar como app
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar Intervalo</DialogTitle>
            <DialogDescription>
              Agregá Intervalo a tu pantalla de inicio para abrirlo como una
              app.
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

      <SignOutButton>
        <Button variant="outline" size="lg" className="h-12 justify-start">
          <LogOutIcon className="size-5" />
          Cerrar sesión
        </Button>
      </SignOutButton>
    </div>
  )
}
