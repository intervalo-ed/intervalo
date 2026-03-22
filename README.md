Gradus
============

Este repositorio contiene el MVP de Gradus, una plataforma web de práctica adaptativa para reconocimiento de funciones matemáticas.

Estructura principal:

- `backend/`: API en FastAPI y acceso a datos.
- `algorithm/`: implementación de SM-2 y generadores de ejercicios.
- `frontend/`: aplicación React mobile-first.
- `data/`: análisis, notebooks y scripts de experimentación.
- `docs/`: documentación técnica, incluido el documento de requerimientos.

---

## Descripción técnica

### Arquitectura

Gradus sigue una arquitectura cliente-servidor desacoplada. El frontend es una SPA React servida por Vite; el backend es una API REST en FastAPI (Python). En el MVP la persistencia es en memoria (diccionario de sesiones); la migración a PostgreSQL via Supabase está prevista antes del lanzamiento.

```
┌─────────────────────┐        HTTP/JSON       ┌──────────────────────────┐
│   React + Vite      │ ◄────────────────────► │   FastAPI (Python)       │
│   (puerto 5173)     │                        │   (puerto 8000)          │
│                     │                        │                          │
│  • SVG plot propio  │                        │  • session_store.py      │
│  • KaTeX (LaTeX)    │                        │  • exercise_bank.py      │
│  • Pixel art avatar │                        │  • algorithm/ (SM-2)     │
└─────────────────────┘                        └──────────────────────────┘
```

### Algoritmo SM-2 Dual-Loop

El núcleo de Gradus es una implementación propia del algoritmo SM-2 con dos fases explícitas, ubicada en `algorithm/`:

| Módulo | Responsabilidad |
|---|---|
| `domain.py` | Tipos base: `FunctionFamily`, `SkillType`, `ItemKey`, `SM2ItemState` |
| `config.py` | `SM2Config`: todos los parámetros del modelo como dataclass |
| `sm2.py` | Lógica de transición de estado (quality → nuevo intervalo / EF) |
| `session.py` | `build_session()`: selección y ordenamiento de ítems para cada sesión |
| `generator.py` | Selección de dificultad por estado del ítem |
| `graduation.py` | Criterio de graduación de learning → review |
| `scoring.py` | `quality_from_attempt()`: calificación 0-5 desde acierto + tiempo |

**Loop corto (adquisición):** pasos `[0, 1, 3]` días. El step 0 permite reinserción intra-sesión (máx. 2 veces). Graduación al completar step 2 con calidad ≥ 3.

**Loop largo (retención):** SM-2 estándar post-graduación. Intervalo inicial 7 días, techo 21 días, EF inicial 2.5.

### Banco de ejercicios

`backend/exercise_bank.py` contiene **42 ejercicios** curados manualmente:

```
7 familias × 3 habilidades × 2 subtipos = 42 ejercicios
```

| Dimensión | Valores |
|---|---|
| Familias (topics) | lineal, cuadrática, exponencial, logarítmica, trigonométrica, racional, valor absoluto |
| Habilidades | `vocabulary`, `visual_recognition`, `parameter_identification` |
| Subtipos | `graph` (gráfico SVG) · `text` (expresión LaTeX) |

La proporción graph/text se controla con `SM2Config.graph_exercise_probability` (default 0.66).

### API REST

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/session/start` | Crea sesión, devuelve lista de ejercicios |
| `POST` | `/session/answer` | Registra respuesta, actualiza estado SM-2 |
| `GET` | `/session/{id}/summary` | Devuelve resultados + `skill_states` por ítem |

### Frontend

`frontend/src/main.jsx` es el único archivo fuente del frontend (SPA single-file). Componentes principales:

| Componente | Descripción |
|---|---|
| `BJJAvatar` | Avatar pixel art SVG (12×19 grid, colores dinámicos desde props) |
| `GradusLogo` | Logo pixel art SVG con barra de cinturones |
| `FunctionPlot` | Graficador SVG propio con detección de discontinuidades |
| `MathText` | Renderizado inline de LaTeX con KaTeX |
| `HomeScreen` | Flujo 2 pasos: avatar + nombre → universidad + carrera |
| `SessionScreen` | Sesión de ejercicios con feedback inmediato |
| `SummaryScreen` | Resumen: XP, franjas de cinturón, grilla de madurez por topic/habilidad |

### Cómo correr localmente

**Backend:**
```bash
cd backend
uvicorn main:app --reload
# API disponible en http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install   # solo la primera vez
npm run dev
# App disponible en http://localhost:5173
```

### Estado del MVP (demo)

- [x] Algoritmo SM-2 dual-loop completo
- [x] Banco de 42 ejercicios (7 topics × 3 habilidades × 2 subtipos)
- [x] Graficador de funciones SVG con discontinuidades
- [x] Flujo completo: home → sesión → resumen
- [x] Avatar pixel art con 4 colores de kimono y 2 géneros
- [x] Grilla de progreso por topic con gradiente de madurez
- [ ] Persistencia en base de datos (próximo paso)
- [ ] Autenticación y perfiles de usuario
- [ ] Cinturones Azul, Violeta y Marrón (contenido pendiente)
