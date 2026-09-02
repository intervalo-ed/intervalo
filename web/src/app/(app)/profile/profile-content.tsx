"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProfileSkeleton } from "@/components/tab-skeletons"
import { setSoundMuted, useSoundMuted } from "@/lib/audio/sound-settings"
import { useMe } from "@/app/UseMe"
import { ProfileHeaderCard } from "./profile-header-card"
import { EditUsernameDialog } from "./edit-username-dialog"
import { EditApodoDialog } from "./edit-apodo-dialog"
import { NotificationSettings } from "./notification-settings"
import { useEmojiState } from "./UseEmojiState"
import { useNotificationSettingsQuery } from "./UseNotificationSettings"
import { CafecitoSheet } from "@/components/cafecito-sheet"
import { useLeaderboardSummary } from "@/app/(app)/leaderboard/UseLeaderboardSummary"
import { SignOutButton } from "@clerk/nextjs"
import Link from "next/link"
import {
  CoffeeIcon,
  LogOutIcon,
  MessageSquareIcon,
  UsersIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react"

const btnCls = "h-12 w-full justify-start rounded-md"
// Los mismos dos colores que usa el panel del minijuego para estas dos
// acciones: verde WhatsApp para reclutar, ámbar café para el cafecito. El verde
// es `VERDE_TINTA` (derivadas/cafecito-cta.tsx), que es de donde sale el de
// allá; acá va escrito porque Tailwind no puede generar una clase de un valor
// que no ve escrito, así que si se cambia allá hay que cambiarlo acá.
//
// El borde va al 85% y no al 50%: a la mitad, mezclado contra la card, quedaba
// tan oscuro que se leía como el borde gris de cualquier fila y estas tres
// dejaban de distinguirse del resto de la lista.
const reclutarCls =
  "h-12 w-full justify-start rounded-md border-[#2CB863]/85 text-[#2CB863] hover:bg-[#2CB863]/10 hover:text-[#2CB863]"
const cafecitoCls =
  "h-12 w-full justify-start rounded-md border-[#EABB74]/85 text-[#EABB74] hover:bg-[#EABB74]/10 hover:text-[#EABB74]"
const signOutCls =
  "h-12 w-full justify-start rounded-md border-red-500/70 text-red-400 hover:bg-red-500/10 hover:text-red-400"

export function ProfileContent() {
  const muted = useSoundMuted()
  const me = useMe()
  const emoji = useEmojiState()
  const notif = useNotificationSettingsQuery()
  const [usernameOpen, setUsernameOpen] = useState(false)
  const [apodoOpen, setApodoOpen] = useState(false)
  const [cafecitoOpen, setCafecitoOpen] = useState(false)
  // La universidad que la diapo del café va a nombrar. Sale del mismo endpoint
  // que el tag del ranking (`_mi_universidad`, o sea el enrollment más antiguo)
  // y no del jugador del minijuego: quien nunca jugó tiene su universidad acá y
  // no allá. Sin argumentos consulta el scope completo, que es la consulta que
  // el ranking ya hace y deja cacheada.
  const universidad = useLeaderboardSummary().data?.university ?? null

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

      {/* Las dos puertas de crecimiento, con el mismo par de colores que en el
          minijuego: verde para reclutar, ámbar para el cafecito. Son la misma
          mecánica de los dos lados, así que tienen que verse igual.

          Reclutar va a la vista del ranking y no directo a WhatsApp: mandando al
          chat, quien comparte no se entera de que el link le paga un porcentaje
          de lo que hagan los que entren — o sea que se pierde justo lo que lo
          haría compartir de nuevo. Mismo motivo que la fila del juego. */}
      <Button
        variant="outline"
        size="lg"
        className={reclutarCls}
        nativeButton={false}
        render={<Link href="/leaderboard" />}
      >
        <UsersIcon className="size-5" />
        {/* «Reclutar» a secas se leía como una orden sin objeto. Lo que se
            ofrece es traer gente que conocés, y decirlo cambia a quién te
            imaginás mandándole el link. Mismo rótulo que en el minijuego
            (derivadas/settings-panel.tsx). */}
        Reclutar compañeros
      </Button>

      {/* Abre la diapo del cafecito, no Cafecito.

          Era un enlace directo a cafecito.app, y de todos los caminos al mismo
          lugar ese era el peor: NO anotaba la intención. O sea que quien donaba
          desde acá llegaba al servidor sin nada que lo identificara, y su
          donación se la repartían las intenciones abiertas de otras personas o
          terminaba siendo global. Es exactamente la forma en que se pierde una
          atribución, y ya pasó con una donación real — por eso los tres botones
          del minijuego llevan a la diapo (derivadas/settings-panel.tsx) y este
          ahora también.

          La diapo además muestra el slider, que es lo que convierte "donar" en
          "elegir cuánto multiplicás el XP de tu universidad", y sabe contarle a
          la persona qué pasó cuando vuelve. El anchor a cafecito.app sigue
          existiendo: está adentro del panel, que es de donde tiene que salir. */}
      <Button
        variant="outline"
        size="lg"
        className={cafecitoCls}
        onClick={() => setCafecitoOpen(true)}
      >
        <CoffeeIcon className="size-5" />
        Invitar un cafecito
      </Button>

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
      <CafecitoSheet
        open={cafecitoOpen}
        onOpenChange={setCafecitoOpen}
        university={universidad}
      />
    </div>
  )
}
