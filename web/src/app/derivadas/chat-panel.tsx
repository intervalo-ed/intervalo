"use client"

// El chat del juego: lo que pasa y lo que la gente dice, en la misma columna.
//
// No es un chat al lado de las novedades: es UNA sola lista donde se intercalan.
// Que «alguien invitó 5 cafecitos para la UTN» aparezca entre dos mensajes es lo
// que hace que el panel se lea como un lugar y no como dos widgets apilados — y
// además es la única forma de que un anuncio se comente, que es lo que uno
// querría que pasara.
//
// Las dos listas viajan en el MISMO pedido que ya corría cada ocho segundos (ver
// useGameEvents), así que abrir esto no le cuesta nada al servidor. La latencia
// es de hasta ocho segundos y eso está bien: no es una conversación, es un
// tablón donde se deja un mensaje cada tanto.
//
// Escribir pide cuenta. Al invitado no se le esconde el campo: se le muestra
// apagado con el motivo, porque un campo que no está no invita a registrarse y
// uno que dice por qué no anda, sí.

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import { MessageCircle, SendHorizontal } from "lucide-react"
import { UniTag } from "@/components/university-tag"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import { fmtAgo } from "./event-feed"
import { KeyCap } from "./exercise-card"
import { levelColor } from "./game-colors"
import { readEnviosRecientes, registrarEnvio } from "./game-storage"
import { claseDeSalida } from "./slide-salida"
import {
  useGameEvents,
  useSendMessage,
  type ConTiempo,
  type GameEvent,
  type GameMessage,
} from "./UseGameLeaderboard"
import { useCachedPlayer } from "./UseGamePlayer"

// Lo mismo que acepta el servidor (chat.MAX_TEXTO). Se repite acá para poder
// avisar ANTES de mandar; quien manda de verdad es el backend.
const MAX_TEXTO = 140

// Espejo de chat.MAX_LINEAS: hasta dónde crece el textarea solo. El tope de
// verdad lo pone igual el servidor (`limpiar()`); esto es nada más para que
// el campo no empuje un dibujo entero fuera de la pantalla mientras se
// escribe.
const MAX_LINEAS = 6

// Hasta tres mensajes por minuto, espejo de `limits.por_jugador(3)`. Acá solo
// sirve para que el botón sepa esperar en vez de comerse un 429.
const VENTANA_MS = 60_000
const MAX_POR_MINUTO = 3

// Cuántas líneas se muestran. La ventana del historial son 40 de cada tipo, o
// sea hasta 80 intercaladas: mostrarlas todas es scroll que nadie va a subir.
const VISIBLES = 40

// La tecla que abre el chat.
//
// Se eligió midiendo, igual que `i` sobre `c` en su momento: el listener va en
// captura y le roba la letra a MathLive, así que la tecla deja de poder
// escribirse en la fórmula. De las 260 abreviaturas de MathLive, cinco empiezan
// con `u` —upsilon, uu, uuu, uarr, union— y ninguna está en el vocabulario de
// una derivada (las que el juego usa de verdad son sin, cos, tan, ln, log,
// sqrt, pi). El mismo perfil que `m`, que es la que ocupaba este lugar antes.
//
// Las cinco tomadas hoy: `w` reclutar, `i` invitar, `j` estadísticas, `p` el
// «¿Por qué?», `u` esto.
//
// OJO al mantenerla apretada: la pulsación que abre el chat le da el foco al
// campo de abajo, y las repeticiones automáticas que siguen llegan con ESE campo
// como destino, así que se escribirían solas. Quien se las traga es el listener
// del layout, que recuerda que la tecla sigue apretada hasta el keyup — ver
// `abriendoChatRef` en desktop-layout.tsx.
export const TECLA_CHAT = "u"

const MARGEN_PEGADO_PX = 24

/** Segundos que faltan para poder volver a escribir.
 *
 * Cero mientras haya lugar en la ventana de un minuto (menos de
 * `MAX_POR_MINUTO` envíos recientes) — recién cuando se llena hay que esperar
 * a que el más viejo de esos envíos cumpla el minuto y se caiga de la cuenta. */
