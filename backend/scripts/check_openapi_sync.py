"""Verifica que `backend/openapi.json` sea el contrato que el código sirve hoy.

Ese archivo está commiteado y es de dónde el front genera sus tipos:
`bun run build` corre `types:api:file`, que lee EL ARCHIVO y no el servidor. O
sea que un `openapi.json` viejo produce tipos viejos y el build pasa igual —
verde de los dos lados, con el front tipando campos que el backend ya no manda o
sin ver los que estrenó.

No es hipotético: el commit `2249e4bc` de esta semana dice textualmente
«declarar game_players.numeric_cycle_json, que ya existe en la DB», que es el
mismo modo de fallo un nivel más abajo. `check_schema_migrations` existe para
atajar ese; esto ataja el del contrato.

Comparar es barato porque `app.openapi()` no necesita servidor ni base: se
importa `main` y se le pregunta. Lo mismo que hace `dump_openapi.py` para
escribirlo.

Si falla, el arreglo es una línea:

    python backend/scripts/dump_openapi.py
    cd web && bun run types:api:file

Uso:
    python backend/scripts/check_openapi_sync.py

Sale con código 1 si difieren.
"""

import difflib
import json
import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
# Base temporal: importar `main` arma el engine, y no hace falta que apunte a
# ningún lado real para preguntarle el esquema.
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite:///" + str(Path(tempfile.mkdtemp()) / "openapi.db").replace("\\", "/"),
)
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from main import app  # noqa: E402

ARCHIVO = BACKEND / "openapi.json"

# Exactamente el formato que escribe dump_openapi.py: si esto se separa, el check
# falla por el formato y no por el contenido, que es peor que no tenerlo.
vivo = json.dumps(app.openapi(), indent=2) + "\n"

if not ARCHIVO.exists():
    print(f"FALLA  no existe {ARCHIVO}")
    raise SystemExit(1)

guardado = ARCHIVO.read_text(encoding="utf-8")

if vivo == guardado:
    ops = sum(len(m) for m in app.openapi().get("paths", {}).values())
    print(f"ok     openapi.json coincide con el código ({ops} operaciones)")
    raise SystemExit(0)

print("FALLA  openapi.json NO coincide con lo que sirve el código")
print()
# Solo las primeras líneas del diff: alcanza para reconocer qué cambió, y el
# arreglo no depende de leerlo entero.
diff = list(
    difflib.unified_diff(
        guardado.splitlines(),
        vivo.splitlines(),
        fromfile="openapi.json (commiteado)",
        tofile="app.openapi() (el código)",
        lineterm="",
        n=1,
    )
)
for linea in diff[:40]:
    print(linea)
if len(diff) > 40:
    print(f"... y {len(diff) - 40} líneas más de diferencia")

print()
print("Arreglo:")
print("  python backend/scripts/dump_openapi.py")
print("  cd web && bun run types:api:file")
raise SystemExit(1)
