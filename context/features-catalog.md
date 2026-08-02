# Features catalog

Inventario pantalla por pantalla. Rutas relativas a `web/src/app/`. Grupo `(app)` = shell autenticado con tab bar.

## Dashboard / Home (`dashboard-entry.tsx`, ruta `/`)

Pantalla principal. Selector de curso (`CourseSwitcher`, entre `analisis`/`probabilidad`/`algebra`), grilla de belts mostrando progreso por unidad (`BeltGrid`), CTAs "Repasar"/"Practicar" que arrancan una sesión (`useStartSession`). XP y nivel del usuario, indicador de racha.

**Editor de curso inline**: desde el dashboard se puede entrar en modo edición para suspender/reactivar topics, ajustar `active_cap`/`session_size` (stepper con debounce), y reiniciar el curso (con confirmación — botón de reset en rojo, guardar en verde; reiniciar incrementa `iteration` y archiva el `UnitState` actual en `UnitStateArchive`).

Transición deliberada antes de entrar a una sesión: fade-out de 200ms + delay forzado de 500ms, para que el prefetch de la sesión siempre resuelva antes de mostrar cualquier loading state.

## Sesión — runner (`session/[sessionId]/session-runner.tsx`)

El loop central de ejercicios. Tarjeta swipeable (Framer Motion, `drag="x"`, elástico, con snap-back) para pasar entre ejercicios. Grilla de opciones 2×2 solo si hay exactamente 4 opciones y todas ≤35 caracteres; si no, lista apilada (regla espejada en `backend/content/authoring-context.md` del lado de contenido). Trackea intentos por ítem (`wrongOptions`) para alimentar `quality_from_attempts`.

Micro-encuesta post-ejercicio (canales A/B/C — dificultad, utilidad de la explicación "¿Por qué?", reporte de contenido): se dispara como una slide intermedia con la misma mecánica de interacción que un ejercicio (seleccionar → Continuar → banner verde de agradecimiento + sonido), gateada por `feedback_survey.py` (caps anti-fatiga: máx 1 por sesión, nunca 1er/último ejercicio, alternancia entre sesiones, pausa tras 3 skips seguidos). Deliberadamente **sin XP** — el motor es el reconocimiento ("esto ayuda a elegir mejor qué mostrarte"), no la recompensa.

## Resumen de sesión (`session/[sessionId]/summary/`)

XP ganada (con el bonus por racha separado), confetti con los colores de belt (`BELT_VIVID_COLORS`). No hay nivel: el backend calcula uno (`algorithm/xp.py::level_progress`) pero no se muestra en ningún lado del frontend hoy — no asumir que existe UI de nivel.

## Práctica (`practice/`)

Volumen libre e ilimitado a elección del usuario, sin gate diario, XP plano y bajo (ver [gamification.md](gamification.md)) para que no sea farmeable, pero sí escala con el multiplicador de racha diaria.

## Test (`test/`)

Pantalla de configuración estilo examen, flujo separado de Repaso/Práctica.

## Leaderboard (`leaderboard/`)

Ranking global y **por universidad** — ver [gamification.md](gamification.md), es el objetivo de retención de largo plazo del producto, no una pantalla secundaria.

## Perfil (`profile/`)

Edición de nombre/username, configuración de notificaciones (hora local en pasos de 15 min + timezone), árbol de badges de emoji (desbloqueables, se pueden "vestir" para mostrar en el ranking), flujo de feedback libre.

## Onboarding (`onboarding/`)

Intake de curso/carrera/universidad/motivación (los datos de universidad son los que alimentan directamente el ranking universitario y la segmentación de notificaciones), secuencia animada de colores de belt, termina en `onboarding/complete` con prompt de instalación PWA.

## Misceláneo

- Splash animado con colores de belt al cargar (`splash-context.tsx`/`splash-gate.tsx`).
- Tab bar / shell (`app-chrome.tsx`).
- PWA: manifest, splash screens iOS generados por script.

Última verificación: 2026-08-01
