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

const COL_W = 96 // separación horizontal entre niveles
const ROW_H = 64 // separación vertical entre hojas
const MARGIN = 48

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

// Conjunto de ids "vivos": alcanzables dado el camino comprometido. Al elegir un
// nodo en un cruce, las ramas hermanas (y sus subárboles) dejan de estar vivas.
export function aliveSet(layout: TreeLayout, path: string[]): Set<string> {
  const byId = new Map(layout.nodes.map((n) => [n.node.id, n]))
  const alive = new Set<string>()
  // Procesar por profundidad ascendente: el padre antes que el hijo.
  const ordered = [...layout.nodes].sort((a, b) => a.depth - b.depth)
  for (const ln of ordered) {
    if (ln.parentId === null) {
      alive.add(ln.node.id) // raíz
      continue
    }
    const parent = byId.get(ln.parentId)!
    if (!alive.has(parent.node.id)) continue
    // Si el padre está a una profundidad ya decidida, solo el hijo elegido vive.
    const decided = parent.depth < path.length
    if (!decided || path[parent.depth] === ln.node.id) {
      alive.add(ln.node.id)
    }
  }
  return alive
}
