"""
emoji_tree.py — Árbol de desbloqueo de emojis por carrera.

La fuente de verdad es content/emoji-tree.json: 5 árboles top-level keyeados por
bucket de carrera (E/S/T/M/Otra). La raíz de cada bucket es su emoji "gratis"
(profundidad 0). Cada nivel más profundo se desbloquea por XP; el umbral lo
define la profundidad del nodo (no se guarda en el JSON).

El desbloqueo es automático y no requiere elección: al cruzar el umbral de XP
de una profundidad, TODOS los nodos de esa profundidad (de cualquier rama del
árbol del bucket) quedan desbloqueados. No hay estado propio que persistir —
"desbloqueado" se deriva puramente de total_xp vía unlocked_depth(). Lo único
que el usuario elige es qué emoji ya desbloqueado mostrar (ver can_wear).
"""

import json
from pathlib import Path

_TREE_PATH = Path(__file__).resolve().parent / "content" / "emoji-tree.json"

# Umbral de XP por profundidad. Profundidad 0 = raíz de bucket (gratis).
DEPTH_XP: dict[int, int] = {1: 64, 2: 256, 3: 1024, 4: 4096, 5: 8192}

_raw = json.loads(_TREE_PATH.read_text(encoding="utf-8"))

# node_by_id[id] = {id, emoji, label, depth, bucket, parent, unis, child_ids}
node_by_id: dict[str, dict] = {}
_roots: dict[str, str] = {}  # bucket -> root node id


def _index(node: dict, bucket: str, parent: str | None, depth: int) -> None:
    node_by_id[node["id"]] = {
        "id": node["id"],
        "emoji": node["emoji"],
        "label": node["label"],
        "depth": depth,
        "bucket": bucket,
        "parent": parent,
        "unis": node.get("unis"),
        "child_ids": [c["id"] for c in node.get("children", [])],
    }
    for child in node.get("children", []):
        _index(child, bucket, node["id"], depth + 1)


for _bucket, _root in _raw.items():
    _roots[_bucket] = _root["id"]
    _index(_root, _bucket, None, 0)


def emoji_for(node_id: str | None) -> str | None:
    node = node_by_id.get(node_id) if node_id else None
    return node["emoji"] if node else None


def unlocked_depth(total_xp: int) -> int:
    """Profundidad máxima desbloqueada dado el XP total (0 = raíz/gratis,
    siempre desbloqueada)."""
    depth = 0
    for d, threshold in sorted(DEPTH_XP.items()):
        if total_xp >= threshold:
            depth = d
    return depth


def can_wear(
    node_id: str | None,
    bucket: str | None,
    total_xp: int,
) -> tuple[bool, str | None]:
    """¿Puede vestir `node_id`? None o la raíz del bucket = emoji por defecto.
    Cualquier otro nodo debe estar a una profundidad ya desbloqueada por XP."""
    if node_id is None or node_id == _roots.get(bucket or ""):
        return True, None
    node = node_by_id.get(node_id)
    if node is None or node["bucket"] != bucket:
        return False, "Ese emoji no existe."
    if node["depth"] > unlocked_depth(total_xp):
        threshold = DEPTH_XP.get(node["depth"])
        missing = (threshold - total_xp) if threshold is not None else None
        return False, (
            f"Te faltan {missing} XP." if missing else "Todavía no desbloqueaste ese emoji."
        )
    return True, None


def normalize_worn(node_id: str | None, bucket: str | None) -> str | None:
    """La raíz del bucket se guarda como None (= comportamiento por defecto)."""
    if node_id is not None and node_id == _roots.get(bucket or ""):
        return None
    return node_id
