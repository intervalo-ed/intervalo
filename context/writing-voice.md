# Writing voice

Tono y convenciones de comunicación con el estudiante — copy de la app, notificaciones, mensajes de feedback. Pensado para mantenerse consistente en cualquier comunicación de producto, no solo dentro del código (soporte, redes, emails).

## Tono general

Español neutro/rioplatense, directo, informal pero no adolescente. Frases cortas. Emojis puntuales para dar calidez sin saturar (ver ejemplos de `notification_copy.py` más abajo — uno por mensaje, nunca más). Nunca acusatorio ni condescendiente hacia el estudiante, ni siquiera cuando se equivoca.

## Reglas heredadas de autoría de contenido (`backend/content/authoring-context.md`, generalizadas)

- Sin em-dash (—) en textos de cara al usuario.
- Sin símbolos ✓/✗ como decoración.
- Formato LaTeX (`$$...$$`) con el espaciado correcto cuando hay matemática.
- El feedback de un ejercicio incorrecto nunca debe sonar acusatorio ("te equivocaste" mal encarado) — enfocado en corregir, no en señalar.

## Encuestas de feedback (micro-encuesta post-ejercicio)

Regla no negociable: **nunca mencionar XP ni recompensa** al agradecer una respuesta de encuesta. El motor es el reconocimiento (Core Drive 4 / Alfred Effect de Octalysis — "esto ayuda"), no el incentivo material. Mensajes ya definidos:

- Encuestas de dificultad/utilidad (A/B): *"¡Gracias! Esto ayuda a elegir mejor qué mostrarte."*
- Reportes de contenido (C): *"Gracias por avisar. Lo revisamos."*

## Notificaciones push (`backend/notification_copy.py`)

Título siempre `"Intervalo"`. Cuerpo corto, una idea, un emoji. Rota entre 7 categorías con pesos fijos (ver [gamification.md](gamification.md) para el desglose completo) — **la mayoría del peso está en copy que menciona la universidad, el ranking o compañeros**, reforzando que el enganche de largo plazo es social/competitivo, no "vení a sumar puntos" genérico. Ejemplos reales:

- Universidad: *"Sumaste 340 XP para la UBA esta semana ¿Seguimos? 🎓"*
- Ranking: *"Nahuel te alcanzó en el ranking. ¿Lo dejás así? 🤼"*
- Podio: *"Estás a 120 XP del top 10 de la UBA. ¡Dale que se puede! 🏅"*
- Reactivación: *"Hace 6 días que no practicás. Retomá antes de perder terreno 👀"*

Nunca se repite la misma categoría ni la misma variante dos veces seguidas al mismo usuario (rotación con exclusión del último enviado, `choose_variant`).

Última verificación: 2026-08-01
