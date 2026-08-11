import "dotenv/config"

import { NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Console, Effect, Schedule } from "effect"
import {
  loadConfig,
  runEmailTick,
  runSweepTick,
  runTick,
  setupWebPush,
} from "./tick"

const program = Effect.gen(function* () {
  const config = yield* loadConfig
  setupWebPush(config)
  yield* Console.log(
    "notifier started — push every 15 min, emails + abandoned-session sweep every hour",
  )

  const pushLoop = runTick(config).pipe(
    Effect.catch((e) => Console.error("push tick failed:", e)),
    Effect.repeat(Schedule.cron("*/15 * * * *")),
  )
  const emailLoop = runEmailTick(config).pipe(
    Effect.catch((e) => Console.error("email tick failed:", e)),
    Effect.repeat(Schedule.cron("0 * * * *")),
  )
  const sweepLoop = runSweepTick(config).pipe(
    Effect.catch((e) => Console.error("sweep tick failed:", e)),
    Effect.repeat(Schedule.cron("30 * * * *")),
  )

  yield* Effect.all([pushLoop, emailLoop, sweepLoop], {
    concurrency: "unbounded",
  })
})

NodeRuntime.runMain(program.pipe(Effect.provide(NodeHttpClient.layerUndici)))
