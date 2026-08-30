"use client"

import { useEffect, useRef } from "react"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { unwrap } from "@/lib/api/client"
import { ALL_SCOPE } from "@/components/leaderboard-chrome"
import type { components } from "@/lib/api/schema"
import { gameKeys } from "./UseGamePlayer"
import { useGameApi } from "./UseGameApi"

export type GameLeaderboard = components["schemas"]["GameLeaderboardResponse"]
export type GameLeaderboardEntry = components["schemas"]["GameLeaderboardEntry"]
export type GameUniversityRow = components["schemas"]["GameUniversityRow"]
export type GameBoost = components["schemas"]["GameBoostOut"]
export type GameEvent = components["schemas"]["GameEventOut"]

export type Scope = { university: string; career: string }

export const PAGE_SIZE = 30

// Cada cuánto se pregunta si el ranking cambió. Coincide con el intervalo del
// tick de simulación del servidor (game/simulation.py :: TICK_SECONDS).
const PULSE_INTERVAL_MS = 10_000

// Cada cuánto se vuelve a preguntar si el cafecito ya se acreditó, mientras la
// persona mira el cartel de «todavía no llegó». Corto: es una espera con alguien
// del otro lado mirando.
const ESPERA_ACREDITACION_MS = 3_000

// Cuánto se considera fresca la lista de reclutas. Largo comparado con el resto
// del juego: lo que la mueve es que un recluta propio resuelva una derivada, que
// pasa en la escala de los minutos, no de los segundos.
const RECLUTAS_FRESCOS_MS = 60_000

// Qué hacen los dos sondeos cuando la red no contesta.
//
// Sin esto seguían saliendo al mismo ritmo para siempre: un teléfono en un
// subte, un ascensor o un barrio sin señal mantenía dos pedidos cada nueve
// segundos que no iban a llegar a ningún lado, gastando batería y datos. Con
// espera creciente, una desconexión larga se calma sola y al volver la señal el
// siguiente reintento la encuentra.
//
// El mismo criterio que UseEnrollMutation.ts, que ya lo tenía.
const SIN_SEÑAL = {
  retry: 3,
  retryDelay: (intento: number) => Math.min(1000 * 2 ** intento, 30_000),
} as const

// "all" es el valor del selector, no un filtro: se omite del query string.
function scopeQuery({ university, career }: Scope) {
  return {
    ...(university === ALL_SCOPE ? {} : { university }),
    ...(career === ALL_SCOPE ? {} : { career }),
  }
}

const scopeKey = (scope: Scope) => [scope.university, scope.career] as const

// La primera página pide la ventana centrada en el jugador (`around_me`); las
// siguientes piden por offset hacia arriba o hacia abajo. Cada fila trae su
// `rank` absoluto, así se calculan los bordes de lo ya cargado. Misma mecánica
// que el leaderboard de Intervalo (app/(app)/leaderboard/UseLeaderboard.ts).
type PageParam = { around: true } | { around: false; offset: number; limit: number }

// Por qué ordena el ranking individual, en el vocabulario del servidor
// (game/router.py :: game_leaderboard). El de la interfaz es otro —
// game-ranking.tsx :: RankingSort — porque ahí la palabra que se lee es
// "experiencia", no "xp".
export type LeaderboardSort = "xp" | "elo"

