"""Sortea los grupos del A/B de la imagen del ranking, estratificado.

**Por qué a mano y no con el mecanismo de variantes de Hermes.** `run.py`
elige variante con `sum(codigo.encode()) % n` — la suma de los bytes del código
de invitación. Eso no es un sorteo: es una función determinística de la
identidad del grupo, y si los códigos guardan cualquier estructura (cuándo se
creó, de qué tanda salió) esa estructura entra derecho en la asignación. Con
~250 unidades un desbalance no es improbable, es esperable. Ya pasó una vez del
lado del front: el experimento de la puerta bucketeaba con FNV-1a y `% 2`, y el
bit bajo de FNV-1a es el XOR de los bits bajos de la entrada.

**Los tres estratos**, y por qué cada uno:

  - `universidad` — las medias por casa difieren hasta en un factor de dos
    (UTN FRC ~5%, UBA ~11% de clickrate).
  - `banda de tamaño` — el clickrate cae con el tamaño del grupo, y las bandas
    no se reparten solas.
  - `contacto previo` — de los 253 elegibles, 140 ya recibieron `intervalo`.
    Dos olas de 87 no entran en los 113 nunca contactados, así que el brazo que
    quede con más grupos ya contactados arranca con otra base y eso se
    confundiría con el efecto de la imagen.

**La propiedad que el sorteo garantiza, y que es lo que lo hace útil:** los dos
brazos quedan parejos DENTRO de cada estrato, no solo en el total. Eso es lo
que permite abrir y cerrar el grifo por universidad día a día sin romper el
experimento: cualquier subconjunto que se elija por criterios de estrato
—«hoy mando UNLP», «esta semana solo los grandes»— sigue teniendo los dos
brazos balanceados.

Se sortea de una vez sobre TODO el inventario elegible, no por ola. El orden de
salida está intercalado de modo que cualquier prefijo también queda balanceado,
así que las olas son cortes de esta lista y no sorteos nuevos. El brazo de un
grupo no cambia nunca.

Uso:
    python backend/scripts/diag/sortear_ab_imagen.py                  # informe
    python backend/scripts/diag/sortear_ab_imagen.py --yaml           # para pegar
    python backend/scripts/diag/sortear_ab_imagen.py --uni UNLP UTN   # solo esas
"""

import argparse
import os
import random
import sys
from collections import defaultdict
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import GameGroup  # noqa: E402

# La semilla va acá y no en la línea de comandos a propósito: es parte del
# registro del experimento. Si se cambia, la asignación cambia, y una
# asignación que cambia después de ver números no es una asignación.
SEMILLA = 20260914

# Debajo de esto la tasa por grupo es ruido: un grupo de cinco personas donde
# entraron tres marca 60%. Medido sobre la camada del 07/09, pedir 40 baja el
# desvío entre grupos de 9,64 a 6,07 pp.
PISO_MIEMBROS = 40

# Las cinco del top, que son también las cinco con inventario propio. UTN entra
# con sus dos regionales bajo la misma etiqueta: el ranking del juego las cuenta
# juntas, así que la imagen las muestra juntas.
TOP5 = ("UBA", "UNC", "UNLP", "UNSAM", "UTN")

BRAZOS = ("dx-ab-imagen-control", "dx-ab-imagen-tratamiento")


def universidad(cruda: str | None) -> str:
    u = (cruda or "").strip()
    return "UTN" if u.startswith("UTN") else u


def elegibles(db) -> list[dict]:
    """Los grupos que pueden entrar al sorteo.

    Tres condiciones: universidad en el top 5, `PISO_MIEMBROS` o más, y que
    NUNCA hayan recibido dx. Los que recibieron `intervalo` sí entran —es otro
    producto y otro mensaje, y es lo que ya hicieron los 26 planes de dx— pero
    entran marcados, porque el contacto previo es uno de los estratos.
    """
    filas = []
    for g in db.query(GameGroup).all():
        uni = universidad(g.universidad)
        if uni not in TOP5 or (g.miembros or 0) < PISO_MIEMBROS or g.producto == "dx":
            continue
        filas.append({
            "id": g.id,
            "uni": uni,
            "miembros": g.miembros,
            "previo": bool(g.ultimo_envio),
            "fuente": g.fuente,
        })
    return filas


