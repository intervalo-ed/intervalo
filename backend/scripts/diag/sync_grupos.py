"""Copia el tracker de difusión a `game_groups`, para que el panel sepa dividir.

**El problema que resuelve.** El panel sabe cuántos jugadores trajo cada grupo
(`game_players.first_group_id`) pero no cuánta gente había adentro, así que no
puede calcular el clickrate — que es lo único que compara dos difusiones entre
sí. Ese denominador vive en un Google Sheet, fuera del repo, y hasta ahora se
cruzaba a mano: el reporte del 28/08 tiene los nueve grupos de la primera ola
escritos como constantes en el `.py`.

**Cuándo correrlo.** Después de mandar una ola, o cuando el tracker haya cambiado
lo bastante como para que el panel esté mintiendo. No hay job automático a
propósito: el Sheet es una herramienta de trabajo humano y sincronizarlo solo
significaría que una fila a medio escribir termina en un gráfico.

**Las dos pestañas tienen claves de identidad distintas** y esto ya hizo parecer
huérfano a un grupo que no lo era: en `Grupos` la clave del checkpoint es el
código de invitación de WhatsApp y en `Comunidades` es el id del tracker. Lo que
esta tabla usa es el `ID` —el mismo string del `?g=` del link— que existe en las
dos y es el que trae atribuido el jugador.

Uso:
    # la pestaña Grupos, directo del export CSV (el de SHEET_CSV_URL)
    python backend/scripts/diag/sync_grupos.py --csv "<url>"

    # sumando Comunidades, exportada a mano (necesita la cuenta de servicio)
    python backend/scripts/diag/sync_grupos.py --csv "<url>" --csv comunidades.csv

    # sin escribir, para ver qué haría
    python backend/scripts/diag/sync_grupos.py --csv "<url>" --dry-run

Corre contra la base de `DATABASE_URL`. Es idempotente: reescribe la fila entera
de cada id que venga, y no borra las que no vengan — un export parcial no puede
vaciar la tabla.
"""

import argparse
import csv
import io
import os
import sys
import urllib.request
from datetime import date, datetime
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import GameGroup  # noqa: E402

# Los encabezados del tracker, tal como están escritos en el Sheet. Si alguno
# cambia de nombre el script corta con un error que lo dice, en vez de escribir
# una tabla de nulos que el panel dibujaría como "clickrate 0%".
COL = {
    "id": ("ID", "Id", "id"),
    "universidad": ("Universidad",),
    "cluster": ("Cluster",),
    "materia": ("Materia",),
    "titulo": ("Grupo", "Título WPP", "Titulo"),
    "miembros": ("Miembros",),
    "ultimo_envio": ("Último envío", "Ultimo envio"),
    "ultima_campana": ("Última campaña", "Ultima campana"),
    "producto": ("Último producto", "Ultimo producto"),
}


def _col(fila: dict, clave: str) -> str:
    for nombre in COL[clave]:
        if nombre in fila:
            return (fila[nombre] or "").strip()
    return ""


def _entero(txt: str):
    limpio = txt.replace(".", "").replace(",", "").strip()
    return int(limpio) if limpio.isdigit() else None


def _fecha(txt: str):
    txt = txt.strip()
    if not txt:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(txt, fmt).date()
        except ValueError:
            continue
    return None


