"""Verifica el catálogo de universidades (backend/universities.py) y su espejo del front.

Lo que se defiende acá:
  - las claves del catálogo son únicas y el front (university-tags.ts) tiene
    EXACTAMENTE las mismas: al agregar una universidad hay que tocar los dos;
  - cada clave no argentina tiene país en PAIS_DE, y cada país del front
    coincide con el del backend;
  - dos universidades de países distintos con la misma sigla (UAI, UNAB, UNA,
    UCA, UNCA) conviven con claves distintas;
  - canonical_university junta variantes de una sigla custom ("Fing" = "FING")
    pero no toca siglas conocidas ni frases;
  - is_junk_university atrapa teclazos y números y NO esconde universidades de
    verdad (ninguna del catálogo, ni "CERN");
  - las siglas que son palabras corrientes ("uni") no se reconocen en el texto
    libre de una donación.

Uso:
    python backend/scripts/check_universities.py

Sale con código 1 si algo falla.
"""

import re
import sys as _s
_s.stdout.reconfigure(encoding="utf-8", errors="replace")
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from universities import (  # noqa: E402
    PAIS_DE,
    SIGLAS_AMBIGUAS,
    UNIVERSITIES,
    canonical_university,
    is_junk_university,
)

fallos: list[str] = []


def check(cond: bool, msg: str) -> None:
    print(("  ok  " if cond else "  FALLA  ") + msg)
    if not cond:
        fallos.append(msg)


claves = [k for k, _ in UNIVERSITIES]
check(len(claves) == len(set(claves)), "las claves del catálogo son únicas")

ts = (BACKEND.parent / "web/src/lib/university-tags.ts").read_text(encoding="utf-8")
front = re.findall(r'key: "([^"]+)"', ts)
check(set(front) == set(claves), f"front y backend tienen las mismas claves ({len(front)} vs {len(claves)})")
check(set(claves) - set(front) == set() and set(front) - set(claves) == set(), "sin claves de más ni de menos")

paises_front = dict(re.findall(r'key: "([^"]+)",(?: label: "[^"]*",)?(?: aliases: \[[^\]]*\],)? country: "(CL|PY)"', ts))
check(
    all(PAIS_DE.get(k) == p for k, p in paises_front.items()) and len(paises_front) == 48,
    "los países de Chile y Paraguay coinciden entre front y backend",
)
check(set(PAIS_DE) <= set(claves), "PAIS_DE solo nombra claves del catálogo")

for sigla in ("UAI", "UNAB", "UNA", "UCA", "UNCA"):
    check(sigla in claves and any(f"{sigla}-{c}" in claves for c in ("CL", "PY")),
          f"{sigla}: la argentina y la extranjera conviven con claves distintas")

check(canonical_university("Fing") == "FING" == canonical_university("fing"), "Fing/fing → FING")
check(canonical_university("uba") == "UBA", "uba → UBA")
check(canonical_university("  Universidad   de Buenos Aires ") == "UBA", "nombre completo con espacios → UBA")
check(canonical_university("ISFD  99") == "ISFD 99", "espacios colapsados en una sigla custom")
check(canonical_university("Instituto Superior Docente") == "Instituto Superior Docente", "una frase no se toca")
check(canonical_university(None) is None and canonical_university("   ") == "", "None y vacío pasan derecho")

for basura in ("jlkhjkjkhjkjh", "23213r", "x", "", "  "):
    check(is_junk_university(basura), f"basura: {basura!r}")
for buena in [k for k in claves] + ["CERN", "ISFD 99", "FING", "UP", "Harvard"]:
    if is_junk_university(buena):
        check(False, f"NO es basura: {buena!r}")
check(True, "ninguna sigla del catálogo se marca como basura")

from game.boosts import universities_in_text  # noqa: E402

check(universities_in_text("para la uni, con cariño") == [], "«uni» en un mensaje no es la UNI de Itapúa")
check("UBA" in universities_in_text("Santi UBA"), "una sigla de verdad sí se reconoce")
check({"UNI", "UNE"} <= SIGLAS_AMBIGUAS, "UNI y UNE están marcadas como ambiguas")

if fallos:
    print(f"\n{len(fallos)} fallas")
    sys.exit(1)
print("\nOK")
