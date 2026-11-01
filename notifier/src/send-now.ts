import "dotenv/config"

import { NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { Console, Effect } from "effect"
import { loadConfig, runGameTick, runTick, setupWebPush } from "./tick"

// One-shot for manual testing: bypasses the time/last-sent checks (force=true)
// but still requires the user to be enabled and have pendings.
// `--game` corre la tanda programada del minijuego (web y app nativa) en vez de
// la de Intervalo: `npm run send-now -- --game`.
const delJuego = process.argv.includes("--game")

const program = Effect.gen(function* () {
  const config = yield* loadConfig
  setupWebPush(config)
  yield* Console.log(
    `send-now: running one forced ${delJuego ? "game " : ""}tick…`,
  )
  yield* (delJuego ? runGameTick : runTick)(config, { force: true })
  yield* Console.log("send-now: done")
})

NodeRuntime.runMain(program.pipe(Effect.provide(NodeHttpClient.layerUndici)))
