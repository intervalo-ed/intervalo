import {
  EMOJI_TREE,
  DEPTH_XP,
  type EmojiBucket,
  type EmojiNode,
} from "./emoji-tree.generated"

export { EMOJI_TREE, DEPTH_XP }
export type { EmojiBucket, EmojiNode }

export function getRoot(bucket: string | null | undefined): EmojiNode | null {
  if (!bucket) return null
  return EMOJI_TREE[bucket as EmojiBucket] ?? null
}

// Busca un nodo por id dentro del árbol del bucket (camina el árbol completo).
export function findNode(
  bucket: string | null | undefined,
  id: string | null | undefined,
): EmojiNode | null {
  const root = getRoot(bucket)
  if (!root || !id) return null
  const stack: EmojiNode[] = [root]
  while (stack.length) {
    const n = stack.pop()!
    if (n.id === id) return n
    if (n.children) stack.push(...n.children)
  }
  return null
}

// ── Layout horizontal por columnas (tidy tree) ──────────────────────────────────
// Profundidad = columna (x); cada hoja ocupa una fila y cada nodo interno se
// centra entre sus hijos (y). Devuelve coordenadas absolutas (centro del nodo).

export type LaidNode = {
  node: EmojiNode
  depth: number
  parentId: string | null
  x: number
  y: number
}

export type TreeLayout = {
  nodes: LaidNode[]
  width: number
  height: number
}

// Separaciones entre centros de nodos. Compactas (estilo Minecraft): el tile
// mide 44px, así que con COL_W=60 el hueco horizontal queda en ~16px y con
// ROW_H=54 el vertical en ~10px.
const COL_W = 60 // separación horizontal entre niveles
const ROW_H = 54 // separación vertical entre hojas
const MARGIN = 32

export function layoutTree(root: EmojiNode): TreeLayout {
  type Tmp = {
    node: EmojiNode
    depth: number
    parentId: string | null
    row: number
  }
  const tmp: Tmp[] = []
  let leaf = 0
  let maxDepth = 0

  function walk(n: EmojiNode, depth: number, parentId: string | null): number {
    maxDepth = Math.max(maxDepth, depth)
    const children = n.children ?? []
    let row: number
    if (children.length === 0) {
      row = leaf++
    } else {
      const rows = children.map((c) => walk(c, depth + 1, n.id))
      row = (rows[0] + rows[rows.length - 1]) / 2
    }
    tmp.push({ node: n, depth, parentId, row })
    return row
  }
  walk(root, 0, null)

  const lastRow = Math.max(0, leaf - 1)
  const nodes: LaidNode[] = tmp.map((t) => ({
    node: t.node,
    depth: t.depth,
    parentId: t.parentId,
    x: MARGIN + t.depth * COL_W,
    y: MARGIN + t.row * ROW_H,
  }))

  return {
    nodes,
    width: MARGIN * 2 + maxDepth * COL_W,
    height: MARGIN * 2 + lastRow * ROW_H,
  }
}

// Profundidad máxima desbloqueada dado el XP total (0 = raíz/gratis, siempre
// desbloqueada). Mismo cálculo que unlocked_depth() en backend/emoji_tree.py.
export function unlockedDepth(totalXp: number): number {
  let depth = 0
  for (const [d, threshold] of Object.entries(DEPTH_XP)) {
    if (totalXp >= threshold) depth = Math.max(depth, Number(d))
  }
  return depth
}

// Conjunto de ids desbloqueados: todo nodo cuya profundidad sea <= la
// alcanzada por XP, sin importar de qué rama del árbol cuelgue (el desbloqueo
// es automático por nivel completo, no una elección de camino).
export function unlockedNodeIds(
  bucket: string | null | undefined,
  totalXp: number,
): Set<string> {
  const root = getRoot(bucket)
  const unlocked = new Set<string>()
  if (!root) return unlocked
  const maxDepth = unlockedDepth(totalXp)
  const stack: { node: EmojiNode; depth: number }[] = [{ node: root, depth: 0 }]
  while (stack.length) {
    const { node, depth } = stack.pop()!
    if (depth > maxDepth) continue
    unlocked.add(node.id)
    for (const c of node.children ?? []) stack.push({ node: c, depth: depth + 1 })
  }
  return unlocked
}
