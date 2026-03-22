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

## Carpetas principales

### `algorithm/`

Núcleo del sistema de progresión adaptativa. Implementa el algoritmo SM-2 Dual-Loop en módulos independientes y sin dependencias externas (puro Python). Define el sistema de cinturones (Blanco → Azul → Violeta → Marrón → Negro), los catálogos de ítems por cinturón (temas × habilidades), y toda la lógica de calificación, construcción de sesión y graduación. Es el único lugar donde vive la lógica del negocio; el backend y el frontend son clientes de este módulo.

### `backend/`

API REST en FastAPI que expone el algoritmo al frontend. Maneja el ciclo completo de una sesión: inicio, registro de respuestas y generación del resumen con estados de cada ítem. En el MVP usa persistencia en memoria; la migración a PostgreSQL está prevista antes del lanzamiento.

### `frontend/`

SPA en React + Vite, mobile-first. Un único archivo fuente (`src/main.jsx`) que contiene todos los componentes: avatar pixel art SVG, graficador de funciones propio, renderizado LaTeX con KaTeX, flujo de sesión y pantalla de resumen con grilla de progreso por cinturón.

### `data/`

Notebooks Jupyter y scripts de experimentación. Contiene las simulaciones que informaron el diseño del algoritmo y los parámetros actuales de `SM2Config`.

### `docs/`

Documentación técnica del proyecto. `gradus.md` es el documento de referencia del algoritmo: describe el diseño Dual-Loop, el sistema de cinturones y habilidades, los parámetros de configuración y ejemplos completos de progresión de estudiante.

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
| `domain.py` | Tipos base: `Belt`, `BeltCatalog`, `SkillCode`, `ItemKey` y los 5 catálogos de cinturón |
| `config.py` | `SM2Config`: todos los parámetros del modelo como dataclass |
| `sm2.py` | Lógica de transición de estado (quality → nuevo intervalo / EF) |
| `session.py` | `build_session()`: selección y ordenamiento de ítems para cada sesión |
| `generator.py` | Selección de dificultad por estado del ítem |
| `graduation.py` | `is_graduated()` por ítem y `belt_progress()` por cinturón |
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
| Familias (topics) | lineal, cuadrática, polinomial, exponencial, logarítmica, racional, trigonométrica |
| Habilidades | `CLSF` (Clasificación) · `LEXI` (Léxico) · `FORM` (Formulación) |
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

