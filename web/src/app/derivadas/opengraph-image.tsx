import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

// Preview del link en WhatsApp: mismo lenguaje que el OG del sitio (wordmark
// serif sobre #131324 con el subrayado de colores de cinturón) pero diciendo
// "derivadas". Los colores son BELT_LEGEND_BAR_COLORS resueltos a hex — acá no
// se puede importar el catálogo (corre en el runtime de imagen).

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "derivadas · ¿cuántas aguantás?"

// BELT_LEGEND_COLORS: vivid mezclado al 0.9 con #131324 (ver web/src/lib/catalog).
const BAR_COLORS = ["#e8e8ea", "#2a62c4", "#8d31b7", "#7e451f", "#131324"]

export default async function Image() {
  const notoSerif = await readFile(
    join(process.cwd(), "src/app/derivadas/noto-serif-600.ttf"),
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#131324",
          gap: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              fontFamily: "Noto Serif",
              fontSize: 130,
              fontWeight: 600,
              color: "#F6F8FC",
              lineHeight: 1,
            }}
          >
            derivadas
          </div>
          <div style={{ display: "flex", width: 560, height: 12, borderRadius: 3, overflow: "hidden" }}>
            {BAR_COLORS.slice(0, 4).map((c) => (
              <div key={c} style={{ flex: 1, background: c }} />
            ))}
          </div>
        </div>
        <div
          style={{
            fontFamily: "Noto Serif",
            fontSize: 40,
            color: "#a4b3c6",
          }}
        >
          ¿cuántas aguantás?
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Serif",
          data: notoSerif,
          weight: 600,
          style: "normal",
        },
      ],
    },
  )
}
