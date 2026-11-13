#!/usr/bin/env node
// Hook PreToolUse de Claude Code: frena `eas build` sin `--local`.
//
// Las builds de la app se hacen en la máquina de quien las corre
// (mobile/README.md), no en los servidores de EAS: una build en la nube gasta
// cuota de la cuenta de Expo. Este hook la corta antes de que el agente la
// lance. Exit 2 bloquea el comando y le devuelve el mensaje al agente.

import { readFileSync } from "node:fs";

let comando = "";
try {
  comando = JSON.parse(readFileSync(0, "utf8"))?.tool_input?.command ?? "";
} catch {
  process.exit(0);
}

// `eas build` (también vía npx/bunx/eas-cli), pero no `eas build:list` & co.
const EAS_BUILD = /\beas(?:-cli)?\s+build(?=\s|$)/;
// Workflows de EAS: corren en la nube aunque no digan `build`.
const EAS_WORKFLOW = /\beas(?:-cli)?\s+workflow:run\b/;

const tramos = comando.split(/&&|\|\||[;|\n]/);
const enLaNube = tramos.some(
  (t) => EAS_WORKFLOW.test(t) || (EAS_BUILD.test(t) && !/(^|\s)--local(\s|=|$)/.test(t)),
);

if (enLaNube) {
  process.stderr.write(
    "Bloqueado: las builds se hacen en local, nunca en los servidores de EAS.\n" +
      "Agregá --local, por ejemplo:\n" +
      "  eas build --platform ios --profile production --local --output ./build.ipa\n" +
      "Ver mobile/README.md.\n",
  );
  process.exit(2);
}
