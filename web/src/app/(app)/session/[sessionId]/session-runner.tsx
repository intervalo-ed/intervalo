"use client"

import MathGraph from "@/components/math-graph"
import MathText from "@/components/math-text"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Screen, ScreenBody, ScreenFooter, ScreenHeader } from "@/components/ui/screen"
import { Spinner } from "@/components/ui/spinner"
import type { SessionExercise } from "@/lib/api/types"
import { useSfx } from "@/lib/audio/UseSfx"
import { topicLabel } from "@/lib/catalog"
import { haptic } from "@/lib/haptics"
import { X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { useAnswer } from "./UseAnswer"
import { useSessionPayload } from "./UseSessionPayload"

export default function SessionRunner({ sessionId }: { sessionId: string }) {
  const payload = useSessionPayload({ id: sessionId })
  const router = useRouter()
  const [idx, setIdx] = useState(0)

  if (payload === undefined) {
    return (
      <Screen>
        <ScreenBody className="items-center justify-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Spinner />
            <span>Cargando sesión…</span>
          </div>
        </ScreenBody>
      </Screen>
    )
  }

  if (payload === null) {
    return (
      <Screen>
        <ScreenBody className="items-center justify-center text-center">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-xl font-semibold">Esta sesión expiró</h1>
            <p className="text-sm text-muted-foreground">
              Iniciá una nueva desde el inicio.
            </p>
            <Button render={<Link href="/" />}>Volver al inicio</Button>
          </div>
        </ScreenBody>
      </Screen>
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
    <QuestionScreen
      key={idx}
      exercise={exercise}
      sessionId={sessionId}
      isLast={idx === total - 1}
      progress={idx + 1}
      total={total}
      onAdvance={onAdvance}
    />
  )
}

function QuestionScreen({
  exercise,
  sessionId,
  isLast,
  progress,
  total,
  onAdvance,
}: {
  exercise: SessionExercise
  sessionId: string
  isLast: boolean
  progress: number
  total: number
  onAdvance: () => void
}) {
  const startedAt = useRef(Date.now())
  const [tried, setTried] = useState<Set<number>>(new Set())
  const [done, setDone] = useState(false)
  const [firstTry, setFirstTry] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const answer = useAnswer()
  const playCorrect = useSfx({ name: "correct" })
  const playWrong = useSfx({ name: "wrong" })

  function onPick(i: number) {
    if (done || tried.has(i)) return
    const isCorrect = i === exercise.correct_index

    if (isCorrect) {
      answer.mutate({
        session_id: sessionId,
        exercise_id: exercise.id,
        answer_index: i,
        attempts: tried.size + 1,
        response_time_s: (Date.now() - startedAt.current) / 1000,
      })
      setFirstTry(tried.size === 0)
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
    <Screen>
      <ScreenHeader>
        <ExitButton />
        <div className="flex flex-1 items-center gap-3 text-sm text-muted-foreground">
          <Progress value={Math.round((progress / total) * 100)} className="flex-1" />
          <span className="tabular-nums">
            {progress} / {total}
          </span>
        </div>
      </ScreenHeader>

      <ScreenBody>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-5"
        >
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">
                {topicLabel({ topic: exercise.topic })}
              </Badge>
            </div>

            <div className="text-lg">
              <MathText text={exercise.question} />
            </div>

            {exercise.graph_fn && (
              <MathGraph
                graphFn={exercise.graph_fn}
                graphView={exercise.graph_view}
              />
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
        </motion.div>
      </ScreenBody>

      <ScreenFooter
        className={
          done
            ? "border-green-500/40 bg-green-500/10"
            : undefined
        }
      >
        <AnimatePresence initial={false}>
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
                firstTry={firstTry}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          size="lg"
          className="mt-3 h-12 w-full"
          onClick={onAdvance}
          disabled={!done}
        >
          {isLast ? "Finalizar" : "Siguiente"}
        </Button>
      </ScreenFooter>
    </Screen>
  )
}

function ExitButton() {
  const router = useRouter()
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Salir de la sesión">
            <X />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Salir de la sesión?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a perder el progreso de los ejercicios todavía no respondidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Seguir</AlertDialogCancel>
          <AlertDialogAction onClick={() => router.push("/")}>Salir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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

  let toneCls = ""
  if (pickedThis) {
    toneCls =
      "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300"
  } else if (struck) {
    toneCls = "border-red-500/40 bg-red-500/5 text-foreground/40 line-through"
  } else if (done) {
    toneCls = "text-muted-foreground cursor-not-allowed"
  }

  return (
    <Button
      variant="outline"
      onClick={onSelect}
      disabled={done || struck}
      className={`h-auto min-h-11 justify-start px-4 py-3 text-left text-sm whitespace-normal ${toneCls}`}
    >
      <MathText text={option} />
    </Button>
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
    <div className="text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-green-700 dark:text-green-300">
          {firstTry ? "¡Correcto!" : "Correcto, pero no en el primer intento"}
        </span>
        {xp !== undefined && xp > 0 && (
          <Badge
            variant="secondary"
            className="bg-green-500/20 text-green-700 dark:text-green-300"
          >
            +{xp} XP
          </Badge>
        )}
      </div>
      <div className="mt-1 text-foreground/85">
        <MathText text={text} />
      </div>
    </div>
  )
}
