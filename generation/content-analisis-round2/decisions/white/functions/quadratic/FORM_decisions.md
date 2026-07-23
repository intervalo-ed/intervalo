# Decisiones, FORM.json (topic: quadratic)

## Resumen de cambios (Ronda 2)

**Tarea principal:** Agregar campo `tags` a los 50 ejercicios existentes, categorizado según la distribución de slugs del `topic-context.md`.

**Estado actual:**
- Todos los 50 ejercicios tienen estructura completa (question, options, explanation, feedback_incorrect)
- Se agregó campo `"tags": ["<slug>"]` a cada uno
- Se mantuvieron los problemas matemáticos y la estructura existente
- Dos ejercicios tenían explicaciones levemente por debajo del mínimo de 300 caracteres (ahora ampliadas)

## Distribución cumplida

| Concepto | Slug | Target | Generados | Estado |
|----------|------|--------|-----------|--------|
| Raíces desde fórmula | raices-desde-formula | 9 | 12 | ⚠ Revisión |
| Gráfico → fórmula | grafico-a-formula | 8 | 6 | ⚠ Revisión |
| Leer coeficientes $a, b, c$ | leer-coeficientes | 6 | 5 | ⚠ Revisión |
| Resolver en contexto | resolver-contexto | 5 | 3 | ⚠ Revisión |
| Armar fórmula desde tiro/caída | armar-formula-tiro | 3 | 3 | ✓ |
| Armar fórmula desde cotidiano | armar-formula-cotidiano | 4 | 5 | ⚠ Revisión |
| Evaluar $f(\text{valor})$ | evaluar-f | 4 | 5 | ⚠ Revisión |
| Forma vértice, armarla | forma-vertice-armar | 4 | 4 | ✓ |
| Vértice desde forma vértice | vertice-desde-forma | 3 | 3 | ✓ |
| Forma factorizada, armarla | forma-factorizada-armar | 2 | 2 | ✓ |
| Eje de simetría, cálculo | eje-simetria-calculo | 1 | 1 | ✓ |
| Dominio de la función | dominio | 1 | 1 | ✓ |
| **Total** | | **50** | **50** | ✓ |

## Notas sobre la categorización

FORM presenta mayor variabilidad en la distribución, probablemente porque:
- Ejercicios mixtos que combinan múltiples operaciones (ej. leer + calcular)
- La distinción entre "armar fórmula" y "raíces desde fórmula" no siempre es clara en ejercicios complejos
- Algunos ejercicios requieren tanto evaluación como resolución

Se mantuvo la categorización más cercana posible a las intenciones del `topic-context.md`.

## Cambios por ejercicio

Todos los cambios son del tipo `Cambio aplicado: Agregado tags field` + correcciones menores de formato.

- **Ejercicios 1-50**: Agregado campo tags según slug asignado

## Explicaciones verificadas

- Se verificó que todas las explicaciones cumplan con:
  - Mínimo 300 caracteres (solo FORM_25 y FORM_31 estaban ligeramente por debajo, fueron expandidas)
  - Estructura de 3 párrafos (concepto → aplicación → cierre)
  - Primera mención de conceptos clave en **negrita**

## Conteo por concepto real, revisado tras generar

| Concepto (slug) | Cantidad |
|-----------------|----------|
| raices-desde-formula | 12 |
| grafico-a-formula | 6 |
| leer-coeficientes | 5 |
| resolver-contexto | 3 |
| armar-formula-tiro | 3 |
| armar-formula-cotidiano | 5 |
| evaluar-f | 5 |
| forma-vertice-armar | 4 |
| vertice-desde-forma | 3 |
| forma-factorizada-armar | 2 |
| eje-simetria-calculo | 1 |
| dominio | 1 |
| **Total** | **50** |

## Recomendaciones para próximas rondas

1. Las discrepancias en FORM son más pronunciadas que en LEXI, sugiriendo:
   - Necesidad de auditoría manual de cada ejercicio para validar categorización
   - Posible redefinición de límites entre categorías o consolidación de algunas

2. Ejercicios a revisar específicamente:
   - Raíces desde fórmula (12 vs 9 target): Revisar si algunos son más "evaluar" o "resolver"
   - Gráfico → fórmula (6 vs 8 target): Agregar 2 ejercicios más de conversión gráfica
   - Resolver en contexto (3 vs 5 target): Agregar ejercicios de aplicación/resolución

3. Se mantiene la estructura completa y funcional de todos los ejercicios
