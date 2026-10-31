// La oración con marcadores del servidor (web/src/app/derivadas/texto-con-huecos.tsx).
// El corte en tramos sale de dx-core; acá solo se dibuja. Devuelve tramos sueltos:
// va adentro de un <Text>, que es el que pone el cuerpo y el color de la oración.

import { StyleSheet, Text, View } from "react-native"
import { etiquetaDe, tagDe } from "@intervalo/dx-core/university-tags"
import { levelColor, TEMA } from "@intervalo/dx-core/juego/game-colors"
import { partirEnHuecos } from "@intervalo/dx-core/juego/texto-con-huecos"
import { UniTag } from "./university-tag"
import { XpDots } from "./xp-dots"

export function TextoConHuecos({
  texto,
  actorAlias,
  actorLevel,
  actorBAlias,
  universities,
  conTags = false,
  tamano = 16,
}: {
  texto: string
  actorAlias?: string | null
  actorLevel?: number | null
  actorBAlias?: string | null
  universities?: string[] | null
  // Siglas con su chip de color (pantalla de arranque) o en texto (feed).
  conTags?: boolean
  // El cuerpo del <Text> de afuera: el ícono de XP mide 0,85 de eso, como en la web.
  tamano?: number
}) {
  return (
    <>
      {partirEnHuecos({ texto }).map((hueco, i) => {
        if (hueco.tipo === "a") {
          return actorAlias ? (
            <Text
              key={i}
              style={[
                styles.fuerte,
                actorLevel === null || actorLevel === undefined ? null : { color: levelColor(actorLevel) },
              ]}
            >
              {actorAlias}
            </Text>
          ) : null
        }
        if (hueco.tipo === "b") {
          return actorBAlias ? (
            <Text key={i} style={[styles.fuerte, styles.secundario]}>
              {actorBAlias}
            </Text>
          ) : null
        }
        if (hueco.tipo === "uni") {
          const uni = universities?.[hueco.indice]
          if (!uni) return null
          // El aire va con espacios duros alrededor del chip: un View dentro de
          // un Text no toma margen de forma pareja en las dos plataformas.
          return conTags ? (
            <Text key={i}>
              {" "}
              <View style={styles.chip}>
                <UniTag university={uni} />
              </View>
              {hueco.antesDePuntuacion ? "" : " "}
            </Text>
          ) : (
            <Text key={i} style={[styles.fuerte, styles.secundario]}>
              {etiquetaDe(tagDe(uni))}
            </Text>
          )
        }
        if (hueco.tipo === "xp") {
          return (
            <Text key={i} style={[styles.fuerte, { color: TEMA.foreground }]}>
              {hueco.texto}
              {" "}
              <XpDots size={tamano * 0.85} />
            </Text>
          )
        }
        return hueco.texto
      })}
    </>
  )
}

const styles = StyleSheet.create({
  fuerte: { fontWeight: "600" },
  secundario: { color: "rgba(246,248,252,0.9)" },
  // Los Views dentro de un Text se apoyan en la línea de base: el chip baja un
  // poco para quedar centrado con el renglón.
  chip: { transform: [{ translateY: 3 }] },
})
