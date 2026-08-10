# context/ — fuente de verdad del producto Intervalo

Esta carpeta es el contexto de producto para agentes IA (y para cualquier colaborador que necesite orientar a su propio agente) trabajando en Intervalo. No es documentación de usuario ni un manual de setup técnico — es la base contra la que un agente debería **analizar, planear e implementar** una feature nueva, y contra la que debería calibrar tono/estilo en cualquier comunicación fuera del código (copy, soporte, contenido).

No reemplaza:
- `web/AGENTS.md` / `web/CLAUDE.md` — convenciones de código del frontend.
- `AGENTS.md` / `CLAUDE.md` (raíz) — convenciones sobre `dep-repos/` (repos vendored).
- `backend/content/*.md` — reglas de autoría de contenido editorial (ver [content-authoring.md](content-authoring.md)).
- `docs/backlog.md` — ideas y backlog de producto, no estado actual.

## Índice

| Archivo | Qué encontrás ahí |
|---|---|
| [product-overview.md](product-overview.md) | Qué es Intervalo, para quién, propuesta de valor, cursos activos. Punto de entrada. |
| [domain-model.md](domain-model.md) | Entidades del dominio (Course, Session, UnitState, Exercise, etc.) y el algoritmo SM-2 con sus constantes reales. |
| [features-catalog.md](features-catalog.md) | Inventario pantalla por pantalla: qué puede hacer el usuario y patrones de interacción no obvios. |
| [student-journey.md](student-journey.md) | El recorrido del estudiante en primera persona: onboarding, los dos modos (Repasar/Practicar) y cómo se configuran, ranking, badges, perfil. Complemento narrativo de features-catalog.md. |
| [gamification.md](gamification.md) | XP, streaks, belts, leaderboard, badges — y por qué el **ranking/competencia universitaria** es el motor de retención de largo plazo, no un sistema más entre otros. |
| [design-system.md](design-system.md) | Paleta, componentes, tipografía, particularidades de PWA/iOS. |
| [writing-voice.md](writing-voice.md) | Tono de copy, reglas de comunicación con el estudiante, convenciones de notificaciones. |
| [architecture.md](architecture.md) | Servicios, cómo se despliegan (Railway), y pitfalls operativos conocidos. |
| [content-authoring.md](content-authoring.md) | Puente a `backend/content/*.md` — cómo se conecta el contenido editorial al producto. |

## Protocolo de actualización

**Toda feature que se mergea a `main` actualiza el/los archivo(s) de `context/` que correspondan, en el mismo PR** (igual que ya se hace con `backend/content/exercise-authoring.md` para cambios de formato de contenido — no es una convención nueva, es la misma disciplina aplicada a producto en general).

Reglas prácticas:
- Si agregaste una pantalla, ruta o interacción nueva → `features-catalog.md`.
- Si cambiaste una entidad, tabla o el algoritmo SM-2 → `domain-model.md`.
- Si tocaste XP, streaks, belts o ranking → `gamification.md`.
- Si cambiaste paleta, componentes o tipografía → `design-system.md`.
- Si cambiaste copy de notificaciones, tono de mensajes o reglas de feedback → `writing-voice.md`.
- Si agregaste/cambiaste un servicio, su forma de deploy, o encontraste un pitfall operativo nuevo → `architecture.md`.
- No copies números o fórmulas de memoria: verificalos contra el código (`algorithm/`, `models.py`) antes de escribir, igual que se hizo al crear estos documentos por primera vez.

Cada archivo termina con una línea `Última verificación: <fecha>` — actualizala cuando confirmes que el contenido sigue vigente, aunque no hayas cambiado nada.

Última verificación: 2026-08-01
