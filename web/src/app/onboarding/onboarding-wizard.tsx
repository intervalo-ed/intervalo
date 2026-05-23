"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useEnrollMutation } from "./UseEnrollMutation"

const CAREERS = [
  { value: "S", label: "Ciencias" },
  { value: "T", label: "Tecnología" },
  { value: "E", label: "Ingeniería" },
  { value: "M", label: "Matemática" },
  { value: "Otra", label: "Otra" },
]

const UNIVERSITIES = [
  "UBA",
  "UTN",
  "UCA",
  "UADE",
  "ITBA",
  "Universidad de San Andrés",
  "Universidad Torcuato Di Tella",
  "Universidad Austral",
  "Universidad de Belgrano",
  "Otra",
]

export default function OnboardingWizard() {
  const router = useRouter()
  const { user } = useUser()
  const enroll = useEnrollMutation()
  const [career, setCareer] = useState("")
  const [university, setUniversity] = useState("")
  const [universityOther, setUniversityOther] = useState("")

  const greetingName = user?.firstName ?? user?.fullName ?? null

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const finalUniversity =
      university === "Otra" ? universityOther.trim() : university
    if (!finalUniversity || !career) return

    enroll.mutate(
      {
        name: user?.fullName ?? user?.firstName ?? null,
        university: finalUniversity,
        career,
      },
      {
        onSuccess: async () => {
          await user?.update({ unsafeMetadata: { onboarded: true } })
          router.push("/")
        },
      },
    )
  }

  const submitting = enroll.isPending

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex max-w-md flex-col gap-5 px-6 py-16"
    >
      <h1 className="text-3xl font-semibold">
        {greetingName ? `Hola, ${greetingName}` : "Bienvenido"}
      </h1>
      <p className="text-sm text-foreground/70">Contanos un poco antes de empezar.</p>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Carrera</span>
        <select
          value={career}
          onChange={(e) => setCareer(e.target.value)}
          required
          className="h-10 rounded-md border px-3"
        >
          <option value="" disabled>
            Elegí una opción
          </option>
          {CAREERS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Universidad</span>
        <select
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          required
          className="h-10 rounded-md border px-3"
        >
          <option value="" disabled>
            Elegí una opción
          </option>
          {UNIVERSITIES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>

      {university === "Otra" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">¿Cuál?</span>
          <input
            type="text"
            value={universityOther}
            onChange={(e) => setUniversityOther(e.target.value)}
            required
            className="h-10 rounded-md border px-3"
          />
        </label>
      )}

      {enroll.isError && (
        <p className="text-sm text-red-500">
          No pudimos guardar la inscripción: {enroll.error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-foreground font-medium text-background disabled:opacity-50"
      >
        {submitting ? "Guardando…" : "Empezar"}
      </button>
    </form>
  )
}
