# Decisiones, FORM.json (topic: white/conteo/variaciones)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| formula-directa | 7 | 1 | 6 | 7 |
| identificar-formula-correcta | 4 | 1 | 3 | 4 |
| producto-decreciente | 4 | 1 | 3 | 4 |
| **Total** | **15** | 3 | 12 | **15** |

## Contextos usados

- `formula-directa` (6 nuevos, siguiendo el estilo contextual del ejercicio existente de banderas): podio parcial (10 corredores, 1°/2°/3°), código con posiciones distintas (clave de 4 dígitos entre 9), cargo distinto (comité de 12, presidente/secretario), franja de bandera (8 colores, 6 franjas), código (contraseña de 3 caracteres entre 11), cargo distinto (equipo de 10, capitán/vicecapitán). Rotan las 4 categorías del topic sin que ninguna supere el ~30% (cargo 2/7, podio 1/7, franja 1/7, código 2/7, más el existente de franja).
- `identificar-formula-correcta`: el ejercicio existente era completamente abstracto (símbolos $n,k$ sin contexto). Los 3 nuevos se redactaron con un contexto liviano concreto (torneo de 8 equipos y podio de 3, clave de 4 dígitos entre 10, comité de 7 con 2 cargos) siguiendo la regla 43 de `authoring-context.md` (enmarcar en contexto cotidiano cuando existe un escenario disponible), ya que este `topic-context.md` no declara explícitamente que `FORM` pueda quedar en abstracto (la excepción de la regla 43 exige esa aclaración explícita por topic, que acá no está).
- `producto-decreciente`: el existente y los 3 nuevos se mantuvieron abstractos (solo $n,k$ sin contexto narrativo), siguiendo el estilo del ejercicio ya validado del archivo, que plantea directamente la manipulación algebraica del producto decreciente sin un escenario cotidiano de por medio.

## Decisiones de contenido

- Al planificar `identificar-formula-correcta`, se decidió agregar un contexto concreto a los 3 ejercicios nuevos en vez de mantenerlos 100% abstractos como el existente, por la razón ya explicada (el topic-context.md no exime explícitamente a `FORM` de la regla 43). El ejercicio existente no se tocó.
- Corrección de errores de estructura tras la primera pasada de validación:
  - **Error `correct_index` (11/15 en índice 1, tope 50%)**: se reordenaron las opciones (y su `feedback_incorrect` paralelo) de 3 ejercicios de `formula-directa` (clave de 9 dígitos, bandera de 8 colores, equipo de 10) intercambiando las posiciones 1 y 2, y de 1 ejercicio de `identificar-formula-correcta` (comité de 7) intercambiando las posiciones 0 y 1. El contenido de cada opción no cambió, solo su posición y el índice correcto correspondiente. Distribución final: índice 0 = 4, índice 1 = 7, índice 2 = 3, índice 3 = 1.
  - **Warning regla 36 (párrafo de `question` > 130 caracteres)**: el ejercicio de podio (10 corredores) tenía un primer párrafo de 135 caracteres; se acortó a "Se quiere calcular la cantidad de podios distintos, eligiendo y ordenando 3 corredores para el 1°, 2° y 3° puesto." (114 caracteres), sin perder información.
  - **Warning regla 38 (3+ igualdades encadenadas en un solo bloque display)**: los 3 ejercicios nuevos de `identificar-formula-correcta` tenían un bloque `$$V_{n,k} = \dfrac{n!}{(n-k)!} = n\times\cdots = \text{resultado}$$` con 3 igualdades en una sola línea. Se partió cada uno en dos bloques `$$...$$` consecutivos (la fórmula con el cociente de factoriales, y el desarrollo numérico con el resultado), sin agregar texto entre medio.

## Warnings que quedaron

Ninguno. El topic completo (`CLSF`, `FORM`, `RESL`) corre en 0 ERRORS y 0 WARNINGS tras las correcciones.
