"""
Auditoría de white_logarithmic.json (36 ejercicios existentes):
1. Vaciar feedback_incorrect a "" en todos.
2. Agregar párrafo de contexto a clsf_01, clsf_05, clsf_08.
3. Corregir graph_view en 7 ejercicios.
"""
import json
import sys

PATH = "content/analisis-1/exercises/white_logarithmic.json"

with open(PATH, encoding="utf-8") as f:
    exercises = json.load(f)

fixes = 0

# --- 1. Vaciar feedback_incorrect ---
for ex in exercises:
    if ex.get("feedback_incorrect") != "":
        ex["feedback_incorrect"] = ""
        fixes += 1

# --- 2. Contexto en CLSF con gráfico ---
context_fixes = {
    "white_logarithmic_clsf_01": (
        "La gráfica muestra una función definida para $x > 0$, con una curva que crece lentamente y una asíntota vertical en $x = 0$.\n\n"
        "¿A qué familia de funciones pertenece esta gráfica?"
    ),
    "white_logarithmic_clsf_05": (
        "La gráfica muestra una función definida para $x > 0$, con una curva creciente que se aplana hacia la derecha y una asíntota vertical en $x = 0$.\n\n"
        "¿A qué familia de funciones pertenece esta gráfica?"
    ),
    "white_logarithmic_clsf_08": (
        "La gráfica muestra una función definida para $x > 0$, con una curva creciente y una asíntota vertical en $x = 0$.\n\n"
        "¿A qué familia de funciones pertenece esta gráfica?"
    ),
}

for ex in exercises:
    eid = ex["external_id"]
    if eid in context_fixes:
        old_q = ex["question"]
        ex["question"] = context_fixes[eid]
        print(f"CONTEXT  {eid}: '{old_q}' -> pregunta con contexto")
        fixes += 1

# --- 3. Corregir graph_view ---
view_fixes = {
    "white_logarithmic_lexi_02": [-0.5, 8.5, -3, 5],
    "white_logarithmic_lexi_06": [-0.5, 8.5, -3, 5],
    "white_logarithmic_lexi_09": [-0.5, 8.5, -3, 5],
    "white_logarithmic_clsf_01": [-0.5, 8.5, -2, 6],
    "white_logarithmic_clsf_05": [-0.5, 8.5, -3, 5],
    "white_logarithmic_clsf_08": [-0.5, 8.5, -2, 6],
    "white_logarithmic_form_08": [-0.5, 8.5, -4, 4],
}

for ex in exercises:
    eid = ex["external_id"]
    if eid in view_fixes:
        old_view = ex.get("graph_view")
        ex["graph_view"] = view_fixes[eid]
        print(f"VIEW_FIX {eid}: {old_view} -> {view_fixes[eid]}")
        fixes += 1

print(f"\nTotal fixes: {fixes}")
print(f"Total exercises: {len(exercises)}")

with open(PATH, "w", encoding="utf-8") as f:
    json.dump(exercises, f, ensure_ascii=False, indent=2)
    f.write("\n")

print("OK audit_logarithmic.py")