function restante(): number {
  const ahora = Date.now()
  const vigentes = readEnviosRecientes().filter((t) => t > ahora - VENTANA_MS)
  if (vigentes.length < MAX_POR_MINUTO) return 0
  const masViejo = Math.min(...vigentes)
  return Math.max(0, Math.ceil((masViejo + VENTANA_MS - ahora) / 1000))
}

type Linea =
  | { tipo: "evento"; at: number; clave: string; evento: ConTiempo<GameEvent> }
  | { tipo: "mensaje"; at: number; clave: string; mensaje: ConTiempo<GameMessage> }

/** El renglón de un mensaje.
 *
 * Misma anatomía que una fila del ranking y que una línea del feed —el @ pintado
 * con el color de su nivel, la sigla en su tag, la antigüedad a la derecha en
 * tabular— porque es la misma persona en las tres pantallas. Lo único propio es
 * que el texto va abajo y no al lado: un mensaje puede ocupar dos renglones y
 * meterlo en la misma línea que el nombre parte la frase por la mitad.
 */
function MensajeRow({ mensaje }: { mensaje: ConTiempo<GameMessage> }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-xs leading-snug",
        mensaje.is_mine && "bg-primary/10",
      )}
    >
      <span className="flex items-baseline gap-1.5">
        <span
          className="min-w-0 truncate font-medium"
          style={{ color: levelColor(mensaje.level) }}
        >
          {mensaje.alias}
        </span>
        {mensaje.university && (
          <span className="shrink-0">
            <UniTag university={mensaje.university} />
          </span>
        )}
        <span className="ml-auto shrink-0 tabular-nums text-[0.68rem] text-muted-foreground/70">
          {fmtAgo(mensaje.seconds_ago)}
        </span>
      </span>
      {/* `break-words` y no `truncate`: un mensaje se lee entero o no se lee.
          El tope de 140 caracteres es lo que garantiza que "entero" sean dos
          renglones y no una pared.

          `whitespace-pre-wrap` + monoespaciada SOLO si el mensaje tiene más
          de un renglón: sin esto el salto de línea que el servidor ya
          preserva (game/chat.py :: limpiar) se pierde en el CSS —
          `white-space: normal` lo trata como un espacio más— y un dibujo
          ASCII de varias líneas se aplana en una sola. Un mensaje de un solo
          renglón no lo necesita y sigue exactamente igual que siempre: la
          fuente de siempre, el espaciado de siempre. */}
      <span
        className={cn(
          "text-foreground/90",
          mensaje.text.includes("\n")
            ? "whitespace-pre-wrap break-words font-mono text-[0.7rem] leading-tight"
            : "break-words",
        )}
      >
        {mensaje.text}
      </span>
    </motion.li>
  )
}

/** El renglón de una novedad, adentro del chat.
 *
 * Deliberadamente más apagado y más chico que un mensaje: acá el sistema es un
 * participante más, pero no es el que importa. En la franja de novedades de la
 * columna izquierda estas mismas líneas son las protagonistas y se ven distinto
 * — es el mismo dato en dos lugares con dos jerarquías (ver event-feed.tsx). */
function NovedadRow({ evento }: { evento: ConTiempo<GameEvent> }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-baseline gap-2 px-2 py-1 text-[0.7rem] leading-snug text-muted-foreground/80"
    >
      <span className="min-w-0 flex-1">
        {/* Sin los marcadores resueltos: acá la línea es contexto, no el evento
            protagonista, y el texto plano alcanza. Resolverlos pide el mismo
            trabajo que hace EventText y no cambiaría lo que se entiende. */}
        {textoPlano(evento.text, evento.actor_alias, evento.actor_b_alias, evento.universities)}{" "}
        <span aria-hidden>{evento.emoji}</span>
      </span>
      <span className="shrink-0 tabular-nums text-[0.68rem] text-muted-foreground/60">
        {fmtAgo(evento.seconds_ago)}
      </span>
    </motion.li>
  )
}