export function useGameLeaderboard(
  scope: Scope,
  enabled: boolean,
  sort: LeaderboardSort = "xp",
) {
  const api = useGameApi()
  return useInfiniteQuery({
    // El orden va en la CLAVE y no como un parámetro más: por Elo cambia el
    // puesto de cada fila, así que las dos listas no son dos vistas de los
    // mismos datos sino dos listas distintas. Con una sola clave, volver al
    // orden anterior mostraría los puestos del otro hasta que llegara el
    // refetch.
    queryKey: [...gameKeys.leaderboard, ...scopeKey(scope), sort],
    initialPageParam: { around: true } as PageParam,
    queryFn: async ({ pageParam }) =>
      unwrap(
        await api.GET("/game/derivemos/leaderboard", {
          params: {
            query: {
              ...scopeQuery(scope),
              sort,
              ...(pageParam.around
                ? { around_me: true }
                : { offset: pageParam.offset, limit: pageParam.limit }),
            },
          },
        }),
      ),
    // Hacia abajo: desde el rank (1-based) de la última fila cargada, que es el
    // offset (0-based) de la siguiente.
    getNextPageParam: (lastPage): PageParam | undefined => {
      const last = lastPage.entries.at(-1)
      if (!last) return undefined
      if (last.rank >= lastPage.total_count) return undefined
      return { around: false, offset: last.rank, limit: PAGE_SIZE }
    },
    // Hacia arriba: hasta el offset (0-based) de la primera fila cargada.
    getPreviousPageParam: (firstPage): PageParam | undefined => {
      const first = firstPage.entries[0]
      if (!first) return undefined
      const topOffset = first.rank - 1
      if (topOffset <= 0) return undefined
      const limit = Math.min(PAGE_SIZE, topOffset)
      return { around: false, offset: topOffset - limit, limit }
    },
    enabled,
    staleTime: 10_000,
    // Quien decide cuándo se actualiza el ranking es el festejo, no el montaje:
    // en el teléfono la lista aparece recién en la slide del ranking, y si se
    // refrescara al montar la fila propia ya estrenaría puesto y XP antes del
    // primer paso del conteo. Se refresca con la invalidación explícita de
    // xp-conteo (onComplete) y al cambiar de scope, que es otra queryKey.
    refetchOnMount: false,
  })
}

// Latido del ranking. Se consulta cada 10 s y la lista se refresca SOLO si el
// número cambió, o sea si alguien respondió algo. Ese mismo pedido es además lo
// que hace avanzar la actividad simulada en el servidor: si nadie mira, nada se
// mueve, que es exactamente lo que se quiere.
//
// `paused` corta el latido mientras cae el confeti: refrescar ahí adelantaría el
// puesto nuevo antes de que termine el festejo.
export function useGamePulse({
  enabled,
  paused,
}: {
  enabled: boolean
  paused: boolean
}) {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const seen = useRef<number | null>(null)
  const pending = useRef(false)

  const pulse = useQuery({
    queryKey: gameKeys.pulse,
    queryFn: async () => unwrap(await api.GET("/game/derivemos/leaderboard/pulse")),
    enabled,
    refetchInterval: PULSE_INTERVAL_MS,
    // En segundo plano se detiene: este pedido es lo que hace avanzar la
    // simulación, y una pestaña olvidada no tiene por qué mover el ranking de
    // los demás. Al volver, el primer latido lo pone al día.
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 0,
    ...SIN_SEÑAL,
  })

  const version = pulse.data?.version ?? null
  useEffect(() => {
    if (version === null) return
    if (seen.current === null) {
      seen.current = version
      return
    }
    if (version === seen.current && !pending.current) return
    if (paused) {
      // Se anota que hay algo nuevo y se aplica cuando termine el festejo.
      pending.current = true
      return
    }
    seen.current = version
    pending.current = false
    queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
  }, [version, paused, queryClient])

  return pulse
}

// Los empujes de universidad viajan en el pulso, que ya late cada 10 s desde el
// layout. Este hook LEE ese caché (`enabled: false` ⇒ nunca dispara un pedido
// propio) en vez de plomear los datos por props: cualquier componente que
// necesite saber qué universidades están impulsadas lo pregunta acá, sin sumar ni
// una request ni un prop nuevo a la cadena.
export function useGameBoosts(): GameBoost[] {
  const api = useGameApi()
  const { data } = useQuery({
    queryKey: gameKeys.pulse,
    queryFn: async () => unwrap(await api.GET("/game/derivemos/leaderboard/pulse")),
    enabled: false,
  })
  return data?.boosts ?? []
}

