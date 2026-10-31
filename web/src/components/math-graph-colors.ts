// Los colores de las curvas, en un módulo propio y sin dependencias.
//
// Viven separados de math-graph.tsx por una razón de peso, literal: ese archivo
// importa `mafs` y `mathjs`, que juntos son casi un mega. La leyenda del
// «¿Por qué?» solo necesita los dos colores para pintar dos rayitas, y mientras
// los sacara de ahí arrastraba el gráfico entero al bundle inicial de
// /derivadas — aunque el gráfico se cargue perezosamente y aunque esa pantalla
// solo aparezca después de errar una derivada.
//
// math-graph.tsx los vuelve a exportar, así que quien ya los importaba de allá
// sigue funcionando igual.

export { AXIS_COLOR, LINE_COLOR, SECOND_LINE_COLOR } from "@intervalo/dx-core/grafico/math-graph-colors"
