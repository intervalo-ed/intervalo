"""Verifica que los modelos y las migraciones digan lo mismo.

Existe por un incidente concreto del 28/08. Una columna nueva entró a
`models.py` sin su migración —se coló al hacer `git add` de un archivo en un
árbol de trabajo compartido con otra sesión— y el resultado fue que producción
empezó a devolver 500 en cada alta:

    column "referred_by" of relation "game_players" does not exist

Lo peor del modo de fallar es que **no se ve en ninguna otra prueba**. El módulo
importa bien, el linter no dice nada, y todos los checks del repo pasan, porque
cada uno arma su base con `Base.metadata.create_all()` — que crea las tablas
desde los modelos y por lo tanto SIEMPRE está de acuerdo con ellos. La única
forma de que la discrepancia aparezca es levantar la base como la levanta
producción: corriendo las migraciones.

Eso es exactamente lo que hace este check. Sobre un SQLite temporal:

  1. `alembic upgrade head`, la cadena entera desde cero;
  2. compara el esquema resultante contra `Base.metadata`;
  3. falla si el modelo declara algo que ninguna migración crea.

La dirección importa. Una columna en el MODELO que no está en la BASE rompe
producción en el primer INSERT. Al revés —una columna que quedó en la base y ya
no está en el modelo— es inofensivo: SQLAlchemy la ignora. Lo primero es un
error; lo segundo se informa y no falla.

Uso:
    python backend/scripts/check_schema_migrations.py

Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from pathlib import Path

# La consola de Windows abre en cp1252 y esto imprime acentos.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
# Un archivo y no ":memory:": alembic abre su propia conexión y una base en
# memoria no sobreviviría entre una y otra (mismo motivo que en check_dashboard).
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "esquema.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from sqlalchemy import inspect  # noqa: E402

import database  # noqa: E402
from models import Base  # noqa: E402

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok  ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


# ── 1 · Levantar la base como la levanta producción ──────────────────────────
print("— la cadena de migraciones corre entera —")
cfg = Config(str(BACKEND / "alembic.ini"))
cfg.set_main_option("script_location", str(BACKEND / "migrations"))
try:
    command.upgrade(cfg, "head")
    check("`alembic upgrade head` desde cero", True)
except Exception as exc:  # noqa: BLE001
    check("`alembic upgrade head` desde cero", False, f"({type(exc).__name__}: {exc})")
    print("\nsin base no hay nada que comparar.")
    sys.exit(1)

inspector = inspect(database.engine)
tablas_base = set(inspector.get_table_names())


# ── 2 · Comparar contra los modelos ──────────────────────────────────────────
print("\n— los modelos no piden nada que las migraciones no creen —")

faltan_tablas = sorted(t for t in Base.metadata.tables if t not in tablas_base)
check(
    "todas las tablas del modelo existen",
    not faltan_tablas,
    f"(faltan: {', '.join(faltan_tablas)})" if faltan_tablas else "",
)

faltan_columnas: list[str] = []
sobran_columnas: list[str] = []
for nombre, tabla in sorted(Base.metadata.tables.items()):
    if nombre not in tablas_base:
        continue  # ya se reportó como tabla faltante
    en_base = {c["name"] for c in inspector.get_columns(nombre)}
    en_modelo = {c.name for c in tabla.columns}
    faltan_columnas += [f"{nombre}.{c}" for c in sorted(en_modelo - en_base)]
    sobran_columnas += [f"{nombre}.{c}" for c in sorted(en_base - en_modelo)]

check(
    "todas las columnas del modelo existen",
    not faltan_columnas,
    f"(faltan: {', '.join(faltan_columnas)})" if faltan_columnas else "",
)

# No es un fallo: una columna que quedó en la base y salió del modelo no rompe
# nada, SQLAlchemy la ignora. Pero conviene verla, porque suele ser una columna
# muerta que nadie se animó a borrar.
if sobran_columnas:
    print(f"      nota: en la base y no en el modelo — {', '.join(sobran_columnas)}")

print(f"\n{len(Base.metadata.tables)} tablas y "
      f"{sum(len(t.columns) for t in Base.metadata.tables.values())} columnas comparadas.")

if fallos:
    print(f"\n{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    print(
        "\nUna columna en el modelo sin su migración NO se ve en ninguna otra\n"
        "prueba: los demás checks arman la base con `create_all()`, que la crea\n"
        "desde los modelos y por lo tanto nunca está en desacuerdo con ellos.\n"
        "En producción, en cambio, revienta en el primer INSERT."
    )
    sys.exit(1)

print("\ntodo ok")
