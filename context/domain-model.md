# Domain model

Fuente de verdad: `algorithm/` (paquete Python puro, sin dependencia de DB) para el algoritmo de repetición espaciada, y `backend/models.py` (SQLAlchemy) para la persistencia. Todos los valores de esta página están copiados directo de esos archivos — si algo no coincide con lo que ves en el código, confiá en el código y actualizá esto.

## Entidades (`backend/models.py`)

| Modelo | Propósito |
|---|---|
| `User` | Identidad (ligada a Clerk vía `clerk_user_id`), `total_xp`, preferencias de notificación, racha (`streak_days`/`streak_last_date`), badges de emoji desbloqueados, estado de opt-out de emails. |
| `Course` | Un curso/materia (`slug`, `name`, `description`). Hoy: `analisis`, `probabilidad`, `algebra`. |
| `Enrollment` | Join usuario↔curso, con metadata de onboarding (universidad, carrera, motivación) — es la fuente de la segmentación por universidad que alimenta el ranking. |
| `CourseProgress` | Config de progreso por (usuario, curso): `active_cap` (tope de ítems en aprendizaje simultáneo), `session_size` (tamaño de sesión de repaso), `iteration` (se incrementa al reiniciar el curso). Fila lazy — se crea la primera vez que hace falta. |
| `UnitState` | El estado SM-2 en vivo por `(user, course, belt, topic, exercise_type)` — la tabla central del algoritmo. `is_catchup` = unidad creada por detrás del frontier ya desbloqueado (no cuenta para maestría/belt). `suspended` = tema oculto por el usuario desde el editor (reversible). |
| `UnitStateArchive` | Snapshot de `UnitState` al reiniciar un curso, tageada por `iteration` — así `unit_states` queda limpia con solo la iteración vigente sin perder historial. |
| `ItemExerciseCycle` | Ejercicios ya servidos en el ciclo vigente de un ítem `(user, course, belt, topic, exercise_type)` — `served_external_ids` es una lista JSON de `Exercise.external_id`. Garantiza que no se repita un ejercicio hasta agotar todos los del ítem: se vacía cuando el ciclo se completa, o al reiniciar el curso (`reset_course`). |
| `Session` | Una sesión de práctica. `mode` es `"main"` (sesión de Repaso, gateada por día — ver más abajo) o `"practice"` (Práctica libre). |
| `Answer` | Un intento de ejercicio dentro de una sesión. `xp_base` (pre-multiplicador de racha) vs `xp_earned` (post-multiplicador) — la diferencia es lo que se muestra como "bonus por racha" en el resumen. |
| `Exercise` | Banco de preguntas, scoped por `(course, belt, topic, exercise_type)`. Opción múltiple (`option_a..d`, `correct_index`), gráfico opcional (`graph_fn/view/shade/free_aspect`, renderizado con Mafs), `reviewed` (flag editorial). |
| `BeltInfo` | Headline/descripción por `(course, belt)`, mostrado en la UI. |
| `Feedback` | Feedback libre desde ajustes (`categoria`: error/idea/comentario). |
| `ExerciseFeedback` | Micro-encuesta post-ejercicio (dificultad/utilidad de la explicación) + reportes de contenido, keyed por `exercise_external_id` (no por el slot de sesión) para agregar entre sesiones/usuarios. `answered_at IS NULL` = impresión mostrada pero no respondida (skip). |
| `PushSubscription` | Suscripción Web Push (`endpoint`/`p256dh`/`auth`) por `(user, course)`. |
| `NotificationSend` | Historial append-only de push enviados: una fila por usuario por envío (no por dispositivo), con `category`/`variant_key` del copy elegido (ver `notification_copy.py`), el `title`/`body` renderizados y `opened_at`, que se completa cuando el usuario clickea la notificación (`notificationclick` del service worker → beacon a `main.py`, idempotente: gana el primer click). Permite medir efectividad por categoría/variante; distinto de `User.notify_last_*`, que solo guarda el último estado para el guard diario de idempotencia. |

## Estructura de contenido: belt → unit → topic

Definida en `backend/content/<course_slug>/course.json`, cargada por `algorithm/domain.py::load_belt_catalogs`. Jerarquía:

