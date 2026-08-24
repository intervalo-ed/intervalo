# El camino del estudiante

Esta página describe la experiencia desde la perspectiva del estudiante: qué ve y qué puede hacer, en orden, desde que entra por primera vez hasta el uso recurrente. Es el complemento narrativo de [features-catalog.md](features-catalog.md) (que es inventario técnico por pantalla) — acá el eje es "qué puede hacer y decidir el usuario", no la implementación.

## 1. Onboarding (`onboarding/`)

Antes de ver cualquier ejercicio, el estudiante elige:
- **Curso**: `analisis`, `probabilidad` o `algebra` (puede tener más de uno con el tiempo — el `CourseSwitcher` está presente desde el primer día).
- **Universidad y carrera**: estos dos datos no son solo perfil — son la base de todo el sistema de ranking universitario y de la segmentación de notificaciones (ver [gamification.md](gamification.md)). La carrera también determina el "bucket" de badges de emoji que va a poder desbloquear (ver más abajo).
- **Motivación**: por qué está usando la app (input libre/categorizado).

Durante el onboarding ve una secuencia animada con los colores de cada belt del curso elegido — su primer contacto con la identidad visual de progreso. Termina en una pantalla de instalación como PWA (agregar a inicio) — la app está pensada para vivir como ícono en el home, no como pestaña de navegador.

## 2. Home / Dashboard

Acá vive todo el tiempo entre sesiones. El estudiante ve:
- Su **XP total**.
- Su **racha** de días de actividad y el multiplicador de XP que le da (ej. "×1.4, te faltan 3 días para ×1.6").
- La **grilla de cinturones** del curso activo: cada celda es un `(belt, topic, exercise_type)` y su color/relleno refleja si está sin empezar, en aprendizaje o ya dominado.
- Dos botones principales: **Repasar** (la sesión diaria de repetición espaciada) y **Practicar** (modo libre).

Desde acá también puede **cambiar de curso** con el selector superior, y entrar al **modo edición** del curso activo (ícono de tuerca, con un puntito rojo la primera vez que existe para llamar la atención hasta que lo toca):
- **Suspender/reactivar temas**: oculta un tema del home y de las sesiones sin perder el progreso — reversible en cualquier momento.
- **Ajustar cuántos ítems puede tener en aprendizaje a la vez** y **cuántos ejercicios entran en cada sesión de repaso**, con un stepper.
- **Reiniciar el curso**: vuelve a cero el progreso (con confirmación explícita, botón rojo) — el progreso viejo no se borra, queda archivado para historial, pero deja de contar para la grilla y el ranking de maestría.

## 3. Los dos modos: Repasar vs. Practicar

Son experiencias con objetivos distintos, y el estudiante los distingue rápido:

