"use client"

// Slides de registro del minijuego, en el orden que pide el producto:
// hito 1 (usuario enganchado) → carrera y universidad, IDÉNTICAS a las del
// onboarding (components/onboarding-fields.tsx); hito 2 → registro con Google
// con el gancho de elegir tu @username. Todo skippeable ("Ahora no").

import { useRef, useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import posthog from "posthog-js"
import { Button } from "@/components/ui/button"
import { CareerSelect, UniversityGrid } from "@/components/onboarding-fields"
import { readOnboarding, saveOnboarding } from "@/lib/onboarding/storage"
import { canonicalUniversity } from "@/lib/university-tags"
import { useSfx } from "@/lib/audio/useSfx"
import { unwrap } from "@/lib/api/client"
import { VERDE } from "./cafecito-cta"
import { SlideFlip } from "./slide-flip"
import { useGameApi } from "./UseGameApi"
import { useGameRecruits } from "./UseGameLeaderboard"
import type { GamePlayer } from "./UseGamePlayer"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// Las slides están dibujadas para una columna de teléfono (`max-w-md`, el mismo
// ancho del onboarding). En el panel de escritorio, que es bastante más ancho,
// hay que acotarlas y centrarlas: si no, la grilla 2×2 de carreras y los chips
// de universidad se estiran y quedan deformes.
const panelCls = "mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-6"
const bodyCls = "flex min-h-0 flex-1 flex-col justify-center overflow-y-auto py-6"

const DESIRED_ALIAS_KEY = "intervalo:game:desired-alias"

export function readDesiredAlias(): string | null {
  try {
    return window.localStorage.getItem(DESIRED_ALIAS_KEY)
  } catch {
    return null
  }
}

export function clearDesiredAlias() {
  try {
    window.localStorage.removeItem(DESIRED_ALIAS_KEY)
  } catch {}
}

// Persistir carrera/universidad: al jugador (backend) y como prefill del
// onboarding de Intervalo (localStorage, solo si no había nada — semántica
// register_once). El puente es pasivo: el juego no linkea a Intervalo.
export function ProfileSlides({
  onDone,
  onSkip,
}: {
  onDone: (data: { career: string; university: string }) => void
  onSkip: () => void
}) {
  const sfx = useSfx()
  const api = useGameApi()
  const [phase, setPhase] = useState<"career" | "university">("career")
  const [career, setCareer] = useState("")
  const [university, setUniversity] = useState("")
  const [universityOther, setUniversityOther] = useState("")
  const [showOther, setShowOther] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)

  const finish = async (chosenUniversity: string) => {
    if (saving) return
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
  }

  const confirmOther = () => {
    const value = canonicalUniversity(universityOther)
    if (!value) return
    void finish(value)
  }

  // Las dos preguntas del perfil son dos pantallas, y cambiar de pantalla en
  // este juego es siempre el mismo volteo (slide-flip.tsx). Antes la segunda
  // reemplazaba a la primera sin más y parecía que la página se hubiera
  // recargado sola.
  return (
    <SlideFlip slide={phase} className="flex min-h-0 flex-1 flex-col">
      {phase === "career" ? (
        <div className={panelCls}>
          <div className={bodyCls}>
            <CareerSelect
              value={career}
              onSelect={(v) => {
                sfx.select()
                setCareer(v)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              className={ctaCls}
              disabled={!career}
              onClick={() => {
                sfx.continue()
                posthog.capture("game_register_slide_shown", { slide: "university" })
                setPhase("university")
              }}
            >
              Continuar
            </Button>
            <button
              type="button"
              onClick={onSkip}
              className="py-2 text-sm text-muted-foreground"
            >
              Ahora no
            </button>
          </div>
        </div>
      ) : (
        <div className={panelCls}>
          <div className={bodyCls}>
            <UniversityGrid
              university={university}
              showOther={showOther}
              otherValue={universityOther}
              onOtherChange={setUniversityOther}
              onPick={(u) => {
                sfx.select()
                setUniversity(u)
                setShowOther(false)
              }}
              onSelectOther={() => {
                sfx.select()
                setUniversity("")
                setShowOther(true)
              }}
              onConfirmOther={confirmOther}
              onPickSuggestion={(key) => {
                sfx.select()
                setUniversityOther(key)
                inputRef.current?.focus()
              }}
              inputRef={inputRef}
            />
          </div>
          <div className="flex flex-col gap-2">
            {showOther ? (
              <Button
                size="lg"
                className={ctaCls}
                disabled={!universityOther.trim() || saving}
                onClick={confirmOther}
              >
                Continuar
              </Button>
            ) : (
              <Button
                size="lg"
                className={ctaCls}
                disabled={!university || saving}
                onClick={() => void finish(university)}
              >
                Continuar
              </Button>
            )}
            <button
              type="button"
              onClick={onSkip}
              className="py-2 text-sm text-muted-foreground"
            >
              Ahora no
            </button>
          </div>
        </div>
      )}
    </SlideFlip>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
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
}: {
  player: GamePlayer
  onSkip: () => void
}) {
  const { signIn } = useSignIn()
  const [desired, setDesired] = useState("")
  const [authPending, setAuthPending] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Del mismo caché que usan la diapo de reclutar y el ranking: si ya se pidió
  // en esta sesión, esto no suma ni un pedido.
  const { data } = useGameRecruits(true)
  const entries = data?.entries ?? []
  const xp = entries.reduce((total, r) => total + r.xp_given, 0)
  // Solo cuando hay algo que cobrar. Con reclutas que todavía no aportaron
  // nada, «ya te dieron 0 XP» sería peor que no decir nada.
  const reclutas = xp > 0 ? { xp, gente: entries.length } : null

  // Misma coreografía que el wizard (create + sso), con el retorno apuntando
  // al juego: /sso-callback?next=/derivadas y de ahí de vuelta acá.
  async function authenticateWithGoogle() {
    if (!signIn || authPending) return
    setAuthPending(true)
    setAuthError(null)
    posthog.capture("game_register_slide_shown", { slide: "google_tap" })

    try {
      const cleaned = desired.trim().toLowerCase().replace(/^@/, "")
      if (cleaned) window.localStorage.setItem(DESIRED_ALIAS_KEY, cleaned)
    } catch {}

    const origin = window.location.origin
    const callbackUrl = `${origin}/sso-callback?next=/derivadas`
    const completeUrl = `${origin}/derivadas`

    const created = await signIn.create({
      strategy: "oauth_google",
      redirectUrl: callbackUrl,
      actionCompleteRedirectUrl: completeUrl,
    })
    if (created.error) return failGoogleSso(created.error)

    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: completeUrl,
      redirectCallbackUrl: callbackUrl,
    })
    if (error) return failGoogleSso(error)

    if (!signIn.firstFactorVerification.externalVerificationRedirectURL) {
      failGoogleSso({ code: "no_external_verification_redirect" })
    }
  }

  function failGoogleSso(error: { code: string }) {
    // Sesión ya activa: no hay OAuth que correr; recargar alcanza para que el
    // bootstrap linkee al guest con la cuenta.
    if (error.code === "session_exists") {
      window.location.assign("/derivadas")
      return
    }
    console.error("Google SSO error", error)
    setAuthPending(false)
    setAuthError("No pudimos conectar con Google. Probá de nuevo.")
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
        {reclutas ? (
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
            <h2 className="text-2xl font-bold">Elegí tu @</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sos <span className="text-foreground">{player.alias}</span>
              {player.rank !== null && player.rank !== undefined && (
                <> · puesto {player.rank}</>
              )}{" "}
              · {player.xp} xp
              <br />
              Registrate para ponerle tu nombre. El progreso se conserva.
            </p>
          </>
        )}
        <div className="flex w-full max-w-xs items-center gap-1 rounded-md border border-[#7e80f7] bg-white/5 px-3">
          <span className="text-lg text-muted-foreground">@</span>
          <input
            type="text"
            value={desired}
            onChange={(e) =>
              setDesired(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))
            }
            placeholder={player.alias}
            maxLength={15}
            className="h-[52px] w-full bg-transparent text-foreground outline-none"
          />
        </div>
        {authError && <p className="text-sm text-orange-300">{authError}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          className={ctaCls}
          disabled={!signIn || authPending}
          onClick={() => void authenticateWithGoogle()}
        >
          <GoogleIcon className="mr-2 size-4" />
          {authPending ? "Conectando…" : "Continuar con Google"}
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="py-2 text-sm text-muted-foreground"
        >
          Ahora no
        </button>
      </div>
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
