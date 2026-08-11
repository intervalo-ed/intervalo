# Decisiones, ESTR.json (topic: blue/probabilidad/total)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| reconocer-probabilidad-total | 7 | 1 | 6 | 7 |
| distractor-condicional-simple | 4 | 1 | 3 | 4 |
| verificar-particion | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- **reconocer-probabilidad-total** (7): líneas de producción x2 (fábrica de piezas defectuosas ya existente + planta con líneas A/B/C), canales de envío x2 (aéreo/terrestre, transportistas T1/T2), proveedores x2 (distribuidores M/N de insumos, proveedores P1/P2/P3 de repuestos), urnas/cajas x1 (dos cajas con bolitas rojas). Ningún contexto supera el ~30% (2/7 ≈ 28,6%).
- **distractor-condicional-simple** (4): abstracto (encuesta, ya existente) + proveedor certificado único + courier expreso único + línea de ensamblaje única. Cada contexto nuevo usado una sola vez.
- **verificar-particion** (4): abstracto (escenarios genéricos, ya existente) + tres cajas + dos canales + cuatro proveedores. Cada contexto nuevo usado una sola vez.

## Decisiones de contenido

- Se balanceó `correct_index` entre las 3 posiciones posibles a lo largo del archivo completo (15 ejercicios): quedó en 6/5/4 para los índices 0/1/2 respectivamente, razonablemente uniforme.
- Tras la primera pasada de validación se corrigieron 8 warnings reales: relleno asimétrico ("solamente" en una sola opción), dos casos de paridad de longitud de opciones (la correcta demasiado larga o demasiado corta respecto de las demás, regla 4/15), dos bloques `$$...$$` de 2 términos que convenía verticalizar (regla 38), y cuatro párrafos de `question` que superaban los 130 caracteres (regla 36), todos reescritos partiendo el párrafo en dos con `\n\n` sin perder información.
- No se tocó ningún ejercicio preexistente (índices 0-2 del archivo original).
- Sin desvíos del plan de sub-familias/slugs del `topic-context.md`.

## Warnings que quedaron

Ninguno. Tras las correcciones, `validate_content.py --topic blue/probabilidad/total` reporta 0 ERRORS y 0 WARNINGS para `ESTR.json`.
