"""
Auditoría de white_rational.json:
1. feedback_incorrect → "" en todos los ejercicios
2. graf_11: graph_view dict → lista
3. graph_view muy altos → ajustar a proportional
4. clsf_01, clsf_05, clsf_08: agregar párrafo de contexto a la pregunta
"""
import json, pathlib, copy

FILE = pathlib.Path("content/analisis-1/exercises/white_rational.json")
data = json.loads(FILE.read_text(encoding="utf-8"))

# ── 1. Vaciar feedback_incorrect en todos ──────────────────────────────────
changed_fi = 0
for e in data:
    if e["feedback_incorrect"] != "":
        e["feedback_incorrect"] = ""
        changed_fi += 1
print(f"feedback_incorrect vaciados: {changed_fi}")

# ── 2. graf_11: dict → lista ───────────────────────────────────────────────
for e in data:
    if e["external_id"] == "white_rational_graf_11":
        if isinstance(e["graph_view"], dict):
            gv = e["graph_view"]
            e["graph_view"] = [gv["xMin"], gv["xMax"], gv["yMin"], gv["yMax"]]
            print(f"graf_11 graph_view corregido: {e['graph_view']}")

# ── 3. Ajustar graph_view desproporcionados ────────────────────────────────
ADJUSTMENTS = {
    # lexi_02, lexi_09, clsf_01, graf_06: (x+1)/(x-2), AV x=2, AH y=1
    # view original [-5,7,-8,8] → xR=12, yR=16; mejor: [-4,8,-6,6] → xR=12, yR=12
    "white_rational_lexi_02":  [-4, 8, -6, 6],
    "white_rational_lexi_09":  [-4, 8, -6, 6],
    "white_rational_clsf_01":  [-4, 8, -6, 6],
    "white_rational_graf_06":  [-4, 8, -6, 6],
    # clsf_08, graf_10: 2/(x+1), AV x=-1, AH y=0
    # view original [-6,4,-8,8] → xR=10, yR=16; mejor: [-5,5,-6,6] → xR=10, yR=12
    "white_rational_clsf_08":  [-5, 5, -6, 6],
    "white_rational_graf_10":  [-5, 5, -6, 6],
}
for e in data:
    eid = e["external_id"]
    if eid in ADJUSTMENTS:
        old = e["graph_view"]
        e["graph_view"] = ADJUSTMENTS[eid]
        print(f"{eid}: graph_view {old} -> {e['graph_view']}")

# ── 4. Agregar contexto a CLSF con gráfico sin párrafo ────────────────────
CLSF_CONTEXT = {
    "white_rational_clsf_01": (
        "La gráfica muestra una curva con dos ramas separadas por una línea vertical. "
        "Ambas ramas se alejan de esa línea y se aplanan horizontalmente a medida que $x$ crece.\n\n"
        "¿A qué familia de funciones pertenece esta gráfica?"
    ),
    "white_rational_clsf_05": (
        "La gráfica muestra dos ramas simétricas respecto al origen. "
        "Una rama está en el primer cuadrante y la otra en el tercero, "
        "acercándose a ambos ejes sin llegar a tocarlos.\n\n"
        "¿A qué familia de funciones pertenece esta gráfica?"
    ),
    "white_rational_clsf_08": (
        "La gráfica muestra una curva con dos ramas y una línea vertical que las separa. "
        "Las ramas se aplanan en torno al eje $X$ al alejarse del centro.\n\n"
        "¿A qué familia de funciones pertenece esta gráfica?"
    ),
}
for e in data:
    eid = e["external_id"]
    if eid in CLSF_CONTEXT:
        old_q = e["question"]
        e["question"] = CLSF_CONTEXT[eid]
        print(f"{eid}: question actualizada")

# ── Guardar ────────────────────────────────────────────────────────────────
FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\nTotal ejercicios: {len(data)}")
from collections import Counter
skills = Counter(e["exercise_type"] for e in data)
print("Por skill:", dict(skills))
print("Auditoría completa.")
