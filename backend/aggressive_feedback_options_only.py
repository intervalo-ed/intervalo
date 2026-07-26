#!/usr/bin/env python3
"""
Aggressive fixer for ONLY feedbacks and options.

Never touches explanations (to avoid formatting errors).
Focus on:
1. Rewriting accusatory feedback patterns
2. Normalizing feedback length
3. Aggressive option trimming
4. Removing feedback markers

This approach avoids all explanation-related errors (Rule 2, 9, 10, 17).
"""

import json
import re
import sys
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent / "content"

def is_accusatory(text):
    """Check if feedback starts with accusatory pattern."""
    if not text:
        return False

    accusatory_starts = [
        r'^Error',
        r'^La trampa',
        r'^Un error',
        r'^Falta',
        r'^Incorrecto',
        r'^No [a-z]',
        r'^La confusión',
        r'^Equivocado',
        r'^Pensar',  # "Pensar que..."
        r'^Creer',   # "Creer que..."
        r'^Olvidar',
        r'^No considerar',
        r'^Olvidás',  # Spanish: "You forget..."
        r'^Confundís',  # Spanish: "You confuse..."
        r'^Equivocás',  # Spanish: "You make a mistake..."
        r'^No [a-z]ás',  # Spanish: "You don't X..."
    ]

    for pattern in accusatory_starts:
        if re.match(pattern, text, re.IGNORECASE):
            return True

    return False

def rewrite_accusatory(text):
    """Rewrite accusatory patterns to neutral tone."""
    if not text or not is_accusatory(text):
        return text

    # Specific rewrites for common patterns
    rewrites = [
        (r"^Error ", "Parece que hay un error: "),
        (r"^La trampa común es ", "Una práctica común es "),
        (r"^Un error frecuente", "Un enfoque que se intenta frecuentemente"),
        (r"^Un error ", "Un enfoque que se intenta"),
        (r"^Falta ", "Faltó considerar: "),
        (r"^Incorrecto", "Esa no es la respuesta correcta: "),
        (r"^No consideraste", "No se consideró "),
        (r"^La confusión común", "Es fácil confundir"),
        (r"^Pensar que ", "Podría pensarse que "),
        (r"^Creer que ", "Podría creerse que "),
        (r"^Olvidás que ", "Se olvidó que "),
        (r"^Confundís ", "Es fácil confundir "),
        (r"^Equivocás ", "Se comete el error de "),
    ]

    for pattern, repl in rewrites:
        if re.match(pattern, text, re.IGNORECASE):
            result = re.sub(pattern, repl, text, flags=re.IGNORECASE)
            # Capitalize first letter
            if result and result[0].islower():
                result = result[0].upper() + result[1:]
            return result

    # Generic rewrite for patterns not in list
    if is_accusatory(text):
        text = "Nota: " + text
        return text

    return text

def remove_markers(text):
    """Remove warning/note markers."""
    if not text:
        return text

    # Remove markers at start
    text = re.sub(r'^(Ojo|Cuidado|Atención|Nota|Tip)[:\s]*', '', text, flags=re.IGNORECASE)
    text = text.lstrip()

    # Capitalize if needed
    if text and text[0].islower():
        text = text[0].upper() + text[1:]

    return text

def trim_long_distractors_aggressive(options, correct_index):
    """Aggressively trim long distractors."""
    if not options or len(options) < 2:
        return options

    def measure(text):
        if not text:
            return 0
        return len(re.sub(r'\s+', ' ', text).strip())

    lengths = [measure(opt) for opt in options]
    if not lengths or max(lengths) == 0:
        return options

    correct_len = lengths[correct_index]
    median = sorted(lengths)[len(lengths)//2]
    result = []

    for i, opt in enumerate(options):
        if i == correct_index:
            result.append(opt)
        else:
            opt_len = measure(opt)

            # Trim if 1.8x+ correct length or 2x+ median and > 120 chars
            should_trim = (opt_len > correct_len * 1.8 or opt_len > median * 2) and opt_len > 120

            if should_trim:
                # Strategy 1: Remove trailing explanations
                trimmed = re.sub(r',\s*(?:que|porque|para|ya que|si)\s+[^,]*$', '', opt)

                # Strategy 2: Remove parenthetical
                trimmed = re.sub(r'\s*\([^)]*\)$', '', trimmed)

                # Strategy 3: Remove trailing descriptors
                trimmed = re.sub(r',\s*(?:muy|bastante|demasiado|realmente)[^,]*$', '', trimmed)

                trimmed = trimmed.rstrip(' ,.')

                new_len = measure(trimmed)
                if new_len >= 80 and new_len < opt_len - 20:
                    opt = trimmed

            result.append(opt)

    return result

def fix_exercise(exercise):
    """Apply feedback and options fixes only."""
    fixed = False

    # Aggressively fix feedback_incorrect
    if "feedback_incorrect" in exercise and exercise["feedback_incorrect"]:
        for i, fb in enumerate(exercise["feedback_incorrect"]):
            if fb and isinstance(fb, str):
                original = fb
                # Try rewrites
                fb = rewrite_accusatory(fb)
                fb = remove_markers(fb)
                # Trim excessive length
                if len(fb) > 300:
                    trimmed = re.sub(r',\s*(?:que|porque|para)\s+[^,]*$', '', fb)
                    if len(trimmed) > 100:
                        fb = trimmed

                if fb != original:
                    exercise["feedback_incorrect"][i] = fb
                    fixed = True

    # Aggressively trim options
    if "options" in exercise and exercise["options"]:
        ci = exercise.get("correct_index", 0)
        original = exercise["options"][:]
        trimmed = trim_long_distractors_aggressive(exercise["options"], ci)
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
