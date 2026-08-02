# Gamification

Fuente de verdad: `algorithm/xp.py`. Todas las constantes de esta página vienen de ahí.

## Jerarquía: esto es lo primero que hay que entender

El sistema de gamificación tiene **dos capas con roles distintos, no un conjunto plano de mecánicas**:

- **Corto plazo (feedback loop diario)**: XP por ejercicio, multiplicador de dificultad personal, bonus por racha de aciertos dentro de una sesión, multiplicador de racha diaria. Esto está para que cada sesión se sienta bien y para incentivar volver mañana.
- **Largo plazo (motor de retención real)**: **la competencia en el ranking — especialmente la rivalidad entre universidades**. `notification_copy.py` es la evidencia más clara de esto: de 7 categorías de notificación, `university` (20%), `social` universitario (15%), `ranking` (15%) y `podium` (15%) — es decir, **65% del peso de las notificaciones push está atado directa o indirectamente al ranking/competencia**, contra 15% de recordatorio genérico de práctica.

**Al diseñar o evaluar cualquier feature de gamificación nueva, la pregunta correcta no es "¿cómo le doy más XP a esto?" sino "¿cómo esto alimenta o refuerza la competencia en el ranking, en particular entre universidades?"**. XP es un medio, el ranking es el fin.

## XP y niveles

Curva de niveles precalculada al importar el módulo, basada en razón áurea a la sexta (`_RATIO = φ^(1/6) ≈ 1.0835`): nivel 1 = 30 XP, nivel 2 = 55 XP, cada nivel siguiente requiere ≈×1.0835 el anterior (50 niveles precalculados, `XP_TABLE`). **El backend calcula esto (`level_progress`, devuelto en el payload de progreso) pero el frontend no lo muestra en ningún lado hoy** — no hay barra de nivel ni indicador de "subiste de nivel" en la UI actual. Si se agrega esa UI en el futuro, actualizar esta nota.

### XP por ejercicio — modo Repaso (`"main"`)

Base según intento (`XP_BY_ATTEMPT`): 1er intento = 8, 2do = 2, 3ro = 1, 4to (por descarte) = 0.

El XP del primer intento se pondera además por un **multiplicador de dificultad personal** (`difficulty_multiplier`): entre ×0.5 (ítem que el estudiante domina) y ×1.5 (ítem que le cuesta), calculado linealmente sobre su precisión rodante de primer intento en las últimas 10 respuestas (`DIFFICULTY_WINDOW`), neutro (×1.0) con menos de 3 muestras.

Bonus fijo por racha de aciertos limpios dentro de la sesión: cada 5 correctas seguidas (`XP_STREAK_INTERVAL`) suma +5 XP (`XP_STREAK_BONUS`), sin multiplicadores.

### XP por ejercicio — modo Práctica

Plano, sin ajuste de dificultad: 3 XP si acierta al primer intento (`XP_PRACTICE_CORRECT`), 0 si no. Sí escala con el multiplicador de racha diaria. Base deliberadamente baja para que no sea farmeable — práctica es volumen ilimitado a elección del usuario.

### Multiplicador de racha diaria (`STREAK_TIERS`)

La racha cuenta **días distintos con ≥1 sesión completada**, no necesariamente consecutivos:

| Días acumulados | Multiplicador |
|---|---|
| 0 | ×1.0 |
| 3 | ×1.2 |
| 9 | ×1.4 |
| 18 | ×1.6 |
| 30 | ×1.8 |
| 45 | ×2.0 (máximo) |

Se resetea a 0 tras 30 días consecutivos sin actividad (`STREAK_RESET_AFTER_DAYS`).

`Answer.xp_base` (antes del multiplicador) vs `Answer.xp_earned` (después) — la diferencia es lo que el resumen de sesión muestra como "bonus por tu racha".

## Belts y graduación

Ver [domain-model.md](domain-model.md#maestría-y-graduación-algorithmgraduationpy) para la definición exacta. Belts activos: blanco → azul → violeta → marrón.

## Ranking (leaderboard) — el objetivo de largo plazo

Ranking global y **por universidad** (`web/src/lib/nav`/`leaderboard/UseUniversityLeaderboard.ts`), ordenado por `User.total_xp`. `User.notify_last_rank` guarda el último rank global conocido del usuario para detectar "te pasaron en el ranking" y disparar el push correspondiente (categoría `ranking`, `notification_copy.py::_ranking_named`/`_ranking_generic`).

Categorías de notificación atadas al ranking/universidad (`backend/notification_copy.py`, pesos sobre 1.0):
- `university` (0.20): XP semanal aportado a la universidad, top contribuyente, brecha contra universidad rival.
- `social` (0.15): cuántos compañeros de la misma universidad ya practicaron hoy.
- `ranking` (0.15): alguien te superó en el ranking (nombrado si se conoce el nombre).
- `podium` (0.15): a cuánto XP estás del top N general o de tu universidad.
- `practice` (0.15): recordatorio genérico, sin componente social.
- `reactivation` (0.10) / `personal_best` (0.10): reengagement puro.

## Badges de emoji

Track de desbloqueo append-only por carrera (`emoji_tree.py`, `User.emoji_path`/`emoji_worn`), mostrado/vestido en el leaderboard — capa de ownership (Core Drive 4 de Octalysis) distinta de XP/belts, pensada como otro insumo de estatus social visible en el ranking, no como sistema de recompensa aislado.

Última verificación: 2026-08-01
