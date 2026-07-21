"""Validador determinista de contenido de ejercicios.

Corre los checks automatizables de `authoring-context.md` sobre los JSON de un
curso. Dos niveles de hallazgo:

- ERROR:   violación inequívoca de una regla. Exit code 1. Se corrige siempre.
- WARNING: heurística. Se revisa con criterio; si se deja, se justifica en el
           mensaje de commit.

Uso (desde `backend/`):

    python content/validate_content.py --course analisis
    python content/validate_content.py --course analisis --topic brown/integrals/definite
    python content/validate_content.py --course analisis --check options,structure
    python content/validate_content.py --course analisis --json

Reglas citadas por número de `authoring-context.md`. Los checks NO cubiertos acá
(quedan en el checklist manual del topic-context): regla 25 (porqué vs qué),
regla 30 (aligned de datos vs derivación), regla 31 (reintroducir definición),
reglas duras por topic (+C, frontera matemática, límites actualizados).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path
from statistics import median

CONTENT_DIR = Path(__file__).resolve().parent

ALL_CHECKS = ["options", "explanations", "questions", "feedbacks", "structure"]

# --- Umbrales calibrables -----------------------------------------------------

LONGEST_RATIO = 1.5      # correcta más larga: > ratio x mediana de distractores
SHORTEST_RATIO = 0.6     # correcta más corta: < ratio x mediana de distractores
MIN_ABS_GAP = 5          # y la diferencia absoluta (render) supera este piso
OPENER_REPEAT_FRACTION = 0.3   # misma apertura en >=30% de los ítems del archivo
OPENER_REPEAT_MIN = 3
PARAGRAPH_PROSE_MAX = 200      # regla: párrafo de prosa <=200 chars (warning)
INLINE_FRAGMENTS_WARN = 3      # regla 21 dice 2+; se marca desde 3 para bajar ruido
EXPLANATION_MIN = 300
FEEDBACK_CORRECT_MAX = 160
CORRECT_INDEX_SKEW = 0.5

ACCUSATORY_STARTS = [
    "Confunde", "Confundís", "Invierte", "Invertís", "Olvida", "Olvidás",
    "Ignora", "Ignorás", "Interpreta", "Falla en", "Se olvidó", "Falta",
]

EMDASH = "—"
ENDASH = "–"
CHECKMARKS = ("✓", "✗", "✘")

# --- Utilidades de texto ------------------------------------------------------

DISPLAY_RE = re.compile(r"\$\$.*?\$\$", re.DOTALL)
INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)")
TEXTCMD_RE = re.compile(r"\\text\{([^{}]*)\}")
LATEX_CMD_RE = re.compile(r"\\[a-zA-Z]+")


def render_len(s: str) -> int:
    """Longitud de render estimada: descuenta sintaxis LaTeX y delimitadores."""
    t = s
    t = t.replace("$$", "").replace("$", "")
    t = TEXTCMD_RE.sub(lambda m: m.group(1), t)
    t = LATEX_CMD_RE.sub("", t)
    t = re.sub(r"[{}^_&]|\\\\|\\[,;!:]", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    return len(t)


def strip_math(s: str) -> str:
    """Texto con las zonas matemáticas ($...$ y $$...$$) removidas."""
    return INLINE_RE.sub(" ", DISPLAY_RE.sub(" ", s))


def paragraphs(s: str) -> list[str]:
    return [p for p in s.split("\n\n") if p.strip()]


def word_count(s: str) -> int:
    return len([w for w in re.split(r"\s+", s.strip()) if w])


# --- Motor de hallazgos -------------------------------------------------------

class Findings:
    def __init__(self) -> None:
        self.rows: list[dict] = []

    def add(self, level: str, check: str, rule: str, file: str, item: str, msg: str) -> None:
        self.rows.append({
            "level": level, "check": check, "rule": rule,
            "file": file, "item": item, "message": msg,
        })

    def errors(self) -> int:
        return sum(1 for r in self.rows if r["level"] == "ERROR")

    def warnings(self) -> int:
        return sum(1 for r in self.rows if r["level"] == "WARNING")


# --- Checks por familia -------------------------------------------------------

def check_options(items, file, F: Findings) -> None:
    for idx, it in enumerate(items):
        opts = it.get("options") or []
        ci = it.get("correct_index")
        label = f"#{idx}"
        if not isinstance(ci, int) or not (0 <= ci < len(opts)):
            continue  # structure lo reporta
        if len(opts) < 2:
            continue
        raws = [len(o) for o in opts]
        rends = [render_len(o) for o in opts]
        d_raw = [v for i, v in enumerate(raws) if i != ci]
        d_rend = [v for i, v in enumerate(rends) if i != ci]
        med_raw, med_rend = median(d_raw), median(d_rend)

        # Correcta única más larga, en ambas métricas.
        if (raws[ci] > max(d_raw) and rends[ci] > max(d_rend)
                and med_raw > 0 and med_rend > 0
                and raws[ci] > LONGEST_RATIO * med_raw
                and rends[ci] > LONGEST_RATIO * med_rend
                and rends[ci] - max(d_rend) >= MIN_ABS_GAP):
            F.add("WARNING", "options", "4", file, label,
                  f"la correcta es la única notablemente más larga "
                  f"(render {rends[ci]} vs mediana {med_rend:.0f}): {opts[ci]!r}")

        # Correcta única más corta, en ambas métricas.
        if (raws[ci] < min(d_raw) and rends[ci] < min(d_rend)
                and raws[ci] < SHORTEST_RATIO * med_raw
                and rends[ci] < SHORTEST_RATIO * med_rend
                and med_rend - rends[ci] >= MIN_ABS_GAP):
            F.add("WARNING", "options", "15", file, label,
                  f"la correcta es la única notablemente más corta "
                  f"(render {rends[ci]} vs mediana {med_rend:.0f}): {opts[ci]!r}")

        # Glosa entre paréntesis fuera de zona math, en una sola opción.
        has_paren = [("(" in strip_math(o)) for o in opts]
        if sum(has_paren) == 1:
            which = has_paren.index(True)
            role = "la correcta" if which == ci else f"un distractor (#{which})"
            F.add("WARNING", "options", "4", file, label,
                  f"paréntesis aclaratorio solo en {role}: {opts[which]!r}")

        # Relleno "solamente" asimétrico.
        has_only = ["solamente" in o.lower() for o in opts]
        if 0 < sum(has_only) < len(opts):
            F.add("WARNING", "options", "4/15", file, label,
                  "relleno 'solamente' en algunas opciones y no en todas")


def _check_text_common(text, field, file, label, F: Findings) -> None:
    """Checks compartidos entre explanation / question / feedbacks."""
    if "\n\n$$" in text or "$$\n\n" in text:
        F.add("ERROR", field, "2", file, label, r"\n\n pegado a un bloque $$...$$")
    if EMDASH in text:
        F.add("ERROR", field, "6", file, label, "em-dash (—) en el texto")
    if ENDASH in text and not re.search(r"\d" + ENDASH + r"\d", text):
        F.add("ERROR", field, "6", file, label, "en-dash (–) fuera de un rango numérico")
    for c in CHECKMARKS:
        if c in text:
            F.add("ERROR", field, "14", file, label, f"símbolo {c!r} prohibido")
    if re.search(r"(?<!\$)\$\\begin\{aligned\}", text):
        F.add("ERROR", field, "17b", file, label,
              r"\begin{aligned} envuelto en $ simple (debe ser $$)")
    if "\\begin{aligned}" in text and "\\\\\\\\" in text:
        F.add("ERROR", field, "17b", file, label,
              r"\\\\ duplicado dentro de un aligned")
    for m in TEXTCMD_RE.finditer(text):
        content = m.group(1)
        wc = word_count(content)
        if "(" in content or ")" in content or wc > 4:
            F.add("ERROR", field, "26", file, label,
                  f"\\text{{}} con cláusula larga o paréntesis: {content!r}")
        elif wc >= 3:
            F.add("WARNING", field, "26", file, label,
                  f"\\text{{}} de {wc} palabras, preferible moverlo a la prosa: {content!r}")
    # 0/0 apilada en zona inline.
    for m in INLINE_RE.finditer(text):
        if re.search(r"\\[dt]?frac\{0\}\{0\}", m.group(1)):
            F.add("ERROR", field, "28", file, label,
                  "fracción 0/0 apilada tejida inline en prosa")
            break


def _check_display_flow(text, field, file, label, F: Findings) -> None:
    """Regla 9/10/32: cierre antes de $$ y mayúscula después."""
    lines = text.split("\n")
    for i, line in enumerate(lines):
        nxt = lines[i + 1].strip() if i + 1 < len(lines) else ""
        cur = line.strip()
        if nxt.startswith("$$") and cur and not cur.startswith("$$"):
            if not cur.endswith((".", ":", "?", "!")):
                F.add("ERROR", field, "9/32", file, label,
                      f"la línea previa a un bloque $$ no cierra en puntuación: {cur[:60]!r}")
        if cur.endswith("$$") and nxt and not nxt.startswith("$$"):
            first = nxt[0]
            if first.isalpha() and first.islower():
                F.add("ERROR", field, "10", file, label,
                      f"texto tras un bloque $$ arranca en minúscula: {nxt[:60]!r}")


def check_explanations(items, file, F: Findings) -> None:
    for idx, it in enumerate(items):
        text = it.get("explanation")
        label = f"#{idx}"
        if not isinstance(text, str) or not text.strip():
            F.add("ERROR", "explanations", "-", file, label, "explanation ausente o vacía")
            continue
        if len(text) < EXPLANATION_MIN:
            F.add("ERROR", "explanations", "-", file, label,
                  f"explanation de {len(text)} chars (mínimo {EXPLANATION_MIN})")
        _check_text_common(text, "explanations", file, label, F)
        _check_display_flow(text, "explanations", file, label, F)
        for p in paragraphs(text):
            stripped = p.rstrip()
            if not stripped.endswith((".", ":", "?", "!", "$")):
                F.add("ERROR", "explanations", "17", file, label,
                      f"párrafo sin puntuación terminal: ...{stripped[-40:]!r}")
            prose = DISPLAY_RE.sub(" ", p)
            prose_flat = re.sub(r"\s+", " ", prose).strip()
            if len(prose_flat) > PARAGRAPH_PROSE_MAX:
                F.add("WARNING", "explanations", "párrafos", file, label,
                      f"párrafo de prosa de {len(prose_flat)} chars (máx {PARAGRAPH_PROSE_MAX}): "
                      f"{prose_flat[:60]!r}...")
            inline_count = len(INLINE_RE.findall(prose))
            if inline_count >= INLINE_FRAGMENTS_WARN:
                F.add("WARNING", "explanations", "21", file, label,
                      f"{inline_count} fragmentos LaTeX inline en el mismo párrafo")


def check_questions(items, file, F: Findings) -> None:
    openers: Counter[str] = Counter()
    for idx, it in enumerate(items):
        text = it.get("question")
        label = f"#{idx}"
        if not isinstance(text, str) or not text.strip():
            F.add("ERROR", "questions", "-", file, label, "question ausente o vacía")
            continue
        _check_text_common(text, "questions", file, label, F)
        _check_display_flow(text, "questions", file, label, F)
        lines = text.split("\n")
        if len(lines) > 1 and lines[1].strip().startswith("$$"):
            openers[lines[0].strip()] += 1
        # Fórmula central tejida inline (regla 18).
        for m in INLINE_RE.finditer(text):
            if re.search(r"\\[dt]?frac", m.group(1)):
                F.add("WARNING", "questions", "18", file, label,
                      f"fracción tejida inline en el enunciado: ${m.group(1)[:40]}$")
                break
    total = len(items)
    threshold = max(OPENER_REPEAT_MIN, int(total * OPENER_REPEAT_FRACTION))
    for opener, count in openers.items():
        if count >= threshold:
            F.add("WARNING", "questions", "32", file, "ALL",
                  f"misma apertura en {count}/{total} ítems (plantilla repetida): {opener[:60]!r}")


def check_feedbacks(items, file, F: Findings) -> None:
    for idx, it in enumerate(items):
        label = f"#{idx}"
        opts = it.get("options") or []
        ci = it.get("correct_index")
        fc = it.get("feedback_correct")
        if isinstance(fc, str) and fc.strip():
            _check_text_common(fc, "feedbacks", file, label, F)
            if not fc.rstrip().endswith((".", "?", "!", "$")):
                F.add("ERROR", "feedbacks", "17", file, label,
                      "feedback_correct sin puntuación terminal")
            if len(fc) > FEEDBACK_CORRECT_MAX:
                F.add("WARNING", "feedbacks", "-", file, label,
                      f"feedback_correct de {len(fc)} chars (ideal 1 oración corta)")
            if fc.count("=") >= 3:
                F.add("WARNING", "feedbacks", "fórmulas anchas", file, label,
                      "feedback_correct con 3+ igualdades, mover la derivación a explanation")
        fi = it.get("feedback_incorrect")
        if not isinstance(fi, list):
            F.add("ERROR", "feedbacks", "-", file, label, "feedback_incorrect ausente o no-lista")
            continue
        if len(fi) != len(opts):
            F.add("ERROR", "feedbacks", "-", file, label,
                  f"feedback_incorrect de largo {len(fi)} vs {len(opts)} opciones")
            continue
        for j, entry in enumerate(fi):
            if j == ci:
                if entry is not None:
                    F.add("ERROR", "feedbacks", "-", file, label,
                          "feedback_incorrect no es null en el índice correcto")
                continue
            if not isinstance(entry, str) or not entry.strip():
                F.add("ERROR", "feedbacks", "-", file, label,
                      f"feedback_incorrect[{j}] vacío o null fuera del índice correcto")
                continue
            _check_text_common(entry, "feedbacks", file, label, F)
            if not entry.rstrip().endswith((".", "?", "!", "$")):
                F.add("ERROR", "feedbacks", "17", file, label,
                      f"feedback_incorrect[{j}] sin puntuación terminal")
            first_words = entry.strip()
            for start in ACCUSATORY_STARTS:
                if first_words.startswith(start + " ") or first_words == start:
                    F.add("WARNING", "feedbacks", "anti-acusación", file, label,
                          f"feedback_incorrect[{j}] arranca acusatorio: {entry[:50]!r}")
                    break


# --- Structure: tags contra la tabla del topic-context ------------------------

SLUG_CELL_RE = re.compile(r"`([a-z0-9]+(?:-[a-z0-9]+)*)`")


def parse_distribution(topic_context: Path) -> dict[str, int]:
    """Extrae {slug: cantidad} de las tablas markdown con columna Slug/Cant y menciones en prose."""
    targets: dict[str, int] = {}
    if not topic_context.exists():
        return targets
    text = topic_context.read_text(encoding="utf-8")

    # Parse tablas markdown
    for line in text.splitlines():
        if not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        slug = None
        count = None
        for c in cells:
            m = SLUG_CELL_RE.fullmatch(c)
            if m:
                slug = m.group(1)
        # la celda de cantidad es la última numérica de la fila (puede tener ~ al inicio)
        for c in reversed(cells):
            m = re.fullmatch(r"~?(\d+)", c)
            if m:
                count = int(m.group(1))
                break
        if slug and count is not None:
            targets[slug] = targets.get(slug, 0) + count

    # Parse menciones inline: "(NN ejercicios):* ... slug único `slug`"
    for m in re.finditer(r"\((\d+)\s+ejercicios[^`]*slug\s+único\s+`([a-z0-9]+(?:-[a-z0-9]+)*)`", text):
        count_str, slug = m.groups()
        count = int(count_str)
        if slug and count:
            targets[slug] = targets.get(slug, 0) + count

    return targets


def check_structure(items, file, F: Findings, targets: dict[str, int]) -> None:
    ci_counter: Counter[int] = Counter()
    tag_counter: Counter[str] = Counter()
    for idx, it in enumerate(items):
        label = f"#{idx}"
        opts = it.get("options") or []
        ci = it.get("correct_index")
        if len(opts) not in (2, 3, 4):
            F.add("ERROR", "structure", "cardinalidad", file, label,
                  f"{len(opts)} opciones (esperado 2-4)")
        if not isinstance(ci, int) or not (0 <= ci < len(opts)):
            F.add("ERROR", "structure", "-", file, label,
                  f"correct_index inválido: {ci!r}")
        else:
            ci_counter[ci] += 1
        tags = it.get("tags")
        if targets:
            if not isinstance(tags, list) or not tags:
                F.add("ERROR", "structure", "tags", file, label,
                      "sin campo tags (la tabla de distribución del topic lo exige)")
            else:
                for t in tags:
                    if t not in targets:
                        F.add("ERROR", "structure", "tags", file, label,
                              f"slug desconocido {t!r} (no está en la tabla del topic-context)")
                    else:
                        tag_counter[t] += 1
    total = sum(ci_counter.values())
    if total >= 6:
        top_idx, top_count = ci_counter.most_common(1)[0]
        if top_count / total > CORRECT_INDEX_SKEW:
            F.add("ERROR", "structure", "correct_index", file, "ALL",
                  f"{top_count}/{total} ítems con correct_index={top_idx} (máx 50%)")
    for slug, count in tag_counter.items():
        if targets.get(slug) is not None and count != targets[slug]:
            F.add("WARNING", "structure", "tags", file, "ALL",
                  f"slug {slug!r}: {count} ítems vs {targets[slug]} de la tabla "
                  "(esperable durante generación parcial; al cierre debe coincidir)")


# --- Runner -------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--course", default="analisis")
    ap.add_argument("--topic", default=None,
                    help="ruta belt/unit/topic (ej. brown/integrals/definite)")
    ap.add_argument("--check", default=",".join(ALL_CHECKS),
                    help=f"lista separada por comas de: {','.join(ALL_CHECKS)}")
    ap.add_argument("--json", action="store_true", dest="as_json")
    args = ap.parse_args()

    checks = [c.strip() for c in args.check.split(",") if c.strip()]
    bad = [c for c in checks if c not in ALL_CHECKS]
    if bad:
        print(f"checks desconocidos: {bad} (válidos: {ALL_CHECKS})", file=sys.stderr)
        return 2

    course_dir = CONTENT_DIR / args.course
    if not course_dir.is_dir():
        print(f"no existe el curso: {course_dir}", file=sys.stderr)
        return 2

    if args.topic:
        topic_dirs = [course_dir / args.topic.replace("\\", "/")]
        if not topic_dirs[0].is_dir():
            print(f"no existe el topic: {topic_dirs[0]}", file=sys.stderr)
            return 2
    else:
        topic_dirs = sorted(
            {p.parent for p in course_dir.glob("*/*/*/[A-Z]*.json")}
        )

    F = Findings()
    files_scanned = 0
    items_scanned = 0
    for topic_dir in topic_dirs:
        targets = parse_distribution(topic_dir / "topic-context.md")
        for jf in sorted(topic_dir.glob("[A-Z]*.json")):
            rel = jf.relative_to(course_dir).as_posix()
            try:
                items = json.loads(jf.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                F.add("ERROR", "structure", "-", rel, "-", f"JSON inválido: {e}")
                continue
            if not isinstance(items, list):
                F.add("ERROR", "structure", "-", rel, "-", "el archivo no es un array de ítems")
                continue
            files_scanned += 1
            items_scanned += len(items)
            if "options" in checks:
                check_options(items, rel, F)
            if "explanations" in checks:
                check_explanations(items, rel, F)
            if "questions" in checks:
                check_questions(items, rel, F)
            if "feedbacks" in checks:
                check_feedbacks(items, rel, F)
            if "structure" in checks:
                check_structure(items, rel, F, targets)

    if args.as_json:
        print(json.dumps({
            "course": args.course,
            "files": files_scanned,
            "items": items_scanned,
            "errors": F.errors(),
            "warnings": F.warnings(),
            "findings": F.rows,
        }, ensure_ascii=False, indent=2))
    else:
        current_file = None
        for r in F.rows:
            if r["file"] != current_file:
                current_file = r["file"]
                print(f"\n== {current_file} ==")
            print(f"  [{r['level']}] {r['item']:>5} | {r['check']} (regla {r['rule']}): {r['message']}")
        print(f"\n{'-'*70}")
        print(f"Archivos: {files_scanned} | Ítems: {items_scanned} | "
              f"ERRORS: {F.errors()} | WARNINGS: {F.warnings()}")
        by_check = Counter((r["check"], r["level"]) for r in F.rows)
        for (check, level), n in sorted(by_check.items()):
            print(f"  {check:<14} {level:<8} {n}")

    return 1 if F.errors() else 0


if __name__ == "__main__":
    sys.exit(main())
