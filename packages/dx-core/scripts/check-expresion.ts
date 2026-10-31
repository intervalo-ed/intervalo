// Chequeo del parser de f(x) del gráfico del «¿Por qué?» en la app.
//
// Corre con: bun run check:expresion
//
// La web compila `graph_fn` con mathjs y la app con src/grafico/expresion.ts.
// Si las dos leen distinto la misma f, el gráfico del teléfono dibuja otra
// curva y nada lo dice. Acá se fija lo que más fácil se rompe: precedencias
// (`-x**2`, `2**x*log(2)`, `a/b*c`), la potencia que asocia a derecha, y que
// lo ilegible vuelva `null` en vez de una función que da cualquier cosa.

import { compilarExpresion } from "../src/grafico/expresion"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

const XS = [-2.5, -1, -0.3, 0.7, 1, 2, 3.9]
const cerca = (a: number, b: number) =>
  (Number.isNaN(a) && Number.isNaN(b)) || Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b))

// Formas reales de sympy (`str(expr)`), con su equivalente en JS.
const CASOS: [string, (x: number) => number][] = [
  ["3*x**2*sin(x)", (x) => 3 * x ** 2 * Math.sin(x)],
  ["x**2*cos(x) + 2*x*sin(x)", (x) => x ** 2 * Math.cos(x) + 2 * x * Math.sin(x)],
  ["-x**2", (x) => -(x ** 2)],
  ["-2*x + 5", (x) => -2 * x + 5],
  ["2**x*log(2)", (x) => 2 ** x * Math.log(2)],
  ["2**(-x)", (x) => 2 ** -x],
  ["x**3**2", (x) => x ** 9],
  ["exp(2*x)/x", (x) => Math.exp(2 * x) / x],
  ["log(5*x**2 + 1)/cos(2*x)", (x) => Math.log(5 * x ** 2 + 1) / Math.cos(2 * x)],
  ["sqrt(3*x**2 - 4*x + 7)", (x) => Math.sqrt(3 * x ** 2 - 4 * x + 7)],
  ["log(x)/log(2)", (x) => Math.log(x) / Math.log(2)],
  ["log(x, 2)", (x) => Math.log(x) / Math.log(2)],
  ["tan(x)**2 + 1", (x) => Math.tan(x) ** 2 + 1],
  ["6*x/(x**2 + 1)**2", (x) => (6 * x) / (x ** 2 + 1) ** 2],
  ["x/2*3", (x) => (x / 2) * 3],
  ["1/x", (x) => 1 / x],
  ["4", () => 4],
  ["0.5*x**(1/2)", (x) => 0.5 * Math.sqrt(x)],
  ["1.5e-3*x", (x) => 1.5e-3 * x],
  ["E**x + pi", (x) => Math.E ** x + Math.PI],
  ["x^2 - 1", (x) => x ** 2 - 1],
]

for (const [src, esperado] of CASOS) {
  const fn = compilarExpresion(src)
  if (!fn) {
    check(false, `«${src}» no compiló`)
    continue
  }
  const mal = XS.filter((x) => !cerca(fn(x), Number.isFinite(esperado(x)) ? esperado(x) : NaN))
  check(mal.length === 0, `«${src}»${mal.length ? ` difiere en x=${mal.join(", ")}` : ""}`)
}

console.log("fuera del dominio es NaN, no Infinity")
check(Number.isNaN(compilarExpresion("1/x")!(0)), "1/x en 0")
check(Number.isNaN(compilarExpresion("log(x)")!(-1)), "log(x) en -1")

console.log("lo ilegible es null")
for (const src of ["", "x +", "foo(x)", "y*2", "(x", "x)", "3 $ x", "sin x"]) {
  check(compilarExpresion(src) === null, `«${src}»`)
}

console.log(fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} chequeos fallaron`)
process.exit(fallos === 0 ? 0 : 1)
