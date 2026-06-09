import "dotenv/config"

import { NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Console, Effect, Schedule } from "effect"
import { loadConfig, runTick, setupWebPush } from "./tick"

const program = Effect.gen(function* () {
  const config = yield* loadConfig
  setupWebPush(config)
  yield* Console.log("notifier started — ticking every 15 min")

  yield* runTick(config).pipe(
    Effect.catch((e) => Console.error("tick failed:", e)),
    Effect.repeat(Schedule.cron("*/15 * * * *")),
  )
})

NodeRuntime.runMain(program.pipe(Effect.provide(NodeHttpClient.layerUndici)))
