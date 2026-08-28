import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

// Favicon propio de /derivadas: el mismo cuadradito redondeado del ícono de
// Intervalo (public/intervalo-icon-1024.png) pero con "dx" adentro en vez de
// "int". Al vivir en esta carpeta y no en app/, Next se lo pone SOLO a esta ruta.
//
// Se dibuja a 96 px y no a 32: Satori rasteriza al tamaño declarado, y una
// serifa resuelta directamente en 32 px queda con los remates rotos. A 96 el
// navegador la baja él, que interpola mucho mejor.
//
// La barra va más gruesa que en el wordmark de pantalla (.17em contra .12em):
// es la misma corrección óptica que ya hace el Wordmark de la app a tamaño
// chico, porque un subrayado a escala exacta desaparece en un favicon.

export const size = { width: 96, height: 96 }
export const contentType = "image/png"

const BAR_COLORS = ["#e8e8ea", "#2a62c4", "#8d31b7", "#7e451f"]

const FONT_SIZE = 43
const GAP = Math.round(FONT_SIZE * 0.14)
const BAR_HEIGHT = Math.round(FONT_SIZE * 0.17)

export default async function Icon() {
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
          alignItems: "center",
          justifyContent: "center",
          background: "#131324",
          // ~19% del lado, medido sobre el ícono de Intervalo.
          borderRadius: 18,
        }}
      >
        {/* `alignItems: stretch` hace que la barra mida exactamente lo que mide
            la palabra, igual que en el logo: el ancho lo fija el texto. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: GAP,
            // El centrado del flex alinea la CAJA, no la tinta: con
            // line-height 1 la fuente igual reserva aire sobre la mayúscula, así
            // que la tinta quedaba 4 px más abajo que el centro. Medido contra
            // el ícono de Intervalo, que sí está ópticamente centrado.
            marginTop: -4,
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
            dx
          </div>
          <div style={{ display: "flex", height: BAR_HEIGHT, borderRadius: 2, overflow: "hidden" }}>
            {BAR_COLORS.map((c) => (
              <div key={c} style={{ flex: 1, background: c }} />
            ))}
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
