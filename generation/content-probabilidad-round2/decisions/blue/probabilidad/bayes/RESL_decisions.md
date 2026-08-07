# Decisiones, RESL.json (topic: blue/probabilidad/bayes)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| resl-fraccion-indicada | 8 | 1 | 7 | 8 |
| resl-frecuencias-naturales | 7 | 1 | 6 | 7 |
| **Total** | **15** | **2** | **13** | **15** |

## Contextos usados

- **resl-fraccion-indicada** (8, incluye 1 preexistente): test diagnóstico x2 (condición ya existente + condición con test al 70%/40%), control de calidad x2 (líneas $A$/$B$ + proveedores $P$/$Q$), urnas/cajas x2 (urnas $A$/$B$ + cajas $X$/$Y$), filtros de spam x2 (palabra clave + remitente desconocido). 2/8 = 25%.
- **resl-frecuencias-naturales** (7, incluye 1 preexistente): test diagnóstico x2 (1000 personas ya existente + 800 personas), control de calidad x2 (línea $A$/$B$ de 600 piezas + proveedores $P$/$Q$ de 900 tornillos), urnas/cajas x2 (500 sorteos con urnas $A$/$B$ + 1000 sorteos con cajas $X$/$Y$), filtros de spam x1 (2000 correos). 2/7 ≈ 28,6%.

## Decisiones de contenido

- En `resl-frecuencias-naturales` todos los números se eligieron para que la suma de positivos/defectuosas/negras/etc. y la división final requieran solo aritmética mental directa (sin decimales, denominadores que sean sumas de dos enteros redondos), siguiendo la nota de diseño numérico del `authoring-context.md`.
- Se corrigió una colisión numérica detectada en el diseño inicial del ejercicio de urnas de `resl-frecuencias-naturales`: los primeros números elegidos hacían que la fracción correcta coincidiera numéricamente con el distractor de "verosimilitud" (ambos daban $140/200$), lo que hubiera vuelto ambigua la opción correcta. Se rediseñaron las cantidades (250/250 sorteos, 175/50 rojas) para que las 4 fracciones de las opciones sean todas numéricamente distintas.
- Primer intento del ejercicio de test diagnóstico en `resl-fraccion-indicada` usaba decimales de 2 cifras (8%, 85%, 15%, 92%), lo que generaba opciones de más de 35 caracteres de render (regla 39) y un bloque display por verticalizar (regla 38); se rediseñó con decimales de 1 cifra (20%, 70%, 40%), coherente con el estilo del ejercicio preexistente del mismo archivo.
- Se acortó el cierre de `explanation` en los 7 ejercicios nuevos de `resl-fraccion-indicada` ("Dejar afuera alguna de las dos ramas del denominador, o usar solo X sin Y en el numerador..." → "Dejar afuera una rama del denominador, o usar solo X sin Y...") para que el párrafo final quedara bajo los 200 caracteres (regla de párrafos de `explanation`).
- Se partieron varios párrafos de `question` que superaban los 130 caracteres (regla 36) en dos o tres oraciones con `\n\n`, sin sacar información del enunciado.
- No se tocó ningún ejercicio preexistente.
- Sin desvíos del plan de sub-familias/slugs del `topic-context.md`.

## Warnings que quedaron

Ninguno. Tras las correcciones, `validate_content.py --topic blue/probabilidad/bayes` reporta 0 ERRORS y 0 WARNINGS para `RESL.json`.
