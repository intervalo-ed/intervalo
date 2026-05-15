"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import MathText from "@/components/math-text"
import { skillLabel, topicLabel } from "@/lib/catalog"
import { haptic } from "@/lib/haptics"
import { useSfx } from "@/lib/audio/UseSfx"
import type { SessionExercise } from "@/lib/api/types"
import { useAnswer } from "./UseAnswer"
import { useSessionPayload } from "./UseSessionPayload"

export default function SessionRunner({ sessionId }: { sessionId: string }) {
  const payload = useSessionPayload({ id: sessionId })
  const router = useRouter()
  const [idx, setIdx] = useState(0)

  if (payload === undefined) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-foreground/60">Cargando sesión…</p>
      </main>
    )
  }

  if (payload === null) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Esta sesión expiró</h1>
        <p className="text-sm text-foreground/70">
          Iniciá una nueva desde el inicio.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-foreground px-4 font-medium text-background"
        >
          Volver al inicio
        </Link>
      </main>
    )
  }

  const total = payload.exercises.length
  const exercise = payload.exercises[idx]
  if (!exercise) return null

  function onAdvance() {
    if (idx < total - 1) setIdx(idx + 1)
    else router.push(`/session/${sessionId}/summary`)
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-8">
      <ProgressBar value={idx + 1} max={total} />
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <QuestionView
            exercise={exercise}
            sessionId={sessionId}
            isLast={idx === total - 1}
            onAdvance={onAdvance}
          />
        </motion.div>
      </AnimatePresence>
    </main>
  )
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3 text-xs text-foreground/60">
      <span>
        {value} / {max}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded bg-foreground/10">
        <motion.div
          className="h-full bg-foreground"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

function QuestionView({
  exercise,
  sessionId,
  isLast,
  onAdvance,
}: {
  exercise: SessionExercise
  sessionId: string
  isLast: boolean
  onAdvance: () => void
}) {
  const startedAt = useRef(Date.now())
  const [tried, setTried] = useState<Set<number>>(new Set())
  const [done, setDone] = useState(false)
  const [firstSent, setFirstSent] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const answer = useAnswer()
  const playCorrect = useSfx({ name: "correct" })
  const playWrong = useSfx({ name: "wrong" })

  function onPick(i: number) {
    if (done || tried.has(i)) return
    const isCorrect = i === exercise.correct_index

    // Record FIRST attempt to the backend, right or wrong. Subsequent attempts
    // are visual-only so SM-2 quality scoring reflects the first guess.
    if (!firstSent) {
      answer.mutate({
        session_id: sessionId,
        exercise_id: exercise.id,
        answer_index: i,
        response_time_s: (Date.now() - startedAt.current) / 1000,
      })
      setFirstSent(true)
    }

    if (isCorrect) {
      setDone(true)
      playCorrect()
      haptic({ preset: "success" })
    } else {
      setTried((prev) => new Set(prev).add(i))
      setShakeKey((k) => k + 1)
      playWrong()
      haptic({ preset: "error" })
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border p-6">
      <div className="flex items-center gap-2 text-xs">
        <span className="rounded bg-foreground/10 px-2 py-0.5 font-medium">
          {skillLabel({ skill: exercise.skill })}
        </span>
        <span className="text-foreground/40">·</span>
        <span className="text-foreground/60">
          {topicLabel({ topic: exercise.topic })}
        </span>
      </div>

      <div className="text-base">
        <MathText text={exercise.question} />
      </div>

      {exercise.graph_fn && (
        <div className="rounded border border-dashed border-foreground/30 p-4 text-xs text-foreground/50">
          [Gráfico: {exercise.graph_fn}] — pendiente integrar mafs
        </div>
      )}

      <motion.div
        key={shakeKey}
        animate={shakeKey > 0 ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-2"
      >
        {exercise.options.map((opt, i) => (
          <OptionButton
            key={i}
            option={opt}
            isCorrect={i === exercise.correct_index}
            wasTried={tried.has(i)}
            done={done}
            onSelect={() => onPick(i)}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Feedback
              text={exercise.feedback_correct}
              xp={answer.data?.xp_earned}
              firstTry={answer.data?.correct === true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={onAdvance}
        disabled={!done}
        className="mt-2 inline-flex h-11 items-center justify-center rounded-md bg-foreground font-medium text-background disabled:opacity-40"
      >
        {isLast ? "Finalizar" : "Siguiente"}
      </button>
    </div>
  )
}

function OptionButton({
  option,
  isCorrect,
  wasTried,
  done,
  onSelect,
}: {
  option: string
  isCorrect: boolean
  wasTried: boolean
  done: boolean
  onSelect: () => void
}) {
  const pickedThis = done && isCorrect
  const struck = wasTried

  let cls = "border-foreground/15 hover:bg-foreground/5"
  if (pickedThis) cls = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300"
  else if (struck) cls = "border-red-500/40 bg-red-500/5 text-foreground/40 line-through"
  else if (done) cls = "border-foreground/10 text-foreground/50 cursor-not-allowed"

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={done || struck}
      className={`flex items-center justify-between rounded-md border px-4 py-3 text-left transition ${cls}`}
    >
      <MathText text={option} />
    </button>
  )
}

function Feedback({
  text,
  xp,
  firstTry,
}: {
  text: string
  xp: number | undefined
  firstTry: boolean
}) {
  return (
    <div className="rounded-md bg-green-500/10 p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-green-700 dark:text-green-300">
          {firstTry ? "¡Correcto!" : "Correcto, pero no en el primer intento"}
        </span>
        {xp !== undefined && xp > 0 && (
          <span className="text-xs text-green-700 dark:text-green-300">
            +{xp} XP
          </span>
        )}
      </div>
      <div className="mt-1 text-foreground/85">
        <MathText text={text} />
      </div>
    </div>
  )
}
