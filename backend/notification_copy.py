"""
notification_copy.py — Category pool + weighted rotation for push notification copy.

Each category has one or more copy variants. `due_notifications`
(push_store.py) builds a context dict per due user, picks a category via
weighted random selection (excluding the user's last-sent category unless
it's the only option), picks a variant within that category (excluding the
last-sent variant with the same fallback), and renders the winning variant's
title/body — the notifier and service worker just relay what comes back from
`render`, they never see category/variant.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Callable

CATEGORY_PRACTICE = "practice"
CATEGORY_UNIVERSITY = "university"
CATEGORY_SOCIAL = "social"
CATEGORY_RANKING = "ranking"
CATEGORY_PODIUM = "podium"
CATEGORY_REACTIVATION = "reactivation"
CATEGORY_PERSONAL_BEST = "personal_best"

# Pesos por categoría (suman 1.0) — ajustados a mano con el usuario.
CATEGORY_WEIGHTS: dict[str, float] = {
    CATEGORY_UNIVERSITY: 0.20,
    CATEGORY_SOCIAL: 0.15,
    CATEGORY_RANKING: 0.15,
    CATEGORY_PODIUM: 0.15,
    CATEGORY_PRACTICE: 0.15,
    CATEGORY_REACTIVATION: 0.10,
    CATEGORY_PERSONAL_BEST: 0.10,
}


@dataclass(frozen=True)
class Variant:
    key: str
    available: Callable[[dict], bool]
    render: Callable[[dict], tuple[str, str]]


# ── Practice ─────────────────────────────────────────────────────────────────

def _practice_reminder(context: dict) -> tuple[str, str]:
    return "Intervalo", "¡Vení a repasar! Tus ejercicios te esperan 🦾"


def _practice_cta(context: dict) -> tuple[str, str]:
    return "Intervalo", "¡Vení a practicar! Elegí un tema y sumá XP 🦾"


def _practice_yesterday(context: dict) -> tuple[str, str]:
    n = context["exercises_yesterday"]
    return "Intervalo", f"Ayer resolviste {n} ejercicios. ¿Y hoy? 📚"


def _practice_next_tier(context: dict) -> tuple[str, str]:
    days = context["days_to_next_tier"]
    mult = context["next_multiplier"]
    return (
        "Intervalo",
        f"Estás a {days} días para mejorar tu multiplicador de XP a "
        f"×{mult:.1f}. ¡Vení a practicar! ⚡",
    )


# ── University ───────────────────────────────────────────────────────────────

def _university_weekly_xp(context: dict) -> tuple[str, str]:
    xp = context["xp_this_week"]
    uni = context["university"]
    return "Intervalo", f"Sumaste {xp} XP para la {uni} esta semana ¿Seguimos? 🎓"


def _university_top_contributor(context: dict) -> tuple[str, str]:
    uni = context["university"]
    return (
        "Intervalo",
        f"¡Fuiste de los que más aportó XP esta semana a la {uni}! ¿Seguimos? 🏆",
    )


def _university_rival_gap(context: dict) -> tuple[str, str]:
    gap = context["xp_gap_rival"]
    rival = context["rival_university"]
    return (
        "Intervalo",
        f"Tu universidad está a {gap} XP de alcanzar a la {rival}. ¡Vení a repasar! 🎓",
    )


# ── Social universidad ───────────────────────────────────────────────────────

def _social_active_today(context: dict) -> tuple[str, str]:
    n = context["social_count"]
    uni = context["university"]
    return "Intervalo", f"{n} compañeros de la {uni} ya repasaron hoy. ¿Vos? 🎓"


# ── Ranking ──────────────────────────────────────────────────────────────────

def _ranking_generic(context: dict) -> tuple[str, str]:
    return "Intervalo", "Alguien te pasó en el ranking. ¿Lo dejás así? 🤼"


def _ranking_named(context: dict) -> tuple[str, str]:
    name = context["overtaker_name"]
    return "Intervalo", f"{name} te alcanzó en el ranking. ¿Lo dejás así? 🤼"


# ── Cerca del podio ──────────────────────────────────────────────────────────

def _podium_general(context: dict) -> tuple[str, str]:
    gap = context["podium_gap_general"]
    threshold = context["podium_threshold_general"]
    return (
        "Intervalo",
        f"Estás a {gap} XP del top {threshold} del ranking. ¡Dale que se puede! 🏅",
    )


def _podium_university(context: dict) -> tuple[str, str]:
    gap = context["podium_gap_university"]
    threshold = context["podium_threshold_university"]
    uni = context["university"]
    return (
        "Intervalo",
        f"Estás a {gap} XP del top {threshold} de la {uni}. ¡Dale que se puede! 🏅",
    )


# ── Reactivación ─────────────────────────────────────────────────────────────

def _reactivation(context: dict) -> tuple[str, str]:
    days = context["days_inactive"]
    return (
        "Intervalo",
        f"Hace {days} días que no practicás. ¿Volvemos? 👀",
    )


# ── Récord personal ──────────────────────────────────────────────────────────

def _personal_best(context: dict) -> tuple[str, str]:
    best = context["personal_best"]
    return (
        "Intervalo",
        f"Tu mejor racha de ejercicios en un día fue {best}. ¿La superás hoy? 🚀",
    )


def _practice_has_yesterday(ctx: dict) -> bool:
    return (ctx.get("exercises_yesterday") or 0) > 0


def _practice_has_next_tier(ctx: dict) -> bool:
    return ctx.get("days_to_next_tier") is not None


_VARIANTS: dict[str, list[Variant]] = {
    CATEGORY_PRACTICE: [
        # reminder/cta son el fallback genérico: solo aparecen cuando ninguna
        # variante más específica (yesterday/next_tier) aplica.
        Variant(
            "practice_reminder",
            lambda ctx: not (_practice_has_yesterday(ctx) or _practice_has_next_tier(ctx)),
            _practice_reminder,
        ),
        Variant(
            "practice_cta",
            lambda ctx: not (_practice_has_yesterday(ctx) or _practice_has_next_tier(ctx)),
            _practice_cta,
        ),
        Variant("practice_yesterday", _practice_has_yesterday, _practice_yesterday),
        Variant("practice_next_tier", _practice_has_next_tier, _practice_next_tier),
    ],
    CATEGORY_UNIVERSITY: [
        Variant(
            "university_weekly_xp",
            lambda ctx: (ctx.get("xp_this_week") or 0) > 0 and ctx.get("university") is not None,
            _university_weekly_xp,
        ),
        Variant(
            "university_top_contributor",
            lambda ctx: bool(ctx.get("is_top_contributor")) and ctx.get("university") is not None,
            _university_top_contributor,
        ),
        Variant(
            "university_rival_gap",
            lambda ctx: (ctx.get("xp_gap_rival") or 0) > 0 and ctx.get("rival_university") is not None,
            _university_rival_gap,
        ),
    ],
    CATEGORY_SOCIAL: [
        Variant(
            "social_active_today",
            lambda ctx: (ctx.get("social_count") or 0) > 5 and ctx.get("university") is not None,
            _social_active_today,
        ),
    ],
    CATEGORY_RANKING: [
        Variant(
            "ranking_named",
            lambda ctx: bool(ctx.get("overtaken")) and ctx.get("overtaker_name") is not None,
            _ranking_named,
        ),
        Variant("ranking_generic", lambda ctx: bool(ctx.get("overtaken")), _ranking_generic),
    ],
    CATEGORY_PODIUM: [
        Variant(
            "podium_general",
            lambda ctx: (ctx.get("podium_gap_general") or 0) > 0,
            _podium_general,
        ),
        Variant(
            "podium_university",
            lambda ctx: (ctx.get("podium_gap_university") or 0) > 0 and ctx.get("university") is not None,
            _podium_university,
        ),
    ],
    CATEGORY_REACTIVATION: [
        Variant(
            "reactivation_days",
            lambda ctx: (ctx.get("days_inactive") or 0) > 1,
            _reactivation,
        ),
    ],
    CATEGORY_PERSONAL_BEST: [
        Variant(
            "personal_best_beat",
            lambda ctx: ctx.get("personal_best") is not None,
            _personal_best,
        ),
    ],
}


def _available_variants(category: str, context: dict) -> list[Variant]:
    return [v for v in _VARIANTS[category] if v.available(context)]


def available_categories(context: dict) -> set[str]:
    return {cat for cat in CATEGORY_WEIGHTS if _available_variants(cat, context)}


def choose_variant(
    *, context: dict, last_category: str | None, last_variant_key: str | None
) -> tuple[str, Variant]:
    """Weighted-random category (excluding `last_category` unless it's the
    only one available), then uniform-random variant within it (excluding
    `last_variant_key` with the same fallback)."""
    available = available_categories(context)
    if not available:
        # practice siempre tiene al menos una variante sin requisitos, y
        # due_notifications solo llega acá con count > 0 garantizado.
        raise ValueError("no notification category available for this context")

    weighted = {cat: CATEGORY_WEIGHTS[cat] for cat in available}
    if len(weighted) > 1 and last_category in weighted:
        without_last = {cat: w for cat, w in weighted.items() if cat != last_category}
        if sum(without_last.values()) > 0:
            weighted = without_last

    categories = list(weighted.keys())
    weights = [weighted[c] for c in categories]
    category = random.choices(categories, weights=weights, k=1)[0]

    variants = _available_variants(category, context)
    pool = [v for v in variants if v.key != last_variant_key] or variants
    variant = random.choice(pool)
    return category, variant


def render(category: str, variant: Variant, context: dict) -> tuple[str, str]:
    return variant.render(context)
