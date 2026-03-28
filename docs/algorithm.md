# Algoritmo de Progresión — Intervalo

## Índice

1. [Motivación y diseño de alto nivel](#1-motivación-y-diseño-de-alto-nivel)
2. [Unidad de seguimiento: el Ítem](#2-unidad-de-seguimiento-el-ítem)
3. [Arquitectura Dual-Loop](#3-arquitectura-dual-loop)
4. [Loop Corto — Fase de Adquisición](#4-loop-corto--fase-de-adquisición)
5. [Loop Largo — Fase de Retención](#5-loop-largo--fase-de-retención)
6. [Calificación por respuesta](#6-calificación-por-respuesta)
7. [Construcción de la sesión](#7-construcción-de-la-sesión)
8. [Cinturones y progresión](#8-cinturones-y-progresión)
9. [Dificultad del ejercicio generado](#9-dificultad-del-ejercicio-generado)
10. [Parámetros de configuración](#10-parámetros-de-configuración)
11. [Ejemplo completo — estudiante promedio](#11-ejemplo-completo--estudiante-promedio)

---

## 1. Motivación y diseño de alto nivel

### El problema con SM-2 puro

SM-2 es un algoritmo diseñado para **retención a largo plazo**: aumenta los intervalos entre revisiones de forma exponencial. Funciona bien una vez que el material está adquirido, pero en la fase inicial de aprendizaje presenta un problema: un ítem visto por primera vez puede no volver a aparecer hasta el día siguiente, y la graduación tarda semanas.

Para Intervalo, esto genera dos problemas concretos:

1. **Engagement temprano**: un estudiante nuevo que practica funciones lineales y no recibe señal de progreso en la primera semana abandona.
2. **Adquisición vs. retención**: la memoria de trabajo necesita repetición dentro de la misma sesión para consolidar; el espaciado importa más una vez que el concepto ya fue adquirido.

### La solución: Dual-Loop

El algoritmo de Intervalo separa explícitamente dos fases con lógicas distintas:

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

El algoritmo gestiona ítems independientes por estudiante, organizados en **cinturones**. Cada ítem representa la combinación de un tema del cinturón y una habilidad.

```
Ítems por cinturón = N temas × 3 habilidades
```

Cada ítem tiene su propio estado y evoluciona de forma completamente independiente.

### Habilidades

Las habilidades son transversales a todos los cinturones. Cada una tiene un código de 4 letras en mayúscula:

| Código | Habilidad | Descripción |
|---|---|---|
| CLSF | Clasificación | Identifica y categoriza a partir de representaciones visuales o gráficas |
| LEXI | Léxico | Nombra y clasifica usando vocabulario matemático correcto |
| FORM | Formulación | Extrae y construye la expresión formal a partir de una representación |
| GRAF | Graficación | Interpreta el comportamiento de un concepto desde una gráfica |
| RESV | Resolución | Calcula y simplifica expresiones aplicando técnicas algebraicas |
| DERI | Derivación | Aplica reglas de derivación con precisión |
| INTG | Integración | Aplica técnicas de integración al tipo de expresión correcto |
| APLI | Aplicación | Usa el concepto del cinturón en problemas de contexto real o analítico |

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
| Correcto | < 6 segundos | **5** | Fluente, sin dudar |
| Correcto | 6 – 12 segundos | **4** | Bien, con pequeña pausa |
| Correcto | > 12 segundos | **3** | Recordó con esfuerzo |
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

Si hay menos de `min_items_before_new_content` ítems vencidos, el sistema incorpora ítems nuevos del cinturón actual del estudiante. El orden de introducción sigue la secuencia CLSF → LEXI → FORM (cinturón blanco) o GRAF → [habilidad de cálculo] → APLI (cinturones siguientes) para cada tema del cinturón activo.

### Paso 4 — Limitar y reordenar

```
Cortar al máximo de ejercicios por sesión (12)

Garantizar distancia mínima entre ejercicios del mismo tema:
    min_distance_same_function = 2
    (nunca dos ejercicios del mismo tema consecutivos)
```

La restricción de distancia previene que el estudiante resuelva por contexto inmediato en lugar de por reconocimiento genuino.

---

## 8. Cinturones y progresión

El sistema organiza el contenido en **cinturones**. Cada cinturón cubre un dominio matemático del curso de cálculo univariable y contiene un conjunto de temas evaluados a través de tres habilidades.

Todos los cinturones comparten la misma mecánica de progresión:

- **2 grados internos (rayas)** basados en el conteo total de ítems graduados del cinturón.
- **Umbral de promoción**: al alcanzarlo, el sistema introduce ítems del siguiente cinturón en la sesión aunque el actual no esté completo.
- **Maestría opcional**: los ítems restantes entre el umbral de promoción y el total del cinturón no bloquean el avance.

```
Blanco (Funciones) → Azul (Límites) → Violeta (Derivadas) → Marrón (Integrales) → Negro (TBD)
```

---

### Cinturón Blanco — Funciones

Cubre el reconocimiento, vocabulario y formulación de las familias de funciones fundamentales.

**Temas (7):** Lineal, Cuadrática, Polinomial, Exponencial, Logarítmica, Trigonométrica, Racional

| Código | Habilidad | Descripción |
|---|---|---|
| CLSF | Clasificación | Identifica la familia de función a partir de su gráfica |
| LEXI | Léxico | Nombra y clasifica usando vocabulario matemático correcto |
| FORM | Formulación | Extrae parámetros clave y construye la expresión de la ecuación |

**Total ítems:** 7 × 3 = 21

| Grado | Ítems graduados | Efecto |
|---|---|---|
| Primera raya | 3 | Progreso visible |
| Segunda raya | 9 | Progreso visible |
| Promoción a Azul | 18 | Desbloquea cinturón Azul |
| Maestría | 21 | Opcional, sin efecto en progresión |

---

### Cinturón Azul — Límites

Cubre el concepto de límite, continuidad y técnicas algebraicas para su cálculo.

**Temas (6):** Límites algebraicos, Límites laterales, Límites al infinito, Continuidad, Formas indeterminadas, L'Hôpital

| Código | Habilidad | Descripción |
|---|---|---|
| GRAF | Graficación | Interpreta límites y comportamiento de funciones desde una gráfica |
| RESV | Resolución | Calcula límites aplicando técnicas algebraicas |
| CLSF | Clasificación | Identifica tipos de discontinuidad y reconoce formas indeterminadas |

**Total ítems:** 6 × 3 = 18

| Grado | Ítems graduados | Efecto |
|---|---|---|
| Primera raya | 2 | Progreso visible |
| Segunda raya | 6 | Progreso visible |
| Promoción | 15 | Desbloquea cinturón Violeta |
| Maestría | 18 | Opcional, sin efecto en progresión |

---

### Cinturón Violeta — Derivadas

Cubre la definición, reglas de derivación y aplicaciones de la derivada.

**Temas (6):** Definición como límite, Reglas básicas, Producto y cociente, Regla de la cadena, Funciones especiales (trig/exp/log), Derivadas implícitas

| Código | Habilidad | Descripción |
|---|---|---|
| GRAF | Graficación | Lee la derivada geométricamente: tangente, monotonía y concavidad |
| DERI | Derivación | Aplica reglas de derivación con precisión |
| APLI | Aplicación | Usa derivadas en optimización, tasas de cambio y análisis de curvas |

**Total ítems:** 6 × 3 = 18

| Grado | Ítems graduados | Efecto |
|---|---|---|
| Primera raya | 2 | Progreso visible |
| Segunda raya | 6 | Progreso visible |
| Promoción | 15 | Desbloquea cinturón Marrón |
| Maestría | 18 | Opcional, sin efecto en progresión |

---

### Cinturón Marrón — Integrales

Cubre la integral definida e indefinida, el Teorema Fundamental del Cálculo y las principales técnicas de integración.

**Temas (5):** Integral indefinida, Teorema Fundamental del Cálculo, Sustitución, Integración por partes, Integrales impropias

| Código | Habilidad | Descripción |
|---|---|---|
| GRAF | Graficación | Interpreta la integral como área acumulada bajo la curva |
| INTG | Integración | Aplica técnicas de integración al tipo de expresión correcto |
| APLI | Aplicación | Resuelve problemas de área, acumulación y volumen de revolución |

**Total ítems:** 5 × 3 = 15

| Grado | Ítems graduados | Efecto |
|---|---|---|
| Primera raya | 2 | Progreso visible |
| Segunda raya | 5 | Progreso visible |
| Promoción | 12 | Desbloquea cinturón Negro |
| Maestría | 15 | Opcional, sin efecto en progresión |

---

### Cinturón Negro — TBD

Cubre los temas restantes del curso de cálculo univariable.

| Código | Habilidad | Descripción |
|---|---|---|
| TBD | TBD | TBD |

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
| 1 | `learning_steps` | `[0, 1, 3]` | Intervalos en días para cada paso del loop corto. `0` = misma sesión. |
| 2 | `max_intra_session_reps` | `2` | Máximo de reinserciones de un ítem en step 0 dentro de la misma sesión. |
| 3 | `quality_threshold_pass` | `3` | Calidad mínima para avanzar un paso. Por debajo = fallo. |
| 4 | `review_initial_interval` | `7` | Intervalo en días al entrar en review. |
| 5 | `post_graduation_max_interval` | `21` | Techo de intervalo en review. |
| 6 | `ef_initial` | `2.5` | EF al entrar en review. |
| 7 | `ef_min_absolute` | `1.3` | Piso de EF. |
| 8 | `ef_min_for_valid_review` | `2.5` | EF mínimo para considerar que el dominio es sólido en review. |
| 9 | `response_time_threshold_fast` | `6.0` s | Por debajo → calificación 5. |
| 10 | `response_time_threshold_slow` | `12.0` s | Por encima → calificación 3. |
| 11 | `max_exercises_per_session` | `12` | Techo de ejercicios por sesión. |
| 12 | `min_items_before_new_content` | `5` | Si hay menos ítems vencidos, incorporar contenido nuevo. |
| 13 | `min_distance_same_function` | `2` | Distancia mínima entre ejercicios del mismo tema en una sesión. |

---

## 11. Ejemplo completo — estudiante promedio

**Contexto:** estudiante con base media en funciones lineales. Practica 3–4 sesiones por semana.

### Semana 1

| Día | Sesión | Ítem: Lineal / CLSF | Estado |
|---|---|---|---|
| Lunes | 1 | Primera vez — step 0 | quality 4 → avanza a step 1 |
| Lunes | 1 | (no repite en la sesión — éxito) | next_review = martes |
| Martes | 2 | step 1 | quality 4 → avanza a step 2, next_review = viernes |
| Viernes | 3 | step 2 | quality 4 → **GRADUADO** → entra en review |
| Viernes | 3 | Próxima aparición en review: next_review = viernes + 7 días |

**Resultado:** primera graduación en 5 días corridos, 3 sesiones.

### Semana 2 en adelante (review)

```
Semana 2: aparece 1 vez (interval = 7 días)
Semana 3: aparece 1 vez (interval = 7 días si EF < 2.5, o 15–21 días si EF ≥ 2.5)
Mes 2: aparece cada 21 días
```
