// Los colores de las curvas y los ejes del gráfico de funciones. Viven en
// dx-core porque los pintan la web y la app (el «¿Por qué?» de las dos).

export const LINE_COLOR = "#4453E6"

// Segunda curva, opcional (hoy solo la usa el minijuego /derivadas, para
// dibujar f y f' juntas en el «¿Por qué?»). Violeta y no rojo: el rojo ya
// significa "parte negativa del área sombreada" en math-graph.tsx
// (SHADE_NEGATIVE_COLOR) y reusarlo acá confundiría los dos sentidos.
export const SECOND_LINE_COLOR = "#8d31b7"

export const AXIS_COLOR = "#6b7280"
