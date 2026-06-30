"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Screen,
  ScreenFooter,
  ScreenHeader,
} from "@/components/ui/screen"
import { Wordmark } from "@/components/wordmark"
import { XpDots } from "@/components/xp-dots"
import { cn } from "@/lib/utils"
import {
  aliveSet,
  DEPTH_XP,
  getRoot,
  layoutTree,
  type LaidNode,
} from "@/lib/emoji-tree"
import { useEmojiState } from "./UseEmojiState"
import { useSetWornEmoji, useUnlockEmoji } from "./UseEmojiMutations"

// Tamaño del cuadradito. Las posiciones (x, y) las da el layout semi-radial.
const TILE = 44

// Conectores: gris vivo, gris apagado (rama abandonada) y azul del trayecto.
const WIRE_ALIVE = "#575866"
const WIRE_DEAD = "#2e2d44"
const WIRE_PATH = "#5457e5"

// Conector en ángulo recto (estilo Minecraft), sin diagonales. Sale por la
// DERECHA del padre, baja/sube por un bus vertical a mitad de camino entre las
// dos columnas, y entra por la IZQUIERDA del hijo. Así varios hijos del mismo
// padre comparten el mismo bus y nunca parece que la línea sale por arriba/abajo.
const elbow = (p: { x: number; y: number }, c: { x: number; y: number }) => {
  const busX = (p.x + c.x) / 2
  return `M ${p.x + TILE / 2} ${p.y} H ${busX} V ${c.y} H ${c.x - TILE / 2}`
}

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

