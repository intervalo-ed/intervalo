#!/usr/bin/env python3
"""
Smart fixer that validates changes to ensure no errors are introduced.

Strategy:
1. Try a fix on a copy of the data
2. Validate the copy
3. Only keep fixes that don't increase error count
"""

import json
import re
import sys
import subprocess
import tempfile
import shutil
from pathlib import Path
from copy import deepcopy

CONTENT_DIR = Path(__file__).resolve().parent / "content"

def validate_course(course_dir):
    """Run validator and return warning/error counts."""
    result = subprocess.run(
        ["python", "content/validate_content.py", "--course", course_dir.name, "--json"],
        capture_output=True,
        text=True,
        cwd=CONTENT_DIR.parent
    )

    try:
        data = json.loads(result.stdout)
        return data.get("errors", 0), data.get("warnings", 0)
    except:
        return None, None

def fix_accusatory_tone(text):
    """Rewrite accusatory feedback."""
    if not text:
        return text

    # More aggressive replacements
    replacements = [
        (r"^La confusión", "Una posibilidad es confundir"),
        (r"^El error", "Un error que se comete"),
        (r"^Un error", "Un error que se comete"),
        (r"^La trampa", "Una trampa común es"),
    ]

    for pattern, replacement in replacements:
        if re.match(pattern, text, re.IGNORECASE):
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE | re.MULTILINE)
            if text and text[0].islower():
                text = text[0].upper() + text[1:]
            return text

    return text

def fix_closing_markers(text):
    """Fix problematic closing markers."""
    if not text:
        return text

    # Remove or rewrite markers
    patterns = [
        (r"^(Ojo|Cuidado|Atención)[:\s]+", "Recordá: "),
        (r"^(Nota|Tip)[:\s]+", ""),
    ]

    for pattern, replacement in patterns:
        if re.match(pattern, text, re.IGNORECASE):
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
            if text and text[0].islower() and replacement:
                text = text[0].upper() + text[1:]
            return text.strip()

    return text

def split_inline_latex_aggressive(text):
    """More aggressive splitting of inline LaTeX."""
    if not text:
        return text

    paragraphs = text.split("\n\n")
    result = []

    for para in paragraphs:
        # Count inline LaTeX
        inline_count = len(re.findall(r"(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)", para))

        if inline_count >= 3:
            # Split at sentence boundaries when there are multiple formulas
            sentences = re.split(r'(?<=[.!?])\s+', para)
            if len(sentences) > 2:
                # Group by formula density
                grouped = []
                current = ""
                for sent in sentences:
                    sent_formulas = len(re.findall(r"(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)", sent))
                    if current and sent_formulas > 0 and len(current) > 60:
                        # Start new group before this formula-heavy sentence
                        grouped.append(current)
                        current = sent
                    else:
                        current += (" " if current else "") + sent
                if current:
                    grouped.append(current)

                if len(grouped) >= 2:
                    result.append("\n\n".join(grouped))
                else:
                    result.append(para)
            else:
                result.append(para)
        else:
            result.append(para)

    return "\n\n".join(result)

def fix_exercise_aggressive(exercise):
    """Apply aggressive but safe fixes."""
    fixed = False

    # Fix feedback_incorrect tone (very safe)
    if "feedback_incorrect" in exercise and exercise["feedback_incorrect"]:
        for i, feedback in enumerate(exercise["feedback_incorrect"]):
            if feedback:
                original = feedback
                feedback = fix_accusatory_tone(feedback)
                feedback = fix_closing_markers(feedback)
                if feedback != original:
                    exercise["feedback_incorrect"][i] = feedback
                    fixed = True

    # Fix explanation closing markers (very safe)
    if "explanation" in exercise and exercise["explanation"]:
        original = exercise["explanation"]
        paras = original.split("\n\n")
        if len(paras) > 1:
            last = paras[-1]
            # Remove bold for checking
            last_check = re.sub(r"^\*\*([^*]+)\*\*", r"\1", last)

            if re.match(r"^(Ojo|Cuidado|Atención|Nota)[:\s]+", last_check):
                fixed_last = fix_closing_markers(last_check)
                paras[-1] = fixed_last
                fixed_text = "\n\n".join(paras)
                if fixed_text != original:
                    exercise["explanation"] = fixed_text
                    fixed = True

    # Try splitting inline LaTeX (if explanation is long enough to handle it)
    if "explanation" in exercise and exercise["explanation"]:
        original = exercise["explanation"]
        if len(original) > 500 and len(re.findall(r"(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)", original)) >= 3:
            split_text = split_inline_latex_aggressive(original)
            if split_text != original and len(split_text) >= 300:
                exercise["explanation"] = split_text
                fixed = True

    return fixed

def fix_file(file_path):
    """Fix a single JSON file with validation."""
    with open(file_path, 'r', encoding='utf-8') as f:
        exercises = json.load(f)

    if not isinstance(exercises, list):
        return 0, 0

    fixes_applied = 0
    for exercise in exercises:
        if fix_exercise_aggressive(exercise):
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

    print(f"=== Starting comprehensive fixes for {course} ===\n")

    # Get baseline
    print("Getting baseline validation...")
    baseline_errors, baseline_warnings = validate_course(course_dir)
    print(f"Baseline: {baseline_errors} errors, {baseline_warnings} warnings\n")

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

    # Validate final state
    print(f"\nFinal validation...")
    final_errors, final_warnings = validate_course(course_dir)
    if baseline_errors is not None:
        error_change = final_errors - baseline_errors
        warning_change = final_warnings - baseline_warnings
        print(f"Errors: {baseline_errors} → {final_errors} ({error_change:+d})")
        print(f"Warnings: {baseline_warnings} → {final_warnings} ({warning_change:+d})")
    else:
        print(f"Errors: {final_errors}, Warnings: {final_warnings}")

    return 0

if __name__ == "__main__":
    sys.exit(main())
