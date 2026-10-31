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
// Escribe cualquiera, invitados incluidos. Lo pedía —el campo se le mostraba
// apagado, con "Registrate para escribir" de placeholder— y se decidió en
// contra: la mayoría de la gente que está jugando no tiene cuenta, y un chat al
// que esa mayoría no puede contestar no es un chat, es un tablón con un campo
// gris al pie. Los frenos que quedan viven en el server (tres por minuto, 140
// caracteres, allowlist de caracteres; ver game/chat.py).

import { useEffect, useLayoutEffect, useRef } from "react"
import { motion } from "motion/react"
import { MessageCircle, SendHorizontal } from "lucide-react"
import { UniTag } from "@/components/university-tag"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import { fmtAgo } from "@intervalo/dx-core/juego/ranking-formato"
import { KeyCap } from "./exercise-card"
import { levelColor } from "@intervalo/dx-core/juego/game-colors"
import {
  MAX_TEXTO,
  mensajeDePendiente,
  renglonesDelCampo,
  textoPlano,
} from "@intervalo/dx-core/juego/chat"
import { useChat } from "@intervalo/dx-core/juego/UseChat"
import { claseDeSalida } from "./slide-salida"
import type { ConTiempo, GameEvent, GameMessage } from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { useCachedPlayer } from "./UseGamePlayer"

// Sin tope de líneas visibles. Lo hubo —cuarenta, sobre las hasta ochenta que
// traía el historial— con el argumento de que mostrarlas todas era scroll que
// nadie iba a subir. Resultó al revés: el panel abría con un tercio de la caja
// en blanco arriba y abajo, y el scroll no llevaba a ninguna parte, así que lo
// que parecía es que no había pasado nada. Ahora se dibuja todo lo cargado y
// subir pide más (ver `useHistorialViejo`), que es de donde salía el scroll que
// nadie subía: no había nada arriba.
//
// El techo lo pone el historial (TOPE_HISTORIAL en UseGameLeaderboard.ts), que
// es donde tiene que estar: es un límite de memoria, no de diseño.

// A qué distancia del techo se pide la página siguiente. Un poco antes de
// llegar, para que la carga alcance a resolverse mientras el dedo todavía se
// mueve.
const UMBRAL_ARRIBA_PX = 120

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

/** El renglón de un mensaje.
 *
 * Misma anatomía que una fila del ranking y que una línea del feed —el @ pintado
 * con el color de su nivel, la sigla en su tag, la antigüedad a la derecha en
 * tabular— porque es la misma persona en las tres pantallas. Lo único propio es
 * que el texto va abajo y no al lado: un mensaje puede ocupar dos renglones y
 * meterlo en la misma línea que el nombre parte la frase por la mitad.
 */
