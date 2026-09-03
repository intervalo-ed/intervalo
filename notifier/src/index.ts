import "dotenv/config"

import { NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Console, Effect, Schedule } from "effect"
import {
  loadConfig,
  runEmailTick,
  runEventTick,
  runSweepTick,
  runTick,
  setupWebPush,
} from "./tick"

const program = Effect.gen(function* () {
  const config = yield* loadConfig
  setupWebPush(config)
  yield* Console.log(
    "notifier started — push every 15 min, event pushes offset by 5, emails + abandoned-session sweep every hour",
  )

  const pushLoop = runTick(config).pipe(
    Effect.catch((e) => Console.error("push tick failed:", e)),
    Effect.repeat(Schedule.cron("*/15 * * * *")),
  )
  // Corrido cinco minutos respecto de la normal, y no en el mismo minuto: las
  // dos consumen cupo de la misma persona, y arrancando juntas la que pierde la
  // carrera decide con el cupo que la otra ya se llevó.
  const eventLoop = runEventTick(config).pipe(
    Effect.catch((e) => Console.error("event tick failed:", e)),
    Effect.repeat(Schedule.cron("5-59/15 * * * *")),
  )
  const emailLoop = runEmailTick(config).pipe(
    Effect.catch((e) => Console.error("email tick failed:", e)),
    Effect.repeat(Schedule.cron("0 * * * *")),
  )
  const sweepLoop = runSweepTick(config).pipe(
    Effect.catch((e) => Console.error("sweep tick failed:", e)),
    Effect.repeat(Schedule.cron("30 * * * *")),
  )

  yield* Effect.all([pushLoop, eventLoop, emailLoop, sweepLoop], {
    concurrency: "unbounded",
  })
})

NodeRuntime.runMain(program.pipe(Effect.provide(NodeHttpClient.layerUndici)))
