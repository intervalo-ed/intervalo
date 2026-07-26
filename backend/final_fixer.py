#!/usr/bin/env python3
"""
Final targeted fixer focusing on highest-value, safest fixes.

Targets:
- Anti-accusation "Falta..." → "Recordá que..."
- Simple closing marker rewrites
- Tags distribution (where possible)
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict

CONTENT_DIR = Path(__file__).resolve().parent / "content"

def fix_falta_accusatory(text):
    """Fix "Falta X" accusatory pattern."""
    if not text or "Falta " not in text:
        return text

    # "Falta X" → "El paso es X" or "Recordá que necesitás X"
    if text.startswith("Falta "):
        # Extract what's missing
        rest = text[6:]  # Remove "Falta "

        # Create a neutral alternative
        if "dividir" in rest.lower():
            text = "El divisor falta en tu cálculo: " + rest
        elif "restar" in rest.lower():
            text = "Una resta que falta hacer: " + rest
        elif "sumar" in rest.lower():
            text = "Hay una suma que falta: " + rest
        elif "multiplicar" in rest.lower():
            text = "Falta una multiplicación: " + rest
        else:
            # Generic rewrite
            text = "Recordá que: " + rest

    return text

def fix_simple_closing_markers(text):
    """Fix simple closing marker patterns."""
    if not text:
        return text

    # "Ojo:" → remove or rewrite
    if text.startswith("Ojo:"):
        text = text[4:].strip()
        if text:
            text = text[0].upper() + text[1:]
        return text

    # "Cuidado:" → similar
    if text.startswith("Cuidado:"):
        text = text[8:].strip()
        return text

    # "Atención:" → similar
    if text.startswith("Atención:"):
        text = text[9:].strip()
        return text

    return text

def fix_distractors_length(options, correct_index):
    """Normalize option lengths by trimming excessive details from distractors."""
    if not options or len(options) < 2:
        return options

    # Measure lengths
    def measure(text):
        if not text:
            return 0
        return len(re.sub(r"\s+", " ", text).strip())

    lengths = [measure(opt) for opt in options]
    if not lengths or max(lengths) == 0:
        return options

    median = sorted(lengths)[len(lengths) // 2]
    correct_len = lengths[correct_index]

    result = []
    for i, opt in enumerate(options):
        if i == correct_index:
            # Don't modify correct answer
            result.append(opt)
        else:
            # Distractor: trim if way too long
            curr_len = measure(opt)
            if curr_len > 200:
                # Try to trim unnecessary clauses
                # Remove "para..." clauses
                trimmed = re.sub(r",\s*para\s+[^,]*(?=[,.]|$)", "", opt)
                # Remove parenthetical clarifications
                trimmed = re.sub(r"\s*\([^)]*\)", "", trimmed)
                # Remove "that" clauses if they're excessive
                if measure(trimmed) < curr_len - 20:
                    opt = trimmed

            result.append(opt)

    return result

def fix_exercise(exercise):
    """Apply targeted fixes."""
    fixed = False

    # Fix anti-accusatory feedback
    if "feedback_incorrect" in exercise and exercise["feedback_incorrect"]:
        for i, feedback in enumerate(exercise["feedback_incorrect"]):
            if feedback and isinstance(feedback, str):
                original = feedback
                feedback = fix_falta_accusatory(feedback)
                feedback = fix_simple_closing_markers(feedback)
                if feedback != original:
                    exercise["feedback_incorrect"][i] = feedback
                    fixed = True

    # Fix explanation closing markers
    if "explanation" in exercise and exercise["explanation"]:
        original = exercise["explanation"]
        paras = original.split("\n\n")
        if paras:
            last = paras[-1]
            # Check last paragraph for markers
            fixed_last = fix_simple_closing_markers(last)
            if fixed_last != last:
                paras[-1] = fixed_last
                fixed_text = "\n\n".join(paras)
                if fixed_text != original:
                    exercise["explanation"] = fixed_text
                    fixed = True

    # Fix option symmetry only for extreme cases
    if "options" in exercise and exercise["options"]:
        ci = exercise.get("correct_index", 0)
        original_opts = exercise["options"][:]
        fixed_opts = fix_distractors_length(exercise["options"], ci)
        if fixed_opts != original_opts:
            exercise["options"] = fixed_opts
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