/** Los marcadores del feed, reemplazados a texto pelado. Ver events.py. */
function textoPlano(
  text: string,
  alias: string | null | undefined,
  aliasB: string | null | undefined,
  unis: string[],
): string {
  return text
    .replace("{a}", alias ?? "alguien")
    .replace("{b}", aliasB ?? "alguien")
    .replace("{u0}", unis[0] ?? "")
    .replace("{u1}", unis[1] ?? "")
}

/** El botón de la cabecera. Mismo molde que los otros cuatro.
 *
 * En escritorio la tecla alcanzaría, pero un atajo sin botón es una función que
 * solo conoce quien la escribió. En el teléfono no hay teclado, así que ahí el
 * botón ES el acceso. */
export function ChatButton({
  open,
  onToggle,
  sinLeer = 0,
  keyboard = true,
  className,
}: {
  open: boolean
  onToggle: () => void
  /** Cuántos mensajes entraron desde la última vez que se miró. 0 = sin punto. */
  sinLeer?: number
  /** La tecla al lado del ícono. Apagado en el teléfono, donde no hay ninguna. */
  keyboard?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={open ? "Cerrar el chat" : "Abrir el chat"}
      aria-pressed={open}
      onClick={onToggle}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
        open
          ? "border-foreground/40 bg-accent text-foreground"
          : "border-border text-muted-foreground hover:bg-accent",
        className,
      )}
    >
      <MessageCircle size={15} />
      {keyboard && <KeyCap className="ml-0">{TECLA_CHAT}</KeyCap>}
      {/* Un punto y no un número: lo que hay que saber es "hay algo nuevo", y
          contar cuántos invita a compararlos con los de recién. */}
      {!open && sinLeer > 0 && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary"
        />
      )}
    </button>
  )
}

