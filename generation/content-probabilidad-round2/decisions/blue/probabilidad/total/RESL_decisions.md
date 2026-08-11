# Decisiones, RESL.json (topic: blue/probabilidad/total)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| resl-dos-escenarios | 6 | 1 | 5 | 6 |
| resl-tres-o-mas-escenarios | 5 | 1 | 4 | 5 |
| resl-despejar-condicional | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **resl-dos-escenarios** (6): canales de envío x1 (ya existente), líneas de producción x2 (fábrica con líneas 1/2, planta con líneas A/B), proveedores x2 (P1/P2 de productos, R/S de insumos), urnas/cajas x1 (dos cajas con bolitas azules). Líneas y proveedores quedan en 2/6 ≈ 33%, levemente por encima del ~30% recomendado; con solo 4 contextos válidos y 6 cupos no es posible una distribución perfecta bajo 30% sin dejar algún contexto en 0, así que se priorizó cubrir los 4 contextos al menos una vez.
- **resl-tres-o-mas-escenarios** (5): proveedores x2 (3 proveedores ya existente + 4 proveedores Q1-Q4 nuevo), líneas de producción x1 (3 líneas), canales de envío x1 (3 canales), urnas/cajas x1 (3 cajas). Proveedores queda en 2/5 = 40%, por la misma razón de arriba (5 cupos, 4 contextos).
- **resl-despejar-condicional** (4): abstracto x1 (ya existente, sin contexto), líneas de producción x1, canales de envío x1, proveedores x1. Cada contexto nuevo usado una sola vez.

## Decisiones de contenido

- Se balanceó `correct_index` reordenando manualmente las 4 opciones (y su `feedback_incorrect` paralelo) de varios ejercicios: quedó exactamente 3/3/3/3 entre los índices 0-3 de las 12 opciones nuevas, sumado a la distribución 0/1/2/2 de los 3 ejercicios preexistentes.
- En `resl-despejar-condicional` se usaron pesos de partición 0,5/0,5 o 0,6/0,4 y condicionales de una cifra decimal para que el despeje se pueda verificar mentalmente, siguiendo la nota de diseño numérico del `topic-context.md`.
- No se tocó ningún ejercicio preexistente.

## Warnings que quedaron

- **Regla 40 (fórmula de partición con ramas nombradas en `explanation`), 3 ejercicios nuevos + 1 preexistente**, todos de `resl-despejar-condicional`: el propio `topic-context.md` de este topic pide explícitamente que la fórmula base de esta sub-familia nombre $A_1$/$A_2$ (o los símbolos concretos del contexto) en vez de `\sum_i`, porque el despeje necesita referenciar cada rama por separado ("Despeje: fórmula base antes del resultado", sección *Reglas específicas del topic*). El ejercicio preexistente del archivo (índice 2) ya sigue el mismo patrón. Warning esperado y documentado, no se corrige.
