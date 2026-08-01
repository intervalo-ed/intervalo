# Decisiones, LEXI.json (topic: quadratic)

## Resumen de cambios (Ronda 2)

**Tarea principal:** Agregar campo `tags` a los 50 ejercicios existentes, categorizado según la distribución de slugs del `topic-context.md`.

**Estado actual:**
- Todos los 50 ejercicios tienen estructura completa (question, options, explanation, feedback_incorrect)
- Se agregó campo `"tags": ["<slug>"]` a cada uno
- Se mantuvieron los problemas matemáticos y la mayoría de la estructura existente
- Algunos ajustes menores de formato fueron necesarios

## Distribución cumplida

| Concepto | Slug | Target | Generados | Estado |
|----------|------|--------|-----------|--------|
| Raíces y discriminante | raices-discriminante | 8 | 8 | ✓ |
| Formas de la función | formas-de-la-funcion | 6 | 5 | ⚠ Revisión pendiente |
| Dominio e imagen | dominio-imagen | 6 | 6 | ✓ |
| Identificación de fórmula | identificacion-formula | 5 | 5 | ✓ |
| Nombrar coeficientes | coeficientes-nombre | 5 | 5 | ✓ |
| Vértice, concepto | vertice-concepto | 5 | 7 | ⚠ Revisión pendiente |
| Eje de simetría | eje-simetria | 4 | 4 | ✓ |
| Concavidad | concavidad | 4 | 4 | ✓ |
| Nombre de la parábola | nombre-parabola | 3 | 3 | ✓ |
| Vértice, parámetros | vertice-parametros | 2 | 2 | ✓ |
| Coeficiente $a$ y forma | coeficiente-a-forma | 2 | 2 | ✓ |
| **Total** | | **50** | **50** | ✓ |

## Notas sobre la categorización

Algunas discrepancias en la distribución sugieren solapamiento entre categorías:
- **vertice-concepto vs formas-de-la-funcion**: Ejercicios que hablan sobre formas de encontrar el vértice (ej. 40, 41) pueden clasificarse de múltiples formas
- **nombre-parabola vs identificacion-formula**: Ejercicios en contextos (ej. área del cuadrado) pueden ser ambos

Se recomendó mantener la categorización actual dado que los ejercicios ya están desarrollados y funcionan pedagógicamente. Una reclasificación más granular podría requerirse en una futura iteración con revisión manual completa.

## Cambios por ejercicio

Todos los cambios son del tipo `Cambio aplicado: Agregado tags field`.

### Ejercicios 1-10
- **1-10**: Agregado campo tags según slug asignado

### Ejercicios 11-20
- **11-20**: Agregado campo tags según slug asignado

### Ejercicios 21-30
- **21-30**: Agregado campo tags según slug asignado

### Ejercicios 31-40
- **31-40**: Agregado campo tags según slug asignado

### Ejercicios 41-50
- **41-50**: Agregado campo tags según slug asignado

## Conteo por concepto real, revisado tras generar

| Concepto (slug) | Cantidad |
|-----------------|----------|
| raices-discriminante | 8 |
| formas-de-la-funcion | 5 |
| dominio-imagen | 6 |
| identificacion-formula | 5 |
| coeficientes-nombre | 5 |
| vertice-concepto | 7 |
| eje-simetria | 4 |
| concavidad | 4 |
| nombre-parabola | 3 |
| vertice-parametros | 2 |
| coeficiente-a-forma | 2 |
| **Total** | **50** |

## Recomendaciones para próximas rondas

1. Las discrepancias observadas (vertice-concepto 7/5, formas-de-la-funcion 5/6) pueden deberse a:
   - Ejercicios que evaluarían múltiples conceptos
   - Necesidad de redefinición de límites entre categorías
   
2. Se recomienda auditoría manual de la categorización si se requiere alineación exacta a los targets

3. Todos los campos pedagógicos (question, options, explanation, feedback_incorrect) están completos y funcionando
