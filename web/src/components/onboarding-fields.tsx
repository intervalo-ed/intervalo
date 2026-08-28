"use client"

// Slides de carrera y universidad, extraídas del onboarding para que el
// minijuego de derivadas muestre EXACTAMENTE las mismas (pedido de producto:
// idénticas, no parecidas). El wizard las importa de acá y re-exporta
// CAREERS/CareerCard/OptionButton/UNIVERSITY_LOGOS para no romper a
// recover-profile-form.
//
// UniversityGrid es controlado a propósito: el estado (universidad elegida,
// "Otra" abierta, texto tipeado) vive en el dueño — el wizard ya tenía esos
// estados enredados con su navegación y moverlos acá cambiaría comportamiento.

import { cn } from "@/lib/utils"
import {
  ONBOARDING_UNIVERSITIES,
  UNIVERSITY_TAG_BY_KEY,
  matchUniversities,
} from "@/lib/university-tags"

export const CAREERS = [
  { value: "E", label: "Ingeniería", emoji: "⚙️" },
  { value: "S", label: "Ciencia", emoji: "🔬" },
  { value: "T", label: "Tecnología", emoji: "🤖" },
  { value: "M", label: "Matemática", emoji: "📐" },
]

// Logos monocromos (gris) de universidades para los botones del step de universidad.
// El gris se atenúa sin seleccionar y se lleva a blanco (brightness) al seleccionar.
export const UNIVERSITY_LOGOS: Partial<Record<string, string>> = {
  UBA: "/universities/uba.png",
  UTN: "/universities/utn.png",
  UNLP: "/universities/unlp.png",
  UNSAM: "/universities/unsam.png",
  UNC: "/universities/unc.png",
  UNL: "/universities/unl.png",
}

export function OptionButton({
  children,
  selected,
  onClick,
  className,
  style,
}: {
  children: React.ReactNode
  selected?: boolean
  onClick: () => void
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={cn(
        "rounded-md border bg-white/5 px-4 py-3.5 font-medium transition-colors",
        selected
          ? "border-[#7e80f7] text-[#c4c6ff]"
          : "border-white/10 text-foreground/80 hover:border-white/20",
        className,
      )}
    >
      {children}
    </button>
  )
}

export function CareerCard({
  emoji,
  label,
  selected,
  onClick,
  className,
}: {
  emoji: string
  label: string
  selected?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-md border bg-white/5 py-6 font-medium transition-colors",
        selected
          ? "border-[#7e80f7] text-[#c4c6ff]"
          : "border-white/10 text-foreground/80 hover:border-white/20",
        className,
      )}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="text-sm">{label}</span>
    </button>
  )
}

// La slide 9 del onboarding, completa (heading + grilla 2×2 + "Otra").
export function CareerSelect({
  value,
  onSelect,
}: {
  value: string
  onSelect: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-2xl font-bold">¿Qué estudiás?</h2>
        <p className="text-foreground/85">
          Marcá la que más se aproxime a tu carrera.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {CAREERS.map((c) => (
          <CareerCard
            key={c.value}
            emoji={c.emoji}
            label={c.label}
            selected={value === c.value}
            onClick={() => onSelect(c.value)}
          />
        ))}
        <CareerCard
          className="col-span-2"
          emoji="✦"
          label="Otra"
          selected={value === "Otra"}
          onClick={() => onSelect("Otra")}
        />
      </div>
    </div>
  )
}

// La slide 10 del onboarding, completa (heading + chips con logos + "Otra" con
// autocompletado). Controlado: ver la nota del encabezado del archivo.
export function UniversityGrid({
  university,
  showOther,
  otherValue,
  onOtherChange,
  onPick,
  onSelectOther,
  onConfirmOther,
  onPickSuggestion,
  inputRef,
}: {
  university: string
  showOther: boolean
  otherValue: string
  onOtherChange: (value: string) => void
  onPick: (u: string) => void
  onSelectOther: () => void
  onConfirmOther: () => void
  onPickSuggestion: (key: string) => void
  inputRef?: React.Ref<HTMLInputElement>
}) {
  const suggestions = otherValue.trim() ? matchUniversities(otherValue) : []
  return (
    <div className="flex flex-col gap-5 text-center">
      <h2 className="text-2xl font-bold">¿Dónde?</h2>
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-3 gap-2.5">
          {ONBOARDING_UNIVERSITIES.map((u) => {
            const logo = UNIVERSITY_LOGOS[u]
            const isSel = university === u && !showOther
            return (
              <OptionButton
                key={u}
                className={cn(
                  "flex h-[52px] items-center justify-center text-base",
                  logo && "px-2 py-2",
                )}
                style={logo ? undefined : UNIVERSITY_TAG_BY_KEY[u]?.font}
                selected={isSel}
                onClick={() => onPick(u)}
              >
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={u}
                    className={cn(
                      "w-auto max-w-full object-contain transition-[filter,opacity]",
                      u === "UNSAM" || u === "UNC" ? "h-[20px]" : "h-[23px]",
                      isSel ? "opacity-100 brightness-150" : "opacity-90",
                    )}
                  />
                ) : (
                  u
                )}
              </OptionButton>
            )
          })}
        </div>
        {showOther ? (
          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="text"
              value={otherValue}
              onChange={(e) => onOtherChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onConfirmOther()}
              placeholder="Ej: UNQ, UNLa, UNGS…"
              autoFocus
              className="h-[52px] rounded-md border border-[#7e80f7] bg-white/5 px-4 text-foreground outline-none transition-colors"
            />
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => onPickSuggestion(s.key)}
                    className="inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-xs transition-opacity hover:opacity-80"
                    style={{
                      color: s.color,
                      borderColor: `${s.color}99`,
                      backgroundColor: `${s.color}33`,
                      ...s.font,
                    }}
                  >
                    {s.key}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <OptionButton selected={false} onClick={onSelectOther}>
            Otra
          </OptionButton>
        )}
      </div>
    </div>
  )
}
