# Decisiones, CLSF.json (topic: violet/variables/definicion_var)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| clasificar-discreta | 6 | 1 | 5 | 6 |
| clasificar-continua | 6 | 1 | 5 | 6 |
| clasificar-caso-borde | 3 | 1 | 2 | 3 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **clasificar-discreta** (5 nuevos, además del ya existente "llamadas a un
  call center"): clientes que ingresan a un local, artículos defectuosos en
  un lote, caras en 5 tiradas de moneda, mensajes recibidos en un día, autos
  que cruzan un peaje en un minuto. 6 contextos distintos de la lista de
  "Contextos variados" del `topic-context.md`, ninguno repetido.
- **clasificar-continua** (5 nuevos, además del ya existente "duración de una
  batería"): tiempo de espera en la fila de un banco, peso de un paquete,
  altura de una persona adulta, temperatura ambiente de un laboratorio,
  distancia recorrida por un auto en un viaje. 6 contextos distintos, ninguno
  repetido (queda "volumen de líquido" de la lista sin usar, no hacía falta
  para completar el target).
- **clasificar-caso-borde** (2 nuevos, además del ya existente "edad en años
  cumplidos"): monto en pesos con centavos (discreta pese a los decimales
  visibles) y calificación de examen en escala entera de 1 a 10 (discreta
  aunque el concepto de fondo, el desempeño, se sienta graduable). Los 3
  ejercicios de la sub-familia cubren 3 trampas distintas documentadas en el
  `topic-context.md` (redondeo de una magnitud continua, decimales de una
  magnitud discreta, escala entera de un concepto matizado).

## Decisiones de contenido

- Todos los ejercicios nuevos reintroducen la definición de discreta/continua
  en la propia `explanation` (regla crítica 31 + regla específica del topic),
  aunque ya haya aparecido en otro ejercicio del ítem.
- `correct_index` se redistribuyó reordenando las 3 opciones ("Discreta.",
  "Continua.", "Categórica." o sus variantes con justificación en
  `clasificar-caso-borde`) para no dejar el archivo con la posición correcta
  siempre en el mismo índice. Distribución final del archivo completo: índice
  0 → 6, índice 1 → 6, índice 2 → 3 (el índice 2, "Categórica", nunca es la
  respuesta correcta porque ningún contexto de la tabla del topic es
  legítimamente categórico, así que ese desbalance es intrínseco al diseño,
  no un error de generación).
- El primer borrador de la sub-familia `clasificar-caso-borde` (monto en
  pesos) escribía los montos como `$\$10{,}45$` envueltos en modo matemático
  inline, lo que además de no seguir la convención del curso ("montos con
  `\$` escapado", sin modo matemático) generaba conteos de fragmentos LaTeX
  inflados por el regex del validador al toparse con el `\$` interno. Se
  corrigió escribiendo el monto como prosa simple escapada (`\$10{,}45`), sin
  el wrapper `$...$`.
- Varios ejercicios se redactaron primero con párrafos de `explanation` que
  superaban los 200 caracteres por tramo de prosa, o con 3+ fragmentos LaTeX
  inline en el mismo tramo (regla 21, ej. listar `$0$`, `$1$`, `$2$` sueltos);
  se dividieron en más párrafos cortos o se colapsaron en una sola expresión
  (`$0,1,2,\dots$`) en vez de fragmentos sueltos. Dos opciones (`clasificar-
  caso-borde`) tenían la correcta notablemente más larga que las otras dos;
  se acortaron sin perder la justificación.
- Sin desvíos del plan del `topic-context.md` más allá de lo ya descrito.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic
violet/variables/definicion_var` corre con 0 ERRORS y 0 WARNINGS sobre los 2
ítems del topic.
