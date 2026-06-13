# -*- coding: utf-8 -*-
import json, io, sys, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

SKILL = sys.argv[1] if len(sys.argv) > 1 else "LEXI"
data = json.load(open("content/analisis-1/exercises/white_quadratic.json", encoding="utf-8"))
items = [e for e in data if e["exercise_type"] == SKILL]
print(f"Auditando {len(items)} {SKILL}")

issues = 0
VAGUE = ["¿qué familia?", "¿qué tipo?"]
for e in items:
    eid = e["external_id"]
    q = e["question"]
    probs = []
    # feedback_incorrect debe ser ""
    if e.get("feedback_incorrect", "") != "":
        probs.append("fb_inc no vacío")
    # pregunta telegráfica
    if any(v in q.lower() for v in VAGUE):
        probs.append("pregunta telegráfica")
    # contexto pegado a pregunta: si hay un '. ' antes de un '¿' sin \n\n
    if re.search(r"[.!?]\s+¿", q) and "\n\n¿" not in q and "\n¿" not in q:
        probs.append("contexto pegado a pregunta")
    # '$' de dinero sin escapar: un '$' suelto seguido de dígito en prosa
    # (heurística: cantidad impar de '$' no escapados)
    raw = q
    unescaped = len(re.findall(r"(?<!\\)\$", raw))
    if unescaped % 2 != 0:
        probs.append("posible $ desbalanceado en question")
    # paréntesis aclaratorio en opción correcta que las otras no tengan
    opts = e["options"]
    ci = e["correct_index"]
    paren = ["(" in o for o in opts]
    if paren[ci] and sum(paren) == 1:
        probs.append("paréntesis solo en opción correcta (pista)")
    # correct_index válido
    if not (0 <= ci < len(opts)):
        probs.append("correct_index fuera de rango")
    if len(opts) != 4:
        probs.append(f"no tiene 4 opciones ({len(opts)})")
    if probs:
        issues += 1
        print(f"  [{eid}] {', '.join(probs)}")
        print(f"     Q: {q[:90]!r}")

print(f"\nTotal con issues: {issues}")
