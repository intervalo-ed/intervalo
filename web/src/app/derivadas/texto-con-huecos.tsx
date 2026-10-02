"use client"

// La oración con marcadores, que es cómo el servidor manda TODO lo que nombra a
// alguien o a una universidad: `{a}` el protagonista, `{b}` el segundo, y
// `{u0}`/`{u1}` las siglas en el orden en que aparecen.
//
// Existe como pieza propia porque ahora son dos las pantallas que la dibujan —el
// feed del ranking y la de arranque (`intro-panel.tsx`)— y son pantallas que se
// ven seguidas. Con una copia en cada una, el día que el color del @ cambie en
// una, la otra queda con el viejo y las dos hablan del mismo mundo con dos
// paletas.
//
// POR QUÉ EL SERVIDOR MANDA AGUJEROS Y NO LA ORACIÓN RESUELTA. Porque resolverla
// allá obligaría a buscar las siglas acá con una regex, y eso es adivinar: "UNT"
// también aparece adentro de palabras, y el copy cambia. El que arma la frase es
// el único que sabe dónde puso cada cosa.

import { UniTag } from "@/components/university-tag"
import { levelColor } from "./game-colors"

const SLOT = /(\{(?:a|b|u0|u1)\})/

export function TextoConHuecos({
  texto,
  actorAlias,
  actorLevel,
  actorBAlias,
  universities,
  conTags = false,
}: {
  texto: string
  actorAlias?: string | null
  actorLevel?: number | null
  actorBAlias?: string | null
  universities?: string[] | null
  // Si las siglas se dibujan con su chip de color o en texto corrido. Ver el
  // comentario de `{u0}` más abajo: no es lo mismo en las dos pantallas, así
  // que lo elige quien dibuja y no esta pieza.
  conTags?: boolean
}) {
  return (
    <>
      {texto.split(SLOT).map((chunk, i) => {
        if (chunk === "{a}") {
          // Sin nivel —quien invita un cafecito no es necesariamente un
          // jugador— el nombre va destacado pero sin robarle un color que no le
          // corresponde.
          return actorAlias ? (
            <span
              key={i}
              className="font-semibold"
              style={
                actorLevel === null || actorLevel === undefined
                  ? undefined
                  : { color: levelColor(actorLevel) }
              }
            >
              {actorAlias}
            </span>
          ) : null
        }
        if (chunk === "{b}") {
          // El segundo nombre de la oración. Sin color de nivel a propósito,
          // como las siglas: el protagonista es `{a}`, y a este le alcanza con
          // destacarse sin anunciar su rango.
          //
          // Puede venir el marcador y no el dato: el servidor elige entre varias
          // redacciones y algunas no nombran al segundo. Se cae el marcador.
          return actorBAlias ? (
            <span key={i} className="font-semibold text-foreground/90">
              {actorBAlias}
            </span>
          ) : null
        }
        if (chunk === "{u0}" || chunk === "{u1}") {
          const uni = universities?.[chunk === "{u0}" ? 0 : 1]
          if (!uni) return null
          // **Dónde va el chip y dónde no, y por qué no es lo mismo.**
          //
          // En el feed del ranking la sigla va en TEXTO: ahí las oraciones
          // corren una abajo de la otra —"la UNSAM pasó a la UNL"— y dos chips
          // de color adentro de un renglón lo parten en pedazos en vez de
          // dejarlo leer.
          //
          // En la pantalla de arranque van con chip: son tres hechos sueltos y
          // separados, no un feed, y el chip es lo que hace que la universidad
          // de uno se encuentre de un vistazo —que es justo lo que esa pantalla
          // quiere decir—.
          //
          // El artículo ("la"/"el") viene en el texto del servidor en los dos
          // casos: es el único que sabe cuáles son institutos.
          return conTags ? (
            <UniTag key={i} university={uni} />
          ) : (
            <span key={i} className="font-semibold text-foreground/90">
              {uni}
            </span>
          )
        }
        return chunk
      })}
    </>
  )
}
