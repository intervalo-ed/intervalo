"use client"

// Slides de registro del minijuego, en el orden que pide el producto:
// hito 1 (usuario enganchado) → carrera y universidad, IDÉNTICAS a las del
// onboarding (components/onboarding-fields.tsx); hito 2 → registro con Google
// con el gancho de elegir tu @username. Todo skippeable ("Ahora no").

import { useEffect, useRef, useState } from "react"
import { useIsPresent } from "motion/react"
import { useQueryClient } from "@tanstack/react-query"
import posthog from "posthog-js"
import { Button } from "@/components/ui/button"
import {
  CAREER_CHOICES,
  CareerSelect,
  UniversityGrid,
} from "@/components/onboarding-fields"
import { readOnboarding, saveOnboarding } from "@/lib/onboarding/storage"
import {
  ONBOARDING_UNIVERSITIES,
  canonicalUniversity,
} from "@/lib/university-tags"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import { ApiError, unwrap } from "@/lib/api/client"
import { ArrowUp } from "lucide-react"
import { XpDots } from "@/components/xp-dots"
import { ALL_SCOPE } from "@/components/leaderboard-chrome"
import { VERDE } from "./cafecito-cta"
import { KeyCap } from "./exercise-card"
import { GoogleIcon, readDesiredAlias, clearDesiredAlias, saveDesiredAlias, useGoogleLogin } from "./google-login"
import { levelColor } from "./game-colors"
import { Salida, claseDeSalida } from "./slide-salida"
import { SlideFlip } from "./slide-flip"
import { SlideHorizontal } from "./slide-horizontal"
import { digitoDe, enCampoDeTexto, enCampoHtml, useTeclas } from "./teclas"
import { useGameApi } from "./UseGameApi"
import { useGameLeaderboard, useGameRecruits } from "./UseGameLeaderboard"
import { gameKeys, type GamePlayer } from "./UseGamePlayer"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// Las slides están dibujadas para una columna de teléfono (`max-w-md`, el mismo
// ancho del onboarding). En el panel de escritorio, que es bastante más ancho,
// hay que acotarlas y centrarlas: si no, la grilla 2×2 de carreras y los chips
// de universidad se estiran y quedan deformes.
const panelCls = "mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-6"
const bodyCls = "flex min-h-0 flex-1 flex-col overflow-y-auto py-6"
// El mismo cuerpo, en el teléfono. Centrado de verdad quedaba ALTO a la vista:
// debajo tiene «Ahora no», que es texto suelto y no pesa, así que el bloque se
// leía pegado al techo con un hueco abajo. Más relleno arriba que abajo lo corre
// ~20 px hacia los botones sin moverlos (la mitad de la diferencia, porque el
// contenido sigue centrado en lo que queda).
const bodyMovilCls =
  "flex min-h-0 flex-1 flex-col overflow-y-auto pb-2 pt-12"

// El @ deseado (`readDesiredAlias`, `clearDesiredAlias`) vive en
// google-login.tsx, junto con el login que lo necesita.

