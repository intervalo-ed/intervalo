"""
emoji_tree.py — Árbol de desbloqueo de emojis por carrera.

La fuente de verdad es content/emoji-tree.json: 5 árboles top-level keyeados por
bucket de carrera (E/S/T/M/Otra). La raíz de cada bucket es su emoji "gratis"
(profundidad 0). Cada nivel más profundo se desbloquea por XP; el umbral lo
define la profundidad del nodo (no se guarda en el JSON).

El camino del usuario es una cadena append-only (un solo track irreversible):
un nodo solo es desbloqueable si su padre es la punta del camino ya recorrido
(o la raíz del bucket si el camino está vacío).
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


def bucket_root(bucket: str | None) -> str | None:
    """Id de la raíz (emoji gratis) del bucket de carrera, o None si no existe."""
    return _roots.get(bucket) if bucket else None


def threshold_for_depth(depth: int) -> int | None:
    return DEPTH_XP.get(depth)


def emoji_for(node_id: str | None) -> str | None:
    node = node_by_id.get(node_id) if node_id else None
    return node["emoji"] if node else None


def can_unlock(
    committed_path: list[str],
    node_id: str,
    total_xp: int,
    bucket: str | None,
) -> tuple[bool, str | None]:
    """¿Puede el usuario desbloquear `node_id` ahora? Devuelve (ok, motivo)."""
    node = node_by_id.get(node_id)
    if node is None:
        return False, "Ese emoji no existe."
    if node["bucket"] != bucket:
        return False, "Ese emoji no es de tu carrera."
    if node_id in committed_path:
        return False, "Ya lo tenés desbloqueado."
    tip = committed_path[-1] if committed_path else _roots.get(bucket or "")
    if node["parent"] != tip:
        return False, "Tenés que desbloquear el paso anterior primero."
    threshold = DEPTH_XP.get(node["depth"])
    if threshold is None:
        return False, "Ese emoji no es desbloqueable."
    if total_xp < threshold:
        return False, f"Te faltan {threshold - total_xp} XP."
    return True, None


def can_wear(
    committed_path: list[str],
    node_id: str | None,
    bucket: str | None,
) -> tuple[bool, str | None]:
    """¿Puede vestir `node_id`? None o la raíz del bucket = emoji por defecto."""
    if node_id is None or node_id == _roots.get(bucket or ""):
        return True, None
    if node_id in committed_path:
        return True, None
    return False, "Todavía no desbloqueaste ese emoji."


def normalize_worn(node_id: str | None, bucket: str | None) -> str | None:
    """La raíz del bucket se guarda como None (= comportamiento por defecto)."""
    if node_id is not None and node_id == _roots.get(bucket or ""):
        return None
    return node_id