export function ChatPanel({
  enabled,
  open = true,
  onClose,
  className,
}: {
  enabled: boolean
  // ¿Está a la vista AHORA? Lo necesita el foco: en escritorio este panel vive
  // en el dorso del aside y no se desmonta al cerrarse —`backKind` se queda en
  // "chat" para que la cara no cambie mientras la card gira— así que "montarse"
  // y "abrirse" son dos cosas distintas y solo la segunda es la que importa.
  // Default `true` para quien lo monta al abrirlo y punto, como una pantalla del
  // teléfono.
  open?: boolean
  // El botón Volver que reemplaza al compositor mientras corre el
  // enfriamiento de después de mandar (ver más abajo). Sin esto —el teléfono,
  // que cierra el chat con su propio botón de salir— no aparece.
  onClose?: () => void
  className?: string
}) {
  const { data } = useGameEvents(enabled)
  const enviar = useSendMessage()
  const player = useCachedPlayer()
  const sfx = useSfx()
  const [texto, setTexto] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const esInvitado = player === null || player.is_guest
  // El chat puede estar apagado del lado del servidor (GAME_CHAT_ENABLED). Se
  // asume prendido mientras no llegó la primera respuesta: apagar el campo por
  // no saber todavía sería mostrar el peor de los dos estados durante el
  // arranque.
  const apagado = data !== undefined && !data.chatEnabled
  const puedeEscribir = !esInvitado && !apagado

  // Las dos listas, intercaladas por cuándo pasó cada cosa. Vienen de la más
  // nueva a la más vieja y se dan vuelta al final, igual que el feed: así lo
  // último queda abajo, que es donde se lo busca en un chat.
  const lineas = useMemo<Linea[]>(() => {
    const eventos: Linea[] = (data?.events ?? []).map((e) => ({
      tipo: "evento",
      at: e.at,
      clave: `e${e.id}`,
      evento: e,
    }))
    const mensajes: Linea[] = (data?.messages ?? []).map((m) => ({
      tipo: "mensaje",
      at: m.at,
      clave: `m${m.id}`,
      mensaje: m,
    }))
    return [...eventos, ...mensajes]
      .sort((a, b) => b.at - a.at)
      .slice(0, VISIBLES)
      .reverse()
  }, [data])

  // El enfriamiento, en segundos que faltan — cero salvo que ya se hayan
  // gastado los `MAX_POR_MINUTO` envíos de la ventana.
  //
  // El valor inicial sale del propio render (`useState` con función) y no de un
  // efecto: escribir estado adentro de un efecto es justo lo que el lint del
  // compilador de React rechaza, y acá además no hace falta — el dato ya está en
  // localStorage antes del primer pintado.
  //
  // El intervalo corre mientras el panel esté abierto y no se apaga al llegar a
  // cero. Es a propósito: es lo que hace que la cuenta vuelva a arrancar sola en
  // cuanto el envío más viejo de la ventana cumple el minuto, sin depender de
  // que nadie la reinicie. Cuesta una lectura de localStorage por segundo, y
  // cuando el valor no cambia React ni redibuja.
  const [falta, setFalta] = useState(restante)
  useEffect(() => {
    const t = setInterval(() => setFalta(restante()), 1000)
    return () => clearInterval(t)
  }, [])

  // Al abrir, el foco va al campo. Se llegó acá tecleando `u` o tocando un
  // botón: en los dos casos lo que sigue es escribir, y hacer que además haya que
  // ir a hacer clic sería pedir un paso que nadie entiende para qué está.
  //
  // Colgado de `open` y NO del montaje, que es lo que estaba mal: en escritorio
  // el panel se monta la primera vez que se abre y ya no se desmonta más
  // —`backKind` se queda en "chat" para que la cara de atrás no cambie mientras
  // la card gira—, así que un efecto de montaje enfocaba la primera vez y
  // ninguna otra.
  //
  // Solo si se puede escribir: robarle el foco al campo de la fórmula para
  // dejarlo en un input deshabilitado sería peor que no hacer nada — el teclado
  // dejaría de escribir en los dos lados. Al cerrar, el layout lo devuelve a la
  // fórmula (ver cerrarChat).
  useEffect(() => {
    if (!open || !puedeEscribir) return
    inputRef.current?.focus()
  }, [open, puedeEscribir])

  const scrollRef = useRef<HTMLDivElement | null>(null)
  // ¿Está pegado al fondo? Mismo mecanismo que el feed y por lo mismo: seguir lo
  // último sin arrebatarle el scroll a quien está leyendo hacia arriba.
  const pegadoRef = useRef(true)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !pegadoRef.current) return
    el.scrollTop = el.scrollHeight
  })

  const puedeMandar =
    puedeEscribir && texto.trim().length > 0 && falta === 0 && !enviar.isPending

  const mandar = () => {
    if (!puedeMandar) return
    const limpio = texto.trim()
    enviar.mutate(limpio, {
      onSuccess: () => {
        sfx.select()
        setTexto("")
        setError(null)
        registrarEnvio(Date.now(), VENTANA_MS)
        // Recién calculado y no `0` a mano: si todavía queda lugar en la
        // ventana (este no fue el tercero), el compositor sigue sirviendo.
        setFalta(restante())
        pegadoRef.current = true
      },
      onError: (e: unknown) => {
        // El servidor manda el motivo en español y dirigido a la persona (422
        // del saneado, 429 del tope, 403 de invitado). Mostrar el suyo y no uno
        // inventado acá es lo que hace que el mensaje sea cierto.
        const detalle =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: unknown }).message)
            : "No se pudo mandar."
        setError(detalle)
      },
    })
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          pegadoRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < MARGEN_PEGADO_PX
        }}
        className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-0.5 py-1"
      >
        {lineas.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            Todavía no dijo nada nadie.
          </p>
        ) : (
          <ul className="mt-auto flex flex-col gap-0.5">
            {lineas.map((l) =>
              l.tipo === "mensaje" ? (
                <MensajeRow key={l.clave} mensaje={l.mensaje} />
              ) : (
                <NovedadRow key={l.clave} evento={l.evento} />
              ),
            )}
          </ul>
        )}
      </div>

      {error && (
        <p className="px-1 text-[0.7rem] leading-snug text-orange-400">{error}</p>
      )}

      {/* Mientras quede lugar en la ventana del minuto (`falta === 0`) el
          compositor sigue ahí: hasta MAX_POR_MINUTO mensajes se mandan uno
          atrás del otro, sin que aparezca nada en el medio. Recién cuando se
          gasta el tercero y hay que esperar, el compositor deja de servir para
          nada hasta que se cumpla el enfriamiento — mostrarlo apagado con la
          cuenta regresiva era un campo muerto y nada que hacer con él. En vez
          de eso, el mismo botón Volver que ya usan cafecito y reclutas al
          terminar lo suyo: ya escribiste, lo que sigue es salir. */}
      {puedeEscribir && falta > 0 && onClose ? (
        <button type="button" onClick={onClose} className={cn(claseDeSalida(false), "gap-2")}>
          Volver
          <KeyCap>enter</KeyCap>
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex shrink-0 items-end gap-2">
            {/* `textarea` y no `input`: uno de una sola línea le corta el salto
                de línea a lo que se tipea Y a lo que se pega, así que un dibujo
                ASCII de varios renglones (game/chat.py :: MAX_LINEAS) no tenía
                forma de entrar por acá aunque el servidor ya lo aceptara.
                `rows` sigue el número de renglones escritos —arranca en 1 y se
                ve exactamente como el input de siempre— así que crece solo con
                quien realmente está armando un dibujo. */}
            <textarea
              ref={inputRef}
              value={texto}
              rows={Math.min(MAX_LINEAS, Math.max(1, texto.split("\n").length))}
              onChange={(e) => {
                setTexto(e.target.value)
                if (error) setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return
                if (e.shiftKey) {
                  // Shift+Enter mete el renglón nuevo (el textarea ya lo hace
                  // solo); lo único que hace falta es que no llegue al listener
                  // global de Enter, o escribir un dibujo de varios renglones
                  // cerraría el chat a mitad de camino.
                  e.stopPropagation()
                  return
                }
                // Enter pelado manda. Se para acá y no llega al documento: el
                // juego entero se maneja con Enter, y sin esto mandar un
                // mensaje pediría además la derivada siguiente.
                e.preventDefault()
                e.stopPropagation()
                mandar()
              }}
              maxLength={MAX_TEXTO}
              disabled={!puedeEscribir}
              placeholder={
                apagado
                  ? "El chat está apagado por ahora"
                  : esInvitado
                    ? "Registrate para escribir"
                    : "Escribí algo…"
              }
              className={cn(
                "min-w-0 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none",
                "placeholder:text-muted-foreground/70 focus:border-primary/60",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            />
            <button
              type="button"
              onClick={mandar}
              disabled={!puedeMandar}
              aria-label="Mandar"
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md transition-opacity",
                "bg-primary text-primary-foreground hover:opacity-90",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              <SendHorizontal size={16} />
            </button>
          </div>
          {/* Salir del chat sin tocar la fórmula ni buscar el botón de la
              cabecera: Escape ya cierra el chat desde cualquier lado (ver
              desktop-layout.tsx), esto es solo hacerlo visible. Gated por
              `onClose` y no por una prop de plataforma propia: en el teléfono
              no llega —ahí el chat es una pantalla con su propia salida— así
              que ya sale solo en escritorio. */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              // Blanco como el Continuar del ejercicio (exercise-card.tsx ::
              // AnswerButton) y no el contorno gris de `claseDeSalida`: acá no
              // es "la salida discreta", es la acción que sigue.
              className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-base font-semibold text-black transition-opacity hover:opacity-90"
            >
              Volver
              <KeyCap>esc</KeyCap>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
