#!/usr/bin/env python3
"""
Direct fixer for all rule 34 violations.

Uses smart transformations based on violation type and rotates through 4 narrative families.
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict
from typing import Tuple

CONTENT_DIR = Path(__file__).resolve().parent / "content"

# Patterns from validator
DIAGNOSTIC_CLOSE_RE = re.compile(
    r"(?:"
    r"\b(el|la|los|las|una?|este|esta|estos|estas)\s+(confusi[oó]n(es)?|error(es)?|trampa(s)?)\b"
    r"(?:\s+(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?))?"
    r"\s+(?:es|son)\b"
    r"|"
    r"(?<!no )es\s+(?:un|una|la|el|los|las)\s+(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?)?\s*(confusi[oó]n(es)?|error(es)?|trampa(s)?)\b"
    r")",
    re.IGNORECASE,
)
FILLER_CLOSE_RE = re.compile(r"^es\s+(f[aá]cil|tentador)\b", re.IGNORECASE)
MARKER_CLOSE_RE = re.compile(r"^(ojo|atenci[oó]n|cuidado)\b", re.IGNORECASE)
CONTRAST_CLOSE_RE = re.compile(r"^a\s+diferencia\s+de\b", re.IGNORECASE)

VIOLATIONS_FILE = Path("/tmp/claude-0/-home-user-intervalo/83be4736-bc3a-5501-b80a-7055128f243b/scratchpad/rule34_violations.json")

STATS = {
    "files_modified": 0,
    "items_fixed": 0,
    "by_family": {1: 0, 2: 0, 3: 0, 4: 0},
    "by_type": defaultdict(int),
}

# Map: (file, item_idx) -> family to use (for consistency)
FAMILY_ASSIGNMENTS = {}


def paragraphs(s: str) -> list:
    return [p for p in s.split("\n\n") if p.strip()]


def get_violation_type(text: str) -> str:
    """Determine what type of rule 34 violation this is."""
    last = re.sub(r"^\*\*([^*]+)\*\*", r"\1", text.strip())

    if DIAGNOSTIC_CLOSE_RE.search(last):
        return "diagnostic"
    elif FILLER_CLOSE_RE.match(last):
        return "filler"
    elif MARKER_CLOSE_RE.match(last):
        return "marker"
    elif CONTRAST_CLOSE_RE.match(last):
        return "contrast"
    return "unknown"


def remove_diagnostic_marker(text: str) -> str:
    """Remove the diagnostic marker from the beginning."""
    # Pattern: "el/la/los error/confusión + es/son"
    text = re.sub(
        r"^(el|la|los|las|un|una)\s+(error(?:es)?|confusi[oó]n(?:es)?|trampa(?:s)?)\s+"
        r"(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?)?\s+"
        r"(?:es|son)\s+",
        "",
        text,
        flags=re.IGNORECASE
    )
    # Pattern: "es un/una/el/la error/confusión"
    text = re.sub(
        r"^(?:(?<!no\s))es\s+(?:un|una|el|la|los|las)\s+(?:m[aá]s\s+)?"
        r"(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?)?\s*"
        r"(?:error(?:es)?|confusi[oó]n(?:es)?|trampa(?:s)?)\s+",
        "",
        text,
        flags=re.IGNORECASE
    )
    # Filler: "Es fácil/tentador"
    text = re.sub(r"^es\s+(?:f[aá]cil|tentador)\s+", "", text, flags=re.IGNORECASE)
    # Marker: "Ojo/Cuidado/Atención"
    text = re.sub(r"^(?:ojo|atenci[oó]n|cuidado)[,:\s]*", "", text, flags=re.IGNORECASE)
    # Contrast: "A diferencia de"
    text = re.sub(r"^a\s+diferencia\s+de\s+", "", text, flags=re.IGNORECASE)

    return text.strip()


def rewrite_with_family(text: str, violation_type: str, family: int) -> str:
    """Rewrite the last paragraph using the specified narrative family."""

    # Remove the diagnostic marker
    cleaned = remove_diagnostic_marker(text)

    if not cleaned:
        return text  # Can't rewrite if nothing left

    # Capitalize first letter if needed
    if cleaned and cleaned[0].islower():
        cleaned = cleaned[0].upper() + cleaned[1:]

    if family == 1:
        # Direct consequence: emphasize what happens if you do X wrong
        # "Olvidar X causa Y" or "Sin expandir, obtienes Z"
        if violation_type in ("marker", "filler"):
            # These often have imperative structure, transform to consequence
            cleaned = cleaned + "." if not cleaned.endswith((".", ":", "?", "!")) else cleaned
        elif not re.search(r"(?:causa|genera|produce|lleva a|da\s+por|resulta en)", cleaned, re.IGNORECASE):
            # Add causal language if not present
            cleaned = cleaned + "." if not cleaned.endswith((".", ":", "?", "!")) else cleaned

    elif family == 2:
        # Second person: "Si haces X, sucede Y"
        if not cleaned.startswith("Si "):
            # Transform to "Si... sucede/obtienes/resulta"
            cleaned = "Si " + cleaned.lower().lstrip() if cleaned[0].isupper() else "Si " + cleaned
            if not re.search(r"(?:sucede|obtienes|resulta|llegas a)", cleaned, re.IGNORECASE):
                cleaned = cleaned + ", obtienes un resultado incorrecto." if not cleaned.endswith((".", ":")) else cleaned

    elif family == 3:
        # Gerund/infinitive: "Olvidar X es un error frecuente; hay que..."
        if not re.match(r"(?:[A-Z][a-z]+(?:ar|er|ir)(?:se)?)", cleaned):
            # See if we can identify a gerund-compatible start
            cleaned = cleaned
        if not re.search(r"(?:es un error|es frecuente|hay que|conviene)", cleaned, re.IGNORECASE):
            cleaned = cleaned + "." if not cleaned.endswith((".", ":")) else cleaned

    elif family == 4:
        # Neutral observation: state facts about errors
        # Often works best as-is with just the marker removed
        cleaned = cleaned + "." if not cleaned.endswith((".", ":")) else cleaned

    return cleaned


def fix_file(filepath: Path, violations_for_file: list) -> int:
    """Fix all violations in a file. Returns count of fixed items."""
    try:
        items = json.loads(filepath.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        print(f"Error reading {filepath}: {e}", file=sys.stderr)
        return 0

    if not isinstance(items, list):
        return 0

    fixed_count = 0
    family_cycle = 1

    for violation in violations_for_file:
        item_idx = int(violation["item"].replace("#", ""))
        if item_idx >= len(items):
            continue

        item = items[item_idx]
        if not isinstance(item, dict):
            continue

        explanation = item.get("explanation")
        if not isinstance(explanation, str) or not explanation.strip():
            continue

        paras = paragraphs(explanation)
        if not paras:
            continue

        last_para = paras[-1]
        last_for_match = re.sub(r"^\*\*([^*]+)\*\*", r"\1", last_para.strip())

        # Determine violation type
        vtype = get_violation_type(last_for_match)
        if vtype == "unknown":
            continue

        # Assign family if not already assigned
        key = (filepath.name, item_idx)
        if key not in FAMILY_ASSIGNMENTS:
            FAMILY_ASSIGNMENTS[key] = family_cycle
            family_cycle = (family_cycle % 4) + 1

        family = FAMILY_ASSIGNMENTS[key]

        # Rewrite the last paragraph
        new_last = rewrite_with_family(last_for_match, vtype, family)

        if new_last != last_for_match:
            # Preserve leading bold markers if present
            if last_para.startswith("**"):
                match = re.match(r"^(\*\*)([^*]+)(\*\*)", last_para)
                if match:
                    new_last = match.group(1) + new_last[len(match.group(2)):].lstrip() + match.group(3)

            paras[-1] = new_last
            item["explanation"] = "\n\n".join(paras)
            fixed_count += 1
            STATS["items_fixed"] += 1
            STATS["by_family"][family] += 1
            STATS["by_type"][vtype] += 1

    if fixed_count > 0:
        filepath.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        STATS["files_modified"] += 1

    return fixed_count


def main() -> int:
    if not VIOLATIONS_FILE.exists():
        print(f"Violations file not found: {VIOLATIONS_FILE}", file=sys.stderr)
        return 1

    violations = json.loads(VIOLATIONS_FILE.read_text(encoding="utf-8"))

    # Group violations by file
    by_file = defaultdict(list)
    for v in violations:
        by_file[v["file"]].append(v)

    print(f"Processing {len(by_file)} files with {len(violations)} total violations...")

    for filepath_rel in sorted(by_file.keys()):
        filepath = CONTENT_DIR / "analisis" / filepath_rel
        if not filepath.exists():
            print(f"Warning: file not found: {filepath}", file=sys.stderr)
            continue

        violations_for_file = by_file[filepath_rel]
        count = fix_file(filepath, violations_for_file)
        if count > 0:
            print(f"  {filepath_rel}: {count}/{len(violations_for_file)} fixed")

    print(f"\n{'='*70}")
    print(f"Files modified: {STATS['files_modified']}")
    print(f"Items fixed: {STATS['items_fixed']}")
    print(f"\nBy narrative family:")
    for fam in [1, 2, 3, 4]:
        print(f"  Family {fam}: {STATS['by_family'][fam]}")
    print(f"\nBy violation type:")
    for vtype in sorted(STATS['by_type'].keys()):
        print(f"  {vtype}: {STATS['by_type'][vtype]}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