def _leer(origen: str) -> list[dict]:
    if origen.startswith("http"):
        crudo = urllib.request.urlopen(origen, timeout=60).read().decode("utf-8")
    else:
        crudo = Path(origen).read_text(encoding="utf-8")
    return list(csv.DictReader(io.StringIO(crudo)))


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", action="append", required=True,
                    help="URL o archivo del export. Repetible (Grupos y Comunidades).")
    # Con qué copia de dx se le habló a cada grupo. No sale del tracker: todos
    # los planes de dx comparten `id: juego-lanzamiento`, así que la columna
    # «Última campaña» dice lo mismo para los dos clusters. Sale de los nombres
    # de los planes de hermes, que están fuera del repo, y por eso entra como un
    # archivo aparte en vez de inferirse acá.
    #
    # Cuando el que no viene en el archivo ya tenía etiqueta, se la deja: un
    # mapeo parcial no puede borrar lo que sabíamos, igual que un export parcial
    # no puede vaciar la tabla.
    ap.add_argument("--cluster", help="CSV id,cluster_dx (analisis|generico)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    filas: list[tuple[str, dict]] = []
    for i, origen in enumerate(args.csv):
        leidas = _leer(origen)
        fuente = "Grupos" if i == 0 else "Comunidades"
        print(f"{fuente}: {len(leidas)} filas de {origen[:60]}")
        if leidas and not any(n in leidas[0] for n in COL["id"]):
            print(f"  ERROR: no encuentro la columna ID. Encabezados: {list(leidas[0])[:8]}")
            return 1
        filas.extend((fuente, f) for f in leidas)

    cluster_dx: dict[str, str] = {}
    if args.cluster:
        for f in _leer(args.cluster):
            gid = (f.get("id") or "").strip().lower()
            c = (f.get("cluster_dx") or "").strip().lower()
            if gid and c in ("analisis", "generico"):
                cluster_dx[gid] = c
        print(f"clusters de dx: {len(cluster_dx)} grupos etiquetados")

    ahora = datetime.utcnow()
    vistos: dict[str, dict] = {}
    sin_id = 0
    for fuente, f in filas:
        gid = _col(f, "id").lower()
        if not gid:
            sin_id += 1
            continue
        # La última que gane: si un grupo está en las dos pestañas, Comunidades
        # —que viene después— es la que tiene el dato fresco.
        vistos[gid] = {
            "id": gid,
            "universidad": _col(f, "universidad") or None,
            "cluster": _col(f, "cluster") or None,
            "materia": _col(f, "materia") or None,
            "titulo": _col(f, "titulo") or None,
            "miembros": _entero(_col(f, "miembros")),
            "ultimo_envio": _fecha(_col(f, "ultimo_envio")),
            "ultima_campana": _col(f, "ultima_campana") or None,
            "producto": _col(f, "producto") or None,
            "fuente": fuente,
            "synced_at": ahora,
        }
        if gid in cluster_dx:
            vistos[gid]["cluster_dx"] = cluster_dx[gid]

    con_miembros = sum(1 for v in vistos.values() if v["miembros"])
    con_dx = sum(1 for v in vistos.values() if v["producto"] == "dx")
    print(f"\n{len(vistos)} grupos con id · {con_miembros} con miembros · {con_dx} ya con dx"
          + (f" · {sin_id} sin id, salteadas" if sin_id else ""))

    if args.dry_run:
        print("\n(dry-run: no se escribió nada)")
        for v in list(vistos.values())[:5]:
            print("   ", v["id"], v["universidad"], v["miembros"], v["producto"])
        return 0

    db = database.SessionLocal()
    try:
        existentes = {g.id: g for g in db.query(GameGroup).all()}
        nuevos = 0
        for gid, datos in vistos.items():
            fila = existentes.get(gid)
            if fila is None:
                db.add(GameGroup(**datos))
                nuevos += 1
            else:
                for k, v in datos.items():
                    setattr(fila, k, v)
        db.commit()
        print(f"escritos: {nuevos} nuevos, {len(vistos) - nuevos} actualizados")
        # Lo que NO se toca, dicho en voz alta: un export parcial no puede vaciar
        # la tabla, así que las filas que no vinieron quedan como estaban — con
        # su `synced_at` viejo, que es lo que las delata.
        huerfanas = set(existentes) - set(vistos)
        if huerfanas:
            print(f"sin tocar: {len(huerfanas)} filas que no vinieron en este export")
    finally:
        db.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
