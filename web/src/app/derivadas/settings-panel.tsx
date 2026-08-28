"use client"

// Panel de configuración: una sola columna angosta con secciones cortas —
// cambiar el @, la carrera y la universidad, el sonido, compartir, invitar un
// cafecito y reiniciar el progreso.
//
// En escritorio ya no se come la interfaz: la tuerca voltea la card del
// ejercicio y esto aparece del otro lado, con el ranking siempre a la vista. En
// el teléfono sigue siendo una slide propia, que ahí es lo mismo.
//
// Las slides de carrera y universidad son las MISMAS del onboarding
// (components/onboarding-fields.tsx), igual que en los hitos del juego.

import { useRef, useState } from "react"
import posthog from "posthog-js"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, Coffee, RotateCcw, Share2, Volume2, VolumeX } from "lucide-react"
import { ApiError, unwrap } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { CAREERS, CareerSelect, UniversityGrid } from "@/components/onboarding-fields"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UNIVERSITY_TAGS } from "@/lib/university-tags"
import { setSoundMuted, useSoundMuted } from "@/lib/audio/sound-settings"
import { useSfx } from "@/lib/audio/useSfx"
import { canonicalUniversity } from "@/lib/university-tags"
import { cn } from "@/lib/utils"
import { shareUrl } from "./cafecito-cta"
import { SlideFlip } from "./slide-flip"
import { useGameApi } from "./UseGameApi"
import { useCta } from "./game-telemetry"
import { gameKeys, type GamePlayer } from "./UseGamePlayer"

type Section = "root" | "alias" | "career" | "university"

// Valor centinela del desplegable de universidad: no es una sigla, es "abrime
// la pantalla del campo libre".
const OTRA = "__otra__"

// A dónde va el reclamo de un cafecito que no apareció. Provisorio: apunta a una
// casilla personal y no a la de Intervalo, y por eso vive acá suelto en vez de
// estar en la configuración del proyecto.
const RECLAMO_MAIL = "nvrancovich@gmail.com"

/** El mail de reclamo, ya escrito. */
function mailtoCafecito(alias?: string | null): string {
  const ahora = new Date()
  const cuando = `${ahora.getDate()}/${ahora.getMonth() + 1} a las ${ahora
    .getHours()
    .toString()
    .padStart(2, "0")}.${ahora.getMinutes().toString().padStart(2, "0")}`
  const cuerpo = [
    "Hola! Doné un cafecito y no lo vi en el juego.",
    "",
    `Mi @ es ${alias ?? "(no aparece)"} y lo doné el ${cuando}.`,
    "",
    "(No borres estas dos líneas, son las que nos dejan encontrarlo.)",
  ].join("\n")
  return `mailto:${RECLAMO_MAIL}?subject=${encodeURIComponent(
    "Mi cafecito no apareció",
  )}&body=${encodeURIComponent(cuerpo)}`
}

const rowCls =
  "flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:border-white/20"

/** Una fila que despliega sus opciones en el lugar, con la pinta de las demás.
 *
 * Solo en escritorio: ahí hay lugar de sobra al costado y mandar a otra pantalla
 * por elegir entre cuatro carreras es un viaje de ida y vuelta por nada. En el
 * teléfono la lista no entra y se sigue yendo a una slide. */
function RowSelect({
  label,
  value,
  display,
  onChange,
  children,
}: {
  label: string
  value: string
  display: React.ReactNode
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger
        aria-label={label}
        className={cn(rowCls, "h-auto! shadow-none [&>svg]:size-4 [&>svg]:opacity-60")}
      >
        <span className="text-muted-foreground">{label}</span>
        <SelectValue>{() => display}</SelectValue>
      </SelectTrigger>
      {/* Igual que el filtro del ranking: desplegable normal colgado del
          disparador, con su propio scroll. El modo "select nativo" monta la
          lista ENCIMA y con noventa universidades se va de pantalla.

          El tope de alto es NUEVE opciones: 9 × 34,2 px, el paso entre items
          medido (su `py-2` más la caja de línea del `text-sm`). Sin tope la
          lista se estira hasta el borde de la ventana, y con noventa
          universidades eso es un desplegable que tapa la pantalla entera y en el
          que igual hay que scrollear. La barrita queda siempre a la vista
          porque el contenido siempre la desborda, que es justo lo que avisa que
          la lista sigue.

          El número está medido, no derivado de un token: si cambia el cuerpo de
          letra o el padding del item hay que volver a medirlo. El costo de que
          se desfase es una fila cortada, no un layout roto.

          El `min` con la altura disponible es para las ventanas bajas: ahí manda
          la que sobra, que es lo que hacía el estilo original. */}
      <SelectContent
        alignItemWithTrigger={false}
        className="max-h-[min(308px,var(--available-height))]"
      >
        {children}
      </SelectContent>
    </Select>
  )
}

