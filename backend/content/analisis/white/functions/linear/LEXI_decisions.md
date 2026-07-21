# Decisiones, LEXI.json (topic: linear)

## Resumen de cambios (Ronda 2)

En esta ronda se agregó el campo `tags` a los 50 ejercicios existentes, sin modificar enunciados ni respuestas. La etiqueta asignada corresponde a la sub-familia temática del ejercicio según la distribución objetivo del `topic-context.md`.

## Distribución de tags - Plan cumplido

| Concepto | Slug | Target | Asignados |
|----------|------|:------:|:---------:|
| Identificación de fórmula (es/no es lineal, otras familias) | `identificacion-formula` | 10 | 10 |
| Dominio e imagen (natural o restringido) | `dominio-imagen` | 8 | 8 |
| Propiedades generales (visual, existencia de raíz, tasa de cambio, sin extremos, rectas por puntos) | `propiedades-generales` | 7 | 7 |
| Nombrar parámetros/vocabulario (pendiente, ordenada, constante, raíz) | `nombre-parametros` | 6 | 6 |
| Monotonía y signo de la pendiente | `monotonia-signo-pendiente` | 6 | 6 |
| Parámetros $m$/$b$ leídos en contexto cotidiano | `parametros-contexto` | 5 | 5 |
| Pendiente, cálculo directo | `pendiente-calculo` | 3 | 3 |
| Raíz, cálculo directo | `raiz-calculo` | 3 | 3 |
| Ordenada al origen, cálculo directo | `ordenada-calculo` | 2 | 2 |
| **Total** | | **50** | **50** |

## Notas de clasificación

### Identificación de fórmula (10)
- **Ex 0, 1**: Reconocimiento directo de funciones lineales vs otras familias (polinomios, exponenciales, logaritmos)
- **Ex 5**: Identificación de familia a partir de forma desordenada
- **Ex 20, 35-39**: Identificación de linealidad con diferentes notaciones (divisiones, productos, expansiones)
- **Ex 49**: Caracterización matemática abstracta de funciones lineales

### Dominio e imagen (8)
- **Ex 13-15**: Conceptos de dominio natural e imagen, incluyendo casos de $m \neq 0$ vs $m = 0$ (constantes)
- **Ex 23-24**: Diferencia entre dominio e imagen, con restricciones
- **Ex 40**: Exclusión de valores donde función no se define (dominio restringido)
- **Ex 47-48**: Cálculo de imagen sobre dominio restringido $[a, b]$

### Propiedades generales (7)
- **Ex 7-9**: Características visuales (recta), puntos especiales (raíz, ordenada al origen)
- **Ex 16-17**: Definición de raíz e interceptos con los ejes
- **Ex 41-42**: Ausencia de máximos/mínimos, monotonía global

### Nombres de parámetros (6)
- **Ex 2-3, 6**: Definición de pendiente, ordenada al origen, función constante
- **Ex 18-19**: Significado conceptual de pendiente (diferencia positiva vs negativa, variación)
- **Ex 44**: Diferencia entre rectas con igual pendiente pero distinta ordenada

### Monotonía y signo de pendiente (6)
- **Ex 4, 12**: Crecimiento/decrecimiento según signo de $m$
- **Ex 25-26**: Intervalos de crecimiento/decrecimiento
- **Ex 43**: Fórmula de raíz con verificación de monotonía
- **Ex 46**: Unicidad de recta por dos puntos, relación con pendiente

### Parámetros en contexto cotidiano (5)
- **Ex 30-34**: Lectura de pendiente y ordenada desde fórmulas con contexto real (taxi, plomero, abono, tanque, sueldo)

### Cálculos directos (9 total)
- **Pendiente (3)**: Ex 11, 21, 22 - Extracción del coeficiente de $x$ en forma canónica
- **Raíz (3)**: Ex 27, 28, 45 - Resolución de $f(x) = 0$
- **Ordenada (2)**: Ex 10, 29 - Evaluación en $x = 0$ o lectura del término independiente

## Cambios aplicados

- [x] Agregado campo `tags` con un solo slug por ejercicio
- [x] Sin modificación de enunciados, opciones, respuestas ni explicaciones
- [x] Verificación de distribución contra targets del `topic-context.md`
- [x] Todos los 50 ejercicios etiquetados

## Observaciones

- La distribución coincide exactamente con los targets del `topic-context.md`.
- No se detectaron ejercicios sin clasificar.
- La categoría "identificacion-formula" agrupa desde reconocimiento simple de formas hasta caracterización abstracta de linealidad, todos bajo el criterio de "identificar si pertenece a la familia lineal".
