# Dos-Fases

## Índice

1. [Diseño](#1-diseño)
2. [Ítem](#2-ítem)
3. [Arquitectura](#3-arquitectura)
4. [Entendimiento](#4-entendimiento)
5. [Retención](#5-retención)
6. [Calificación](#6-calificación)
7. [Sesión](#7-sesión)
8. [Cinturones](#8-cinturones)
9. [Dificultad](#9-dificultad)
10. [Parámetros](#10-parámetros)
11. [Ejemplo](#11-ejemplo)

---

# **1\. Diseño**

SM-2 es un algoritmo diseñado para retención a largo plazo: aumenta los intervalos entre revisiones de forma exponencial. Funciona bien una vez que el material está adquirido, pero en la fase inicial presenta un problema: un ítem visto por primera vez puede no volver a aparecer hasta el día siguiente, y la graduación tarda semanas.

Para Intervalo, esto genera dos problemas concretos:

1. **Engagement temprano**: un estudiante nuevo que no recibe señal de progreso en la primera semana abandona.
2. **Entendimiento vs. retención**: la memoria necesita repetición dentro de la misma sesión para consolidar; el espaciado importa más una vez que el concepto ya fue adquirido.

**2F** separa explícitamente dos fases con lógicas distintas: una fase de entendimiento con intervalos cortos y repetición intra-sesión, y una fase de retención basada en SM-2.

---

# **2\. Ítem**

El algoritmo gestiona ítems independientes por estudiante. Cada ítem representa la combinación de un tema de un cinturón y una habilidad:

```
Ítems por cinturón = N temas × 3 habilidades
```

Cada ítem tiene su propio estado y evoluciona de forma completamente independiente:

```python
@dataclass
class ItemState:
    phase: Literal["learning", "review"]  # en qué fase está
    step_index: int        # paso actual en entendimiento (0, 1, 2)
    ease_factor: float     # EF — solo relevante en retención
    interval: int          # días hasta próxima revisión
    repetitions: int       # repeticiones consecutivas exitosas en retención
    next_review: date      # cuándo mostrar de nuevo
```

---

# **3\. Arquitectura**

```
┌──────────────────────────────────────────────────────────┐
│  ADQUISICIÓN                                             │
│  Intervalos fijos cortos: misma sesión → 24h → 72h       │
│  Repetición intra-sesión permitida                       │
│  Objetivo: consolidar el concepto en días                │
└────────────────────┬─────────────────────────────────────┘
                     │ GRADUACIÓN
                     ▼
┌──────────────────────────────────────────────────────────┐
│  RETENCIÓN                                               │
│  SM-2 estándar: intervalos crecientes hasta 21 días      │
│  Sin repetición intra-sesión                             │
│  Objetivo: retención permanente con mínima carga         │
└──────────────────────────────────────────────────────────┘
```

Un ítem comienza siempre en `phase = "learning"`, `step_index = 0`. Transiciona a `phase = "review"` al completar el último paso con calidad suficiente:

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

| Situación | Comportamiento |
|---|---|
| Fallo en step 0 | Reinsertar en la sesión actual (hasta `max_intra_session_reps` veces) |
| Fallo en step 1 | Volver a step 0, next_review = hoy |
| Fallo en step 2 | Volver a step 1, next_review = hoy + 1 día |
| Fallo en review (quality < 3) | Reinicia SM-2: interval = 1, repetitions = 0 |

---

# **4\. Entendimiento**

Los `learning_steps` definen el intervalo entre cada paso en días:

```
step 0 → interval: 0 días  (mismo día / misma sesión)
step 1 → interval: 1 día
step 2 → interval: 3 días
```

Un ítem en step 0 puede repetirse dentro de la misma sesión. Un ítem en step 1 o step 2 espera hasta la sesión del día correspondiente.

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

Para evitar memorización inmediata, un ítem en step 0 puede reaparecer en la sesión actual máximo `max_intra_session_reps` veces. Si ya alcanzó ese límite y sigue fallando, se pospone al día siguiente con step_index = 0.

---

# **5\. Retención**

Una vez graduado, el ítem sigue SM-2 estándar:

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

Progresión típica con EF = 2.5:

```
Sesión 1: interval = 1  → next_review en 1 día
Sesión 2: interval = 6  → next_review en 6 días
Sesión 3: interval = 15 → next_review en 15 días
Sesión 4: interval = 21 → cappado al techo
```

En retención no hay repetición intra-sesión. Un ítem aparece una sola vez por sesión.

---

# **6\. Calificación**

El sistema infiere una calificación de 1 a 5 combinando acierto y tiempo de respuesta:

| Resultado | Tiempo | Calificación | Interpretación |
|---|---|---|---|
| Correcto | < 6 segundos | **5** | Fluente, sin dudar |
| Correcto | 6 – 12 segundos | **4** | Bien, con pequeña pausa |
| Correcto | > 12 segundos | **3** | Recordó con esfuerzo |
| Incorrecto | cualquiera | **1** | Fallo |

La calificación 3 es el umbral mínimo para que una respuesta cuente como éxito. Las calificaciones 0 y 2 no se usan.

---

# **7\. Sesión**

La sesión se construye en cuatro pasos en cada apertura:

**Paso 1 — Recolectar ítems vencidos**

```
learning items con next_review <= hoy     → priorizados
review items con next_review <= hoy       → ordenados por next_review ascendente
```

Los ítems en entendimiento tienen prioridad sobre los de retención, porque su ventana de repaso es más estrecha.

**Paso 2 — Marcar candidatos a reinserción**

Los ítems en `step_index = 0` se marcan como candidatos. Si el estudiante falla, se reintroducen al final de la cola (respetando `max_intra_session_reps`).

**Paso 3 — Completar con contenido nuevo**

Si hay menos de `min_items_before_new_content` ítems vencidos, el sistema incorpora ítems nuevos del cinturón activo. El orden de introducción sigue la secuencia de habilidades del cinturón (CLSF → LEXI → FORM para Blanco; GRAF → [habilidad de cálculo] → APLI para los siguientes) por cada tema.

**Paso 4 — Limitar y reordenar**

```
Cortar al máximo de ejercicios por sesión (12)

Garantizar distancia mínima entre ejercicios del mismo tema:
    min_distance_same_function = 2
```

La restricción de distancia previene que el estudiante resuelva por contexto inmediato en lugar de por reconocimiento genuino.

---

# **8\. Cinturones**

Los cinturones organizan el contenido en dominios matemáticos. Para los detalles de temas, habilidades y umbrales por cinturón ver [`mvp.md §9`](mvp.md#9-sistema-de-cinturones).

La mecánica es uniforme en todos los cinturones:

- **2 grados internos** basados en el conteo de ítems graduados.
- **Umbral de promoción**: al alcanzarlo, el sistema introduce ítems del siguiente cinturón aunque el actual no esté completo.
- **Maestría opcional**: los ítems entre el umbral de promoción y el total del cinturón no bloquean el avance.

```
Blanco (Funciones) → Azul (Límites) → Violeta (Derivadas) → Marrón (Integrales) → Negro (TBD)
```

---

# **9\. Dificultad**

Antes de mostrar un ejercicio, 2F lee el estado del ítem y selecciona el nivel de dificultad del generador:

| Condición | Dificultad |
|---|---|
| Entendimiento, step 0 | Fácil |
| Entendimiento, step 1–2 | Media |
| Retención, EF < 1.8 | Fácil |
| Retención, EF 1.8–2.4 | Media |
| Retención, EF > 2.4 | Difícil |

---

# **10\. Parámetros**

Todos los parámetros viven en `SM2Config` y pueden ajustarse sin modificar la lógica del algoritmo. Esto es crítico para A/B testing con datos reales.

| # | Parámetro | Default | Impacto |
|---|---|---|---|
| 1 | `learning_steps` | `[0, 1, 3]` | Intervalos en días para cada paso de entendimiento. `0` = misma sesión. |
| 2 | `max_intra_session_reps` | `2` | Máximo de reinserciones de un ítem en step 0 dentro de la misma sesión. |
| 3 | `quality_threshold_pass` | `3` | Calidad mínima para avanzar un paso. |
| 4 | `review_initial_interval` | `7` | Intervalo en días al entrar en retención. |
| 5 | `post_graduation_max_interval` | `21` | Techo de intervalo en retención. |
| 6 | `ef_initial` | `2.5` | EF al entrar en retención. |
| 7 | `ef_min_absolute` | `1.3` | Piso de EF. |
| 8 | `ef_min_for_valid_review` | `2.5` | EF mínimo para considerar dominio sólido. |
| 9 | `response_time_threshold_fast` | `6.0` s | Por debajo → calificación 5. |
| 10 | `response_time_threshold_slow` | `12.0` s | Por encima → calificación 3. |
| 11 | `max_exercises_per_session` | `12` | Techo de ejercicios por sesión. |
| 12 | `min_items_before_new_content` | `5` | Si hay menos ítems vencidos, incorporar contenido nuevo. |
| 13 | `min_distance_same_function` | `2` | Distancia mínima entre ejercicios del mismo tema en una sesión. |

---

# **11\. Ejemplo**

**Contexto:** estudiante con base media en funciones lineales. Practica 3–4 sesiones por semana.

| Día | Sesión | Ítem: Lineal / CLSF | Estado |
|---|---|---|---|
| Lunes | 1 | Primera vez — step 0 | quality 4 → avanza a step 1, next_review = martes |
| Martes | 2 | step 1 | quality 4 → avanza a step 2, next_review = viernes |
| Viernes | 3 | step 2 | quality 4 → **GRADUADO** → entra en retención, next_review = viernes + 7 días |

Primera graduación en 5 días corridos, 3 sesiones.

```
Semana 2: aparece 1 vez (interval = 7 días)
Semana 3: interval = 15–21 días según EF acumulado
Mes 2 en adelante: aparece cada 21 días
```