// Persistir carrera/universidad: al jugador (backend) y como prefill del
// onboarding de Intervalo (localStorage, solo si no había nada — semántica
// register_once). El puente es pasivo: el juego no linkea a Intervalo.
export function ProfileSlides({
  onDone,
  onSkip,
  slotSalida,
  keyboard = false,
}: {
  onDone: (data: { career: string; university: string }) => void
  onSkip: () => void
  // Dónde dibujar los botones de cada pantalla: el pie de la columna, AFUERA
  // de la caja — misma idea que cafecito/reclutas, el registro desde
  // Configuración y "Elegí tu @" (slide-salida.tsx), para que la caja mida lo
  // mismo que la del ejercicio en vez de comerse la columna entera. Solo lo
  // manda `desktop-layout.tsx`; en el teléfono los botones se quedan adentro,
  // donde siempre estuvieron.
  slotSalida?: HTMLElement | null
  // Atajos de teclado, solo escritorio (mismo criterio que el registro de más
  // abajo): cada opción tiene su número, Enter es Continuar y Alt+Enter es
  // «Ahora no». Valen en las dos pantallas —carrera y universidad— porque el
  // pie es el mismo: un Enter que anduviera en una sola dejaría al chip del
  // botón mintiendo en la otra.
  keyboard?: boolean
}) {
  const sfx = useSfx()
  const api = useGameApi()
  const teclas = useTeclas()
  const [phase, setPhase] = useState<"career" | "university">("career")
  const [career, setCareer] = useState("")
  const [university, setUniversity] = useState("")
  const [universityOther, setUniversityOther] = useState("")
  const [showOther, setShowOther] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  // De esta pantalla se sale UNA vez, guardando o salteando. El guardia es un
  // ref y no `saving`: el estado recién se entera en el render siguiente, y dos
  // teclas en el mismo instante lo leían las dos en `false` — dos guardados, o
  // un guardado y un «Ahora no», y cada uno pedía su derivada siguiente.
  const saliendoRef = useRef(false)
  // Y se SUELTA al rato. Salir es pedir la derivada siguiente, y ese pedido
  // puede fallar: ahí la pantalla no se va, y con el guardia puesto para
  // siempre no quedaba ni «Ahora no» ni Continuar — solo recargar. Un segundo y
  // medio es mucho más que el doble toque que el guardia existe para frenar, y
  // si la pantalla sí se fue, el desmontaje cancela el reloj.
  const soltarRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (soltarRef.current) clearTimeout(soltarRef.current)
    },
    [],
  )
  const soltarLuego = () => {
    if (soltarRef.current) clearTimeout(soltarRef.current)
    soltarRef.current = setTimeout(() => {
      saliendoRef.current = false
      setSaving(false)
    }, 1500)
  }

  const finish = async (chosenUniversity: string) => {
    if (saliendoRef.current) return
    saliendoRef.current = true
    setSaving(true)
    sfx.continue()
    try {
      await api.PATCH("/game/derivemos/me", {
        body: { career, university: chosenUniversity },
      })
    } catch {
      // Sin drama: el juego sigue; la próxima vuelta lo reintenta.
    }
    if (readOnboarding() === null && career && chosenUniversity) {
      saveOnboarding({
        name: "",
        career,
        university: chosenUniversity,
        course: "analisis",
      })
    }
    posthog.capture("game_register_completed", { slide: "profile" })
    onDone({ career, university: chosenUniversity })
    soltarLuego()
  }

  const confirmOther = () => {
    const value = canonicalUniversity(universityOther)
    if (!value) return
    void finish(value)
  }

  const elegirCarrera = (v: string) => {
    sfx.select()
    setCareer(v)
  }
  const elegirUniversidad = (u: string) => {
    sfx.select()
    setUniversity(u)
    setShowOther(false)
  }
  const abrirOtra = () => {
    sfx.select()
    setUniversity("")
    setShowOther(true)
  }
  const pasarAUniversidad = () => {
    sfx.continue()
    posthog.capture("game_register_slide_shown", { slide: "university" })
    setPhase("university")
  }
  const saltar = () => {
    if (saliendoRef.current) return
    saliendoRef.current = true
    onSkip()
    soltarLuego()
  }

  // Lo que hace cada tecla EN LA PANTALLA QUE SE VE. Las dos devuelven si la
  // tecla sirvió de algo, que es lo que decide si se la traga: un 9 que no es de
  // nadie tiene que seguir de largo.
  const continuar = () => {
    if (phase === "career") {
      if (career) pasarAUniversidad()
    } else if (showOther) confirmOther()
    else if (university) void finish(university)
  }
  const elegir = (i: number): boolean => {
    if (phase === "career") {
      const v = CAREER_CHOICES[i]
      if (v === undefined) return false
      elegirCarrera(v)
      return true
    }
    if (i < ONBOARDING_UNIVERSITIES.length) {
      elegirUniversidad(ONBOARDING_UNIVERSITIES[i])
      return true
    }
    // «Otra» es la que sigue al último chip, y solo mientras es un botón: una
    // vez abierta es un campo de texto y ahí los números son números.
    if (i === ONBOARDING_UNIVERSITIES.length && !showOther) {
      abrirOtra()
      return true
    }
    return false
  }

  // Por ref y no en las dependencias —mismo mecanismo que el registro de más
  // abajo—: son closures nuevas en cada render, y con ellas en la lista el
  // listener se sacaría y se pondría de nuevo en cada tecla.
  const atajosRef = useRef({ continuar, elegir, saltar })
  useEffect(() => {
    atajosRef.current = { continuar, elegir, saltar }
  })
  // Solo mientras la pantalla ESTÁ: el fundido de salida la deja montada 220 ms
  // (slide-flip.tsx), y en captura esos 220 ms le robaban las primeras teclas
  // a la derivada que ya había entrado.
  const presente = useIsPresent()
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!keyboard || !presente) return
    const onKey = (e: KeyboardEvent) => {
      // A esta pantalla se llega con un Enter (el Continuar del ejercicio). Si
      // sigue apretado, sus repeticiones no son una respuesta a lo que se ve.
      if (e.repeat) return
      if (e.key === "Enter") {
        // Alt+Enter llega siempre, también desde el campo de «Otra»: nada en
        // un `<input>` le da un uso a esa combinación.
        if (e.altKey) {
          e.preventDefault()
          e.stopPropagation()
          atajosRef.current.saltar()
          return
        }
        // El Enter del campo de «Otra» es del campo (ver `onConfirmOther`).
        if (enCampoDeTexto(e.target)) return
        // Y el de un botón de AFUERA de esta pantalla es de ese botón: quien
        // llegó con Tab hasta «Ahora no», o hasta la tuerca, y aprieta Enter,
        // quiere ese botón y no Continuar. Los de adentro —las tarjetas, que
        // se quedan con el foco al elegirlas con el mouse— no cuentan: ahí
        // Enter sigue siendo Continuar.
        const el = e.target as HTMLElement | null
        if (
          typeof el?.closest === "function" &&
          el.closest("button, a") &&
          !panelRef.current?.contains(el)
        )
          return
        e.preventDefault()
        e.stopPropagation()
        atajosRef.current.continuar()
        return
      }
      // Los números solo ceden ante un campo de texto de verdad («Otra», el
      // chat). Ni un filtro del ranking con el foco ni el campo de la
      // respuesta, que queda enfocado debajo de esta pantalla, se los pueden
      // quedar. Ver `teclas.ts :: enCampoHtml`.
      if (enCampoHtml(e.target)) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const n = digitoDe(e)
      if (n === null) return
      // El `preventDefault` importa con «Otra»: abre un campo con autofoco, y
      // sin esto el número de la tecla quedaba escrito adentro.
      if (atajosRef.current.elegir(n - 1)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    // EN CAPTURA, y parando la tecla usada. El campo de la respuesta conserva el
    // foco debajo de esta pantalla y MathLive no deja burbujear sus teclas: en
    // burbuja los números se escribían en un campo que no se ve. Y un Enter que
    // siguiera viaje llegaría al del ejercicio, que acá saltearía la pantalla.
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [keyboard, presente])

  // El número de cada opción, dibujado como tecla. `ml-0`: el margen de base
  // del chip es para cuando va después de una palabra, y acá va solo.
  const atajo = keyboard
    ? (i: number) => <KeyCap className="ml-0">{i + 1}</KeyCap>
    : undefined

  // Las dos preguntas del perfil son dos pantallas, y cambiar de pantalla en
  // este juego es el pase de cada aparato. Antes la segunda reemplazaba a la
  // primera sin más y parecía que la página se hubiera recargado sola.
  //
  // Y es el pase DEL APARATO, no siempre el volteo: estas dos caras viven
  // adentro de UNA sola diapo del teléfono, así que el `slideSeq` de
  // mobile-flow.tsx no cambia entre carrera y universidad y el deslizamiento de
  // afuera no ocurre. Con `SlideFlip` en los dos lados, «¿Dónde?» era la única
  // pantalla del teléfono que aparecía con un fundido en medio de un juego que
  // se mueve entero de costado. `slotSalida` —que ya distingue escritorio en
  // todo este archivo— elige cuál va.
  //
  // Los botones viven AFUERA del `SlideFlip`, y no —como antes— uno por fase
  // adentro de cada cara: `AnimatePresence` cruza las dos caras durante la
  // transición (las dos están montadas a la vez, ver slide-flip.tsx), así que
  // con un botón por cara y `slotSalida` puesto, las dos intentarían
  // portalizar al MISMO nodo del pie a la vez y se verían superpuestas un
  // instante. Afuera, el botón no cruza con nada: cambia de golpe con
  // `phase`, que es del padre y no de la cara.
  const cuerpoCls = slotSalida ? bodyCls : bodyMovilCls
  // `my-auto` en un hijo y no `justify-center` en el padre: con el contenido
  // más alto que la caja, `justify-center` lo centra igual y lo que sobra se va
  // por ARRIBA, donde el scroll no llega —el título desaparecía—. El margen
  // automático centra cuando sobra lugar y se queda en cero cuando no.
  const cara =
    phase === "career" ? (
      <div className={cuerpoCls}>
        <div className="my-auto">
        <CareerSelect
          value={career}
          onSelect={elegirCarrera}
          atajo={atajo}
        />
        </div>
      </div>
    ) : (
      <div className={cuerpoCls}>
        <div className="my-auto">
        <UniversityGrid
          university={university}
          showOther={showOther}
          otherValue={universityOther}
          onOtherChange={setUniversityOther}
          onPick={elegirUniversidad}
          onSelectOther={abrirOtra}
          onConfirmOther={confirmOther}
          onPickSuggestion={(key) => {
            sfx.select()
            setUniversityOther(key)
            inputRef.current?.focus()
          }}
          inputRef={inputRef}
          atajo={atajo}
        />
        </div>
      </div>
    )

  return (
    <div ref={panelRef} className={panelCls}>
      {slotSalida ? (
        <SlideFlip slide={phase} className="flex min-h-0 flex-1 flex-col">
          {cara}
        </SlideFlip>
      ) : (
        // Sin `flex`: `SlideHorizontal` es una grilla de una celda (así apila
        // las dos caras en el mismo lugar sin sacarlas del flujo), y ponerle
        // `flex` acá le pisaría el `display`.
        <SlideHorizontal llave={phase} className="min-h-0 flex-1">
          {cara}
        </SlideHorizontal>
      )}
      <Salida slot={slotSalida}>
        {/* En el pie (escritorio), Continuar y Ahora no van UNO AL LADO DEL
            OTRO —la misma fila que Revisar/¿Por qué?/Saltear en el
            ejercicio—, con Continuar quedándose con el ancho que sobra.

            En el teléfono van apilados y el Ahora no va ARRIBA: abajo de todo
            está el lugar que el pulgar alcanza sin mover la mano, y ahí tiene
            que estar lo que la pantalla pide, no la puerta de salida. Es la
            misma regla que ya seguían las diapos de pedido
            (slide-salida.tsx :: ConSalidaAbajo), y estas dos eran la excepción.
            `flex-col-reverse` y no reordenar el JSX para que el orden de
            tabulado siga siendo Continuar primero, que es la acción. */}
        <div
          className={
            slotSalida
              ? "flex w-full items-stretch gap-2"
              : "flex flex-col-reverse gap-2"
          }
        >
          {phase === "career" ? (
            <Button
              size="lg"
              className={cn(ctaCls, slotSalida && "flex-1")}
              disabled={!career}
              onClick={pasarAUniversidad}
            >
              Continuar
              {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
            </Button>
          ) : showOther ? (
            <Button
              size="lg"
              className={cn(ctaCls, slotSalida && "flex-1")}
              disabled={!universityOther.trim() || saving}
              onClick={confirmOther}
            >
              Continuar
              {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
            </Button>
          ) : (
            <Button
              size="lg"
              className={cn(ctaCls, slotSalida && "flex-1")}
              disabled={!university || saving}
              onClick={() => void finish(university)}
            >
              Continuar
              {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
            </Button>
          )}
          <button
            type="button"
            onClick={saltar}
            className={
              slotSalida
                ? cn(claseDeSalida(true), "w-auto shrink-0")
                : "py-2 text-sm text-muted-foreground"
            }
          >
            Ahora no
            {keyboard && <KeyCap>{teclas.altEnter}</KeyCap>}
          </button>
        </div>
      </Salida>
    </div>
  )
}

// Resaltado de "esta fila sos vos": el mismo que usa game-ranking.tsx (no
// exportado de ahí, así que se repite el mismo literal en vez de importarlo).
const MINE_ROW_CLASS = "bg-primary/10 ring-primary/30"

/** La fila propia del ranking, en miniatura: mismo formato que una fila de
 *  verdad (game-ranking.tsx :: Row) —puesto, @ con el color de su nivel,
 *  flecha de cuánto subió, XP— para que esta pantalla muestre el progreso
 *  con el mismo lenguaje visual que el ranking de al lado, en vez de
 *  repetirlo en prosa. */
function FilaPropia({
  player,
  delta,
}: {
  player: GamePlayer
  // El mismo `rank_delta` que ya trae la fila de verdad (game-ranking.tsx),
  // no una cuenta propia: se probó restando contra `climbFrom` —lo que subió
  // ESTE acierto puntual— y daba un número menor al de la fila real, que
  // acumula desde el último pulso. Dos números "cuánto subiste" distintos en
  // la misma pantalla es peor que uno solo, así que esta fila lee la MISMA
  // fuente en vez de inventar la propia (ver el `useGameLeaderboard` en
  // `RegisterSlide`).
  delta: number
}) {
  const rank = player.rank ?? null
  return (
    <ul className="w-full max-w-xs">
      <li className={cn("flex items-center gap-3 rounded-lg px-4 py-3 ring-1 ring-foreground/10", MINE_ROW_CLASS)}>
        {rank !== null && (
          <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
            {rank}
          </span>
        )}
        <span
          className="min-w-0 flex-1 truncate text-left text-sm font-medium"
          style={{ color: levelColor(player.level) }}
        >
          {player.alias}
        </span>
        {delta > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium tabular-nums text-green-400"
            aria-label={`subió ${delta} puestos`}
          >
            <ArrowUp size={12} />
            {delta}
          </span>
        )}
        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
          {player.xp}
          <XpDots className="size-[0.85em]" />
        </span>
      </li>
    </ul>
  )
}

// Hito 2: registro con Google. El gancho es el @ propio: el guest ve su alias
// autogenerado y el input para elegir el definitivo; el alias deseado queda en
// localStorage y se aplica al volver del OAuth (ver applyDesiredAlias).
//
// Y si además ya reclutó a alguien, el gancho cambia por uno mucho más fuerte:
// la XP que sus reclutas le vienen dando. Es la diferencia entre pedir fe —
// «registrate para elegir tu nombre»— y cobrar una deuda que ya existe y tiene
// número. La diapo de reclutar sale a las diez resueltas y esta a las doce, así
// que quien compartió y le funcionó llega acá con algo concreto que perder.
export function RegisterSlide({
  player,
  onSkip,
  onOpenPrivacy,
  desdeConfiguracion = false,
  slotSalida,
  popup = false,
  keyboard = false,
}: {
  player: GamePlayer
  onSkip: () => void
  onOpenPrivacy?: () => void
  // Se llega acá también tocando "Usuario" en Configuración, para un invitado
  // que no puede elegir su @ sin cuenta (settings-panel.tsx). Ahí la persona
  // ya sabe quién es —lo está mirando del otro lado, en el ranking— así que
  // repetir "sos fulano, puesto tanto" es ruido, y sobra "Ahora no": la
  // tuerca de la cabecera, siempre a la vista, ya es la vuelta atrás. El botón
  // de Google y el link de privacidad se quedan adentro de la caja, como
  // siempre; lo que cambia es el pie (ver `slotSalida`).
  desdeConfiguracion?: boolean
  // Dónde dibujar el botón que cierra esta pantalla: el pie de la columna,
  // AFUERA de la caja — la misma idea que cafecito/reclutas
  // (slide-salida.tsx), para que la caja mida lo mismo que la del ejercicio
  // en vez de comerse la columna entera. Con `desdeConfiguracion`, ese botón
  // dice "Guardar" y hace lo mismo que el de Google de más arriba; en la
  // variante de hito dice "Ahora no". Solo lo manda `desktop-layout.tsx` —en
  // el teléfono todo se queda adentro de la caja, como siempre.
  slotSalida?: HTMLElement | null
  // Solo escritorio: en vez de irse de la pestaña a Google y volver, el login
  // corre en una ventanita aparte y esta pestaña no se mueve de `/derivadas`
  // en ningún momento. En el teléfono no hay ventanas que abrir, así que ahí
  // se sigue con el redirect de toda la vida (ver `autenticarConVentana`).
  popup?: boolean
  // Atajos de teclado, solo escritorio (mismo criterio que cafecito/reclutas):
  // Enter dispara "Continuar con Google", Alt+Enter dispara "Ahora no". Nunca
  // se manda junto con `desdeConfiguracion` — ahí no hay "Ahora no" y "Guardar"
  // no tiene atajo propio.
  keyboard?: boolean
}) {
  const api = useGameApi()
  const teclas = useTeclas()
  const queryClient = useQueryClient()

  // El mismo `rank_delta` que ya trae la fila de verdad del ranking
  // individual sin acotar (game-ranking.tsx), para que `FilaPropia` diga
  // exactamente lo mismo que la fila de al lado y no una cuenta propia con
  // otro criterio. Misma clave de caché que ese ranking (`ALL_SCOPE` en las
  // dos), así que si ya está cargado esto no pide nada nuevo al servidor.
  const miEntrada = useGameLeaderboard(
    { university: ALL_SCOPE, career: ALL_SCOPE },
    true,
  ).data?.pages[0]?.entries.find((e) => e.is_current_player)
  const [desired, setDesired] = useState("")
  const [savingAlias, setSavingAlias] = useState(false)
  // El login en sí vive en google-login.tsx; acá solo queda lo que esta
  // pantalla guarda antes de irse: el @ deseado y el evento.
  const google = useGoogleLogin({
    popup,
    antesDeIr: () => {
      posthog.capture("game_register_slide_shown", { slide: "google_tap" })
      saveDesiredAlias(desired)
    },
  })
  const authPending = google.pendiente
  const authError = google.error
  const setAuthError = google.setError
  const signIn = google.listo

  // Del mismo caché que usan la diapo de reclutar y el ranking: si ya se pidió
  // en esta sesión, esto no suma ni un pedido.
  const { data } = useGameRecruits(true)
  const entries = data?.entries ?? []
  const xp = entries.reduce((total, r) => total + r.xp_given, 0)
  // Solo cuando hay algo que cobrar. Con reclutas que todavía no aportaron
  // nada, «ya te dieron 0 XP» sería peor que no decir nada.
  const reclutas = xp > 0 ? { xp, gente: entries.length } : null

  // "Guardar", para quien no quiere registrarse pero sí cambiar el @: es el
  // mismo PATCH que ya usa `settings-panel.tsx`, no el registro con Google.
  //
  // El backend lo resuelve solo (`patch_me`, backend/game/router.py): un
  // invitado que TODAVÍA no gastó su única edición gratis (`alias_is_generated`)
  // guarda igual que cualquiera; si ya la gastó, devuelve 403 y ahí el error
  // señala lo que el botón de Google, siempre a la vista al lado, resuelve.
  async function guardarAlias() {
    if (savingAlias) return
    const value = desired.trim()
    if (!value || value === player.alias) {
      onSkip()
      return
    }
    setSavingAlias(true)
    setAuthError(null)
    try {
      const updated = unwrap(await api.PATCH("/game/derivemos/me", { body: { alias: value } }))
      queryClient.setQueryData(gameKeys.me, updated)
      // El ranking de al lado también muestra el @: sin esto seguiría con el
      // viejo hasta el próximo refresco por su cuenta.
      queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
      posthog.capture("game_alias_edited", { via: "settings_register" })
      onSkip()
    } catch (err) {
      setAuthError(
        err instanceof ApiError ? err.message : "No se pudo guardar.",
      )
    }
    setSavingAlias(false)
  }

  const authenticateWithGoogle = google.iniciar

  // Enter dentro del campo del @ lo maneja el propio `input` (ver más abajo):
  // `enCampoDeTexto` lo reconoce como campo de texto a propósito (teclas.ts) y
  // por eso un listener en `document` nunca lo vería. Alt+Enter sí llega acá
  // siempre, esté el campo enfocado o no —igual que Saltear en el ejercicio—,
  // porque nada en un `<input>` de HTML le da un uso especial a esa combinación.
  //
  // Las dos funciones van por ref y no directo en las dependencias —mismo
  // mecanismo que `reclutarRef` en reclutas-panel.tsx—: son closures nuevas en
  // cada render, y sin esto el listener se sacaría y se pondría de nuevo todo
  // el tiempo en vez de vivir una sola vez mientras `keyboard` no cambie.
  const onSkipRef = useRef(onSkip)
  const authenticateWithGoogleRef = useRef(authenticateWithGoogle)
  useEffect(() => {
    onSkipRef.current = onSkip
    authenticateWithGoogleRef.current = authenticateWithGoogle
  })
  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return
      if (e.altKey) {
        e.preventDefault()
        onSkipRef.current()
        return
      }
      if (enCampoDeTexto(e.target)) return
      e.preventDefault()
      void authenticateWithGoogleRef.current()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [keyboard])

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
        {desdeConfiguracion ? (
          <h2 className="text-2xl font-bold">Elegí tu @</h2>
        ) : reclutas ? (
          <>
            {/* El número en el título y no en el cuerpo: es una deuda concreta
                que ya existe, y es lo único de esta pantalla que la persona no
                sabía. */}
            <h2 className="text-2xl font-bold">
              Ya te dieron{" "}
              <span className="tabular-nums" style={{ color: VERDE }}>
                {reclutas.xp} XP
              </span>
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {reclutas.gente === 1
                ? "Alguien entró por tu link y suma para vos."
                : `${reclutas.gente} personas entraron por tu link y suman para vos.`}
              <br />
              Sin cuenta, todo eso vive solo en este navegador.
            </p>
          </>
        ) : (
          <>
            {/* Ya eligió su @ antes (en "Elegí tu @" o en el registro de
                Configuración) — repetírselo acá sería pisar el gancho de la
                pantalla anterior. Este hito ya no vende el @: vende la cuenta,
                así que el cuerpo cuenta cuánto lleva jugado, en vez de quién
                es. El puesto ya no va en el párrafo: lo muestra `FilaPropia`,
                con el mismo lenguaje visual que el ranking de al lado.

                Hubo un párrafo más —«Registrándote podés reclutar gente… o
                donar cafecitos…»— que se sacó por decisión de producto: el
                título y la fila alcanzan. */}
            <h2 className="text-2xl font-bold">¡Guardá tu progreso!</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ya llevás <span className="text-foreground">{player.exercises_correct}</span>{" "}
              {player.exercises_correct === 1 ? "derivada resuelta" : "derivadas resueltas"}.
            </p>
            <FilaPropia player={player} delta={miEntrada?.rank_delta ?? 0} />
          </>
        )}
        {/* El @ ya se eligió antes de llegar acá (en "Elegí tu @" o en el
            registro de Configuración) — en las dos variantes de hito no hay
            nada que elegir, así que el campo no existe. Solo la variante de
            Configuración lo necesita: ahí SÍ se puede estar cambiando el @. */}
        {desdeConfiguracion && (
        <div className="flex w-full max-w-xs items-center gap-1 rounded-md border border-[#7e80f7] bg-white/5 px-3">
          <span className="text-lg text-muted-foreground">@</span>
          <input
            type="text"
            value={desired}
            onChange={(e) =>
              setDesired(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))
            }
            onKeyDown={(e) => {
              if (keyboard && e.key === "Enter" && !e.altKey) {
                e.preventDefault()
                void authenticateWithGoogle()
              }
            }}
            placeholder={player.alias}
            maxLength={15}
            className="h-[52px] w-full bg-transparent text-foreground outline-none"
          />
        </div>
        )}
        {authError && <p className="text-sm text-orange-300">{authError}</p>}
        {/* Con `slotSalida` (escritorio): en la variante de Configuración el
            de Google se queda adentro —es otra acción, crear la cuenta, no
            una manera distinta de "Guardar"— y solo aparece para quien
            todavía es invitado. En la de hito, el de Google se fue al pie
            (ver `Salida` más abajo): al lado de Ahora no, no adentro de la
            caja. Acá adentro, en esa variante, solo queda el link de
            privacidad. */}
        {slotSalida && (
          <div className="flex w-full max-w-xs flex-col gap-2">
            {desdeConfiguracion && player.is_guest && (
              <Button
                size="lg"
                className={ctaCls}
                disabled={!signIn || authPending}
                onClick={() => void authenticateWithGoogle()}
              >
                <GoogleIcon className="mr-2 size-4" />
                {authPending ? "Conectando…" : "Continuar con Google"}
                {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
              </Button>
            )}
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-center text-xs leading-relaxed text-foreground/45 underline underline-offset-2 transition-colors hover:text-foreground/70"
              >
                ¿Qué pasa con mis datos?
              </button>
            )}
          </div>
        )}
      </div>
      <Salida slot={slotSalida}>
        {desdeConfiguracion ? (
          <Button
            size="lg"
            className={cn(ctaCls, slotSalida && "w-full")}
            disabled={savingAlias}
            onClick={() => void guardarAlias()}
          >
            {savingAlias ? "Guardando…" : "Guardar"}
          </Button>
        ) : slotSalida ? (
          // Continuar con Google y Ahora no, uno al lado del otro — la misma
          // fila que Revisar/¿Por qué?/Saltear en el ejercicio (y la misma
          // idea que el pie de ProfileSlides, acá arriba): Google se queda
          // con el ancho que sobra, Ahora no mide lo suyo.
          <div className="flex w-full items-stretch gap-2">
            <Button
              size="lg"
              className={cn(ctaCls, "flex-1")}
              disabled={!signIn || authPending}
              onClick={() => void authenticateWithGoogle()}
            >
              <GoogleIcon className="mr-2 size-4" />
              {authPending ? "Conectando…" : "Continuar con Google"}
              {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
            </Button>
            <button
              type="button"
              onClick={onSkip}
              className={cn(claseDeSalida(true), "w-auto shrink-0")}
            >
              Ahora no
              {keyboard && <KeyCap>{teclas.altEnter}</KeyCap>}
            </button>
          </div>
        ) : (
          // El Ahora no arriba del botón de color, como en el pie del teléfono
          // (ver el comentario del pie de ProfileSlides). El enlace de datos
          // queda ÚLTIMO igual: no es una salida, es una aclaración, y por eso
          // acá se reordena el JSX en vez de dar vuelta la columna entera.
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="py-2 text-sm text-muted-foreground"
            >
              Ahora no
            </button>
            <Button
              size="lg"
              className={ctaCls}
              disabled={!signIn || authPending}
              onClick={() => void authenticateWithGoogle()}
            >
              <GoogleIcon className="mr-2 size-4" />
              {authPending ? "Conectando…" : "Continuar con Google"}
            </Button>
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-center text-xs leading-relaxed text-foreground/45 underline underline-offset-2 transition-colors hover:text-foreground/70"
              >
                ¿Qué pasa con mis datos?
              </button>
            )}
          </div>
        )}
      </Salida>
    </div>
  )
}

// Al volver del OAuth: el bootstrap ya linkeó guest→user (o /link explícito);
// acá se aplica el @ que la persona eligió antes de irse a Google.
export function useApplyDesiredAlias() {
  const api = useGameApi()
  return async (player: GamePlayer | null) => {
    if (!player || player.is_guest) return null
    const desired = readDesiredAlias()
    if (!desired || desired === player.alias) {
      clearDesiredAlias()
      return null
    }
    try {
      const updated = unwrap(
        await api.PATCH("/game/derivemos/me", { body: { alias: desired } }),
      )
      clearDesiredAlias()
      posthog.capture("game_alias_edited", { via: "register" })
      return updated
    } catch {
      // 409 (tomado) o red: se descarta el deseo; el alias derivado del
      // username de Google queda como definitivo.
      clearDesiredAlias()
      return null
    }
  }
}
