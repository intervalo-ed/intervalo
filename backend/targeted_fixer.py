#!/usr/bin/env python3
"""
Targeted fixer for remaining content warnings.

Conservative approach that focuses on:
- Rule 34: Explanation closing style (safe rewrites)
- Anti-accusation: Accusatory feedback tone (safe replacements)
- Rule 21: Only very safe inline LaTeX splits
- Párrafos: Already handled in previous pass
"""

import json
import re
import sys
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent / "content"

def fix_accusatory_feedback(text):
    """Rewrite accusatory feedback starts."""
    if not text:
        return text

    original = text

    # Fix common accusatory openings
    replacements = [
        (r"^La confusión (?:común|típica|frecuente|clásica)", "Una posibilidad es confundir"),
        (r"^El error (?:común|típico|frecuente|clásico)", "Una forma de errar"),
        (r"^Un error (?:común|típico|frecuente|clásico)", "Una forma de errar"),
        (r"^La trampa", "Una trampa común"),
    ]

    for pattern, replacement in replacements:
        if re.match(pattern, text, re.IGNORECASE):
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
            # Capitalize after replacement if needed
            if text and text[0].islower():
                text = text[0].upper() + text[1:]
            return text

    return original

def fix_diagnostic_closing(text):
    """Fix problematic explanation closings."""
    if not text:
        return text

    original = text

    # Pattern 1: "Ojo/Cuidado/Atención:" at the start
    if re.match(r"^(Ojo|Cuidado|Atención|Nota)[:\s]+", text, re.IGNORECASE):
        text = re.sub(r"^(Ojo|Cuidado|Atención|Nota)[:\s]+", "", text, flags=re.IGNORECASE).strip()
        if text:
            text = text[0].upper() + text[1:]
        return text

    # Pattern 2: "Es fácil/tentador..." - these are actually OK in many cases, be conservative
    # Only fix if it's clearly a marker
    if re.match(r"^Es (fácil|tentador) confundir", text, re.IGNORECASE):
        text = re.sub(r"^Es (fácil|tentador) confundir", "Fácilmente se confunde", text, flags=re.IGNORECASE)
        return text

    # Pattern 3: "A diferencia de..." contrasts are sometimes OK, only fix if obviously wrong
    if re.match(r"^A diferencia de [a-z]", text, re.IGNORECASE):
        # This might be legitimate in some cases, be conservative
        return original

    return original

def split_extreme_latex_density(text):
    """Only split paragraphs with EXTREME inline formula density (5+)."""
    if not text:
        return text

    # Count inline LaTeX fragments
    inline_count = len(re.findall(r"(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)", text))

    # Only split if VERY high density
    if inline_count < 5:
        return text

    # Very conservative: only split if we can do it at paragraph boundaries (double newlines exist)
    if "\n\n" in text:
        paras = text.split("\n\n")
        result = []
        for para in paras:
            para_inline = len(re.findall(r"(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)", para))
            if para_inline >= 5:
                # Try to split at sentences
                sentences = re.split(r'(?<=[.!?])\s+', para)
                if len(sentences) > 1:
                    grouped = []
                    current = ""
                    formula_count = 0
                    for sent in sentences:
                        sent_formulas = len(re.findall(r"(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)", sent))
                        if current and formula_count >= 2 and sent_formulas > 0:
                            grouped.append(current)
                            current = sent
                            formula_count = sent_formulas
                        else:
                            current += (" " if current else "") + sent
                            formula_count += sent_formulas
                    if current:
                        grouped.append(current)
                    if len(grouped) > 1:
                        result.append("\n\n".join(grouped))
                    else:
                        result.append(para)
                else:
                    result.append(para)
            else:
                result.append(para)
        return "\n\n".join(result)

    return text

def fix_exercise(exercise):
    """Apply targeted fixes."""
    fixed = False

    # Fix accusatory feedback_incorrect
    if "feedback_incorrect" in exercise and exercise["feedback_incorrect"]:
        for i, feedback in enumerate(exercise["feedback_incorrect"]):
            if feedback:
                original = feedback
                # Fix accusatory tone
                feedback = fix_accusatory_feedback(feedback)
                # Fix diagnostic markers
                feedback = fix_diagnostic_closing(feedback)
                if feedback != original:
                    exercise["feedback_incorrect"][i] = feedback
                    fixed = True

    # Fix explanation closing (only if obviously problematic)
    if "explanation" in exercise and exercise["explanation"]:
        original = exercise["explanation"]
        paras = original.split("\n\n")
        if paras:
            # Only fix the last paragraph if it has obvious markers
            last = paras[-1].strip()
            last_unbolded = re.sub(r"^\*\*([^*]+)\*\*", r"\1", last)

            # Only fix if we detect problematic patterns
            if re.match(r"^(Ojo|Cuidado|Atención|Nota)[:\s]+", last_unbolded, re.IGNORECASE):
                fixed_last = fix_diagnostic_closing(last_unbolded)
                paras[-1] = fixed_last
                fixed_text = "\n\n".join(paras)
                if fixed_text != original:
                    exercise["explanation"] = fixed_text
                    fixed = True

    return fixed

def fix_file(file_path):
    """Fix a single JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        exercises = json.load(f)

    if not isinstance(exercises, list):
        return 0, 0

    fixes_applied = 0
    for exercise in exercises:
        if fix_exercise(exercise):
            fixes_applied += 1

    if fixes_applied > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(exercises, f, ensure_ascii=False, indent=2)

    return len(exercises), fixes_applied

def main():
    course = sys.argv[1] if len(sys.argv) > 1 else "analisis"
    course_dir = CONTENT_DIR / course

    if not course_dir.exists():
        print(f"Course directory not found: {course_dir}")
        return 1

    total_exercises = 0
    total_files = 0
    total_fixes = 0

    for json_file in sorted(course_dir.rglob("*.json")):
        exercises, fixes = fix_file(json_file)
        total_exercises += exercises
        total_files += 1
        total_fixes += fixes

        if fixes > 0:
            rel_path = json_file.relative_to(CONTENT_DIR)
            print(f"Fixed {fixes} exercises in {rel_path}")

    print(f"\n=== Summary ===")
    print(f"Course: {course}")
    print(f"Files processed: {total_files}")
    print(f"Exercises processed: {total_exercises}")
    print(f"Exercises fixed: {total_fixes}")

    return 0

if __name__ == "__main__":
    sys.exit(main())
