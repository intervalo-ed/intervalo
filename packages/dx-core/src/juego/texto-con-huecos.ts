// La oración con marcadores que manda el servidor, partida en tramos: `{a}` el
// protagonista, `{b}` el segundo, `{u0}`/`{u1}` las siglas en el orden en que
// aparecen y `{xp:1500}` una cantidad de experiencia. Quién dibuja cada tramo es
// cosa de cada plataforma (web: texto-con-huecos.tsx; app: el par nativo).

const SLOT = /(\{(?:a|b|u0|u1|xp:\d+)\})/
const XP = /^\{xp:(\d+)\}$/
const miles = new Intl.NumberFormat("es-AR")

export type Hueco =
  | { tipo: "texto"; texto: string }
  | { tipo: "a" }
  | { tipo: "b" }
  // `antesDePuntuacion`: lo que sigue arranca con puntuación, así que el chip no
  // lleva aire a la derecha («la UBA .» se lee como un error).
  | { tipo: "uni"; indice: 0 | 1; antesDePuntuacion: boolean }
  | { tipo: "xp"; cantidad: number; texto: string }

/** Un tramo por pedazo del `split`, vacíos incluidos: el índice sirve de clave. */
export function partirEnHuecos({ texto }: { texto: string }): Hueco[] {
  return texto.split(SLOT).map((chunk, i, todos): Hueco => {
    if (chunk === "{a}") return { tipo: "a" }
    if (chunk === "{b}") return { tipo: "b" }
    if (chunk === "{u0}" || chunk === "{u1}") {
      return {
        tipo: "uni",
        indice: chunk === "{u0}" ? 0 : 1,
        antesDePuntuacion: /^[.,;:!?]/.test(todos[i + 1] ?? ""),
      }
    }
    const xp = XP.exec(chunk)
    if (xp) {
      const cantidad = Number(xp[1])
      return { tipo: "xp", cantidad, texto: miles.format(cantidad) }
    }
    return { tipo: "texto", texto: chunk }
  })
}
