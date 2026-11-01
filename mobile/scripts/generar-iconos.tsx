/** @jsxImportSource react */
// @ts-nocheck: corre en Bun con las dependencias de web/, y mobile no tiene los
// tipos de Node (ni de Bun) para typecheckear fs, Buffer o import.meta.dir.
// Genera los íconos y el splash de la app a partir de la marca "dx" de la web
// (web/src/app/derivadas/marca-dx.tsx). Se corre a mano cuando cambia el dibujo:
//
//   bun mobile/scripts/generar-iconos.tsx
//
// `next/og` (Satori + resvg) está instalado en web/, no acá: se carga desde ahí.
import { readFile, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { join } from "node:path"
import type { ReactElement } from "react"

const RAIZ = join(import.meta.dir, "../..")
const WEB = join(RAIZ, "web")
const SALIDA = join(RAIZ, "mobile/assets/images")

const desdeWeb = createRequire(join(WEB, "package.json"))
const { ImageResponse } = desdeWeb("next/og") as {
  ImageResponse: new (
    el: ReactElement,
    opts: {
      width: number
      height: number
      fonts: { name: string; data: Buffer; weight: 600; style: "normal" }[]
    },
  ) => Response
}
// App Store rechaza un ícono con canal alfa aunque sea opaco, y resvg siempre
// escribe RGBA: sharp (de web/, viene con Next) lo saca.
const sharp = desdeWeb("sharp") as (buf: Buffer) => {
  removeAlpha: () => { png: () => { toBuffer: () => Promise<Buffer> } }
}
const { MarcaDx, FONDO, TINTA } = desdeWeb("./src/app/derivadas/marca-dx.tsx") as {
  MarcaDx: (p: { lado: number; redondeado?: boolean; escala?: number }) => ReactElement
  FONDO: string
  TINTA: string
}

// Copia de las proporciones de marca-dx.tsx: MarcaDx siempre pinta su fondo, y
// el ícono adaptativo de Android y el splash necesitan la marca sola.
const BAR_COLORS = ["#e8e8ea", "#2a62c4", "#8d31b7", "#7e451f"]
const FUENTE = 43 / 96
const BARRA = 0.17
const HUECO = 0.14
const SUBIR = 4 / 96

function MarcaSola({
  lado,
  escala,
  tinta,
  barra,
}: {
  lado: number
  escala: number
  tinta: string
  barra: readonly string[]
}) {
  const fuente = Math.round(lado * FUENTE * escala)
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: Math.round(fuente * HUECO),
          marginTop: -Math.round(lado * SUBIR * escala),
        }}
      >
        <div
          style={{
            fontFamily: "Noto Serif",
            fontSize: fuente,
            fontWeight: 600,
            color: tinta,
            lineHeight: 1,
          }}
        >
          dx
        </div>
        <div
          style={{
            display: "flex",
            height: Math.round(fuente * BARRA),
            borderRadius: Math.max(2, Math.round(lado * 0.02)),
            overflow: "hidden",
          }}
        >
          {barra.map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
      </div>
    </div>
  )
}

const LADO = 1024
// Android recorta el adaptativo a 72/108 del lienzo y garantiza visible un
// círculo de 66/108: a 0.66 la marca entra entera en ese círculo y se ve del
// mismo tamaño que el ícono de iOS.
const ESCALA_ADAPTATIVO = 0.66
// El splash se muestra a imageWidth 200: la marca ocupa ~3/4 del ancho.
const ESCALA_SPLASH = 1.5

const fuente = await readFile(join(WEB, "src/app/derivadas/noto-serif-600.ttf"))

async function png({
  nombre,
  el,
  opaco = false,
}: {
  nombre: string
  el: ReactElement
  opaco?: boolean
}) {
  const res = new ImageResponse(el, {
    width: LADO,
    height: LADO,
    fonts: [{ name: "Noto Serif", data: fuente, weight: 600, style: "normal" }],
  })
  const crudo = Buffer.from(await res.arrayBuffer())
  const buf = opaco ? await sharp(crudo).removeAlpha().png().toBuffer() : crudo
  await writeFile(join(SALIDA, nombre), buf)
  console.log(`✓ ${nombre}`)
}

// A sangre y sin esquinas, como apple-icon.tsx: iOS aplica su máscara.
await png({ nombre: "icon.png", el: <MarcaDx lado={LADO} />, opaco: true })
await png({
  nombre: "android-icon-background.png",
  opaco: true,
  el: <div style={{ width: "100%", height: "100%", display: "flex", background: FONDO }} />,
})
await png({
  nombre: "android-icon-foreground.png",
  el: <MarcaSola lado={LADO} escala={ESCALA_ADAPTATIVO} tinta={TINTA} barra={BAR_COLORS} />,
})
await png({
  nombre: "android-icon-monochrome.png",
  el: (
    <MarcaSola
      lado={LADO}
      escala={ESCALA_ADAPTATIVO}
      tinta="#ffffff"
      barra={["#ffffff"]}
    />
  ),
})
await png({
  nombre: "splash-icon.png",
  el: <MarcaSola lado={LADO} escala={ESCALA_SPLASH} tinta={TINTA} barra={BAR_COLORS} />,
})
