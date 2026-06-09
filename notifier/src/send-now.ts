import "dotenv/config"

import { NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Console, Effect } from "effect"
import { loadConfig, runTick, setupWebPush } from "./tick"

// One-shot for manual testing: bypasses the time/last-sent checks (force=true)
// but still requires the user to be enabled and have pendings.
const program = Effect.gen(function* () {
  const config = yield* loadConfig
  setupWebPush(config)
  yield* Console.log("send-now: running one forced tick…")
  yield* runTick(config, { force: true })
  yield* Console.log("send-now: done")
})

NodeRuntime.runMain(program.pipe(Effect.provide(NodeHttpClient.layerUndici)))
