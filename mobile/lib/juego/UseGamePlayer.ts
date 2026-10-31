import { useEffect, useSyncExternalStore } from "react"
import { useAuth, useClerk } from "@clerk/expo"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { unwrap } from "@intervalo/dx-core/api/client"
import { aplicarAliasDeseado, readDesiredAlias } from "@intervalo/dx-core/juego/alias-deseado"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { gameKeys } from "@intervalo/dx-core/juego/game-keys"
import {
  clearGameIdentity,
  getGameTokenSnapshot,
  saveGameToken,
  subscribeGameToken,
} from "@intervalo/dx-core/juego/game-storage"
import { track } from "@/lib/analytics/track"

// El par nativo de `web/src/app/derivadas/UseGamePlayer.ts`, sin lo que es de la
// web: ni atribución por URL, ni brazo de experimento, ni `?pwa`.

/** El token del invitado, como valor reactivo. */
export function useGameToken(): string | null {
  return useSyncExternalStore(subscribeGameToken, getGameTokenSnapshot)
}

// El alta corre UNA vez por identidad, no una por componente montado: dos POST
// sin token crearían dos invitados. Guarda para cuál corrió —invitado o cuenta—
// porque acá no hay recarga después del login ni del cierre de sesión: cuando
// `isSignedIn` cambia, el segundo POST /player es el que linkea guest→user (o
// crea al invitado nuevo). Se libera si falla, para que un error de red no deje
// al juego sin jugador hasta reabrir la app.
let bootstrapPara: "invitado" | "cuenta" | null = null
// Mientras `cerrarSesion` corre, el alta la hace ella y no el efecto: si el
// efecto se adelantara, el invitado nuevo se borraría con el resto del caché.
let cerrandoSesion = false
// El @ deseado se aplica una vez por vuelta del OAuth, aunque haya varios
// `useGamePlayer` montados.
let aplicandoAlias = false

const raizDelJuego = ["game"] as const

/** Todo lo del juego menos el jugador, que la respuesta del alta ya trae. */
function invalidarLoDelJugador(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    queryKey: raizDelJuego,
    predicate: (q) => q.queryKey[1] !== gameKeys.me[1],
  })
}

function husoHorario(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}

// POST /player es idempotente: sin credenciales crea un invitado (y guardamos el
// token), con token devuelve el existente, y con sesión de Clerk crea/devuelve
// el jugador del usuario, linkeando al invitado si viajan los dos.
export function useGamePlayer() {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const { isSignedIn, isLoaded } = useAuth()
  const { signOut } = useClerk()
  const token = useGameToken()

  const ensure = useMutation({
    mutationFn: async (_: { cambioDeIdentidad: boolean }) =>
      unwrap(
        await api.POST("/game/derivemos/player", {
          body: { timezone: husoHorario() },
        }),
      ),
    onSuccess: (data, { cambioDeIdentidad }) => {
      if (data.guest_token) saveGameToken(data.guest_token)
      queryClient.setQueryData(gameKeys.me, data.player)
      // Lo que se pidió con la identidad anterior (ranking, stats, reclutas)
      // es de otro jugador: en la web lo resuelve la recarga.
      if (cambioDeIdentidad) invalidarLoDelJugador(queryClient)
    },
    onError: () => {
      bootstrapPara = null
    },
  })

  const me = useQuery({
    queryKey: gameKeys.me,
    queryFn: async () => unwrap(await api.GET("/game/derivemos/me")),
    enabled: isLoaded && (isSignedIn || token !== null),
    staleTime: 30_000,
    retry: 1,
  })

  const ensureMutate = ensure.mutate
  useEffect(() => {
    if (!isLoaded || cerrandoSesion) return
    const para = isSignedIn ? "cuenta" : "invitado"
    if (bootstrapPara === para) return
    const cambioDeIdentidad = bootstrapPara !== null
    bootstrapPara = para
    ensureMutate({ cambioDeIdentidad })
  }, [isLoaded, isSignedIn, ensureMutate])

  // Solo del caché: el alta escribe ahí (`onSuccess`), y `ensure.data` de otra
  // instancia podría seguir teniendo al jugador de antes de cerrar sesión.
  const player = me.data ?? null

  // Retorno del OAuth: con el jugador de la cuenta ya acá, se aplica el @ que
  // la persona eligió antes de irse a Google (el par del efecto de
  // web/src/app/derivadas/game-root.tsx).
  useEffect(() => {
    if (aplicandoAlias || player === null || player.is_guest) return
    if (readDesiredAlias() === null) return
    aplicandoAlias = true
    void aplicarAliasDeseado({ api, player })
      .then((updated) => {
        if (!updated) return
        queryClient.setQueryData(gameKeys.me, updated)
        track("game_alias_edited", { via: "register" })
      })
      .finally(() => {
        aplicandoAlias = false
      })
  }, [player, api, queryClient])

  /** Cerrar sesión, el par de `signOutAndReset` + recarga de la web: borra la
   *  identidad local (sin eso el POST siguiente devolvería al mismo invitado),
   *  cierra la sesión de Clerk, tira el caché del jugador anterior y da de alta
   *  a un invitado nuevo. Si el signOut de Clerk falla, la promesa rechaza y
   *  la sesión sigue como estaba. */
  const cerrarSesion = async () => {
    if (cerrandoSesion) return
    cerrandoSesion = true
    try {
      clearGameIdentity()
      await signOut()
      // Después del signOut y no antes: con la sesión viva, la query del
      // jugador se volvería a pedir y traería otra vez al de la cuenta.
      queryClient.removeQueries({ queryKey: raizDelJuego })
      bootstrapPara = "invitado"
      ensureMutate({ cambioDeIdentidad: false })
    } finally {
      cerrandoSesion = false
    }
  }

  return {
    player,
    isSignedIn: isSignedIn ?? false,
    refetch: () => queryClient.refetchQueries({ queryKey: gameKeys.me }),
    ensurePlayer: () => ensureMutate({ cambioDeIdentidad: false }),
    cerrarSesion,
    error: me.error ?? ensure.error ?? null,
  }
}
