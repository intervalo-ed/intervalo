// Las filas de la tabla de derivadas y en qué orden se muestran. Las dibujan
// la web (web/src/app/derivadas/derivatives-table.tsx) y la app
// (mobile/components/juego/derivatives-table.tsx); qué filas hay y cómo se
// reacomodan es lo mismo en las dos.

// `slug` identifica la fila para quien mire sus DATOS y no su fórmula: es la
// misma clave que usa game/stats.py :: ROW_TEMPLATES, así que una fila de acá
// y una del payload de /stats se encuentran por `slug`, nunca por posición
// (un array reordenado del lado del server no tendría por qué romper esto).
export type Fila = { f: string; d: string; slug: string }

// Una sola tabla de dos columnas. Las cuatro reglas —suma, producto, cociente
// y cadena— entran como cuatro filas más y no en una tabla aparte: son lo mismo
// que el resto (algo y su derivada) y separarlas obligaba a una segunda
// cabecera que repetía las mismas dos palabras.
// Las fracciones SIMPLES —las que tienen un 1 arriba y un factor abajo— van
// escritas en una sola línea. Apiladas, cada una de esas filas medía 65 px
// contra los 41 de un renglón normal, y seis de ellas eran 150 px que la tabla
// no tiene: en una ventana de las comunes la tabla se cortaba antes de llegar a
// las reglas, que son justo las que más se consultan.
//
// TODAS, incluida la del cociente: con los paréntesis puestos —(u'v − uv')/v²—
// no queda ambigüedad, y a cambio los quince renglones miden lo mismo. Una
// tabla de renglones parejos se recorre con la vista de un tirón; una con seis
// filas al doble de alto obliga a saltar.
//
// Se pierde algo: `1/x^2` en línea admite leerse mal como `(1/x)^2`. Es un
// precio aceptable en una tabla que se consulta contrarreloj y que ya se está
// mirando con las dos columnas al lado.
export const FILAS: Fila[] = [
  { slug: "a", f: "a", d: "0" },
  { slug: "x", f: "x", d: "1" },
  { slug: "x_n", f: "x^n", d: "n\\,x^{n-1}" },
  { slug: "inv_x", f: "1/x", d: "-1/x^{2}" },
  { slug: "sqrt_x", f: "\\sqrt{x}", d: "1/\\left(2\\sqrt{x}\\right)" },
  { slug: "e_x", f: "e^{x}", d: "e^{x}" },
  { slug: "a_x", f: "a^{x}", d: "a^{x}\\ln a" },
  { slug: "ln_x", f: "\\ln x", d: "1/x" },
  { slug: "log_a_x", f: "\\log_a x", d: "1/\\left(x\\ln a\\right)" },
  { slug: "sin_x", f: "\\operatorname{sen} x", d: "\\cos x" },
  { slug: "cos_x", f: "\\cos x", d: "-\\operatorname{sen} x" },
  { slug: "tan_x", f: "\\tan x", d: "1/\\cos^{2} x" },
  { slug: "sum", f: "u + v", d: "u' + v'" },
  { slug: "prod", f: "u \\cdot v", d: "u'v + uv'" },
  { slug: "quot", f: "u/v", d: "\\left(u'v - uv'\\right)/v^{2}" },
  { slug: "chain", f: "f(u)", d: "f'(u)\\,u'" },
]

/** En qué orden van las filas, y cuántas subieron.
 *
 *  Pura y exportada para poder chequearla sin montar nada: es
 *  `bun run check:tabla` (packages/dx-core/scripts/check-tabla-orden.ts). Perder o duplicar
 *  una fila acá sería un agujero en la tabla de derivadas en la mitad de una
 *  partida, y eso no se ve leyendo seis líneas de `filter`.
 *
 *  `clave` son los slugs pedidos separados por coma —el formato viene de que
 *  `destacar` cambia de identidad en cada render y hay que memoizar contra
 *  algo estable—. `subidas` es cuántas filas se movieron DE VERDAD, que no es
 *  lo mismo que cuántos slugs mandó el server: si nombra una fila que este
 *  front todavía no tiene, esa no se mueve, y de ese número depende dónde va
 *  la costura. */
export function acomodar(
  clave: string,
  desborda: boolean,
): { filas: Fila[]; subidas: number; pedidas: Set<string> } {
  const pedidas = new Set(clave === "" ? [] : clave.split(","))
  const arriba = FILAS.filter((f) => pedidas.has(f.slug))
  // Subir todas las filas, o ninguna, es no ordenar nada.
  if (!desborda || arriba.length === 0 || arriba.length === FILAS.length) {
    return { filas: FILAS, subidas: 0, pedidas }
  }
  return {
    filas: [...arriba, ...FILAS.filter((f) => !pedidas.has(f.slug))],
    subidas: arriba.length,
    pedidas,
  }
}