// El empuje que le está tocando a ESTE jugador: el de su universidad, o el
// global si no hay. El global vale aunque todavía no haya elegido universidad —
// es un regalo para todos y dejar afuera justo al que no eligió sería al revés.
// Si hay los dos, gana el dirigido: es el que su universidad se ganó.
export function useMyBoost(university: string | null | undefined): GameBoost | null {
  const boosts = useGameBoosts()
  const propio = university
    ? boosts.find((b) => b.university === university)
    : undefined
  return propio ?? boosts.find((b) => !b.university) ?? null
}

// "Me voy a Cafecito": se avisa al servidor ANTES de abrir el link, porque una
// vez que la persona se fue, Cafecito no tiene cómo decirnos de qué universidad
// era. Es la pata de la atribución que no le pide nada al donante.
//
// Sin `onError`: si falla, la donación igual cae en algún lado —la sigla del
// mensaje, o el empuje global—. Avisar de un error acá sería ruido sobre algo
// que el servidor ya resuelve solo.
export type GameCafecitoStatus = components["schemas"]["GameCafecitoStatus"]

/** Qué pasó con el cafecito de quien volvió de Cafecito.
 *
 * Se enciende recién cuando la persona se fue a donar (`activo`), no antes: sin
 * esa guarda, la diapo le anunciaría «todavía no llegó» a alguien que ni siquiera
 * salió de la pantalla.
 *
 * Mientras está en `pending` se vuelve a preguntar cada pocos segundos. El pago
 * puede confirmarse justo mientras la persona lee el cartel, y verlo cambiar solo
 * de «estamos esperando» a «llegó» es mejor que cualquier cosa que podamos
 * escribir. Cuando ya llegó, se deja de preguntar. */
export function useCafecitoStatus(activo: boolean) {
  const api = useGameApi()
  const { data } = useQuery({
    queryKey: gameKeys.cafecitoStatus,
    queryFn: async () => unwrap(await api.GET("/game/derivemos/cafecito-status")),
    enabled: activo,
    // Este SÍ se refresca al volver a la pestaña, al revés que el resto del
    // juego (ver providers.tsx): volver es justo el momento que hay que atender.
    refetchOnWindowFocus: true,
    refetchInterval: (q) =>
      q.state.data?.state === "pending" ? ESPERA_ACREDITACION_MS : false,
    staleTime: 0,
    ...SIN_SEÑAL,
  })
  return data ?? null
}

export function useCafecitoIntent() {
  const api = useGameApi()
  return useMutation({
    mutationFn: async () => {
      await api.POST("/game/derivemos/cafecito-intent")
    },
  })
}

// Cada cuánto se pide el historial. Más lento que el pulso: los eventos son
// para leer, no para reaccionar, y a 8 s ya se siente vivo.
const EVENTS_INTERVAL_MS = 8_000

// Cuántas líneas se guardan de cada cosa. El servidor manda hasta 40 de cada una
// y acá se conserva la misma cantidad: lo que se cae por abajo es historia que
// ya nadie va a scrollear.
const VENTANA = 40

// Cada cuántos sondeos se vuelve a pedir todo desde cero.
//
// Con el cursor, un mensaje que se baja a mano (`hidden`) no desaparece de las
// pantallas que ya lo tenían: el servidor deja de mandarlo, pero el cliente lo
// acumuló. Eso convertiría a la única herramienta de moderación que hay en algo
// que solo surte efecto al recargar. Resincronizando cada diez vueltas —unos 80
// segundos— el mensaje bajado se cae solo, y se sigue ahorrando el 90% del
// tráfico igual.
const RESINCRONIZAR_CADA = 10

export type GameMessage = components["schemas"]["GameMessageOut"]

