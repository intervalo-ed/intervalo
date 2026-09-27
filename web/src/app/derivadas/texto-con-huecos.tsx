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

import { levelColor } from "./game-colors"

const SLOT = /(\{(?:a|b|u0|u1)\})/

export function TextoConHuecos({
  texto,
  actorAlias,
  actorLevel,
  actorBAlias,
  universities,
}: {
  texto: string
  actorAlias?: string | null
  actorLevel?: number | null
  actorBAlias?: string | null
  universities?: string[] | null
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
          // Sigla en texto y no la `<UniTag>`: esto es una oración corrida —"la
          // UNSAM pasó a la UNL"— y meterle dos chips de color adentro la parte
          // en pedazos en vez de dejarla leer. El artículo ("la"/"el") ya viene
          // en el texto del servidor, que es el único que sabe cuáles son
          // institutos.
          return uni ? (
            <span key={i} className="font-semibold text-foreground/90">
              {uni}
            </span>
          ) : null
        }
        return chunk
      })}
    </>
  )
}
