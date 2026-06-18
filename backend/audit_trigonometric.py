"""
Auditoría de white_trigonometric.json:
1. feedback_incorrect -> "" en todos
2. graf_11: graph_view dict -> lista
3. lexi_06, graf_01: [-0.5,7,-2,2] -> [-7,7,-2,2]
4. graf_10: [-0.5,7,-2,2] -> [-5,5,-2,2]
5. form_02: [-7,7,-3,3] -> [-7,7,-2,2]
6. graf_02/05/07/09: agregar graph_fn
7. CLSF con grafico sin contexto: agregar intro
"""
import json, pathlib

FILE = pathlib.Path("content/analisis-1/exercises/white_trigonometric.json")
data = json.loads(FILE.read_text(encoding="utf-8"))

# 1. Vaciar feedback_incorrect
changed = 0
for e in data:
    if e["feedback_incorrect"] != "":
        e["feedback_incorrect"] = ""
        changed += 1
print(f"feedback_incorrect vaciados: {changed}")

# 2. graf_11: dict -> lista
for e in data:
    if e["external_id"] == "white_trigonometric_graf_11":
        if isinstance(e["graph_view"], dict):
            gv = e["graph_view"]
            e["graph_view"] = [gv["xMin"], gv["xMax"], gv["yMin"], gv["yMax"]]
            print(f"graf_11 graph_view corregido: {e['graph_view']}")

# 3. Ajustar graph_view
ADJUSTMENTS = {
    "white_trigonometric_lexi_06":  [-7, 7, -2, 2],
    "white_trigonometric_graf_01":  [-7, 7, -2, 2],
    "white_trigonometric_graf_10":  [-5, 5, -2, 2],
    "white_trigonometric_form_02":  [-7, 7, -2, 2],
}
for e in data:
    eid = e["external_id"]
    if eid in ADJUSTMENTS:
        old = e["graph_view"]
        e["graph_view"] = ADJUSTMENTS[eid]
        print(f"{eid}: graph_view {old} -> {e['graph_view']}")

# 4. GRAF sin graph_fn: agregar
GRAF_FN = {
    "white_trigonometric_graf_02": ("sin(x)", [-7, 7, -2, 2]),
    "white_trigonometric_graf_05": ("cos(x)", [-7, 7, -2, 2]),
    "white_trigonometric_graf_07": ("cos(x)", [-7, 7, -2, 2]),
    "white_trigonometric_graf_09": ("sin(x)", [-7, 7, -2, 2]),
}
for e in data:
    eid = e["external_id"]
    if eid in GRAF_FN:
        fn, view = GRAF_FN[eid]
        e["graph_fn"] = fn
        e["graph_view"] = view
        print(f"{eid}: graph_fn agregado")

# 5. CLSF con grafico sin contexto
CLSF_CONTEXT = {
    "white_trigonometric_clsf_01": (
        "La gráfica muestra una onda que sube y baja de forma repetida y regular, "
        "oscilando entre $-2$ y $2$ con período $2\\pi$.\n\n"
        "¿A qué familia de funciones pertenece esta gráfica?"
    ),
    "white_trigonometric_clsf_05": (
        "La gráfica muestra una curva periódica que en $x = 0$ vale $1$ (su máximo) "
        "y luego desciende hacia $-1$.\n\n"
        "¿A qué familia de funciones pertenece esta gráfica?"
    ),
    "white_trigonometric_clsf_08": (
        "La gráfica muestra una onda periódica que completa dos ciclos completos "
        "en el intervalo visible de $[-5, 5]$, oscilando entre $-1$ y $1$.\n\n"
        "¿A qué familia de funciones pertenece esta gráfica?"
    ),
}
for e in data:
    eid = e["external_id"]
    if eid in CLSF_CONTEXT:
        e["question"] = CLSF_CONTEXT[eid]
        print(f"{eid}: question actualizada")

FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\nTotal: {len(data)}")
from collections import Counter
print("Por skill:", dict(Counter(e["exercise_type"] for e in data)))
print("Auditoria completa.")
