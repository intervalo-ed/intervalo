# Intervalo — Content Studio

Editor **local** para navegar y modificar el contenido del curso (cinturones →
temas → habilidades → ejercicios) con ayuda de IA. Trabaja directamente sobre
los archivos JSON de `backend/content/<curso>/`, que son la fuente de verdad.

Flujo de publicación: **editar acá → `git push` → rebuild → re-seed** (el
backend hace upsert idempotente de los JSON al arrancar, vía `seed_content.py`).

> No forma parte del build de producción. Es una herramienta de uso local.

## Qué permite

- Navegar el árbol del curso con conteo de ejercicios por habilidad.
- Crear / editar / duplicar / borrar ejercicios, con **preview en vivo** de
  KaTeX y de los gráficos de funciones.
- Editar el **tooltip** (contexto teórico) de cada tema.
- **Generar ejercicios con IA** (Claude Sonnet 4.5 vía OpenRouter): la IA
  propone, vos revisás y ajustás, y recién al aprobar se escribe al JSON.
- Re-seed de la base local con un click para probar en la app real.

## Cómo correr

### 1. Server (FastAPI, puerto 8077)

```bash
cd studio/server
pip install -r requirements.txt
cp .env.example .env          # y completá OPENROUTER_API_KEY
uvicorn app:app --host 127.0.0.1 --port 8077
```

La API key de OpenRouter vive en `studio/server/.env` (git-ignored): nunca
llega al frontend ni se commitea. El modelo por defecto es
`anthropic/claude-sonnet-4.5` (cambiable con `OPENROUTER_MODEL` en `.env`).

### 2. UI (Vite, puerto 5174)

```bash
cd studio/web
npm install
npm run dev
```

Abrí http://localhost:5174. El dev server proxea `/api` → `127.0.0.1:8077`.

## Endpoints del server

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/catalog` | Estructura belts/topics/skills + tooltips |
| GET | `/api/course` | Metadatos del curso + belt_info |
| GET | `/api/exercises?belt=&topic=` | Ejercicios de un (belt, topic) |
| GET | `/api/next-id?belt=&topic=&skill=` | Próximo `external_id` sugerido |
| PUT | `/api/exercises` | Guarda el archivo del tema (validado) |
| PATCH | `/api/catalog/tooltip` | Actualiza solo el tooltip de un tema |
| POST | `/api/ai/generate` | Propuesta de ejercicio (no guarda) |
| POST | `/api/seed` | Re-seed local de la DB |

## Validación

Las escrituras reutilizan `_validate_exercise` de `backend/seed_content.py`
(mismas reglas que el seeder de producción) y además chequean que belt/topic/
skill existan en el catálogo y que los `external_id` sean únicos. Los archivos
se escriben con `indent=2` y `ensure_ascii=False` para diffs de git limpios.

## Publicar cambios

```bash
git add backend/content/analisis-1
git commit -m "content: ..."
git push     # rebuild + re-seed en producción
```
