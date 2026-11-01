// Las páginas legales siguen siendo de la web: se abren en el navegador del
// sistema dentro de la app (SFSafariViewController / Custom Tabs).

import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { env } from "./env"

export function abrirPrivacidad(): Promise<void> {
  return abrir({ ruta: "/privacidad" })
}

// Un segundo toque con el navegador ya abierto rechaza; no hay nada que avisar.
async function abrir({ ruta }: { ruta: string }) {
  await openBrowserAsync(`${env.webUrl}${ruta}`, {
    presentationStyle: WebBrowserPresentationStyle.PAGE_SHEET,
    controlsColor: TEMA.ring,
    toolbarColor: TEMA.background,
    dismissButtonStyle: "close",
  }).catch(() => {})
}
