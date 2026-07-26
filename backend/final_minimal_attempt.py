#!/usr/bin/env python3
"""
Final attempt: Only fix the absolute most obvious cases with zero risk.

Strategy: Be so selective that there's virtually no risk of introducing errors.
1. Only touch explanations with 5+ inline formulas (very dense)
2. Only split at clear sentence boundaries
3. Only add spaces, never touch formatting around formulas
4. Only trim options that are 3x+ longer than median
"""

import json
import re
import sys
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent / "content"

def count_formulas(text):
    """Count inline $...$ formulas."""
    return len(re.findall(r"(?<!\$)\$(?!\$)[^$\n]+?\$(?!\$)", text))

def split_dense_explanation(text):
    """Only split if explanation is VERY dense (5+ formulas) and long."""
    if not text or len(text) < 600:
        return text

    formula_count = count_formulas(text)
    if formula_count < 5:
        return text

    # Only split at clear sentence boundaries
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if len(sentences) < 4:
        return text

    # Create groups while keeping formula density balanced
    groups = []
    current = ""
    for sent in sentences:
        if current and len(current) > 300:
            groups.append(current)
            current = sent
        else:
            current = (current + " " + sent) if current else sent

    if current:
        groups.append(current)

    # Only return split if creates well-formed groups (all >= 150 chars)
    if len(groups) >= 2 and all(len(g.strip()) >= 150 for g in groups):
        return "\n\n".join(groups)

    return text

def trim_extreme_options(options, correct_index):
    """Only trim if option is 3x+ longer than median."""
    if not options or len(options) < 2:
        return options

    def measure(text):
        return len(re.sub(r'\s+', ' ', text).strip()) if text else 0

    lengths = [measure(opt) for opt in options]
    if not lengths or max(lengths) == 0:
        return options

    median = sorted(lengths)[len(lengths)//2]
    result = options[:]

    for i, opt in enumerate(options):
        if i == correct_index:
            continue

        opt_len = measure(opt)
        # VERY selective: only if 3x+ median AND > 200 chars
        if opt_len > median * 3 and opt_len > 200:
            # Conservative trim: just remove trailing parentheticals
            trimmed = re.sub(r'\s*\([^)]*\)$', '', opt)
            if measure(trimmed) >= 150 and measure(trimmed) < opt_len - 50:
                result[i] = trimmed

    return result

def fix_exercise(exercise):
    """Apply extremely minimal fixes."""
    fixed = False

    # Only split VERY dense explanations
    if "explanation" in exercise and exercise["explanation"]:
        original = exercise["explanation"]
        if count_formulas(original) >= 5:
            text = split_dense_explanation(original)
            if text != original and len(text) >= 300:
                exercise["explanation"] = text
                fixed = True

    # Only trim EXTREME distractors
    if "options" in exercise and exercise["options"]:
        ci = exercise.get("correct_index", 0)
        original = exercise["options"][:]
        trimmed = trim_extreme_options(exercise["options"], ci)
        if trimmed != original:
            exercise["options"] = trimmed
            fixed = True

    return fixed

def fix_file(file_path):
    """Fix a single JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            exercises = json.load(f)
    except:
        return 0, 0

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
