# Decisiones, FORM.json (topic: linear)

## Resumen de cambios (Ronda 2)

En esta ronda se agregó el campo `tags` a los 50 ejercicios existentes, sin modificar enunciados ni respuestas. La etiqueta asignada corresponde a la sub-familia temática del ejercicio según la distribución objetivo del `topic-context.md`.

## Distribución de tags - Plan cumplido

| Concepto | Slug | Target | Asignados |
|----------|------|:------:|:---------:|
| Armar fórmula desde situación cotidiana (costo, tanque, deuda, etc.) | `armar-formula-cotidiano` | 20 | 20 |
| Pendiente, cálculo directo | `pendiente-calculo` | 4 | 4 |
| Raíz, cálculo directo | `raiz-calculo` | 4 | 4 |
| Gráfico → fórmula | `grafico-a-formula` | 4 | 4 |
| Armar fórmula dados $m$ y $b$ | `armar-formula-mb` | 3 | 3 |
| Armar fórmula dados uno o dos puntos | `armar-formula-puntos` | 3 | 3 |
| Evaluar $f(\text{valor})$, abstracto o en contexto | `evaluar-f` | 3 | 3 |
| Leer un parámetro ($m$ o $b$) ya en contexto | `leer-parametro-contexto` | 2 | 2 |
| Ordenada al origen, cálculo directo | `ordenada-calculo` | 2 | 2 |
| Pendiente interpretada como tasa descrita en palabras | `pendiente-concepto-tasa` | 2 | 2 |
| Resolver la ecuación ($f(x) = k$) | `resolver-ecuacion` | 2 | 2 |
| Propiedades generales (identificar la decreciente) | `propiedades-generales` | 1 | 1 |
| **Total** | | **50** | **50** |

## Notas de clasificación

### Pendiente, cálculo directo (4)
- **Ex 0, 2, 3**: Extracción directa del coeficiente de $x$ desde $f(x) = mx + b$ 
- **Ex 35**: Mismo cálculo con notación "La función es..."

### Ordenada al origen, cálculo directo (2)
- **Ex 1, 36**: Lectura directa del término independiente desde forma canónica

### Armar fórmula dados $m$ y $b$ (3)
- **Ex 4, 5**: Dada pendiente y ordenada explícitamente, escribir ecuación
- **Ex 6**: Dado punto de intercepto $(0, b)$ y pendiente, escribir ecuación

### Raíz, cálculo directo (4)
- **Ex 7, 8, 9**: Resolución de $f(x) = 0$ desde fórmula dada
- **Ex 38**: Mismo, con notación alternativa del enunciado

### Gráfico → fórmula (4)
- **Ex 10-13**: Lectura de fórmula a partir de gráfico (lectura de puntos, pendiente, interceptos)

### Armar fórmula desde dos puntos (3)
- **Ex 14**: Dado punto $(0, 0)$ y tasa de cambio ("sube 3 por cada 1"), armar ecuación
- **Ex 44, 46**: Dados dos puntos $(x_1, y_1)$ y $(x_2, y_2)$, armar ecuación

### Pendiente como tasa/concepto (2)
- **Ex 15**: Calcular pendiente de "recta que sube 4 unidades por cada 2 en $x$" → ratio rise/run
- **Ex 43**: Dada descripción de parámetros $m=2, b=3$, armar ecuación (enfatiza comprensión de parámetros como conceptos)

### Armar fórmula desde contexto cotidiano (20)
- **Ex 16-19**: Problemas de tarifa (taxi, plomero, tanque, deuda) con estructura fija + variable
- **Ex 20-34**: Continuación de contextos cotidianos (taxi, gasista, tanque, deuda, empleado, luz, ahorro, bicicleta, temperatura, transporte, internet, caminante, planta, moto, descuento, sin dinero)
- **Ex 49**: Tanque que pierde agua a tasa constante (contexto de reducción)
- **Nota**: Estas son las situaciones clave que enseñan "extraer $m$ como tasa de cambio y $b$ como valor inicial" desde narrativa sin fórmula

### Leer parámetro en contexto (2)
- **Ex 37**: Dado "$C(k) = 700 + 180k$", extraer qué representa la tarifa de \$180 por km
- **Ex 41**: Dado "$C(h) = 300 + 250h$", extraer qué representa el \$250 por hora

### Evaluar función (3)
- **Ex 39**: $f(x) = 5 - x$, calcular $f(3)$
- **Ex 45**: $f(x) = -4x + 12$, calcular $f(-1)$
- **Ex 48**: Contexto "$C(k) = 700 + 300k$", calcular costo en 3 km (evaluación $C(3)$)

### Resolver ecuación (2)
- **Ex 40**: Sueldo $S(v) = 1200 + 80v$, resolver $S(v) = 2000$
- **Ex 47**: $f(x) = 3x - 6$, resolver $f(x) = 9$

### Propiedades generales (1)
- **Ex 42**: Identificar cuál de varios $f(x)$ es decreciente (requiere evaluar signo de $m$)

## Cambios aplicados

- [x] Agregado campo `tags` con un solo slug por ejercicio
- [x] Sin modificación de enunciados, opciones, respuestas ni explicaciones
- [x] Verificación de distribución contra targets del `topic-context.md`
- [x] Todos los 50 ejercicios etiquetados

## Observaciones

- La distribución coincide exactamente con los targets del `topic-context.md`.
- Las 20 ejercicios de "armar-formula-cotidiano" cubren la variedad de contextos (economía, física, tecnología) para generalización del aprendizaje.
- Las 2 ejercicios de "pendiente-concepto-tasa" enfatizan la interpretación de pendiente como tasa de cambio (una abstracta via rise/run, otra desde parámetros descritos).
- Las transiciones entre categorías son claras: leer parámetro de fórmula existente ≠ armar fórmula desde situación.