export function EmojiTreeScreen() {
  const router = useRouter()
  const { data: state, isLoading } = useEmojiState()
  const setWorn = useSetWornEmoji()
  const unlock = useUnlockEmoji()
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<LaidNode | null>(null)

  const root = getRoot(state?.bucket)
  const path = useMemo(() => state?.path ?? [], [state?.path])
  const worn = state?.worn ?? null
  const totalXp = state?.total_xp ?? 0

  const layout = useMemo(() => (root ? layoutTree(root) : null), [root])
  const alive = useMemo(
    () => (layout ? aliveSet(layout, path) : new Set<string>()),
    [layout, path],
  )
  const byId = useMemo(
    () => new Map((layout?.nodes ?? []).map((n) => [n.node.id, n])),
    [layout],
  )
  const wornId = worn ?? root?.id ?? null
  const tip = path.length ? path[path.length - 1] : root?.id ?? null

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!scrollRef.current || !layout) return
    const target =
      (tip ? byId.get(tip) : undefined) ??
      layout.nodes.find((n) => n.parentId === null)
    if (!target) return
    const el = scrollRef.current
    el.scrollTo({
      left: Math.max(0, target.x - el.clientWidth / 2),
      top: Math.max(0, target.y - el.clientHeight / 2),
      behavior: "instant",
    })
  }, [layout, tip, byId])
  // Foco inicial = lo que el usuario tiene puesto.
  const focused = focusedId ?? wornId
  const focusedNode = focused ? byId.get(focused) : undefined

  // Trayecto azul: cadena de ancestros del nodo enfocado (raíz → … → enfocado).
  // Así, al seleccionar un nodo se pintan todos los anteriores de su línea.
  const trajectoryD = useMemo(() => {
    if (!layout || !focused) return ""
    const chain: LaidNode[] = []
    let cur = byId.get(focused)
    while (cur) {
      chain.unshift(cur)
      cur = cur.parentId ? byId.get(cur.parentId) : undefined
    }
    let d = ""
    for (let i = 1; i < chain.length; i++) {
      d += elbow(chain[i - 1], chain[i]) + " "
    }
    return d.trim()
  }, [layout, focused, byId])

  // Ids de los ancestros del enfocado (incluido él): sus marcos se pintan de azul.
  const pathSet = useMemo(() => {
    const ids = new Set<string>()
    let cur = focused ? byId.get(focused) : undefined
    while (cur) {
      ids.add(cur.node.id)
      cur = cur.parentId ? byId.get(cur.parentId) : undefined
    }
    return ids
  }, [focused, byId])

  // Estado del CTA según el nodo enfocado.
  const cta = computeCta({
    focusedNode,
    rootId: root?.id ?? null,
    path,
    tip,
    wornId,
    totalXp,
  })

  function back() {
    router.push("/profile")
  }

  function onCta() {
    if (!focusedNode || cta.kind === "disabled") return
    if (cta.kind === "wear") {
      const target = focusedNode.node.id === root?.id ? null : focusedNode.node.id
      setWorn.mutate(target)
    } else if (cta.kind === "unlock") {
      setConfirming(focusedNode)
    }
  }

  const width = layout?.width ?? 0
  const height = layout?.height ?? 0

  return (
    <Screen>
      <ScreenHeader innerClassName="relative justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={back}
          aria-label="Volver"
          className="absolute left-0"
        >
          <ChevronLeft />
        </Button>
        <Link href="/" aria-label="Intervalo">
          <Wordmark textClass="text-[15px]" barClass="h-[3px]" />
        </Link>
      </ScreenHeader>

      {isLoading && (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Cargando…
        </div>
      )}

      {!isLoading && !root && (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Elegí tu carrera para empezar a desbloquear emojis.
        </div>
      )}

      {!isLoading && root && layout && (
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div className="relative" style={{ width, height }}>
            {/* Conectores en ángulo recto (estilo Minecraft), sin diagonales. */}
            <svg
              className="absolute inset-0"
              width={width}
              height={height}
              fill="none"
            >
              {layout.nodes
                .filter((n) => n.parentId)
                .map((n) => {
                  const p = byId.get(n.parentId!)!
                  return (
                    <path
                      key={n.node.id}
                      d={elbow(p, n)}
                      stroke={alive.has(n.node.id) ? WIRE_ALIVE : WIRE_DEAD}
                      strokeWidth={2}
                    />
                  )
                })}

              {/* Trayecto azul por encima: raíz → nodo enfocado. */}
              {trajectoryD && (
                <path d={trajectoryD} stroke={WIRE_PATH} strokeWidth={2} />
              )}
            </svg>

            {layout.nodes.map((n) => (
              <NodeTile
                key={n.node.id}
                laid={n}
                lit={alive.has(n.node.id)}
                unlocked={n.node.id === root.id || path.includes(n.node.id)}
                frontier={n.parentId === tip}
                focused={focused === n.node.id}
                onPath={pathSet.has(n.node.id)}
                onClick={() => setFocusedId(n.node.id)}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && root && (
        <ScreenFooter>
          {focusedNode && (
            <p className="mb-2 truncate text-center text-sm text-muted-foreground">
              <span className="mr-1.5 text-base">{focusedNode.node.emoji}</span>
              {focusedNode.node.label}
            </p>
          )}
          <Button
            size="lg"
            className={ctaCls}
            disabled={cta.kind === "disabled" || setWorn.isPending}
            onClick={onCta}
          >
            {setWorn.isPending ? (
              "Guardando…"
            ) : cta.kind === "disabled" && cta.xpShort != null ? (
              <span className="inline-flex items-center gap-1.5">
                Te faltan {cta.xpShort.toLocaleString("es")}
                <XpDots className="size-[0.9em]" />
              </span>
            ) : (
              cta.label
            )}
          </Button>
        </ScreenFooter>
      )}

      <ConfirmDialog
        node={confirming}
        pending={unlock.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={async () => {
          if (!confirming) return
          try {
            await unlock.mutateAsync(confirming.node.id)
            setFocusedId(confirming.node.id)
            setConfirming(null)
          } catch {
            // el error se ignora; el árbol queda como estaba
          }
        }}
      />
    </Screen>
  )
}

type Cta =
  | { kind: "wear"; label: string }
  | { kind: "unlock"; label: string }
  | { kind: "disabled"; label: string; xpShort?: number }

function computeCta({
  focusedNode,
  rootId,
  path,
  tip,
  wornId,
  totalXp,
}: {
  focusedNode: LaidNode | undefined
  rootId: string | null
  path: string[]
  tip: string | null
  wornId: string | null
  totalXp: number
}): Cta {
  if (!focusedNode) return { kind: "disabled", label: "Elegí un emoji" }
  const id = focusedNode.node.id
  const unlocked = id === rootId || path.includes(id)
  if (unlocked) {
    if (id === wornId) return { kind: "disabled", label: "Ya seleccionado" }
    return { kind: "wear", label: "Seleccionar" }
  }
  if (focusedNode.parentId === tip) {
    const threshold = DEPTH_XP[focusedNode.depth] ?? Number.POSITIVE_INFINITY
    if (totalXp >= threshold) return { kind: "unlock", label: "Desbloquear" }
    return { kind: "disabled", label: "Te faltan", xpShort: threshold - totalXp }
  }
  return { kind: "disabled", label: "Bloqueado" }
}

function NodeTile({
  laid,
  lit,
  unlocked,
  frontier,
  focused,
  onPath,
  onClick,
}: {
  laid: LaidNode
  lit: boolean
  unlocked: boolean
  frontier: boolean
  focused: boolean
  onPath: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        left: laid.x - TILE / 2,
        top: laid.y - TILE / 2,
        width: TILE,
        height: TILE,
      }}
      className={cn(
        // Fondo SIEMPRE sólido (bg-card); la apagadez va solo en el emoji.
        "absolute flex items-center justify-center rounded-lg bg-card text-xl ring-1 transition-colors",
        unlocked ? "ring-foreground/25" : "ring-foreground/15",
        frontier && !focused && !onPath && "ring-foreground/40",
        // Ancestros del enfocado: marco azul. El enfocado, más marcado.
        onPath && !focused && "ring-primary/70",
        focused && "ring-2 ring-primary",
      )}
    >
      <span
        className={cn(
          "leading-none transition-opacity",
          !lit && "opacity-30",
          lit && !unlocked && !frontier && "opacity-60",
        )}
      >
        {laid.node.emoji}
      </span>
    </button>
  )
}

function ConfirmDialog({
  node,
  pending,
  onClose,
  onConfirm,
}: {
  node: LaidNode | null
  pending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={!!node} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="font-sans">{node?.node.label}</DialogTitle>
          <DialogDescription>
            Esta elección es definitiva: las otras ramas de este cruce quedan
            bloqueadas para siempre.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-2 py-1">
          <span className="text-4xl leading-none">{node?.node.emoji}</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-md"
            onClick={onClose}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="flex-1 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Desbloqueando…" : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
