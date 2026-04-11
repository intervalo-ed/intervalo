#!/bin/bash
set -e  # si cualquier comando falla, detener

# Activar el virtualenv que Railpack creó durante el build
source /app/.venv/bin/activate

# Pararse en el directorio del backend
cd /app/backend

echo "==> Aplicando migraciones..."
alembic upgrade head

echo "==> Arrancando servidor..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
