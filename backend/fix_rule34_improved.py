#!/usr/bin/env python3
"""
Improved rule 34 fixer using more sophisticated pattern matching and removal.
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict

CONTENT_DIR = Path(__file__).resolve().parent / "content"
VIOLATIONS_FILE = Path("/tmp/claude-0/-home-user-intervalo/83be4736-bc3a-5501-b80a-7055128f243b/scratchpad/rule34_violations.json")

STATS = {
    "files_modified": 0,
    "items_fixed": 0,
    "by_family": {1: 0, 2: 0, 3: 0, 4: 0},
    "skipped": 0,
}

FAMILY_ASSIGNMENTS = {}


def paragraphs(s: str) -> list:
    return [p for p in s.split("\n\n") if p.strip()]


def extract_and_remove_diagnostic(text: str) -> tuple:
    """Extract content after diagnostic marker and remove the marker.

    Returns (cleaned_text, was_changed).
    """
    original = text

    # Try each pattern in order of specificity

    # Pattern 1: "el/la/los/las error/confusión/trampa más común/frecuente/típico/clásico/habitual es..."
    m = re.search(
        r"^(.*?)"  # everything before
        r"(?:el|la|los|las|un|una)\s+"
        r"(?:error(?:es)?|confusi[oó]n(?:es)?|trampa(?:s)?)\s+"
        r"(?:(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?))?\s+"
        r"(?:es|son)\s+"
        r"(.*?)$",
        text,
        re.IGNORECASE | re.DOTALL
    )
    if m:
        before, after = m.groups()
        combined = (before.strip() + " " + after.strip()).strip()
        if combined and combined != original.strip():
            return combined, True

    # Pattern 2: "es un/una/el/la error/confusión/trampa más común/frecuente..."
    m = re.search(
        r"^(.*?)"  # everything before
        r"es\s+(?:un|una|el|la|los|las)\s+"
        r"(?:(?:m[aá]s\s+)?(?:t[ií]pic[oa]s?|com[uú]n(?:es)?|frecuente(?:s)?|cl[aá]sico(?:a)?s?|habitual(?:es)?|grave(?:s)?))?\s*"
        r"(?:error(?:es)?|confusi[oó]n(?:es)?|trampa(?:s)?)\s+"
        r"(.*?)$",
        text,
        re.IGNORECASE | re.DOTALL
    )
    if m:
        before, after = m.groups()
        combined = (before.strip() + " " + after.strip()).strip()
        if combined and combined != original.strip():
            return combined, True

    # Pattern 3: "Es fácil/tentador..."
    m = re.match(r"^es\s+(?:f[aá]cil|tentador)\s+(.*?)$", text, re.IGNORECASE | re.DOTALL)
    if m:
        after = m.group(1).strip()
        if after and after != original.strip():
            return after, True

    # Pattern 4: "Ojo/Cuidado/Atención..."
    m = re.match(r"^(?:ojo|atenci[oó]n|cuidado)\b[,:\s]*(.*?)$", text, re.IGNORECASE | re.DOTALL)
    if m:
        after = m.group(1).strip()
        if after and after != original.strip():
            return after, True

    # Pattern 5: "A diferencia de..."
    m = re.match(r"^a\s+diferencia\s+de\s+(.*?)$", text, re.IGNORECASE | re.DOTALL)
    if m:
        after = m.group(1).strip()
        if after and after != original.strip():
            return after, True

    return text, False


def rewrite_with_family(text: str, family: int) -> str:
    """Apply narrative family transformation to extracted text."""

    text = text.strip()
    if not text:
        return text

    # Ensure first letter is capitalized
    if text and text[0].islower():
        text = text[0].upper() + text[1:]

    # Ensure ends with punctuation
    if not text.endswith((".", ":", "?", "!", "$")):
        text = text + "."

    if family == 1:
        # Direct consequence: keep as-is mostly, emphasize causality
        # Add "da por resultado" or similar if not present
        if not re.search(r"(?:da\s+(?:por\s+)?resultado|causa|genera|produce|lleva a)", text, re.IGNORECASE):
            text = text  # Often the content already implies consequence

    elif family == 2:
        # Second person: "Si..., resultado"
        if not text.startswith("Si"):
            # Try to transform to second person
            # Look for verbs and transform them
            text = transform_to_second_person(text)

    elif family == 3:
        # Gerund/infinitive: "Verbo + gerund/infinitivo es frecuente/error"
        if not re.match(r"(?:[A-Z][a-z]+(?:ar|er|ir|ando|iendo))", text):
            text = text  # Keep as-is if already good

    elif family == 4:
        # Neutral observation: state facts
        text = text  # Usually good as-is after marker removal

    return text


def transform_to_second_person(text: str) -> str:
    """Try to transform text to second person."""
    # Simple heuristic: if it looks imperative, wrap with "Si"
    if re.match(r"[A-Z][a-z]+(?:ar|er|ir)", text):
        # It's probably a verb at the start, make it second person
        verb_match = re.match(r"([A-Z][a-z]+(?:ar|er|ir))(.*)$", text)
        if verb_match:
            verb, rest = verb_match.groups()
            # Try simple conjugation heuristics
            if verb.endswith("ar"):
                conj = verb[:-2] + "ás"
            elif verb.endswith("er"):
                conj = verb[:-2] + "és"
            else:  # ir
                conj = verb[:-2] + "ís"
            text = f"Si {conj.lower()}{rest}, obtienes un resultado incorrecto."
    return text


def fix_file(filepath: Path, violations_for_file: list) -> int:
    """Fix all violations in a file."""
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

        # Try to extract and clean
        cleaned, was_changed = extract_and_remove_diagnostic(last_for_match)

        if was_changed and cleaned.strip():
            # Assign family
            key = (filepath.name, item_idx)
            if key not in FAMILY_ASSIGNMENTS:
                FAMILY_ASSIGNMENTS[key] = family_cycle
                family_cycle = (family_cycle % 4) + 1

            family = FAMILY_ASSIGNMENTS[key]

            # Apply family transformation
            new_last = rewrite_with_family(cleaned, family)

            # Preserve bold markers if present in original
            if last_para.startswith("**") and not new_last.startswith("**"):
                match = re.match(r"^(\*\*)(.*)(\*\*)$", last_para)
                if match:
                    new_last = "**" + new_last + "**"

            paras[-1] = new_last
            item["explanation"] = "\n\n".join(paras)
            fixed_count += 1
            STATS["items_fixed"] += 1
            STATS["by_family"][family] += 1
        else:
            STATS["skipped"] += 1

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
            continue

        violations_for_file = by_file[filepath_rel]
        count = fix_file(filepath, violations_for_file)
        if count > 0:
            print(f"  {filepath_rel}: {count}/{len(violations_for_file)} fixed")

    print(f"\n{'='*70}")
    print(f"Files modified: {STATS['files_modified']}")
    print(f"Items fixed: {STATS['items_fixed']}")
    print(f"Items skipped (couldn't extract): {STATS['skipped']}")
    print(f"\nBy narrative family:")
    for fam in [1, 2, 3, 4]:
        print(f"  Family {fam}: {STATS['by_family'][fam]}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