| | **Repasar** ("main") | **Practicar** ("practice") |
|---|---|---|
| Qué es | Repetición espaciada — el algoritmo elige qué ítems tocan hoy | Práctica libre, el estudiante elige qué temas repasar |
| Frecuencia | Tantas sesiones seguidas como ítems pendientes tenga — el bloqueo a "una por día" solo aparece cuando ya no le queda nada vencido (ver [domain-model.md](domain-model.md#gate-de-sesión-diaria-session_storepycreate_session_db)) | Ilimitada, cuando quiera |
| Qué puede configurar | Nada del contenido — el algoritmo decide qué ítems entran (ver [domain-model.md](domain-model.md)); sí puede ajustar cuántos ítems tiene "activos" y el tamaño de sesión desde el editor del home | **Temas específicos** a practicar (uno o varios, cualquier cinturón), y **cuántos ejercicios** quiere en la sesión (editable con el mismo lenguaje visual rojo/verde de reiniciar/guardar) |
| XP | Más alto, ajustado a su dificultad personal con cada ítem | Más bajo y plano, para que no sea la forma "fácil" de sumar XP |
| Multiplicador de racha | Sí | Sí |

También existe un **modo Test** (`/dev/test`, solo en `next dev`; en producción es 404), pensado como herramienta interna de QA sin tracking de progreso: se eligen ítems puntuales `(belt, topic, skill)` de cualquier cinturón del curso, con filtros (orden aleatorio, solo ítems con LaTeX, solo ítems con gráfico) — pensado más para explorar/probar contenido que para el circuito diario de estudio.

## 4. Adentro de una sesión (cualquier modo)

El estudiante resuelve ejercicios de opción múltiple uno a la vez, deslizando entre ellos. Si se equivoca, ve feedback inmediato y puede reintentar (hasta el límite de intentos); tiene acceso a "¿Por qué?" para ver la explicación completa del tema.

De vez en cuando (con moderación deliberada, nunca todas las sesiones), después de resolver un ejercicio puede aparecerle una **micro-encuesta**: "¿Cómo estuvo este problema?" (aburrido / justo / interesante, la más frecuente), "¿Cómo se sintió este ejercicio?" o "¿Te ayudó a entenderlo?" — responde tocando una opción y "Continuar", igual que un ejercicio más. Si en la de interés elige un extremo, aparece un chip opcional para decir por qué (por ejemplo "me hizo pensar" o "pura cuenta"). Nunca gana XP por esto — el mensaje de agradecimiento es explícito en que no es una recompensa, es para mejorar el contenido. En cualquier ejercicio o explicación también puede tocar una banderita discreta para **reportar un problema** de contenido (enunciado con error, opción ambigua, explicación con error), con un campo de texto opcional.

Al terminar, ve un **resumen**: XP ganado (separando el bonus por racha) y una animación de confetti con los colores del curso.

## 5. Ranking (`/leaderboard`)

Esta es, junto con el home, la pantalla que sostiene el uso a largo plazo (ver [gamification.md](gamification.md) para el porqué). El estudiante puede:
- Alternar entre **ranking individual** y **ranking universitario** — ver dónde está su universidad frente a otras, no solo dónde está él.
- Filtrar por **carrera** y por **universidad**.
- Ver estadísticas globales de la comunidad (estudiantes registrados, ejercicios completados) además de su posición.
- Ver el nombre de cada estudiante coloreado según su cinturón más alto, y su badge de emoji actual junto al nombre (ver abajo) — el ranking es también donde el estatus visual (emoji, color de cinturón) se hace público frente a otros.

Recibe notificaciones push directamente atadas a esta pantalla: que alguien lo superó, que está cerca del top, cuánto aportó su universidad esta semana, si su universidad le está ganando a una rival (ver [writing-voice.md](writing-voice.md) para ejemplos de copy).

## 6. Badges de emoji (`/profile/badges`)

Track de desbloqueo por carrera, separado de belts/XP en su lógica pero visible en el mismo lugar (el ranking): cada carrera tiene su propio árbol de emojis, con una raíz gratis desde el día uno. A medida que el estudiante acumula XP total, se desbloquean automáticamente niveles más profundos del árbol (umbrales: 64, 256, 1024, 4096, 8192 XP) — **no hay que elegir nada para desbloquear**, es automático al cruzar el umbral. Lo único que el estudiante decide es **qué emoji ya desbloqueado "vestir"** para que se muestre junto a su nombre en el ranking.

## 7. Perfil (`/profile`)

Desde acá el estudiante configura todo lo que no es parte del flujo de estudio:
- **Nombre visible y username.**
- **Notificaciones**: activar/desactivar recordatorio diario y elegir la hora exacta (en pasos de 15 minutos) en la que quiere recibirlo — como máximo una notificación push por día.
- **Badges de emoji** (ver arriba).
- **Feedback libre**: reportar un error, sugerir una idea, o dejar un comentario, en cualquier momento (no confundir con la micro-encuesta post-ejercicio, que es puntual a un ejercicio).

Última verificación: 2026-08-01
