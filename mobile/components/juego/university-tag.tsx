// Bandera y tag de universidad (web/src/components/university-tag.tsx). Los
// colores y la etiqueta salen de dx-core (`university-tags.ts`); acá solo se
// dibujan.

import { StyleSheet, Text, View } from "react-native"
import { SvgXml } from "react-native-svg"
import { estilosDeTag, etiquetaDe, PAIS_NOMBRE, tagDe, type Pais } from "@intervalo/dx-core/university-tags"

// Banderas rectangulares de Twemoji (CC-BY 4.0, ver web/public/flags/LICENSE.txt),
// las mismas de la web pegadas como texto: son cuatro y chicas, y así no hace
// falta un transformador de SVG en metro. El SVG es un cuadrado de 36 con la
// bandera ondeada adentro, así que `size` es el alto y el ancho sale solo.
const BANDERA_SVG: Record<Pais, string> = {
  AR: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 36 36\"><path fill=\"#75AADB\" d=\"M36 27c0 2.209-1.791 4-4 4H4c-2.209 0-4-1.791-4-4V9c0-2.209 1.791-4 4-4h28c2.209 0 4 1.791 4 4v18z\"/><path fill=\"#EEE\" d=\"M0 13h36v10H0z\"/><path fill=\"#FCBF49\" d=\"M18 13l.488 2.548 1.426-2.167-.525 2.54 2.146-1.457-1.457 2.147 2.541-.524-2.167 1.425L23 18l-2.548.488 2.167 1.426-2.541-.525 1.457 2.146-2.146-1.457.525 2.541-1.426-2.167L18 23l-.488-2.548-1.425 2.167.524-2.541-2.147 1.457 1.457-2.146-2.54.525 2.167-1.426L13 18l2.548-.488-2.167-1.425 2.54.524-1.457-2.147 2.147 1.457-.524-2.54 1.425 2.167z\"/><path fill=\"#843511\" d=\"M18 14.33l.242 1.265.116.605.339-.514.708-1.076-.261 1.261-.125.604.51-.346 1.066-.723-.723 1.066-.346.51.603-.125 1.262-.26-1.076.708-.515.337.605.116L21.67 18l-1.265.242-.605.116.514.339 1.076.708-1.262-.261-.604-.125.346.51.723 1.065-1.065-.723-.51-.346.125.604.261 1.262-.708-1.076-.338-.515-.116.605L18 21.67l-.242-1.265-.116-.605-.339.515-.708 1.076.26-1.262.125-.603-.51.346-1.066.723.723-1.066.346-.51-.604.125-1.261.261 1.076-.708.514-.339-.605-.116L14.33 18l1.265-.242.605-.116-.515-.339-1.076-.708 1.261.26.603.125-.346-.51-.724-1.066 1.066.724.51.346-.125-.603-.26-1.261.708 1.076.339.515.116-.605L18 14.33M18 13l-.488 2.548-1.425-2.167.524 2.541-2.147-1.457 1.457 2.147-2.54-.524 2.167 1.425L13 18l2.548.488-2.167 1.426 2.54-.525-1.457 2.146 2.147-1.457-.524 2.541 1.425-2.167L18 23l.488-2.548 1.426 2.167-.525-2.541 2.146 1.457-1.457-2.146 2.541.525-2.167-1.426L23 18l-2.548-.488 2.167-1.425-2.541.524 1.457-2.147-2.146 1.457.525-2.541-1.426 2.167L18 13zm1.914.381h.005-.005zm1.621 1.083h.005-.005zm1.084 1.623h.005-.005z\"/><circle fill=\"#FCBF49\" cx=\"18\" cy=\"18\" r=\"2\"/><path fill=\"#843511\" d=\"M18 20.125c-1.172 0-2.125-.953-2.125-2.125s.953-2.125 2.125-2.125 2.125.953 2.125 2.125-.953 2.125-2.125 2.125zm0-4c-1.034 0-1.875.841-1.875 1.875s.841 1.875 1.875 1.875 1.875-.841 1.875-1.875-.841-1.875-1.875-1.875z\"/><path fill=\"#C16540\" d=\"M17.801 17.774c0 .155-.261.28-.583.28-.323 0-.584-.125-.584-.28 0-.155.261-.28.584-.28.322 0 .583.125.583.28zm1.553-.024c0-.161-.266-.292-.594-.292-.328 0-.594.13-.594.292s.266.292.594.292c.329 0 .594-.131.594-.292z\"/><path fill=\"#ED8662\" d=\"M17.463 18.874c0-.126.246-.229.548-.229.303 0 .548.102.548.229 0 .126-.246.229-.548.229-.303 0-.548-.103-.548-.229z\"/></svg>",
  UY: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 36 36\"><path fill=\"#0038A8\" d=\"M0 27c0 2.209 1.791 4 4 4h28c2.209 0 4-1.791 4-4v-1H0v1zm0-8h36v4H0z\"/><path fill=\"#EEE\" d=\"M0 23h36v3H0z\"/><path fill=\"#0038A8\" d=\"M36 9c0-2.209-1.791-4-4-4H16v4h20zm-20 3h20v4H16z\"/><path fill=\"#EEE\" d=\"M16 9V5H4C1.791 5 0 6.791 0 9v10h36v-3H16v-4h20V9H16z\"/><path fill=\"#FFD983\" d=\"M13 12c0-2.762-2.238-5-5-5s-5 2.239-5 5 2.239 5 5 5c2.762 0 5-2.239 5-5z\"/><path fill=\"#FFCC4D\" d=\"M12 12c0-2.209-1.79-4-4-4-2.209 0-4 1.791-4 4 0 2.208 1.791 4 4 4 2.21 0 4-1.792 4-4z\"/><path fill=\"#FFAC33\" d=\"M8 5.597l.633 4.041 2.569-3.183-1.473 3.816 3.816-1.473-3.183 2.569 4.041.633-4.041.633 3.183 2.569-3.816-1.473 1.473 3.816-2.569-3.183L8 18.403l-.633-4.041-2.569 3.183 1.473-3.816-3.816 1.473 3.183-2.569L1.597 12l4.041-.633-3.183-2.569 3.816 1.473-1.473-3.816 2.569 3.183z\"/><path fill=\"#C1694F\" d=\"M11 12c0-1.657-1.343-3-3-3s-3 1.343-3 3c0 1.656 1.343 3 3 3s3-1.344 3-3z\"/><path fill=\"#FFAC33\" d=\"M5.834 12.004c0-1.19.964-2.154 2.153-2.154s2.153.964 2.153 2.154c0 1.189-.964 2.152-2.153 2.152s-2.153-.964-2.153-2.152z\"/></svg>",
  CL: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 36 36\"><path fill=\"#1F429B\" d=\"M13 5H4C1.791 5 0 6.791 0 9v9h13V5zm-4.663 9.292l-1.882-1.367-1.882 1.367.719-2.212-1.882-1.368h2.326L6.455 8.5l.719 2.212H9.5L7.618 12.08l.719 2.212z\"/><path fill=\"#EEE\" d=\"M32 5H13v13h23V9c0-2.209-1.791-4-4-4z\"/><path fill=\"#D42D27\" d=\"M0 18v9c0 2.209 1.791 4 4 4h28c2.209 0 4-1.791 4-4v-9H0z\"/><path fill=\"#FFF\" d=\"M7.174 10.712L6.455 8.5l-.719 2.212H3.41l1.882 1.368-.719 2.212 1.882-1.367 1.882 1.367-.719-2.212L9.5 10.712z\"/></svg>",
  PY: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 36 36\"><path fill=\"#0038A8\" d=\"M0 27c0 2.209 1.791 4 4 4h28c2.209 0 4-1.791 4-4v-4H0v4z\"/><path fill=\"#EEE\" d=\"M0 13h36v10H0z\"/><path fill=\"#D52B1E\" d=\"M32 5H4C1.791 5 0 6.791 0 9v4h36V9c0-2.209-1.791-4-4-4z\"/><path d=\"M22 18c0 2.209-1.791 4-4 4s-4-1.791-4-4 1.791-4 4-4 4 1.791 4 4z\"/><path fill=\"#EEE\" d=\"M21.75 18c0 2.071-1.68 3.75-3.75 3.75s-3.75-1.68-3.75-3.75 1.679-3.75 3.75-3.75 3.75 1.679 3.75 3.75z\"/><path d=\"M21.25 18c0 1.795-1.455 3.25-3.25 3.25s-3.25-1.455-3.25-3.25 1.455-3.25 3.25-3.25 3.25 1.455 3.25 3.25z\"/><path fill=\"#EEE\" d=\"M21.126 18c0 1.726-1.4 3.126-3.126 3.126s-3.124-1.4-3.124-3.126 1.399-3.124 3.124-3.124c1.726 0 3.126 1.399 3.126 3.124z\"/><path fill=\"#99AAB5\" d=\"M21.132 17.98c0-1.73-1.402-3.132-3.132-3.132s-3.132 1.402-3.132 3.132c0 .573.154 1.111.423 1.573l2.712-1.491 2.707 1.491c.268-.463.422-1 .422-1.573z\"/><path d=\"M20.5 18c0 1.381-1.119 2.5-2.5 2.5s-2.5-1.119-2.5-2.5 1.12-2.5 2.5-2.5 2.5 1.119 2.5 2.5z\"/><circle fill=\"#EEE\" cx=\"18\" cy=\"18\" r=\"2.4\"/><path fill=\"#FFAC33\" d=\"M18 17.182l.184.565h.594l-.481.35.183.565-.48-.349-.48.349.183-.565-.481-.35h.594z\"/><path fill=\"#007127\" d=\"M18.497 16.517s.3-.07.476-.088c.176-.018.334.388.545.458.214.072.212.282.3.529.088.247.035.299.035.581s.158.423.123.634c-.035.211-.211.264-.316.405-.105.142-.018.317-.124.423-.105.105-.458.088-.581.194-.123.105-.352.264-.511.176-.158-.088-.493-.123-.493-.123s.088-.317.335-.423c.247-.105.352-.088.581-.158.229-.071.211-.177.37-.317.158-.141.176-.335.264-.476.089-.141.106-.247.071-.441-.036-.194-.107-.405-.177-.582-.07-.176-.229-.387-.335-.511-.105-.123-.563-.281-.563-.281z\"/><path fill=\"#007127\" d=\"M17.405 16.622s.175-.383 0-.405c-.705-.088-.846.546-1.057.616-.213.072-.247.423-.334.669-.088.247-.053.299-.053.582 0 .282.005.334.041.546.035.211.083.37.188.511.106.141.146.211.252.316.105.105.312.212.435.317.123.105.498.141.657.053.158-.088.435-.123.435-.123s-.118-.212-.364-.317c-.247-.105-.264-.193-.493-.264-.229-.071-.211-.177-.37-.317-.158-.141-.176-.335-.264-.476-.088-.141-.041-.176-.005-.37.035-.194.105-.352.176-.528.07-.176.247-.405.352-.528.105-.123.404-.282.404-.282z\"/><path fill=\"#007127\" d=\"M17.423 19.863l.229.158.299-.211.282.194.37-.141-.37.265-.264-.212-.282.194-.282-.159z\"/></svg>",
}

