// Matriz de iPhones para las `apple-touch-startup-image` (splash de arranque de
// la PWA en iOS). iOS solo usa una imagen si su media query matchea EXACTO el
// dispositivo, por eso hace falta una entrada por resolución. Las imágenes son
// navy liso (#131324, sin logo): así al abrir la app ya se ve el fondo azul en
// vez de negro, y el handoff a la animación del splash es invisible.
//
// IMPORTANTE: mantener esta lista sincronizada con scripts/gen-ios-splash.mjs.

export type IosSplashDevice = {
  name: string
  /** Ancho lógico (CSS px) en portrait. */
  w: number
  /** Alto lógico (CSS px) en portrait. */
  h: number
  /** Device pixel ratio. */
  dpr: number
}

export const IOS_SPLASH_DEVICES: IosSplashDevice[] = [
  { name: "iPhone SE / 8", w: 375, h: 667, dpr: 2 },
  { name: "iPhone 8 Plus", w: 414, h: 736, dpr: 3 },
  { name: "iPhone X / XS / 11 Pro / 12-13 mini", w: 375, h: 812, dpr: 3 },
  { name: "iPhone XR / 11", w: 414, h: 896, dpr: 2 },
  { name: "iPhone XS Max / 11 Pro Max", w: 414, h: 896, dpr: 3 },
  { name: "iPhone 12 / 13 / 14", w: 390, h: 844, dpr: 3 },
  { name: "iPhone 12-13 Pro Max / 14 Plus", w: 428, h: 926, dpr: 3 },
  { name: "iPhone 14 Pro / 15 / 16", w: 393, h: 852, dpr: 3 },
  { name: "iPhone 14 Pro Max / 15 Plus / 16 Plus", w: 430, h: 932, dpr: 3 },
  { name: "iPhone 16 Pro", w: 402, h: 874, dpr: 3 },
  { name: "iPhone 16 Pro Max", w: 440, h: 956, dpr: 3 },
]

export function splashFileName(d: IosSplashDevice): string {
  return `splash-${d.w}x${d.h}@${d.dpr}x.png`
}

export function splashMedia(d: IosSplashDevice): string {
  return `screen and (device-width: ${d.w}px) and (device-height: ${d.h}px) and (-webkit-device-pixel-ratio: ${d.dpr}) and (orientation: portrait)`
}

/** Array listo para `metadata.appleWebApp.startupImage` de Next. */
export const appleStartupImages = IOS_SPLASH_DEVICES.map((d) => ({
  url: `/splash/${splashFileName(d)}`,
  media: splashMedia(d),
}))
