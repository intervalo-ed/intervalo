"""La regla que etiqueta por materia la copia de dx de cada grupo.

`sync_grupos.py --cluster-auto` decide «analisis» (las derivadas están en el
temario) o «generico» a partir de la materia del tracker. Es una aproximación y
este check fija lo que tiene que acertar: las materias que se etiquetaron a mano
en septiembre, y los casos que una regla ingenua confunde (Cálculo Financiero,
Análisis Numérico, Análisis Estadístico).

Sale con código 1 si algo falla.
"""
import importlib.util
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RUTA = Path(__file__).resolve().parent / "diag" / "sync_grupos.py"
fuente = RUTA.read_text(encoding="utf-8")
inicio = fuente.index("_FUERA_DEL_TEMARIO")
fin = fuente.index("def _col(")
ns: dict = {}
# La regla vive en el script y no en un módulo, así que se ejecuta solo ese
# tramo: importar `sync_grupos` entero abriría la base.
exec("import re\n" + fuente[inicio:fin], ns)
cluster_por_materia = ns["cluster_por_materia"]

fallos: list[str] = []


def check(nombre: str, ok: bool, detalle: str = "") -> None:
    print(("ok   " if ok else "FALLA"), nombre, detalle)
    if not ok:
        fallos.append(nombre)


ANALISIS = [
    "Análisis Matemático I", "Análisis Matemático II (FIUBA)", "Análisis Matemático III",
    "Análisis Matemático 2 (intensivo)", "Análisis 66", "Cálculo 1", "Cálculo II",
    "Matemática I", "Matemática 51", "1er año (Análisis Mat. I + Álgebra Lineal)",
    "2do año (Análisis Mat. II + Probabilidad)",
]
GENERICO = [
    "Física I", "Física 1 (intensivo)", "Álgebra Lineal", "Álgebra Lineal / Álgebra II (FIUBA)",
    "Probabilidad y Estadística", "Estadística (248)", "Cálculo Financiero (276)",
    "Análisis Numérico (752)", "Métodos Numéricos", "Matemática Aplicada I (542)", "", None,
]

for m in ANALISIS:
    check(f"«{m}» lleva la copia de análisis", cluster_por_materia(m) == "analisis")
for m in GENERICO:
    check(f"«{m}» lleva la copia genérica", cluster_por_materia(m) == "generico")

print()
if fallos:
    print(f"FALLARON {len(fallos)}: " + ", ".join(fallos))
    raise SystemExit(1)
print("todo ok")
