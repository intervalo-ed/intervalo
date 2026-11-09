// La tipografía de la app, la misma que la web (web/src/app/layout.tsx):
//
//   - DM Sans         → todo el texto del juego (`--font-sans`).
//   - Noto Serif 600  → el logo `d/dx [intervalo]` (`--font-heading`). En el
//                       juego los títulos van en sans a propósito (ver
//                       `[data-game]` en web/src/app/globals.css); el logo es la
//                       única pieza que usa la serif.
//   - Noto Sans Mono  → código y datos tabulares (`--font-noto-mono`).
//   - Outfit 500      → las tags de universidad (`--font-itba`).
//
// En React Native cada peso de una familia es un archivo de fuente aparte, así
// que `fontWeight` solo no alcanza: hay que elegir `fontFamily` por peso. Los
// nombres de acá son los que registra `useFonts` en app/_layout.tsx.

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans"
import { NotoSerif_600SemiBold } from "@expo-google-fonts/noto-serif"
import { NotoSansMono_400Regular, NotoSansMono_500Medium } from "@expo-google-fonts/noto-sans-mono"
import { Outfit_500Medium } from "@expo-google-fonts/outfit"

/** Las que el primer cuadro necesita: el texto del juego y el logo. El splash
 *  espera solo por estas. */
export const FUENTES_CRITICAS = {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  NotoSerif_600SemiBold,
}

/** Las de pantallas secundarias (chat, palanca, tags de universidad). Se cargan
 *  en segundo plano: hasta que llegan, esos textos usan la del sistema. */
export const FUENTES_DIFERIDAS = {
  NotoSansMono_400Regular,
  NotoSansMono_500Medium,
  Outfit_500Medium,
}

export const FUENTE = {
  /** DM Sans, la del texto del juego. */
  normal: "DMSans_400Regular",
  medio: "DMSans_500Medium",
  seminegrita: "DMSans_600SemiBold",
  negrita: "DMSans_700Bold",
  /** Noto Serif 600: el logo. */
  logo: "NotoSerif_600SemiBold",
  /** Noto Sans Mono. */
  mono: "NotoSansMono_400Regular",
  monoMedio: "NotoSansMono_500Medium",
  /** Outfit 500: las tags de universidad. */
  tag: "Outfit_500Medium",
} as const