function MensajeRow({
  mensaje,
  pendiente,
  onReintentar,
}: {
  mensaje: ConTiempo<GameMessage>
  /** `undefined` = mensaje confirmado por el servidor, como siempre. */
  pendiente?: "enviando" | "fallo"
  onReintentar?: () => void
}) {
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
        pendiente === "enviando" && "opacity-60",
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
        {pendiente === undefined && (
          <span className="ml-auto shrink-0 tabular-nums text-[0.68rem] text-muted-foreground/70">
            {fmtAgo(mensaje.seconds_ago)}
          </span>
        )}
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
      {/* Lo único que cambia con la confirmación real: mientras viaja, un
          aviso chico; si el servidor lo rechazó, un reintento que reusa el
          mismo texto en vez de pedir que se vuelva a escribir. */}
      {pendiente === "enviando" && (
        <span className="text-[0.65rem] text-muted-foreground/70">Enviando…</span>
      )}
      {pendiente === "fallo" && (
        <button
          type="button"
          onClick={onReintentar}
          className="w-fit text-[0.68rem] text-orange-400 underline underline-offset-2"
        >
          No se pudo mandar — reintentar
        </button>
      )}
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
        {textoPlano(evento)}{" "}
        <span aria-hidden>{evento.emoji}</span>
      </span>
      <span className="shrink-0 tabular-nums text-[0.68rem] text-muted-foreground/60">
        {fmtAgo(evento.seconds_ago)}
      </span>
    </motion.li>
  )
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
  enfocaAlAbrir = false,
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
  // ¿Al abrirse se lleva el foco al campo? En escritorio SÍ: se llegó tecleando
  // `u`, y lo que sigue es escribir. En el teléfono NO, y esa es la diferencia
  // que esta prop existe para marcar — allá enfocar levanta el teclado, que se
  // come media pantalla de una conversación que la persona vino a LEER.
  //
  // Default `false` a propósito: el teléfono monta este panel en dos lugares
  // (la diapo de chat y la de novedades) sin pasar `open`, así que el default
  // tiene que ser el que no sorprende. Quien quiera el foco lo pide.
  enfocaAlAbrir?: boolean
  // El botón Volver que reemplaza al compositor mientras corre el
  // enfriamiento de después de mandar (ver más abajo). Sin esto —el teléfono,
  // que cierra el chat con su propio botón de salir— no aparece.
  onClose?: () => void
  className?: string
}) {
  const player = useCachedPlayer()
  const sfx = useSfx()
  // El estado (lista intercalada, envíos optimistas, enfriamiento) vive en
  // dx-core para compartirlo con la app nativa. Ver UseChat.ts.
  const {
    lineas,
    pendientes,
    texto,
    setTexto,
    error,
    falta,
    apagado,
    puedeEscribir,
    puedeMandar,
    mandar: mandarChat,
    reintentar,
    hayMas,
    cargarViejas,
  } = useChat({ enabled, player, onEnviado: sfx.select })
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // Al abrir, el foco va al campo — pero solo donde se pidió (ver
  // `enfocaAlAbrir`). En escritorio se llegó tecleando `u` y lo que sigue es
  // escribir, así que hacer además un clic sería un paso que nadie entiende para
  // qué está. En el teléfono es al revés: entrar al chat levantaba el teclado
  // solo, tapando media conversación antes de que la persona alcanzara a leerla.
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
    if (!enfocaAlAbrir || !open || !puedeEscribir) return
    inputRef.current?.focus()
  }, [enfocaAlAbrir, open, puedeEscribir])

  const scrollRef = useRef<HTMLDivElement | null>(null)
  // ¿Está pegado al fondo? Mismo mecanismo que el feed y por lo mismo: seguir lo
  // último sin arrebatarle el scroll a quien está leyendo hacia arriba.
  const pegadoRef = useRef(true)

  // Cargar más al llegar arriba. Lo que se pide es historia MÁS VIEJA, que entra
  // por el techo de una lista anclada abajo: sin compensar, el contenido nuevo
  // empuja todo hacia abajo y lo que se estaba leyendo se va de la pantalla. Se
  // anota el alto de antes y después del pintado se le suma la diferencia al
  // scroll, así el renglón que estaba bajo el dedo queda donde estaba.
  const altoAntesRef = useRef<number | null>(null)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const antes = altoAntesRef.current
    if (antes !== null && el.scrollHeight !== antes) {
      altoAntesRef.current = null
      el.scrollTop += el.scrollHeight - antes
      return
    }
    if (!pegadoRef.current) return
    el.scrollTop = el.scrollHeight
  })

  const mandar = () => {
    if (mandarChat()) pegadoRef.current = true
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          pegadoRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < MARGEN_PEGADO_PX
          // El pestillo contra pedidos repetidos vive adentro de
          // `cargarViejas`: el scroll dispara muchas veces por gesto.
          if (hayMas && el.scrollTop < UMBRAL_ARRIBA_PX) {
            altoAntesRef.current = el.scrollHeight
            void cargarViejas()
          }
        }}
        className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-0.5 py-1"
      >
        {lineas.length === 0 && pendientes.length === 0 ? (
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
            {/* Siempre al final: son los más recientes, y todavía no tienen
                un `id` real con el que intercalarse por tiempo entre las
                novedades. */}
            {pendientes.map((p) => (
              <MensajeRow
                key={`pend-${p.localId}`}
                mensaje={mensajeDePendiente(p)}
                pendiente={p.failed ? "fallo" : "enviando"}
                onReintentar={() => reintentar(p)}
              />
            ))}
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
              rows={renglonesDelCampo(texto)}
              onChange={(e) => setTexto(e.target.value)}
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
                apagado ? "El chat está apagado por ahora" : "Escribí algo…"
              }
              className={cn(
                "min-w-0 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-base md:text-sm outline-none",
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
