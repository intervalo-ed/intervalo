"""
backfill_pwa_from_posthog.py — Backfill de users.pwa_first_seen_at desde PostHog.

users.pwa_first_seen_at (migración 20260902_0064) nace vacía porque hasta esa
migración nadie mandaba la señal al backend: el endpoint que la escribe
(`/user/progress?pwa=1`) recién se desplegó con ella. Pero el HECHO de haber
instalado la PWA no empezó ese día: el frontend viene grabando
`first_pwa_use_at` como person property de PostHog desde antes (ver
web/src/app/posthog-user.tsx), cada vez que detecta display-mode: standalone.
Este script trae ese histórico y lo escribe, en vez de dejar que el panel
arranque en cero cuando la evidencia real ya existe.

Consulta PostHog EN EL MOMENTO (HogQL) en vez de embeber los emails en una
migración versionada: son datos personales de usuarios reales, y dejarlos
escritos para siempre en el historial de git es peor que volver a traerlos
cada vez que haga falta correr esto.

Cruza por EMAIL, no por id: PostHog identifica personas por clerk_user_id
(ver posthog.identify(userId, ...) en posthog-user.tsx), que no vive en esta
base con ese nombre. El email sí viaja a las dos plataformas tal cual, y
users.email es unique — es la única clave confiable para este cruce.

Idempotente: solo escribe donde pwa_first_seen_at IS NULL, así que no pisa
nada que ya haya llegado por la vía nueva y correrlo dos veces es un no-op
la segunda vez.

Requiere:
    POSTHOG_API_KEY      Personal API key de PostHog con scope de lectura
                         sobre queries (Project settings → Personal API keys).
    POSTHOG_PROJECT_ID   Id numérico del proyecto (default: 386340, "Web").
    POSTHOG_HOST         Host de la API (default: https://us.posthog.com).

Correr desde backend/, contra la base que apunte DATABASE_URL:
    POSTHOG_API_KEY=phx_... python scripts/backfill_pwa_from_posthog.py --dry-run
    POSTHOG_API_KEY=phx_... python scripts/backfill_pwa_from_posthog.py
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx

# La consola de Windows abre en cp1252 y este script imprime flechas y acentos
# (docstring, --help); sin esto muere con UnicodeEncodeError antes de arrancar.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from database import SessionLocal  # noqa: E402
from models import User  # noqa: E402

# Un email por fila (no por persona): un puñado de usuarios quedan duplicados
# en PostHog por un re-identify sin merge, y el MIN se queda con la
# instalación más vieja conocida de cada uno.
_QUERY = """
SELECT properties.email AS email, min(properties.first_pwa_use_at) AS pwa_at
FROM persons
WHERE properties.first_pwa_use_at IS NOT NULL
GROUP BY email
"""


def fetch_pwa_installs(api_key: str, project_id: str, host: str) -> list[tuple[str, str]]:
    """[(email, iso_timestamp_con_offset), ...] vía la API de queries de PostHog."""
    resp = httpx.post(
        f"{host}/api/projects/{project_id}/query/",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"query": {"kind": "HogQLQuery", "query": _QUERY}},
        timeout=60.0,
    )
    resp.raise_for_status()
    rows = resp.json()["results"]
    return [(email, pwa_at) for email, pwa_at in rows if email and pwa_at]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true",
                         help="Solo mostrar qué se escribiría, sin tocar la base.")
    args = parser.parse_args()

    api_key = os.environ.get("POSTHOG_API_KEY")
    if not api_key:
        sys.exit("Falta POSTHOG_API_KEY (personal API key de PostHog, con scope de queries).")
    project_id = os.environ.get("POSTHOG_PROJECT_ID", "386340")
    host = os.environ.get("POSTHOG_HOST", "https://us.posthog.com")

    rows = fetch_pwa_installs(api_key, project_id, host)
    print(f"PostHog: {len(rows)} personas con first_pwa_use_at.")

    db = SessionLocal()
    try:
        actualizados, sin_match, ya_tenian = 0, 0, 0
        for email, iso in rows:
            at_utc = datetime.fromisoformat(iso).astimezone(timezone.utc).replace(tzinfo=None)
            user = db.query(User).filter(User.email == email).first()
            if user is None:
                sin_match += 1
                continue
            if user.pwa_first_seen_at is not None:
                ya_tenian += 1
                continue
            actualizados += 1
            if not args.dry_run:
                user.pwa_first_seen_at = at_utc

        if not args.dry_run:
            db.commit()

        print(f"{'Se escribirían' if args.dry_run else 'Actualizados'}: {actualizados}")
        print(f"Sin usuario con ese email en esta base: {sin_match}")
        print(f"Ya tenían pwa_first_seen_at (no se pisó): {ya_tenian}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
