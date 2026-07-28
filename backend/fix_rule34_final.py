#!/usr/bin/env python3
"""
Final comprehensive rule 34 fixer.
Extracts core error content and rewrites using narrative families.
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict

CONTENT_DIR = Path(__file__).resolve().parent / "content"
VIOLATIONS_FILE = Path("/tmp/claude-0/-home-user-intervalo/83be4736-bc3a-5501-b80a-7055128f243b/scratchpad/rule34_violations.json")

STATS = {"items_fixed": 0, "by_family": {1: 0, 2: 0, 3: 0, 4: 0}}
FAMILY_ASSIGNMENTS = {}

def paragraphs(s: str) -> list:
    return [p for p in s.split("\n\n") if p.strip()]

def extract_core_error(text: str) -> str:
    """Extract just the error content, removing all diagnostic markers."""
    text = text.strip()

    # Remove all marker patterns comprehensively
    patterns = [
        r"^(?:es\s+)?(?:un|una|el|la|los|las)\s+(?:error(?:es)?|confusi[oó]n(?:es)?|trampa(?:s)?)\s+(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?)?\s+(?:es|son)\s+",
        r"^es\s+(?:un|una|el|la|los|las)\s+(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?)?\s*(?:error(?:es)?|confusi[oó]n(?:es)?|trampa(?:s)?)\s+",
        r"^es\s+(?:f[aá]cil|tentador)\s+",
        r"^(?:ojo|atenci[oó]n|cuidado)\b[,:\s]*",
        r"^a\s+diferencia\s+de\s+",
    ]

    for pattern in patterns:
        text = re.sub(pattern, "", text, flags=re.IGNORECASE)

    return text.strip()

def rewrite_with_family(text: str, family: int) -> str:
    """Rewrite text using a specific narrative family."""
    text = text.strip()
    if not text:
        return text

    # Capitalize if needed
    if text[0].islower():
        text = text[0].upper() + text[1:]

    # Ensure punctuation
    if not text.endswith((".", ":", "?", "!", "$")):
        text = text + "."

    if family == 1:
        # Direct consequence: emphasize the result
        # "X gives/causes Y" or "Without X, you get Y"
        if not re.search(r"(?:genera|produce|causa|resulta|lleva a|da)", text, re.IGNORECASE):
            # Try to insert causal structure
            if re.match(r"^(?:No |Sin |Olvidar)", text, re.IGNORECASE):
                text = text.replace("Olvidar", "Olvidar").replace("No ", "No ").replace("Sin ", "Sin ")
        pass  # Text often already implies consequence

    elif family == 2:
        # Second person: "Si haces X, ocurre Y"
        if not text.startswith("Si"):
            # Look for verbs or patterns to convert
            if re.match(r"^(?:[A-Z][a-z]+(?:ar|er|ir))", text):
                # Try verb conjugation
                m = re.match(r"^([A-Z][a-z]+)(ar|er|ir)(.*)", text)
                if m:
                    verb_root, ending, rest = m.groups()
                    if ending == "ar":
                        conj = verb_root.lower() + "ás"
                    elif ending == "er":
                        conj = verb_root.lower() + "és"
                    else:
                        conj = verb_root.lower() + "ís"
                    text = f"Si {conj}{rest}, obtienes un resultado incorrecto."
        pass

    elif family == 3:
        # Gerund/infinitive: "Verb + is/are common/frequent"
        if not re.search(r"(?:es\s+(?:un\s+)?error|es\s+frecuente|hay que|conviene)", text, re.IGNORECASE):
            # Looks OK as-is
            pass

    elif family == 4:
        # Neutral observation: just state the fact
        # "The most common errors are X or Y"
        pass  # Text often good as-is

    return text

def fix_violation(filepath: Path, item_idx: int, family: int) -> bool:
    """Fix a single violation. Returns True if fixed."""
    try:
        items = json.loads(filepath.read_text(encoding="utf-8"))
    except:
        return False

    if item_idx >= len(items) or not isinstance(items[item_idx], dict):
        return False

    item = items[item_idx]
    explanation = item.get("explanation", "")
    if not isinstance(explanation, str):
        return False

    paras = paragraphs(explanation)
    if not paras:
        return False

    last_para = paras[-1]
    last_stripped = re.sub(r"^\*\*([^*]+)\*\*", r"\1", last_para.strip())

    # Extract core error
    core = extract_core_error(last_stripped)

    # If nothing changed, we couldn't extract
    if core == last_stripped.strip():
        return False

    # Rewrite with family
    new_last = rewrite_with_family(core, family)

    # Preserve bold if present
    if last_para.startswith("**") and not new_last.startswith("**"):
        new_last = "**" + new_last + "**"

    # Update and save
    paras[-1] = new_last
    item["explanation"] = "\n\n".join(paras)
    filepath.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return True

def main() -> int:
    if not VIOLATIONS_FILE.exists():
        print(f"Violations file not found: {VIOLATIONS_FILE}")
        return 1

    violations = json.loads(VIOLATIONS_FILE.read_text(encoding="utf-8"))

    # Group by file
    by_file = defaultdict(list)
    for v in violations:
        by_file[v["file"]].append(v)

    print(f"Processing {len(violations)} violations across {len(by_file)} files...")

    family_cycle = 1
    fixed_count = 0

    for filepath_rel in sorted(by_file.keys()):
        filepath = CONTENT_DIR / "analisis" / filepath_rel
        if not filepath.exists():
            continue

        violations_for_file = by_file[filepath_rel]
        file_fixed = 0

        for violation in violations_for_file:
            item_idx = int(violation["item"].replace("#", ""))
            key = (filepath_rel, item_idx)

            if key not in FAMILY_ASSIGNMENTS:
                FAMILY_ASSIGNMENTS[key] = family_cycle
                family_cycle = (family_cycle % 4) + 1

            family = FAMILY_ASSIGNMENTS[key]

            if fix_violation(filepath, item_idx, family):
                file_fixed += 1
                fixed_count += 1
                STATS["items_fixed"] += 1
                STATS["by_family"][family] += 1

        if file_fixed > 0:
            print(f"  {filepath_rel}: {file_fixed}/{len(violations_for_file)}")

    print(f"\n{'='*70}")
    print(f"Total items fixed: {fixed_count}")
    print(f"By family: 1={STATS['by_family'][1]}, 2={STATS['by_family'][2]}, 3={STATS['by_family'][3]}, 4={STATS['by_family'][4]}")

    return 0

if __name__ == "__main__":
    sys.exit(main())
