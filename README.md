Gradus
============

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

