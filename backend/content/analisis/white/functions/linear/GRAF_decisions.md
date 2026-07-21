# Decisiones, GRAF.json (topic: linear)

## Resumen de cambios (Ronda 2)

En esta ronda se agregó el campo `tags` a los 50 ejercicios existentes, sin modificar enunciados, gráficos ni respuestas. La etiqueta asignada corresponde a la sub-familia temática del ejercicio según la distribución objetivo del `topic-context.md`.

## Distribución de tags - Plan cumplido

| Concepto | Slug | Target | Asignados |
|----------|------|:------:|:---------:|
| Pendiente como tasa (cuánto cambia por unidad, incluyendo $m=0$) | `pendiente-tasa` | 9 | 9 |
| Pendiente, diferencia entre dos puntos leídos | `pendiente-diferencia` | 9 | 9 |
| Ordenada al origen, qué representa el corte con el eje Y | `ordenada-origen-concepto` | 8 | 8 |
| Raíz/agotamiento (cuándo llega a cero) | `raiz-agotamiento` | 8 | 8 |
| Lectura de $y$ dado un $x$ | `lectura-y-dado-x` | 8 | 8 |
| Lectura de $x$ dado un $y$ (≠ 0) | `lectura-x-dado-y` | 8 | 8 |
| **Total** | | **50** | **50** |

## Notas de clasificación

### Ordenada al origen, concepto (8)
- **Ex 0-1**: Contexto de tarifa fija (remis, plomero): "¿Qué representa donde la recta toca el eje Y?"
- **Ex 4**: Electricidad: costo fijo vs variable
- **Ex 11-13**: Servicios (electricista, suscripción, bicicletas): interpretación del corte vertical
- **Ex 15-16**: App y música: "¿Qué significa el abono fijo?"
- **Patrón**: El valor $f(0) = b$ representa el costo/cantidad inicial, la "bajada de bandera"

### Raíz / agotamiento (8)
- **Ex 2-3**: Datos y stock: "¿En qué día llega a cero?"
- **Ex 6**: Bidón de agua: "¿Cuándo se agota?"
- **Ex 14**: Tarjeta prepaga: "¿En qué día se termina?"
- **Ex 17-18**: Tanque y vela encendida: "¿Cuándo se acaba?"
- **Ex 22**: Bidón nuevamente: ubicación en contexto ligeramente distinto
- **Ex 43**: Cartucho de tinta: "¿Cuándo se termina?"
- **Patrón**: Encontrar $x$ tal que $f(x) = 0$ (dónde cruza el eje X), interpretado como "agotamiento"

### Lectura de $y$ dado $x$ (8)
- **Ex 5**: Viaje: "¿Cuál es el tiempo total para $n$ estaciones?"
- **Ex 7-8**: Puntaje y temperatura: evaluar en un punto específico
- **Ex 10**: Kilómetros recorridos en cierto tiempo
- **Ex 20**: Carga de batería en cierto tiempo
- **Ex 24**: Factura de internet para cierto uso
- **Ex 28**: Altura de planta en cierta semana
- **Ex 36**: Puntos de fidelidad después de cierto número de visitas
- **Patrón**: Lectura vertical: dado $x$ sobre el gráfico, encontrar $y$

### Lectura de $x$ dado $y$ (8)
- **Ex 9**: Saldo de cuenta: "¿En qué semana alcanza un cierto valor?"
- **Ex 19**: Saldo nuevamente, contexto distinto
- **Ex 21-23**: Cámara frigorífica, agua en bidón, entradas para recital: "¿Cuándo llega a cierto nivel?"
- **Ex 25-26**: Internet y gimnasio: "¿Cuándo el costo alcanza X?"
- **Ex 27**: Tanque de agua: "¿En cuántas horas baja a cierto nivel?"
- **Ex 29**: Distancia en caminata: "¿En cuántas horas llegó a X km?"
- **Patrón**: Lectura horizontal: dado $y$, encontrar el $x$ correspondiente

### Pendiente como tasa de cambio (9)
- **Ex 30-31**: Gotera y sala con termostato: "¿Cuánta variación por unidad de tiempo?"
- **Ex 32**: Lago: "¿Cuántos metros por día sube/baja?"
- **Ex 33-35**: Pileta, nieve, florero: "¿Cuánto cambia por unidad?"
- **Ex 37**: Datos de plan: "¿Cuántos GB se consumen por día?"
- **Ex 39**: Capítulos leídos: "¿Cuántos capítulos por día?"
- **Ex 42**: Reciclaje: "¿Cuántos kilos acumulados por unidad de tiempo?"
- **Patrón**: La pregunta enfatiza "cuánto" o "qué ritmo" → calcular $\frac{\Delta y}{\Delta x}$ directamente como pendiente

### Pendiente por diferencia de dos puntos (9)
- **Ex 38**: Avión en crucero: "¿Cuál es el cambio de altitud en cierto intervalo?"
- **Ex 40-41**: Enredadera y ejercicios restantes: lectura de dos puntos del gráfico, calcular cambio
- **Ex 44-49**: Socios, galletas, tanque, cuenta, capítulos, fotocopias: todos piden calcular pendiente leyendo dos puntos de coordenadas en el gráfico
- **Patrón**: La pregunta pide "¿cuál es la pendiente?" o información equivalente; se resuelve seleccionando dos puntos legibles en el gráfico y calculando $m = \frac{y_2 - y_1}{x_2 - x_1}$

## Cambios aplicados

- [x] Agregado campo `tags` con un solo slug por ejercicio
- [x] Sin modificación de enunciados, gráficos, opciones, respuestas ni explicaciones
- [x] Verificación de distribución contra targets del `topic-context.md`
- [x] Todos los 50 ejercicios etiquetados

## Observaciones

- La distribución coincide exactamente con los targets del `topic-context.md`.
- GRAF es el skill que mejor mantiene coherencia de estructura y redacción (ver topic-context: "GRAF es la referencia de estilo"). Los ejercicios usan contextos variados pero preguntas claras.
- Las 2 categorías de pendiente (`pendiente-tasa` vs `pendiente-diferencia`) reflejan dos enfoques pedagógicos:
  - **pendiente-tasa**: Énfasis en la interpretación "cuánto cambia por unidad" (tasa conceptual)
  - **pendiente-diferencia**: Énfasis en el procedimiento "lea dos puntos y calcule la diferencia" (procedural)
- Las lecturas de puntos (`lectura-y-dado-x` y `lectura-x-dado-y`) son simétricas: 8 cada una.
- El agotamiento/raíz es prominente (8 ejercicios) porque es el concepto más práctico en los contextos cotidianos elegidos (datos, stocks, líquidos, baterías, tarjetas, velas, tintas).
