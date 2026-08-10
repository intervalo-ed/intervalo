# Product overview

## Qué es Intervalo

Intervalo es una plataforma de repetición espaciada (SM-2) para practicar matemática, pensada para estudiantes universitarios de Latinoamérica que cursan materias con mucho volumen de ejercicios técnicos (análisis matemático, probabilidad, álgebra). El problema que resuelve: estos cursos requieren práctica sostenida y repetida para que el conocimiento se fije, pero estudiar sin un sistema de repaso estructurado hace que se olvide lo aprendido y que el estudio se concentre (mal) en la semana previa al parcial.

## Propuesta de valor

- **Algoritmo de repetición espaciada real** (SM-2, ver [domain-model.md](domain-model.md)), no una lista de ejercicios al azar: cada ítem se programa para reaparecer en el momento óptimo según cuánto le costó al estudiante.
- **Gamificación con jerarquía clara** (ver [gamification.md](gamification.md)): XP y streaks dan el feedback loop diario, pero el objetivo de fondo que sostiene el uso a largo plazo es la **competencia en el ranking — especialmente entre universidades**. No es "gamificación por gamificación": todo el sistema de XP existe para alimentar esa competencia social.
- **Contenido curado**, no generado on-the-fly: banco de ejercicios de opción múltiple con feedback y explicación, escrito y validado con reglas propias (ver [content-authoring.md](content-authoring.md)).
- **Fricción mínima**: sesión diaria corta (7-8 ejercicios), sin configuración previa, con push notifications para traer al usuario de vuelta.

## Para quién

Estudiantes universitarios de Latinoamérica cursando materias de matemática de grado. El copy y la interfaz están en español. El onboarding pide universidad y carrera — esos datos alimentan directamente el ranking por universidad, que es el corazón del engagement de largo plazo.

## Cursos activos hoy

Definidos en `web/src/lib/catalog/index.ts` (`COURSE_ORDER`) y en `backend/content/<slug>/course.json`:

| Slug | Nombre |
|---|---|
| `analisis` | Análisis (matemático) |
| `probabilidad` | Probabilidad |
| `algebra` | Álgebra |

Cada curso tiene su propia estructura de belts/units/topics (ver [domain-model.md](domain-model.md)) y su propio banco de ejercicios en `backend/content/<slug>/`.

## Sistema de belts (cinturones)

Los cursos se organizan en 4 belts activos: **blanco → azul → violeta → marrón** (`algorithm/domain.py::Belt`; el histórico "negro" existe en el enum pero no forma parte de ningún curso activo — no usarlo en features nuevas). El progreso avanza belt por belt; graduarse de uno requiere dominar todos sus topics (ver [domain-model.md](domain-model.md) para la definición exacta de "dominado").

Última verificación: 2026-08-01