export function Bandera({ country, size = 17 }: { country: Pais; size?: number }) {
  return (
    <View accessible accessibilityLabel={PAIS_NOMBRE[country]} style={{ width: size, height: size }}>
      <SvgXml xml={BANDERA_SVG[country]} width={size} height={size} />
    </View>
  )
}

// La tag: color de marca + tipografía compartida, con la bandera de su país
// ADENTRO, después de la sigla. Las instituciones que no están en el listado
// reciben una tag generada (ver `tagGenerada`) y no llevan bandera.
export function UniTag({ university }: { university: string }) {
  const cfg = tagDe(university)
  // Solo los colores: la tipografía de la web (`var(--font-itba)`, Outfit) no
  // está en la app y va la del sistema con el mismo peso.
  const { color, borderColor, backgroundColor } = estilosDeTag(cfg)
  return (
    <View
      style={[
        styles.tag,
        {
          borderColor: borderColor as string,
          backgroundColor: backgroundColor as string,
          transform: cfg.tagDy ? [{ translateY: cfg.tagDy }] : undefined,
        },
      ]}
    >
      <Text style={[styles.texto, { color: color as string, fontSize: parseFloat(cfg.tagFontSize) }]}>
        {etiquetaDe(cfg)}
      </Text>
      {cfg.country && (
        // 0,5 px más abajo: el centro óptico del texto en versalitas queda por
        // debajo del centro de su caja, y centrada a secas la bandera se ve alta.
        <View style={{ transform: [{ translateY: 0.5 }] }}>
          <Bandera country={cfg.country} size={10} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: "row",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  // `letterSpacing: 0.02em` de la web, a 9 px.
  texto: { fontWeight: "500", letterSpacing: 0.18, lineHeight: 10, textAlign: "center" },
})