- **Belt** (`algorithm/domain.py::Belt`): `white`, `blue`, `violet`, `brown` (más `black`, histórico, sin curso activo).
- **Unit**: bloque estructural de topics dentro de un belt (un curso puede tener 1 unit por belt, como `analisis`, o varios topics sueltos envueltos en una unit sintética, como `probabilidad`).
- **Topic**: un tema puntual dentro de una unit.
- **`UnitKey`** (`belt, topic, exercise_type`): la unidad real de estado SR — el trío que identifica una fila en `unit_states`. No confundir con `Unit` (estructura de contenido): el nombre colisiona por razones históricas.

## Algoritmo SM-2 (`algorithm/`)

### Configuración (`algorithm/config.py::SM2Config`)

```
learning_steps = [0, 1, 2]        # días: hoy, mañana, pasado mañana
max_intra_session_reps = 2
quality_threshold_pass = 3
review_initial_interval = 7        # días, al graduar de aprendizaje
post_graduation_max_interval_days = 30
ef_initial = 2.5
ef_min_absolute = 1.3
review_fast_seconds = 10.0
review_medium_seconds = 30.0
max_session_exercises = 8
min_distance_same_topic = 2
```

### Dos fases

**`learning`** (`algorithm/sm2.py::_update_learning`): solo avanza de paso con acierto al **primer intento** (quality ≥ 3). Cualquier fallo reinicia al paso 0 (mismo día) — hay que encadenar 3 aciertos limpios seguidos para graduar. Al completar los 3 pasos, la unidad pasa a `review` con `ease_factor = 2.5`, `interval = 7` días.

**`review`** (`algorithm/sm2.py::_update_review`): SM-2 clásico. El ease factor se ajusta según la calidad (`ef += 0.1 - (5-q)·(0.08 + (5-q)·0.02)`, piso `1.3`). Si `quality < 3` (pifió): el intervalo vuelve a 0 y se repite el mismo día — **no vuelve a `learning`**, sigue en `review` con intervalo recalculado. Si acierta: `interval = min(round(interval_anterior_o_1 × ef), 30)` días.

### Cálculo de calidad (`algorithm/scoring.py`)

- **Por intentos** (`quality_from_attempts`, fase learning y primer intento de review): 1er intento → 5, 2do → 4, 3ro → 3, 4to (por descarte, con 4 opciones) → 1 (fail).
- **Por tiempo de respuesta** (`quality_from_time`, solo fase review, solo si acertó al primer intento): `<10s` → 5, `<30s` → 4, resto → 3.

### Gate de sesión diaria (`session_store.py::create_session_db`)

**No es "una sesión de Repaso por día" a secas.** La regla real: el usuario puede arrancar tantas sesiones de Repaso (`mode="main"`) como quiera **mientras le queden ítems pendientes (vencidos)**. El gate de 1/día solo se activa una vez que no le queda nada pendiente — recién ahí, si intenta arrancar otra, el backend rechaza con "Ya completaste tus repasos de hoy. Volvé mañana." (`DailySessionLimitError`). En la práctica esto significa: si tiene 20 ítems vencidos y la sesión es de 8, puede encadenar varias sesiones seguidas hasta vaciar la cola; recién al agotarla queda bloqueado hasta el día siguiente.

### Construcción de sesión (`algorithm/session.py::build_session`)

1. Candidatos: unidades nuevas (no intentadas, en `learning`) o vencidas (`next_review <= hoy`).
2. Cap duro en `max_session_exercises` (8) — el resto queda para el día siguiente.
3. Se intercalan para respetar `min_distance_same_topic` (2): dos ejercicios del mismo topic nunca quedan más cerca que esa distancia en la sesión.

El desbloqueo de topics nuevos **no** pasa por acá: lo maneja `session_store.py::_ensure_active_units`, que mantiene el frontier según el `active_cap` del usuario.

### Maestría y graduación (`algorithm/graduation.py`)

- Una unidad está "dominada" cuando `phase == "review"`.
- Un **topic** está dominado cuando **todos** sus `exercise_type` están en `review` (`is_topic_mastered`, la única función del módulo). Es lo que dispara el desbloqueo de units nuevas.
- El estado de un **belt** no se calcula en el backend: el front lo deriva de `topic_states` (`web/src/lib/catalog/stats.ts`).

Última verificación: 2026-08-11