export function SettingsPanel({
  player,
  // En escritorio carrera y universidad se despliegan en el lugar; en el
  // teléfono se va a una slide y se vuelve.
  variant = "mobile",
  onClose,
  onReset,
  onCafecito,
  onNeedsRegister,
}: {
  player: GamePlayer | null
  variant?: "desktop" | "mobile"
  onClose: () => void
  // Reiniciar el progreso NO es cerrar el panel: el server vence el ejercicio
  // que estaba servido, así que quien monte esto tiene que tirar el suyo y pedir
  // otro. Sale por su propio callback en vez de por `onClose` porque quien lo
  // recibe necesita saber que pasó ESTO y no cualquier cierre.
  onReset: () => void
  // Abre la diapo del cafecito. Quien monta esto decide a dónde se vuelve
  // después, porque solo él sabe desde dónde se entró a configuración.
  onCafecito: () => void
  // El guest no elige su @: ese es el gancho del registro.
  onNeedsRegister: () => void
}) {
  const api = useGameApi()
  const cta = useCta()
  const queryClient = useQueryClient()
  const sfx = useSfx()
  const muted = useSoundMuted()
  const [section, setSection] = useState<Section>("root")
  const [alias, setAlias] = useState(player?.alias ?? "")
  const [aliasError, setAliasError] = useState<string | null>(null)
  const [aliasSaved, setAliasSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [busy, setBusy] = useState(false)
  const [university, setUniversity] = useState(player?.university ?? "")
  const [otherUniversity, setOtherUniversity] = useState("")
  const [showOther, setShowOther] = useState(false)
  const otherRef = useRef<HTMLInputElement>(null)

  // Los dos campos arrancan con lo que el jugador ya tiene, pero `useState` solo
  // mira su valor inicial: si el panel se abrió antes de que el jugador llegara
  // —o si llega uno distinto, como al volver del registro— quedaban vacíos para
  // siempre y guardar pisaba el perfil con "".
  //
  // Se ajusta durante el render y no en un efecto: es el patrón que React
  // recomienda para sincronizar estado con props, no necesita un pintado
  // intermedio con el valor viejo, y `react-hooks/set-state-in-effect` prohíbe
  // la otra forma. Solo dispara cuando cambia el valor DEL SERVIDOR, así que no
  // pisa lo que la persona está tecleando.
  const [perfilSincronizado, setPerfilSincronizado] = useState(player)
  if (player !== null && player !== perfilSincronizado) {
    setPerfilSincronizado(player)
    if (player.alias !== perfilSincronizado?.alias) setAlias(player.alias)
    if (player.university !== perfilSincronizado?.university) {
      setUniversity(player.university ?? "")
    }
  }

  // Todo cambio de perfil toca la fila propia del ranking (tag, badge, scope).
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: gameKeys.me })
    queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
  }

  const saveProfile = async (body: { career?: string; university?: string }) => {
    if (busy) return
    setBusy(true)
    try {
      await api.PATCH("/game/derivemos/me", { body })
      refreshAll()
    } catch {
      // Sin drama: el juego sigue y la próxima vuelta lo reintenta.
    }
    setBusy(false)
    setSection("root")
  }

  const saveAlias = async () => {
    const value = alias.trim()
    if (!value || busy) return
    setBusy(true)
    setAliasError(null)
    try {
      unwrap(await api.PATCH("/game/derivemos/me", { body: { alias: value } }))
      posthog.capture("game_alias_edited", { via: "settings" })
      setAliasSaved(true)
      refreshAll()
    } catch (err) {
      setAliasError(err instanceof ApiError ? err.message : "No se pudo guardar.")
    }
    setBusy(false)
  }

  const reset = async () => {
    if (busy) return
    setBusy(true)
    try {
      unwrap(await api.POST("/game/derivemos/reset"))
      posthog.capture("game_reset")
      refreshAll()
      onReset()
    } catch {
      setBusy(false)
      setConfirmReset(false)
    }
  }

  const confirmOther = () => {
    const value = canonicalUniversity(otherUniversity)
    if (!value) return
    void saveProfile({ university: value })
  }

  // Las tres secciones son tres pantallas y se cambian con el mismo volteo que
  // todo lo demás del juego (slide-flip.tsx).
  return (
    <SlideFlip slide={section} className="flex min-h-0 flex-1 flex-col">
      {section === "career" ? (
        <PanelShell title="Carrera" onBack={() => setSection("root")}>
          <CareerSelect
            value={player?.career ?? ""}
            onSelect={(value) => {
              sfx.select()
              void saveProfile({ career: value })
            }}
          />
        </PanelShell>
      ) : section === "alias" ? (
        <PanelShell title="Usuario" onBack={() => setSection("root")}>
          <form
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault()
              void saveAlias()
            }}
          >
            <span className="text-muted-foreground">@</span>
            <input
              autoFocus
              value={alias}
              onChange={(e) => {
                setAlias(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))
                setAliasSaved(false)
                setAliasError(null)
              }}
              maxLength={15}
              className="w-full bg-transparent text-sm outline-none"
            />
            <button
              type="submit"
              disabled={busy || alias === player?.alias}
              className="shrink-0 text-xs text-ring disabled:text-muted-foreground"
            >
              {aliasSaved ? "Guardado" : "Guardar"}
            </button>
          </form>
          {aliasError && <p className="mt-1 text-xs text-orange-300">{aliasError}</p>}
        </PanelShell>
      ) : section === "university" ? (
        // Sin título: `UniversityGrid` ya entra con su propio "¿Dónde?", y dos
        // encabezados seguidos diciendo lo mismo es uno de más. La flecha de
        // volver no depende del título, así que sigue estando.
        <PanelShell onBack={() => setSection("root")}>
        <UniversityGrid
          university={university}
          showOther={showOther}
          otherValue={otherUniversity}
          onOtherChange={setOtherUniversity}
          onPick={(u) => {
            sfx.select()
            setUniversity(u)
            setShowOther(false)
            void saveProfile({ university: u })
          }}
          onSelectOther={() => {
            sfx.select()
            setUniversity("")
            setShowOther(true)
          }}
          onConfirmOther={confirmOther}
          onPickSuggestion={(key) => {
            sfx.select()
            setOtherUniversity(key)
            otherRef.current?.focus()
          }}
          inputRef={otherRef}
        />
        {showOther && (
          <Button
            size="lg"
            className="mt-4 h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
            disabled={!otherUniversity.trim() || busy}
            onClick={confirmOther}
          >
            Guardar
          </Button>
        )}
      </PanelShell>
      ) : (
    <PanelShell onBack={onClose}>
      <div className="flex flex-col gap-2">
        {/* El @ es una fila más, igual que carrera y universidad: se toca y se
            cambia adentro. Antes era una caja aparte con su input y su botón de
            guardar a la vista, y rompía la lectura de la lista — tres filas
            iguales debajo de un formulario. El invitado no entra a editar: para
            él tocar acá es el gancho de registro. */}
        <button
          type="button"
          className={rowCls}
          onClick={() => (player?.is_guest ? onNeedsRegister() : setSection("alias"))}
        >
          <span className="text-muted-foreground">Usuario</span>
          <span className={player?.is_guest ? "text-ring" : undefined}>
            @{player?.alias ?? ""}
          </span>
        </button>

        {variant === "desktop" ? (
          <RowSelect
            label="Carrera"
            value={player?.career ?? ""}
            display={careerLabel(player?.career)}
            onChange={(v) => {
              sfx.select()
              void saveProfile({ career: v })
            }}
          >
            {CAREERS.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.emoji} {c.label}
              </SelectItem>
            ))}
          </RowSelect>
        ) : (
          <button type="button" className={rowCls} onClick={() => setSection("career")}>
            <span className="text-muted-foreground">Carrera</span>
            <span>{careerLabel(player?.career)}</span>
          </button>
        )}

        {variant === "desktop" ? (
          <RowSelect
            label="Universidad"
            value={player?.university ?? ""}
            display={player?.university ?? "Elegir"}
            onChange={(v) => {
              sfx.select()
              // "Otra" no es una universidad: manda a la pantalla que sí tiene
              // el campo libre. Meter un input adentro del desplegable habría
              // sido pelear con el foco del componente para nada.
              if (v === OTRA) setSection("university")
              else void saveProfile({ university: v })
            }}
          >
            {UNIVERSITY_TAGS.map((u) => (
              <SelectItem key={u.key} value={u.key}>
                {u.key}
              </SelectItem>
            ))}
            <SelectItem value={OTRA}>Otra…</SelectItem>
          </RowSelect>
        ) : (
          <button type="button" className={rowCls} onClick={() => setSection("university")}>
            <span className="text-muted-foreground">Universidad</span>
            <span>{player?.university ?? "Elegir"}</span>
          </button>
        )}

        <button
          type="button"
          className={rowCls}
          onClick={() => {
            setSoundMuted(!muted)
            if (muted) sfx.select()
          }}
        >
          <span className="text-muted-foreground">Sonido</span>
          <span className="flex items-center gap-2">
            {muted ? "Apagado" : "Encendido"}
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </span>
        </button>

        <a
          href={shareUrl({ alias: player?.alias, university: player?.university })}
          target="_blank"
          rel="noreferrer"
          onClick={() => cta("share", "click", { placement: "settings" })}
          className={rowCls}
        >
          <span className="text-muted-foreground">Compartir</span>
          <Share2 size={16} />
        </a>

        {/* Abre la diapo del cafecito, no Cafecito.

            Era un enlace directo, y de los tres caminos que había al mismo lugar
            este era el peor: NO anotaba la intención. O sea que quien donaba
            desde acá llegaba al servidor sin nada que lo identificara, y su
            donación se la repartían las intenciones abiertas de otras personas o
            terminaba siendo global. Es exactamente la forma en que se pierde una
            atribución, y ya pasó con una donación real.

            Ahora los tres botones del juego llevan a la misma diapo, que es la
            única que sabe anotar la intención, mostrar el slider y contarle a la
            persona qué pasó cuando vuelve. */}
        <button
          type="button"
          onClick={() => {
            cta("cafecito", "click", { placement: "settings" })
            onCafecito()
          }}
          className={cn(rowCls, "border-[#A8703C]/50 text-[#A8703C]")}
        >
          <span>Invitar un cafecito</span>
          <Coffee size={16} />
        </button>

        {/* La salida de emergencia del cafecito que no llegó.

            El canal de alertas de Cafecito no repite lo viejo al reconectarse, así
            que una donación que entre con el backend caído se pierde y no se
            recupera sola (ver backend/game/cafecito_stream.py). Esto es lo que
            hace que esa persona no se quede sin nada: se aplica a mano con
            grant_game_boost.py.

            El mail va ESCRITO, con el @ y el momento adentro. Sin esos dos datos
            un reclamo no se puede cruzar contra nada, y pedírselos a alguien que
            ya pagó y encima no recibió lo suyo es pedir de más. */}
        <a
          href={mailtoCafecito(player?.alias)}
          onClick={() => cta("cafecito", "click", { placement: "settings_reclamo" })}
          className={cn(rowCls, "text-muted-foreground")}
        >
          <span>Mi cafecito no apareció</span>
          <Coffee size={16} className="opacity-60" />
        </a>

        {confirmReset ? (
          <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-4 py-3">
            <p className="text-sm font-medium text-orange-300">
              ¿Reiniciar el progreso?
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/85">
              Volvés a cero en XP, racha y dificultad — el ranking te manda al
              fondo. Tu nombre, carrera y universidad quedan como están.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
                onClick={() => setConfirmReset(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-md bg-orange-500/80 px-3 py-2 text-sm font-medium text-white"
                onClick={() => void reset()}
              >
                Reiniciar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={cn(rowCls, "text-muted-foreground")}
            onClick={() => setConfirmReset(true)}
          >
            <span>Reiniciar progreso</span>
            <RotateCcw size={16} />
          </button>
        )}
      </div>
    </PanelShell>
      )}
    </SlideFlip>
  )
}

function careerLabel(career: string | null | undefined): string {
  const names: Record<string, string> = {
    E: "Ingeniería",
    S: "Ciencia",
    T: "Tecnología",
    M: "Matemática",
  }
  return career ? (names[career] ?? career) : "Elegir"
}

function PanelShell({
  title,
  onBack,
  children,
}: {
  // Opcional. No lo lleva la raíz —las filas ya dicen qué es cada cosa— ni la
  // de universidad, que entra con su propio "¿Dónde?". Lo llevan las que no
  // traen encabezado propio, porque ahí es lo único que dice qué se elige.
  title?: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-4">
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent"
        >
          <ChevronLeft size={18} />
        </button>
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
      </div>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