def sortear(filas: list[dict]) -> list[dict]:
    """Asigna brazo a cada grupo, parejo dentro de cada estrato.

    Dentro de un estrato se baraja con la semilla fija y se reparte alternando.
    El que sobra en un estrato impar no va siempre al mismo brazo: se lleva la
    cuenta global y el sobrante va al que viene perdiendo, así que los totales
    tampoco se desbalancean por acumulación de impares.
    """
    mediana = sorted(f["miembros"] for f in filas)[len(filas) // 2]
    for f in filas:
        f["banda"] = "grande" if f["miembros"] >= mediana else "chico"

    estratos: dict[tuple, list[dict]] = defaultdict(list)
    for f in filas:
        estratos[(f["uni"], f["banda"], f["previo"])].append(f)

    rng = random.Random(SEMILLA)
    deuda = 0  # positivo = control va ganando, el sobrante le toca al otro
    salida: list[dict] = []
    for clave in sorted(estratos):
        grupo = estratos[clave]
        rng.shuffle(grupo)
        arranca = 0 if deuda <= 0 else 1
        for i, f in enumerate(grupo):
            f["brazo"] = BRAZOS[(i + arranca) % 2]
        deuda += sum(1 if f["brazo"] == BRAZOS[0] else -1 for f in grupo)
        salida.append(grupo)

    # Intercalado: se emite de a uno por estrato, dando vueltas. Así cualquier
    # PREFIJO de la lista tiene los estratos repartidos y los brazos parejos —
    # que es lo que hace que una ola sea un corte y no un sorteo nuevo.
    orden: list[dict] = []
    i = 0
    while any(len(g) > i for g in salida):
        for g in salida:
            if len(g) > i:
                orden.append(g[i])
        i += 1
    return orden


def informe(orden: list[dict]) -> None:
    por_brazo = defaultdict(int)
    for f in orden:
        por_brazo[f["brazo"]] += 1
    print(f"{len(orden)} grupos elegibles · semilla {SEMILLA} · mediana de corte "
          f"en la banda de tamaño")
    print(f"  {BRAZOS[0]}: {por_brazo[BRAZOS[0]]}")
    print(f"  {BRAZOS[1]}: {por_brazo[BRAZOS[1]]}")
    print()
    print("balance por estrato (control / tratamiento):")
    est: dict[tuple, list[int]] = defaultdict(lambda: [0, 0])
    for f in orden:
        est[(f["uni"], f["banda"], f["previo"])][BRAZOS.index(f["brazo"])] += 1
    peor = 0
    for clave in sorted(est):
        c, t = est[clave]
        peor = max(peor, abs(c - t))
        uni, banda, previo = clave
        print(f"  {uni:<6} {banda:<7} {'con contacto' if previo else 'virgen':<13} "
              f"{c:>3} / {t:<3}")
    print(f"\nel peor desbalance de un estrato es {peor} grupo(s)")
    print()
    print("y cualquier prefijo también queda parejo:")
    for n in (40, 88, 132, 174, len(orden)):
        if n > len(orden):
            continue
        c = sum(1 for f in orden[:n] if f["brazo"] == BRAZOS[0])
        print(f"  primeros {n:>3}: {c} / {n - c}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csv", action="store_true",
                    help="la asignación completa, para versionarla como registro")
    ap.add_argument("--yaml", action="store_true",
                    help="imprime las dos listas de ids, para pegar en filtros.ids")
    ap.add_argument("--uni", nargs="*", help="filtrar a estas universidades")
    ap.add_argument("--n", type=int, help="cortar la lista en los primeros n")
    args = ap.parse_args()

    db = database.SessionLocal()
    try:
        filas = elegibles(db)
    finally:
        db.close()

    orden = sortear(filas)
    if args.uni:
        pedidas = {u.upper() for u in args.uni}
        orden = [f for f in orden if f["uni"].upper() in pedidas]
    if args.n:
        orden = orden[:args.n]

    if args.csv:
        # El registro del experimento. Se commitea ANTES del primer envío: una
        # asignación que no está escrita antes no es una asignación.
        print("orden,id,universidad,miembros,banda,contacto_previo,fuente,brazo")
        for i, f in enumerate(orden, 1):
            print(f'{i},{f["id"]},{f["uni"]},{f["miembros"]},{f["banda"]},'
                  f'{"si" if f["previo"] else "no"},{f["fuente"]},{f["brazo"]}')
    elif args.yaml:
        for brazo in BRAZOS:
            ids = [f["id"] for f in orden if f["brazo"] == brazo]
            print(f"# {brazo} · {len(ids)} grupos")
            print("filtros:")
            print("  ids:")
            for gid in ids:
                print(f"    - {gid}")
            print()
    else:
        informe(orden)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
