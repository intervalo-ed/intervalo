"use client"

// Punto de entrada del minijuego: elige el layout por plataforma. Mobile =
// flujo infinito de slides; desktop = todo en una vista. `usePlatform` devuelve
// null hasta montar (SSR), así que hasta ahí se muestra el fondo pelado.

import { useEffect, useRef } from "react"
import { usePlatform } from "@/lib/platform/detect"
import { DesktopLayout } from "./desktop-layout"
import { GameIntroBackdrop, useGameIntro } from "./game-intro"
import { MobileFlow } from "./mobile-flow"
import { useApplyDesiredAlias } from "./register-slides"
import { useGamePlayer } from "./UseGamePlayer"

export function GameRoot() {
  const platform = usePlatform()
  const { player, refetch } = useGamePlayer()
  const applyDesiredAlias = useApplyDesiredAlias()
  const appliedRef = useRef(false)
  // La presentación corre en cada ingreso, con o sin sesión (el splash de
  // Intervalo, que solo ven los logueados, queda excluido de esta ruta en
  // AppChrome). El logo que se escribe en el centro es el del propio layout:
  // ver game-intro.tsx.
  const intro = useGameIntro()

  // Retorno del OAuth: el bootstrap ya linkeó guest→user; acá se aplica el @
  // que la persona eligió antes de irse a Google, una sola vez.
  useEffect(() => {
    if (appliedRef.current || player === null || player.is_guest) return
    appliedRef.current = true
    void applyDesiredAlias(player).then((updated) => {
      if (updated) refetch()
    })
  }, [player, applyDesiredAlias, refetch])

  if (platform === null) return <div className="min-h-dvh" />
  return (
    <>
      {/* Va primero en el DOM a propósito: tapa el contenido del layout, pero
          el logo —que se pinta después— queda por encima sin necesitar
          z-index, que en el teléfono no serviría (las slides crean su propio
          contexto de apilamiento). */}
      <GameIntroBackdrop intro={intro} />
      {platform === "desktop" ? (
        <DesktopLayout intro={intro} />
      ) : (
        <MobileFlow intro={intro} />
      )}
    </>
  )
}