/** Cuándo pasó, en milisegundos de época.
 *
 * `seconds_ago` lo calcula el servidor al responder, así que en una lista que se
 * ACUMULA envejece mal: lo que llegó hace tres sondeos sigue diciendo los
 * segundos que tenía entonces. Para dibujarlo alcanza —el error es de segundos—
 * pero para MEZCLAR las novedades con los mensajes no, porque son dos listas que
 * se acumulan por separado y hay que intercalarlas por tiempo. Se sella al
 * recibir y ya no se mueve. */
export type ConTiempo<T> = T & { at: number }

type Historial = {
  events: ConTiempo<GameEvent>[]
  messages: ConTiempo<GameMessage>[]
  // Si el chat acepta mensajes. Siempre el del último pedido: es estado del
  // servicio y no historia, así que no se acumula, se pisa.
  chatEnabled: boolean
  // El id más alto visto de cada lista. Son dos espacios de ids distintos
  // (tablas distintas), así que son dos cursores.
  cursorEvents: number
  cursorMessages: number
}

/** Pega lo nuevo arriba de lo viejo y recorta.
 *
 * Las dos listas vienen del servidor de la más nueva a la más vieja, y así se
 * guardan: el feed las da vuelta al dibujar. */
function fundir(previo: Historial | undefined, nuevo: Historial): Historial {
  const unir = <T extends { id: number }>(nuevos: T[], viejos: T[]) =>
    nuevos.length === 0 ? viejos : [...nuevos, ...viejos].slice(0, VENTANA)
  return {
    events: unir(nuevo.events, previo?.events ?? []),
    messages: unir(nuevo.messages, previo?.messages ?? []),
    cursorEvents: Math.max(previo?.cursorEvents ?? 0, nuevo.cursorEvents),
    cursorMessages: Math.max(previo?.cursorMessages ?? 0, nuevo.cursorMessages),
    chatEnabled: nuevo.chatEnabled,
  }
}

// Historial del juego: las novedades del sistema y los mensajes del chat, en el
// MISMO pedido.
//
// Que viajen juntos es todo el diseño del chat: no hay un sondeo nuevo, hay un
// campo nuevo en el que ya corría cada ocho segundos. Y son dos listas y no una
// mezclada porque cada una tiene su ventana — compartiendo las cuarenta filas,
// una racha de chat empujaría fuera de pantalla el anuncio de cafecitos.
//
// Se acumula con los dos cursores en vez de pedir todo cada vez. Antes se
// reemplazaba la lista entera, y estaba bien mientras el feed era una franja de
// doce líneas que nadie miraba: eran 4 KB cada 8 segundos POR PESTAÑA, o sea
// 0,18 GB por hora con cien personas jugando. Con el chat esa cuenta pasa a
// pagarse por algo que sí se mira, y ahorrarla es lo que hace que el chat no
// cueste nada: en régimen la respuesta son 27 bytes.
export function useGameEvents(enabled: boolean) {
  const api = useGameApi()
  const client = useQueryClient()
  const vueltas = useRef(0)
  return useQuery({
    queryKey: gameKeys.events,
    queryFn: async (): Promise<Historial> => {
      const previo = client.getQueryData<Historial>(gameKeys.events)
      const desdeCero = vueltas.current % RESINCRONIZAR_CADA === 0
      vueltas.current += 1
      const r = unwrap(
        await api.GET("/game/derivemos/events", {
          params: {
            query: desdeCero
              ? {}
              : {
                  after_id: previo?.cursorEvents ?? 0,
                  after_msg_id: previo?.cursorMessages ?? 0,
                },
          },
        }),
      )
      // Como vienen ordenadas de la más nueva a la más vieja, el cursor es el
      // primer id de cada lista.
      const ahora = Date.now()
      const sellar = <T extends { seconds_ago: number }>(xs: T[]) =>
        xs.map((x) => ({ ...x, at: ahora - x.seconds_ago * 1000 }))
      const recibido: Historial = {
        events: sellar(r.events),
        messages: sellar(r.messages),
        cursorEvents: r.events[0]?.id ?? 0,
        cursorMessages: r.messages[0]?.id ?? 0,
        chatEnabled: r.chat_enabled,
      }
      return desdeCero ? recibido : fundir(previo, recibido)
    },
    enabled,
    refetchInterval: EVENTS_INTERVAL_MS,
    // Igual que el pulso: una pestaña olvidada no sondea.
    refetchIntervalInBackground: false,
    ...SIN_SEÑAL,
  })
}

