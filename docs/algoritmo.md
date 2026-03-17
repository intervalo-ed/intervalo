# Algoritmo de Progresión — Gradus

## Índice

1. [Motivación y diseño de alto nivel](#1-motivación-y-diseño-de-alto-nivel)
2. [Unidad de seguimiento: el Ítem](#2-unidad-de-seguimiento-el-ítem)
3. [Arquitectura Dual-Loop](#3-arquitectura-dual-loop)
4. [Loop Corto — Fase de Adquisición](#4-loop-corto--fase-de-adquisición)
5. [Loop Largo — Fase de Retención](#5-loop-largo--fase-de-retención)
6. [Calificación por respuesta](#6-calificación-por-respuesta)
7. [Construcción de la sesión](#7-construcción-de-la-sesión)
8. [Graduación y progresión de cinturones](#8-graduación-y-progresión-de-cinturones)
9. [Dificultad del ejercicio generado](#9-dificultad-del-ejercicio-generado)
10. [Parámetros de configuración](#10-parámetros-de-configuración)
11. [Ejemplo completo — estudiante promedio](#11-ejemplo-completo--estudiante-promedio)
12. [Ejemplo completo — estudiante curtido](#12-ejemplo-completo--estudiante-curtido)

---

## 1. Motivación y diseño de alto nivel

### El problema con SM-2 puro

SM-2 es un algoritmo diseñado para **retención a largo plazo**: aumenta los intervalos entre revisiones de forma exponencial. Funciona bien una vez que el material está adquirido, pero en la fase inicial de aprendizaje presenta un problema: un ítem visto por primera vez puede no volver a aparecer hasta el día siguiente, y la graduación tarda semanas.

Para Gradus, esto genera dos problemas concretos:

1. **Engagement temprano**: un estudiante nuevo que practica funciones lineales y no recibe señal de progreso en la primera semana abandona.
2. **Adquisición vs. retención**: la memoria de trabajo necesita repetición dentro de la misma sesión para consolidar; el espaciado importa más una vez que el concepto ya fue adquirido.

### La solución: Dual-Loop

El algoritmo de Gradus separa explícitamente dos fases con lógicas distintas:

```
┌──────────────────────────────────────────────────────────┐
│  LOOP CORTO (Adquisición)                                │
│  Intervalos fijos cortos: misma sesión → 24h → 72h       │
│  Repetición intra-sesión permitida                       │
│  Objetivo: consolidar el concepto en días                │
└────────────────────┬─────────────────────────────────────┘
                     │ GRADUACIÓN
                     ▼
┌──────────────────────────────────────────────────────────┐
│  LOOP LARGO (Retención)                                  │
│  SM-2 estándar: intervalos crecientes hasta 21 días      │
│  Sin repetición intra-sesión                             │
│  Objetivo: retención permanente con mínima carga         │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Unidad de seguimiento: el Ítem

El algoritmo gestiona **21 ítems independientes** por estudiante, uno por cada combinación de familia de función y tipo de habilidad:

```
7 familias × 3 habilidades = 21 ítems

Familias: Lineal, Cuadrática, Polinomial, Exponencial,
          Logarítmica, Trigonométrica, Racional

Habilidades: Reconocimiento Visual, Vocabulario, Identificación de Parámetros
```

Cada ítem tiene su propio estado y evoluciona de forma completamente independiente. Un estudiante puede tener "Lineal / Reconocimiento Visual" graduado mientras todavía está en paso 1 de "Lineal / Vocabulario".

### Estado del ítem

```python
@dataclass
class SM2ItemState:
    phase: Literal["learning", "review"]  # en qué loop está
    step_index: int        # paso actual en learning (0, 1, 2)
    ease_factor: float     # EF — solo relevante en review
    interval: int          # días hasta próxima revisión
    repetitions: int       # repeticiones consecutivas exitosas en review
    next_review: date      # cuándo mostrar de nuevo
    valid_reviews: int     # contador hacia graduación en review (legacy, puede eliminarse)
```

---

## 3. Arquitectura Dual-Loop

### Transición entre fases

Un ítem comienza siempre en `phase = "learning"`, `step_index = 0`. Transiciona a `phase = "review"` al completar el último paso de aprendizaje con calidad suficiente.

```
Ítem nuevo
    │
    ▼
[learning / step 0]  ──falla──▶  vuelve a step 0 (misma sesión)
    │
  éxito (quality ≥ 3)
    │
    ▼
[learning / step 1]  ──falla──▶  vuelve a step 0
    │
  éxito
    │
    ▼
[learning / step 2]  ──falla──▶  vuelve a step 1
    │
  éxito
    │
    ▼
[review]  ──SM-2──▶  intervalos crecientes (7, 14, 21 días)
```

### Manejo de fallos por fase

| Situación | Comportamiento |
|---|---|
| Fallo en step 0 | Reinsertar en la sesión actual (hasta `max_intra_session_reps` veces) |
| Fallo en step 1 | Volver a step 0, next_review = hoy |
| Fallo en step 2 | Volver a step 1, next_review = hoy + 1 día |
| Fallo en review (quality < 3) | Reinicia SM-2: interval = 1, repetitions = 0 |

---

## 4. Loop Corto — Fase de Adquisición

### Pasos de aprendizaje

Los `learning_steps` definen el intervalo entre cada paso (en días):

```
step 0 → interval: 0 días  (mismo día / misma sesión)
step 1 → interval: 1 día   (sesión siguiente)
step 2 → interval: 3 días  (pasado mañana o próxima sesión)
```

Un ítem en step 0 puede repetirse dentro de la misma sesión. Un ítem en step 1 o step 2 espera hasta la sesión del día correspondiente.

### Lógica de actualización en learning

```
Si quality >= 3 (éxito):
    Si step_index < último paso:
        step_index += 1
        next_review = hoy + learning_steps[step_index]
    Si step_index == último paso:
        phase = "review"
        ease_factor = ef_inicial (2.5)
        interval = review_initial_interval (7 días)
        next_review = hoy + interval

Si quality < 3 (fallo):
    paso_destino = max(0, step_index - 1)
    step_index = paso_destino
    next_review = hoy + learning_steps[paso_destino]
    Si paso_destino == 0:
        reinsertar en sesión actual
```

### Restricción intra-sesión

Para evitar feedback loops de memorización inmediata, un ítem en step 0 puede reaparecer en la sesión actual máximo `max_intra_session_reps` veces (por defecto: 2). Si ya alcanzó ese límite y sigue fallando, se pospone al día siguiente con step_index = 0.

---

## 5. Loop Largo — Fase de Retención

Una vez graduado, el ítem sigue el algoritmo SM-2 estándar adaptado:

### Actualización de estado en review

```
Si quality < 3:
    interval = 1
    repetitions = 0
    EF = max(ef_min_absoluto, EF - 0.8)

Si quality >= 3:
    Si repetitions == 0: interval = 1
    Si repetitions == 1: interval = 6
    Si repetitions >  1: interval = round(interval × EF)

    interval = min(interval, post_graduation_max_interval)  # techo: 21 días
    repetitions += 1
    EF = max(ef_min_absoluto, EF + 0.1 - (5 - quality) × (0.08 + (5 - quality) × 0.02))
```

### Progresión de intervalos típica (EF = 2.5)

```
Sesión 1: interval = 1  → next_review en 1 día
Sesión 2: interval = 6  → next_review en 6 días
Sesión 3: interval = 15 → next_review en 15 días (6 × 2.5)
Sesión 4: interval = 21 → cappado al techo de 21 días
```

En review no hay repetición intra-sesión. Un ítem de retención aparece una sola vez por sesión.

---

## 6. Calificación por respuesta

El sistema infiere una calificación de 0 a 5 combinando acierto y tiempo de respuesta. No se le pregunta al estudiante cuán seguro estuvo; el comportamiento habla por sí solo.

| Resultado | Tiempo | Calificación | Interpretación |
|---|---|---|---|
| Correcto | < 4 segundos | **5** | Fluente, sin dudar |
| Correcto | 4 – 8 segundos | **4** | Bien, con pequeña pausa |
| Correcto | > 8 segundos | **3** | Recordó con esfuerzo |
| Incorrecto | cualquiera | **1** | Fallo |

La calificación 0 y 2 no se usan actualmente. La calificación 3 es el umbral mínimo para que una respuesta cuente como éxito.

---

## 7. Construcción de la sesión

La sesión se construye en cuatro pasos en cada apertura del estudiante:

### Paso 1 — Recolectar ítems vencidos

```
learning items con next_review <= hoy     → priorizados
review items con next_review <= hoy       → ordenados por next_review ascendente
```

Los ítems de aprendizaje (learning) tienen prioridad sobre los de review, porque su ventana de repaso es más estrecha.

### Paso 2 — Ítems en step 0 para repetición intra-sesión

Los ítems en `step_index = 0` que aparecen en la sesión se marcan como candidatos a reinserción. Si el estudiante falla, se reintroducen al final de la cola de la sesión (respetando `max_intra_session_reps`).

### Paso 3 — Completar con contenido nuevo

Si hay menos de `min_items_before_new_content` ítems vencidos, el sistema incorpora ítems nuevos del cinturón actual del estudiante. El orden de introducción sigue la secuencia: Reconocimiento Visual → Vocabulario → Identificación de Parámetros para cada función del cinturón activo.

### Paso 4 — Limitar y reordenar

```
Cortar al máximo de ejercicios por sesión (15)

Garantizar distancia mínima entre ejercicios de la misma función:
    min_distance_same_function = 2
    (nunca dos ejercicios de "Cuadrática" consecutivos)
```

La restricción de distancia previene que el estudiante resuelva por contexto inmediato en lugar de por reconocimiento genuino.

---

## 8. Graduación y progresión de cinturones

### Graduación de un ítem

Un ítem se **gradúa** cuando completa el último paso del loop corto con `quality >= 3`. No existe un criterio de graduación adicional en el loop largo: una vez en review, el ítem está graduado de forma permanente.

Si el EF en review cae por debajo de `ef_min_for_valid_review` (2.5), el ítem puede ser marcado como "en riesgo" y priorizarse en la sesión, pero no regresa a learning.

### Rayas y promoción de cinturón

Cada ítem graduado otorga **una dimensión aprobada** para la función correspondiente:

```
3 dimensiones aprobadas para una función del cinturón actual
→ esa función está completamente dominada

Dominio de todas las funciones del cinturón actual
→ PROMOCIÓN al siguiente cinturón
```

Las rayas se otorgan cuando 2 de las 3 dimensiones de la función están aprobadas. La tercera otorga la promoción.

```
Estado             Reconocimiento   Vocabulario   Parámetros
─────────────────────────────────────────────────────────────
Sin rayas          —                —             —
Primera raya       ✓                —             —   (o cualquier 1 de 3)
Segunda raya       ✓                ✓             —   (o cualquier 2 de 3)
Promoción          ✓                ✓             ✓
```

### Caso especial: Cinturón Negro

La función Racional (cinturón negro) otorga hasta dos rayas sobre las dos dimensiones que el estudiante elija completar primero. La tercera dimensión queda como objetivo de maestría permanente sin promoción ulterior.

---

## 9. Dificultad del ejercicio generado

Antes de mostrar un ejercicio, el algoritmo lee el estado del ítem y selecciona el nivel de dificultad del generador:

| Condición | Dificultad | Descripción |
|---|---|---|
| Ítem en `learning`, step 0 | **Fácil** | Primer contacto con el concepto |
| Ítem en `learning`, step 1–2 | **Media** | Consolidando la habilidad |
| Ítem en `review`, EF < 1.8 | **Fácil** | Estudiante con dificultades persistentes |
| Ítem en `review`, EF 1.8–2.4 | **Media** | Progresión normal |
| Ítem en `review`, EF > 2.4 | **Difícil** | Dominio sólido |

Un estudiante experto con EF alto recibe únicamente ejercicios difíciles de forma natural, sin lógica adicional.

---

## 10. Parámetros de configuración

Todos los parámetros viven en `SM2Config` y pueden ajustarse sin modificar la lógica del algoritmo. Esto es crítico para A/B testing con datos reales.

| # | Parámetro | Valor por defecto | Impacto |
|---|---|---|---|
| 1 | `learning_steps` | `[0, 1, 3]` | Intervalos en días para cada paso del loop corto. `0` = misma sesión. Valores bajos aceleran la graduación; valores altos exigen más evidencia sostenida. |
| 2 | `max_intra_session_reps` | `2` | Máximo de reinserciones de un ítem en step 0 dentro de la misma sesión. Evita que un ítem difícil monopolice la sesión. |
| 3 | `quality_threshold_pass` | `3` | Calidad mínima para avanzar un paso. Por debajo = fallo. |
| 4 | `review_initial_interval` | `7` | Intervalo en días al entrar en review. Más alto = mayor separación desde el primer repaso post-graduación. |
| 5 | `post_graduation_max_interval` | `21` | Techo de intervalo en review. Evita que ítems de retención desaparezcan por demasiado tiempo. |
| 6 | `ef_initial` | `2.5` | EF al entrar en review. Asume competencia promedio al graduarse. |
| 7 | `ef_min_absolute` | `1.3` | Piso de EF. Evita que ítems muy difíciles aparezcan diariamente de forma indefinida. |
| 8 | `ef_min_for_valid_review` | `2.5` | EF mínimo para considerar que el dominio es sólido en review. |
| 9 | `response_time_threshold_fast` | `4.0` s | Por debajo → calificación 5. Define el umbral de fluidez. |
| 10 | `response_time_threshold_slow` | `8.0` s | Por encima → calificación 3. Define el umbral de recuerdo lento. |
| 11 | `max_exercises_per_session` | `15` | Techo de ejercicios por sesión (~5 minutos). |
| 12 | `min_items_before_new_content` | `5` | Si hay menos ítems vencidos, incorporar contenido nuevo. |
| 13 | `min_distance_same_function` | `2` | Distancia mínima entre ejercicios de la misma familia en una sesión. |

---

## 11. Ejemplo completo — estudiante promedio

**Contexto:** estudiante con base media en funciones lineales. Practica 3–4 sesiones por semana.

### Semana 1

| Día | Sesión | Ítem: Lineal / Reconocimiento | Estado |
|---|---|---|---|
| Lunes | 1 | Primera vez — step 0 | quality 4 → avanza a step 1 |
| Lunes | 1 | (no repite en la sesión — éxito) | next_review = martes |
| Martes | 2 | step 1 | quality 4 → avanza a step 2, next_review = viernes |
| Viernes | 3 | step 2 | quality 4 → **GRADUADO** → entra en review |
| Viernes | 3 | Próxima aparición en review: next_review = viernes + 7 días |

**Resultado:** primera graduación en 5 días corridos, 3 sesiones. Primera raya posible en semana 1.

### Semana 2 en adelante (review)

```
Semana 2: aparece 1 vez (interval = 7 días)
Semana 3: aparece 1 vez (interval = 7 días si EF < 2.5, o 15–21 días si EF ≥ 2.5)
Mes 2: aparece cada 21 días
```

---

## 12. Ejemplo completo — estudiante curtido

**Contexto:** estudiante con sólida base en funciones lineales. Responde rápido y correcto desde el primer intento.

| Día | Sesión | Ítem | quality | Resultado |
|---|---|---|---|---|
| Lunes | 1 | step 0 | 5 (< 4s, correcto) | → step 1, next_review mañana |
| Martes | 2 | step 1 | 5 | → step 2, next_review en 3 días |
| Viernes | 3 | step 2 | 5 | → **GRADUADO** |

**Resultado:** graduación en 5 días con 3 sesiones, idéntico al promedio pero con mayor EF inicial en review (puede empezar con interval más largo si se implementa EF dinámico en learning).

**Diferencia real:** el curtido no necesita repetición intra-sesión. El promedio puede necesitar 1–2 reinserciones en step 0 antes de consolidar. El curtido completa el camino sin fricciones.

---

*Documento técnico interno — Gradus. Última actualización: 2026-03-17.*
