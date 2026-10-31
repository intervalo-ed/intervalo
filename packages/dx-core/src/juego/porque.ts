// Lo que el «¿Por qué?» dice además del texto del server: el parrafito que
// abre el gráfico y la forma del gráfico. Lo pintan la web
// (web/src/app/derivadas/porque-panel.tsx) y la app
// (mobile/components/juego/porque-panel.tsx).

import type { GameExplain } from "./UseGameExplain"

// El parrafito que ABRE el gráfico (va antes, no después: invita a mirarlo,
// no lo resume una vez que ya se vio). Fijo y sin parámetros a propósito —
// mismo criterio que las imágenes de REGLAS en explain.py: la relación entre
// f y f' (dónde una sube, qué signo tiene la otra) es la misma para
// cualquier función que el juego sirva, así que decirla una vez alcanza. No
// afirma que ESTE gráfico puntual muestre un máximo o un cruce por cero —
// una f sin extremos en su ventana (una exponencial pura, por ejemplo) es
// tan válida como cualquier otra— sino qué relación mirar en general.
//
// La entrada da vuelta la lectura de arriba —qué dice f' sobre f, no qué
// mirar EN f— con la definición (la derivada como pendiente) primero, para
// que los tres casos de GRAPH_POINTS ya sepan a qué se refieren. Van en
// bullets y no seguidos en la misma oración: son tres casos PARALELOS —crece,
// decrece, ni una cosa ni la otra— y una lista los deja leer de un vistazo,
// en vez de contar tres cláusulas dentro de un mismo párrafo.
//
// $f(x)$/$f'(x)$ van en LaTeX y no como texto —es la misma notación que el
// resto de la explicación, `MathText` los resuelve igual, línea por línea— y
// lo que responde cada caso (el signo, o el cero) va en negrita: es el dato
// nuevo de cada oración, el resto es la condición que ya se venía leyendo.
export const GRAPH_INTRO =
  "En el siguiente gráfico están $f(x)$ y $f'(x)$ juntas. Como la derivada " +
  "de una función representa la **pendiente**, observamos lo siguiente:"

export const GRAPH_POINTS = [
  "Cuando $f(x)$ crece, $f'(x)$ es **positiva**.",
  "Cuando $f(x)$ decrece, $f'(x)$ es **negativa**.",
  "Cuando en $f(x)$ hay un máximo, un mínimo o una meseta, $f'(x)$ es " +
    "igual a **0**.",
]

// El gráfico de cierre: f y f' en los mismos ejes. Lo manda siempre el
// servidor (game/explain.py :: Explanation); las dos vistas lo pintan, cada
// una pasando este prop desde su propio estado (mobile-flow.tsx y
// desktop-layout.tsx guardan el mismo objeto por separado, porque cada una
// tiene su propio ciclo de vida de "qué ejercicio es este").
export type PorQueGraph = {
  fn: string
  fn2: string
  // La MISMA f y f' de arriba, en LaTeX: solo para la leyenda, que si no
  // diría un genérico "f(x)"/"f'(x)" en vez de la fórmula real.
  fnLatex: string
  fn2Latex: string
  view: [number, number, number, number]
}

/** El gráfico tal como viene de POST /explain. `graph_view` es `number[]` en el
 *  schema; el server manda siempre cuatro (game/explain.py :: _auto_view). */
export function graficoDelExplain(data: GameExplain): PorQueGraph {
  return {
    fn: data.graph_fn,
    fn2: data.graph_fn2,
    fnLatex: data.graph_fn_latex,
    fn2Latex: data.graph_fn2_latex,
    view: data.graph_view as PorQueGraph["view"],
  }
}
