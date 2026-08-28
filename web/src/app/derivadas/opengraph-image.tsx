import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

// Preview del link en WhatsApp: el logo del juego sobre el mismo papel
// cuadriculado de la pantalla, y nada más. Sin bajada — el texto lo pone la
// metadata (layout.tsx) y repetirlo acá era decir dos veces lo mismo.
//
// El logo es d/dx [ intervalo ]: notación correcta que se lee "la derivada de
// intervalo", así que la tarjeta dice la marca y el tema en un solo gesto.
//
// Las proporciones son las de game-logo.tsx, en `em` contra FONT_SIZE, para
// que esta imagen y el logo de la pantalla sean el mismo dibujo a otra escala.
// Los colores son BELT_LEGEND_BAR_COLORS resueltos a hex: acá no se puede
// importar el catálogo, porque esto corre en el runtime de imagen.

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Intervalo · derivadas"

const BAR_COLORS = ["#e8e8ea", "#2a62c4", "#8d31b7", "#7e451f"]

const FONT_SIZE = 118
const em = (n: number) => Math.round(FONT_SIZE * n)

const GAP = em(0.16)
const BAR_HEIGHT = em(0.12)
const OP_SIZE = em(0.66)  // ~0,92 del alto del corchete, medido sobre el PNG del preview
const OP_BAR = Math.max(2, Math.round(OP_SIZE * 0.075))
const BRACKET_W = em(0.2)
const BRACKET_STEM = em(0.07)
const BRACKET_ARM = em(0.055)
const BRACKET_PAD = em(0.13)

export default async function Image() {
  const notoSerif = await readFile(
    join(process.cwd(), "src/app/derivadas/noto-serif-600.ttf"),
  )

  const bracket = (side: "left" | "right") => (
    <div
      style={{
        width: BRACKET_W,
        borderTop: `${BRACKET_ARM}px solid #F6F8FC`,
        borderBottom: `${BRACKET_ARM}px solid #F6F8FC`,
        ...(side === "left"
          ? { borderLeft: `${BRACKET_STEM}px solid #F6F8FC` }
          : { borderRight: `${BRACKET_STEM}px solid #F6F8FC` }),
      }}
    />
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#131324",
          // El mismo cuadriculado que GRID_BG_STYLE, escalado: a 40px se vuelve
          // una trama y en la miniatura de WhatsApp se lee como ruido.
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "90px 90px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: GAP }}>
          {/* d/dx */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: OP_BAR * 2,
              fontFamily: "Noto Serif",
              fontSize: OP_SIZE,
              fontWeight: 600,
              color: "#F6F8FC",
              lineHeight: 1,
            }}
          >
            <div>d</div>
            <div style={{ height: OP_BAR, width: "100%", background: "#F6F8FC" }} />
            <div>dx</div>
          </div>

          {/* [ intervalo ] — `alignItems: stretch` hace que los corchetes midan
              exactamente el alto del bloque de adentro, como los que arma KaTeX
              en los enunciados. */}
          <div style={{ display: "flex", alignItems: "stretch", gap: BRACKET_PAD }}>
            {bracket("left")}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                gap: GAP,
                padding: `${BRACKET_PAD}px 0`,
              }}
            >
              <div
                style={{
                  fontFamily: "Noto Serif",
                  fontSize: FONT_SIZE,
                  fontWeight: 600,
                  color: "#F6F8FC",
                  lineHeight: 1,
                }}
              >
                intervalo
              </div>
              <div style={{ display: "flex", height: BAR_HEIGHT, borderRadius: 3, overflow: "hidden" }}>
                {BAR_COLORS.map((c) => (
                  <div key={c} style={{ flex: 1, background: c }} />
                ))}
              </div>
            </div>
            {bracket("right")}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Serif", data: notoSerif, weight: 600, style: "normal" },
      ],
    },
  )
}
