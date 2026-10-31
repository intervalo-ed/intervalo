import { useEffect, useMemo, useRef, useState } from "react"
import { registrarEnvio } from "./game-storage"
import {
  detalleDeError,
  intercalar,
  restante,
  VENTANA_MS,
  type Linea,
  type MensajePendiente,
} from "./chat"
import {
  hayMasHistorial,
  useGameEvents,
  useHistorialViejo,
  useSendMessage,
} from "./UseGameLeaderboard"

type Autor = { alias: string; level: number; university?: string | null }

/** El estado del chat del juego, sin dibujo: la lista intercalada, los envíos
 *  optimistas y el enfriamiento. Lo usan el panel de la web y el de la app. */
export function useChat({
  enabled,
  player,
  onEnviado,
}: {
  enabled: boolean
  /** Quién escribe. `null` mientras no hay jugador: no se manda nada. */
  player: Autor | null
  /** Cuando el servidor confirmó un mensaje (el sonido, en los dos lados). */
  onEnviado?: () => void
}) {
  const { data } = useGameEvents(enabled)
  const enviar = useSendMessage()
  const [texto, setTextoCrudo] = useState("")
  const [error, setError] = useState<string | null>(null)

  // El mensaje propio se ve al toque, sin esperar la confirmación real: el
  // cuadro se vacía y el mensaje aparece "enviando" de inmediato, y pasa a
  // confirmado (se saca de acá, ya vive en `data.messages`) o a "fallo" según lo
  // que conteste el servidor. Sin esto, entre el toque y el `onSuccess` —que
  // puede tardar por la moderación del lado del server— el cuadro vacío y la
  // lista sin cambios se leen como "no se mandó".
  const [pendientes, setPendientes] = useState<MensajePendiente[]>([])
  // Negativos: los ids reales son autoincrement positivo de la base
  // (GameMessageOut), así que nunca chocan.
  const nextLocalIdRef = useRef(-1)

  // El chat puede estar apagado del lado del servidor (GAME_CHAT_ENABLED). Se
  // asume prendido mientras no llegó la primera respuesta: apagar el campo por
  // no saber todavía sería mostrar el peor de los dos estados durante el
  // arranque. Y es lo ÚNICO que lo apaga: ser invitado ya no.
  const apagado = data !== undefined && !data.chatEnabled
  const puedeEscribir = !apagado

  const lineas = useMemo<Linea[]>(
    () => intercalar({ events: data?.events ?? [], messages: data?.messages ?? [] }),
    [data],
  )

  // El enfriamiento, en segundos que faltan. El intervalo no se apaga al llegar
  // a cero a propósito: es lo que hace que la cuenta vuelva a arrancar sola en
  // cuanto el envío más viejo de la ventana cumple el minuto. Cuando el valor no
  // cambia React ni redibuja.
  const [falta, setFalta] = useState(restante)
  useEffect(() => {
    const t = setInterval(() => setFalta(restante()), 1000)
    return () => clearInterval(t)
  }, [])

  const cargarViejas = useHistorialViejo()
  const hayMas = hayMasHistorial(data)

  // Sin `!enviar.isPending`: cada envío se rastrea solo, por su propia entrada
  // en `pendientes`, así que escribir uno nuevo no espera al anterior.
  const puedeMandar = puedeEscribir && texto.trim().length > 0 && falta === 0

  const setTexto = (nuevo: string) => {
    setTextoCrudo(nuevo)
    if (error) setError(null)
  }

  const despachar = (localId: number, text: string) => {
    enviar.mutate(text, {
      onSuccess: () => {
        onEnviado?.()
        setPendientes((ps) => ps.filter((p) => p.localId !== localId))
        registrarEnvio(Date.now(), VENTANA_MS)
        // Recién calculado y no `0` a mano: si todavía queda lugar en la
        // ventana (este no fue el tercero), el compositor sigue sirviendo.
        setFalta(restante())
      },
      onError: (e: unknown) => {
        setPendientes((ps) => ps.map((p) => (p.localId === localId ? { ...p, failed: true } : p)))
        setError(detalleDeError(e))
      },
    })
  }

  /** Manda lo escrito. Devuelve si salió algo (para que quien llama sepa que
   *  tiene que pegarse al fondo). */
  const mandar = (): boolean => {
    if (!puedeMandar || player === null) return false
    const limpio = texto.trim()
    const localId = nextLocalIdRef.current--
    setPendientes((ps) => [
      ...ps,
      {
        localId,
        text: limpio,
        failed: false,
        alias: player.alias,
        level: player.level,
        university: player.university ?? null,
        at: Date.now(),
      },
    ])
    setTextoCrudo("")
    setError(null)
    despachar(localId, limpio)
    return true
  }

  /** Reintenta un mensaje que falló, con el mismo texto. */
  const reintentar = (p: MensajePendiente) => {
    setPendientes((ps) => ps.map((x) => (x.localId === p.localId ? { ...x, failed: false } : x)))
    despachar(p.localId, p.text)
  }

  return {
    data,
    lineas,
    pendientes,
    texto,
    setTexto,
    error,
    falta,
    apagado,
    puedeEscribir,
    puedeMandar,
    mandar,
    reintentar,
    hayMas,
    cargarViejas,
  }
}