/** Manda un mensaje al chat.
 *
 * Al volver, el mensaje se mete a mano en el historial en vez de esperar al
 * sondeo. No es una optimización: sin esto, entre que tocás Enter y que tu propio
 * mensaje aparece pasan hasta ocho segundos, y en ese hueco lo único razonable
 * que podés pensar es que no se mandó.
 *
 * Se adelanta también el cursor, para que el sondeo siguiente no lo traiga
 * duplicado. */
export function useSendMessage() {
  const api = useGameApi()
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (text: string) =>
      unwrap(await api.POST("/game/derivemos/message", { body: { text } })),
    onSuccess: (mensaje) => {
      client.setQueryData<Historial>(gameKeys.events, (previo) =>
        previo === undefined
          ? previo
          : {
              ...previo,
              messages: [{ ...mensaje, at: Date.now() }, ...previo.messages].slice(
                0,
                VENTANA,
              ),
              cursorMessages: Math.max(previo.cursorMessages, mensaje.id),
            },
      )
    },
  })
}

export function useGameLeaderboardSummary(scope: Scope, enabled: boolean) {
  const api = useGameApi()
  return useQuery({
    queryKey: [...gameKeys.leaderboard, "summary", ...scopeKey(scope)],
    queryFn: async () =>
      unwrap(
        await api.GET("/game/derivemos/leaderboard/summary", {
          params: { query: scopeQuery(scope) },
        }),
      ),
    enabled,
    staleTime: 30_000,
  })
}

export type GameRecruitEntry = components["schemas"]["GameRecruitEntry"]
export type GameRecruits = components["schemas"]["GameRecruitsResponse"]

/** Los reclutas propios: quiénes entraron por el link y cuánto aportaron.
 *
 * Con raíz propia (`gameKeys.recruits`) y no colgado del ranking: el latido
 * invalida el ranking cada vez que alguien —cualquiera— responde algo, y esta
 * lista solo cambia cuando se mueve UN recluta propio. Estando abajo del
 * ranking se volvía a pedir todo el tiempo para devolver casi siempre lo mismo.
 *
 * Se refresca al abrir la vista y cada tanto mientras se la mira; que el aporte
 * de alguien aparezca un minuto más tarde no le cambia nada a nadie. */
export function useGameRecruits(enabled: boolean) {
  const api = useGameApi()
  return useQuery({
    queryKey: gameKeys.recruits,
    queryFn: async () => unwrap(await api.GET("/game/derivemos/leaderboard/recruits")),
    enabled,
    staleTime: RECLUTAS_FRESCOS_MS,
    // Un reintento y listo. La lista se dibuja con los renglones de ejemplo
    // mientras esto viaja, así que un error acá no deja a nadie mirando una caja
    // vacía: deja en pantalla exactamente lo que corresponde mostrarle a quien
    // todavía no reclutó a nadie.
    retry: 1,
  })
}

export function useGameUniversityLeaderboard(scope: Scope, enabled: boolean) {
  const api = useGameApi()
  return useQuery({
    queryKey: [...gameKeys.leaderboard, "universities", ...scopeKey(scope)],
    queryFn: async () =>
      unwrap(
        await api.GET("/game/derivemos/leaderboard/universities", {
          params: { query: scopeQuery(scope) },
        }),
      ),
    enabled,
    staleTime: 30_000,
  })
}
