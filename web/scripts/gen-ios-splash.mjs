// Genera las `apple-touch-startup-image` de la PWA en iOS: un PNG navy liso
// (#131324, sin logo) por resolución de iPhone, en public/splash/. Así al abrir
// la app instalada ya se ve el fondo azul en vez del negro de arranque, y el
// handoff a la animación del splash es invisible.
// Correr: `node scripts/gen-ios-splash.mjs`
//
// IMPORTANTE: mantener la lista de dispositivos sincronizada con
// src/lib/ios-splash.ts (misma data y mismo naming de archivo).
import sharp from "sharp"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { mkdir } from "node:fs/promises"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "..", "public", "splash")

const BG = "#131324"

// Mantener sincronizado con IOS_SPLASH_DEVICES en src/lib/ios-splash.ts.
const DEVICES = [
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

const fileName = (d) => `splash-${d.w}x${d.h}@${d.dpr}x.png`

await mkdir(OUT, { recursive: true })

for (const d of DEVICES) {
  const pxW = d.w * d.dpr
  const pxH = d.h * d.dpr
  const file = fileName(d)
  await sharp({
    create: {
      width: pxW,
      height: pxH,
      channels: 4,
      background: BG,
    },
  })
    .png()
    .toFile(join(OUT, file))
  console.log(`✓ ${file} (${pxW}x${pxH}) — ${d.name}`)
}
