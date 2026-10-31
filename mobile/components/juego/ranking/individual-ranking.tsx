// La vista individual del ranking
// (web/src/app/derivadas/game-ranking.tsx :: IndividualRanking).
//
// Scroll infinito por baches hacia arriba y hacia abajo, con el scroll
// compensado cuando entra un bache por arriba; la fila propia a ROWS_ABOVE del
// techo, y de vuelta ahí cuando cambia de puesto, cuando el layout lo pide o
// tras un rato sin tocar la lista; el reacomodo de a un cruce
// (`useStagedOrder`); y la XP propia en vivo mientras corre el conteo.
//
// Las filas miden siempre ALTO_FILA_PX (fila + separación), así que todo lo que
// la web mide en el DOM acá se cuenta: la fila `i` está en `4 + i × 52`.

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type FlatList,
  type HostInstance,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native"
import Animated, {
  cancelAnimation,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import type { MemoriaDelRanking } from "@intervalo/dx-core/juego/ranking-orden"
import { ROWS_ABOVE, scrollEnReposo, type RankingSort } from "@intervalo/dx-core/juego/ranking-reglas"
import {
  ALTO_FILA_PX,
  filasConLugar,
  filasDelSalto,
  ritmoDelSalto,
} from "@intervalo/dx-core/juego/salto-ranking"
import { useBoostMultipliers } from "@intervalo/dx-core/juego/UseBoosts"
import {
  useGameBoosts,
  useGameLeaderboard,
  type GameLeaderboardEntry,
  type Scope,
} from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { useStagedOrder } from "@intervalo/dx-core/juego/UseStagedOrder"
import { filaALaVista } from "@intervalo/dx-core/juego/ventana-ranking"
import { curvaEnUI, Row, transicionDeFila } from "./row"
import { ALTO_FILA, ESTILOS_FILA, FilaHueca, ListSkeleton, SEPARACION_FILAS } from "./skeleton"

// Las mismas props que la web. `attachXpTarget` recibe el nodo nativo.
export type IndividualRankingProps = {
  scope: Scope
  enabled: boolean
  sort: RankingSort
  climbFrom: number | null
  onSaltoArranca?: () => void
  cortarSalto?: number
  liveXp: number | null
  counting: boolean
  xpColor: string | null
  attachXpTarget?: (node: HostInstance | null) => void
  centerKey: number
  mobile: boolean
  leerMemoria?: () => MemoriaDelRanking
  guardarMemoria?: (m: MemoriaDelRanking) => void
  boostPreview?: { university: string; multiplier: number; color: string } | null
}

// El `py-1` de la lista, que no es de ninguna fila.
const LIST_TOP_PADDING = 4

// Sin tocar la lista por este tiempo, vuelve sola a la fila propia (ver
// IDLE_RECENTER_MS en la web: en escritorio son 20 s).
const IDLE_RECENTER_MS = 20_000
const IDLE_RECENTER_MS_MOVIL = 10_000

// Lo que lleva cargado un bache por arriba antes de pedir el siguiente: la web
// usa un margen de 300 px; acá el umbral va en altos de la ventana.
const UMBRAL_BACHE = 0.5

// Cuánto se adelanta la fila a la ventana a mitad del viaje (ver ADELANTO_PX
// en la web): acotado en píxeles para que un salto largo no la saque por el
// techo.
const ADELANTO_PX = ALTO_FILA_PX * 1.5

const offsetDeFila = (i: number) => LIST_TOP_PADDING + i * ALTO_FILA_PX
const altoDelContenido = (n: number) => offsetDeFila(n) - SEPARACION_FILAS + LIST_TOP_PADDING
const enReposo = (indice: number) => scrollEnReposo({ indice, paso: ALTO_FILA_PX })

// Las fases del salto, en el orden en que se ven (ver `Fase` en la web).
type Fase = "agachado" | "abriendo" | "viajando" | "cerrando" | "listo"

// Lo que el hilo de UI necesita para mover el scroll en un tramo del salto.
type PlanDeScroll =
  | { tipo: "lineal"; s0: number; sobra: number; tope: number }
  | { tipo: "vuelo"; yFin: number; dY: number; pant0: number; pantFin: number; adelanto: number; tope: number }

type Item = GameLeaderboardEntry | null

export function IndividualRanking({
  scope,
  enabled,
  sort,
  climbFrom,
  onSaltoArranca,
  cortarSalto = 0,
  liveXp,
  counting,
  xpColor,
  attachXpTarget,
  centerKey,
  mobile,
  leerMemoria,
  guardarMemoria,
  boostPreview,
}: IndividualRankingProps) {
  const boostByUni = useBoostMultipliers(useGameBoosts())
  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    fetchPreviousPage,
    hasPreviousPage,
    isFetchingPreviousPage,
  } = useGameLeaderboard(scope, enabled, sort === "elo" ? "elo" : "xp")

  // Deduplicada (la ventana `around_me` puede repetir a alguien que otra página
  // ya traía) y ordenada por puesto (las páginas no llegan en orden).
  const rawEntries = useMemo(() => {
    const seen = new Set<number>()
    const out: GameLeaderboardEntry[] = []
    for (const entry of data?.pages.flatMap((p) => p.entries) ?? []) {
      if (seen.has(entry.player_id)) continue
      seen.add(entry.player_id)
      out.push(entry)
    }
    out.sort((a, b) => a.rank - b.rank)
    return out
  }, [data])

  // El reacomodo lo lee dentro de su intervalo: mientras la fila propia salta,
  // el mundo espera.
  const escalandoRef = useRef(false)
  const staged = useStagedOrder({ entries: rawEntries, pausadoRef: escalandoRef })

  const meIndexRaw = rawEntries.findIndex((e) => e.is_current_player)
  const myRank = meIndexRaw >= 0 ? rawEntries[meIndexRaw].rank : null
  const quieto = useReducedMotion()

  const climbing = !quieto && climbFrom !== null && myRank !== null && climbFrom > myRank

  // ── El salto ───────────────────────────────────────────────────────────────
  // UN movimiento continuo del puesto viejo al nuevo (ver salto-ranking.ts),
  // acotado a las filas que hay cargadas por debajo de la propia.
  const disponibles = meIndexRaw < 0 ? 0 : rawEntries.length - 1 - meIndexRaw
  const filasPosibles = filasDelSalto(climbing ? climbFrom - (myRank as number) : 0, disponibles)

  // Congelado al arrancar: el vuelo se completa aunque `climbFrom` se apague a
  // mitad de camino, que es justo lo que hace `onSaltoArranca`.
  const [salto, setSalto] = useState<{
    key: number | null
    fase: Fase
    filas: number
    ms: number
    desde: number
  }>({ key: null, fase: "listo", filas: 0, ms: 0, desde: 0 })

  // Terminado el salto y apagado `climbFrom`, la clave se suelta: dos derivadas
  // seguidas que arrancan del mismo puesto no compartirían clave.
  if (!climbing && salto.fase === "listo" && salto.key !== null) {
    setSalto({ key: null, fase: "listo", filas: 0, ms: 0, desde: 0 })
  }

  // El corte desde afuera: aterriza el salto en vuelo. `trasCorte` dibuja la
  // lista cruda y sin animar hasta que la escalonada la alcanza (ver la web).
  const [corteVisto, setCorteVisto] = useState(cortarSalto)
  const [trasCorte, setTrasCorte] = useState(false)
  if (cortarSalto !== corteVisto) {
    setCorteVisto(cortarSalto)
    if (salto.fase !== "listo") {
      setSalto({ ...salto, fase: "listo" })
      setTrasCorte(true)
    }
  }
  if (
    trasCorte &&
    staged.length === rawEntries.length &&
    staged.every((e, i) => e.player_id === rawEntries[i].player_id)
  ) {
    setTrasCorte(false)
  }

  const ritmo = ritmoDelSalto(mobile)
  const nuevo = climbing && filasPosibles > 0 && salto.key !== climbFrom
  const fase: Fase = nuevo ? "agachado" : salto.fase
  const filas = nuevo ? filasPosibles : salto.filas
  const saltoMs = nuevo ? ritmo.viaje(filasPosibles) : salto.ms
  const desde = nuevo ? (climbFrom as number) : salto.desde
  const settled = fase === "listo"
  const curvaDelViaje = ritmo.curvaDelViaje(filas)

  // La fase que DIBUJA la lista va un fotograma atrás de `fase`, salvo al
  // agacharse y al aterrizar. Reanimated toma la transición de cada celda
  // después del commit (en `componentDidUpdate`), así que si la transición
  // nueva y las posiciones nuevas llegaran juntas, las filas se moverían con la
  // del tramo anterior. Primero se cambia la transición (`fase`) y en el
  // fotograma siguiente se mueven las filas (`faseLista`).
  const [faseLista, setFaseLista] = useState<Fase>("listo")
  const listaFase: Fase = fase === "agachado" || fase === "listo" ? fase : faseLista
  useEffect(() => {
    if (faseLista === fase) return
    if (fase === "agachado" || fase === "listo") {
      setFaseLista(fase)
      return
    }
    const raf = requestAnimationFrame(() => setFaseLista(fase))
    return () => cancelAnimationFrame(raf)
  }, [fase, faseLista])

  // Por ref y no en las dependencias: el layout lo pasa como flecha inline (ver
  // `arrancaRef` en la web, que es donde se midió el porqué).
  const arrancaRef = useRef(onSaltoArranca)
  useEffect(() => {
    arrancaRef.current = onSaltoArranca
  })

  useEffect(() => {
    if (fase === "listo") return
    if (fase === "agachado") {
      // Un fotograma agachado y sale, con la red del timeout por si no hay
      // fotogramas. Ya en el aire, el salto se da por visto.
      const salir = () => {
        setSalto({ key: desde, fase: "abriendo", filas, ms: saltoMs, desde })
        arrancaRef.current?.()
      }
      const raf = requestAnimationFrame(salir)
      const red = setTimeout(salir, 120)
      return () => {
        cancelAnimationFrame(raf)
        clearTimeout(red)
      }
    }
  }, [fase, filas, saltoMs, desde])

  // Los tres tramos encadenados. Cuentan desde que la LISTA llegó al tramo, no
  // desde que cambió la transición.
  useEffect(() => {
    const sigue: Partial<Record<Fase, { fase: Fase; ms: number }>> = {
      abriendo: { fase: "viajando", ms: ritmo.abrir },
      viajando: { fase: "cerrando", ms: saltoMs },
      cerrando: { fase: "listo", ms: ritmo.cerrar },
    }
    const paso = sigue[listaFase]
    if (!paso || fase !== listaFase) return
    const t = setTimeout(
      () => setSalto({ key: desde, fase: paso.fase, filas, ms: saltoMs, desde }),
      paso.ms,
    )
    return () => clearTimeout(t)
  }, [listaFase, fase, filas, saltoMs, desde, ritmo])

  useEffect(() => {
    escalandoRef.current = !settled || trasCorte
  })

  // Mientras la fila vuela, la lista es la cruda y no la escalonada.
  const entries = settled && !trasCorte ? staged : rawEntries
  const meIndex = entries.findIndex((e) => e.is_current_player)

  // Qué se dibuja en cada tramo. `null` es el HUECO.
  //   agachado   la propia en el puesto del que viene, sin hueco.
  //   abriendo   igual, más un hueco en el destino: la lista hace lugar.
  //   viajando   la propia en el destino y el hueco donde estaba: solo ella se mueve.
  //   cerrando   sin hueco: la lista se cierra.
  const ordered: Item[] = (() => {
    if (meIndex < 0 || listaFase === "listo" || listaFase === "cerrando") return entries
    const rows: Item[] = [...entries]
    const [mine] = rows.splice(meIndex, 1)
    if (listaFase === "agachado") {
      rows.splice(meIndex + filas, 0, mine)
      return rows
    }
    if (listaFase === "abriendo") {
      rows.splice(meIndex + filas, 0, mine)
      rows.splice(meIndex, 0, null)
      return rows
    }
    rows.splice(meIndex + filas, 0, null)
    rows.splice(meIndex, 0, mine)
    return rows
  })()
  const iPropia = ordered.findIndex((e) => e !== null && e.is_current_player)

  // El layout animado es para los REACOMODOS. Un commit que cambia el conjunto
  // de filas —un bache por arriba, una ventana `around_me` nueva— corre a todas
  // dentro de la lista y el scroll se compensa en el mismo commit, así que en
  // la pantalla no se mueve nada; animarlo era la lista entera saltando y
  // volviendo (el problema que en la web resuelve `capaDe`). Ese commit va sin
  // transición y el siguiente la devuelve.
  const conjunto = useMemo(
    () =>
      rawEntries
        .map((e) => e.player_id)
        .sort((a, b) => a - b)
        .join(","),
    [rawEntries],
  )
  const [conjuntoAnimado, setConjuntoAnimado] = useState(conjunto)
  const animarLayout = conjunto === conjuntoAnimado
  useEffect(() => {
    setConjuntoAnimado(conjunto)
  }, [conjunto])

  // La transición va con `fase`, un fotograma antes que las filas (ver
  // `faseLista`). En reposo, el resorte; un commit que no es reacomodo, nada.
  const transicion = transicionDeFila({
    quieto: quieto || trasCorte || (fase === "listo" && !animarLayout),
    agachado: fase === "agachado",
    saltoMs:
      fase === "abriendo" ? ritmo.abrir : fase === "viajando" ? saltoMs : fase === "cerrando" ? ritmo.cerrar : 0,
    curva: fase === "viajando" ? curvaDelViaje : ritmo.curvaDelLugar,
  })

  // ── Scroll ─────────────────────────────────────────────────────────────────
  // Ref animado: el mismo nodo lo mueve JS (`scrollToOffset`) y el hilo de UI
  // durante el salto (`scrollTo`).
  const listaRef = useAnimatedRef<FlatList<Item>>()
  const scrollYRef = useRef(0)
  const altoVistaRef = useRef(0)
  const colocadaRef = useRef(false)
  // Lo que la persona hizo con la lista. La copia que sobrevive al remonte vive
  // en `MobileFlow` y se sincroniza por `guardarMemoria` (ver
  // `MemoriaDelRanking`). `manoSV` es la misma mano, para el hilo de UI.
  const manoRef = useRef(false)
  const topRef = useRef(0)
  const manoSV = useSharedValue(false)
  // Antes que cualquier otro efecto: cuando alguno pregunte por la mano, ya
  // está contestado.
  useLayoutEffect(() => {
    const m = leerMemoria?.()
    if (!m) return
    manoRef.current = m.mano
    manoSV.set(m.mano)
    topRef.current = m.top
  }, [leerMemoria, manoSV])
  // El primer id del commit anterior: separa «entró un bache por arriba» de
  // «esta es otra ventana» (ver ventana-ranking.ts).
  const anclaRef = useRef<{ id: number; ids: Set<number> } | null>(null)
  // A qué altura de la VENTANA está la fila propia. `pinRef` es el valor de
  // antes del último commit: el que la fila conserva al agacharse.
  const relRef = useRef<number | null>(null)
  const pinRef = useRef<number | null>(null)

  // El alto del contenido también se cuenta, y no se espera a
  // `onContentSizeChange`: la compensación del bache corre en el mismo commit
  // que lo trae, cuando el alto medido todavía es el de antes.
  const nFilas = ordered.length
  const tope = useCallback(
    (n: number) => Math.max(0, altoDelContenido(n) - altoVistaRef.current),
    [],
  )
  const irA = useCallback(
    (offset: number, animado: boolean) => {
      const y = Math.max(0, Math.min(offset, tope(nFilas)))
      listaRef.current?.scrollToOffset({ offset: y, animated: animado })
      scrollYRef.current = y
    },
    [nFilas, tope, listaRef],
  )

  const snapToMe = useCallback(
    (smooth: boolean) => {
      if (meIndex < 0) return
      const top = enReposo(meIndex)
      if (Math.abs(scrollYRef.current - top) < 4) return
      // Suave solo si la fila propia se está viendo: si no, es la corrección que
      // la trae de vuelta, no un acomodo cosmético.
      const seVe = filaALaVista(
        { y: offsetDeFila(meIndex), alto: ALTO_FILA },
        { scroll: scrollYRef.current, alto: altoVistaRef.current },
      )
      irA(top, smooth && seVe)
    },
    [meIndex, irA],
  )

  // Cambiar de scope o de orden es otra lista: hay que volver a colocarla.
  useEffect(() => {
    colocadaRef.current = false
    anclaRef.current = null
    scrollYRef.current = 0
  }, [scope.university, scope.career, sort])

  const colocar = useCallback(() => {
    if (colocadaRef.current || entries.length === 0 || altoVistaRef.current === 0) return
    // Con la mano puesta, montarse de nuevo no es entrar al ranking: es volver a
    // donde estabas. Sin la fila propia (un filtro que la deja afuera) la lista
    // queda arriba.
    if (manoRef.current) irA(topRef.current, false)
    else if (meIndex >= 0) irA(enReposo(meIndex), false)
    colocadaRef.current = true
  }, [entries.length, meIndex, irA])

  // Llegó un bache por arriba: hay que compensar el scroll o el contenido salta
  // bajo el dedo. Si el ancla ya no está, es una ventana nueva y no hay nada que
  // compensar. Con filas de alto fijo, lo que se corrió son las filas nuevas que
  // quedaron por encima del ancla. Va ANTES que el efecto del fotograma
  // agachado, que lee el `pinRef` que este deja.
  useLayoutEffect(() => {
    if (entries.length === 0) return
    pinRef.current = relRef.current
    const ancla = anclaRef.current
    if (colocadaRef.current && ancla !== null) {
      const i = entries.findIndex((e) => e.player_id === ancla.id)
      if (i > 0) {
        let nuevas = 0
        for (let k = 0; k < i; k++) if (!ancla.ids.has(entries[k].player_id)) nuevas++
        if (nuevas > 0) irA(scrollYRef.current + nuevas * ALTO_FILA_PX, false)
      }
    }
    anclaRef.current = { id: entries[0].player_id, ids: new Set(entries.map((e) => e.player_id)) }
    relRef.current = iPropia >= 0 ? offsetDeFila(iPropia) - scrollYRef.current : null
    // Solo cuando cambian las filas: la XP en vuelo no mueve a nadie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries])

  useEffect(() => {
    colocar()
  })

  // ── El scroll durante el salto ─────────────────────────────────────────────
  // Lo mueve el hilo de UI, fotograma a fotograma: `progreso` corre con la
  // curva del tramo (ya interpolada, ver `curvaEnUI`) y la reacción convierte
  // cada valor en un `scrollTo`. Todo lo que hace falta para la cuenta se
  // decide en JS al arrancar el tramo y viaja en `plan`; las filas miden fijo,
  // así que no hay nada que medir durante el vuelo.
  const progreso = useSharedValue(0)
  const plan = useSharedValue<PlanDeScroll | null>(null)
  useAnimatedReaction(
    () => progreso.value,
    (p) => {
      const pl = plan.value
      // La mano gana: el vuelo es un festejo, no una orden.
      if (pl === null || manoSV.value) return
      let y: number
      if (pl.tipo === "lineal") {
        y = pl.s0 + pl.sobra * p
      } else {
        // Dónde está la fila (con la misma curva con que la mueve la
        // transición) y dónde se la quiere VER, con una comba hacia arriba en el
        // medio. El scroll es la diferencia.
        const fila = pl.yFin - pl.dY * (1 - p)
        const pant = pl.pant0 + (pl.pantFin - pl.pant0) * p - pl.adelanto * Math.sin(Math.PI * p)
        y = fila - pant
      }
      scrollTo(listaRef, 0, Math.max(0, Math.min(y, pl.tope)), false)
    },
  )
  const animarScroll = useCallback(
    (p: PlanDeScroll, ms: number, curva: (t: number) => number) => {
      cancelAnimation(progreso)
      plan.set(p)
      progreso.set(0)
      progreso.set(withTiming(1, { duration: ms, easing: curvaEnUI(curva) }))
    },
    [plan, progreso],
  )
  useEffect(() => {
    if (listaFase !== "listo") return
    cancelAnimation(progreso)
    plan.set(null)
  }, [listaFase, plan, progreso])
  useEffect(
    () => () => {
      cancelAnimation(progreso)
    },
    [progreso],
  )

  // Dónde estaba la fila al abrirse el lugar: el origen del viaje.
  const origenRef = useRef<number | null>(null)

  // Agachado: la fila arranca el viaje exactamente donde la persona la estaba
  // mirando. Si no alcanza la lista debajo para dejarla ahí, el viaje se ACORTA
  // (`filasConLugar`) en vez de mandar el scroll al fondo.
  useLayoutEffect(() => {
    if (listaFase !== "agachado" || iPropia < 0) return
    const y = offsetDeFila(iPropia)
    const rel = pinRef.current
    if (rel === null) {
      // No se sabe dónde estaba: se la trae a la vista con una fila de margen.
      const vista = altoVistaRef.current
      const masAbajo = y + ALTO_FILA + ALTO_FILA - vista
      const masArriba = y - ALTO_FILA
      irA(Math.max(Math.min(scrollYRef.current, masArriba), masAbajo), false)
    } else {
      const deseado = y - rel
      const menos = filasConLugar(filas, deseado, tope(nFilas))
      if (menos !== filas) {
        setSalto({ key: desde, fase: "agachado", filas: menos, ms: ritmo.viaje(menos), desde })
        return
      }
      irA(deseado, false)
    }
    origenRef.current = y
  }, [listaFase, filas, desde, ritmo, iPropia, nFilas, irA, tope])

  // Abriendo: la fila se corre una abajo y de ahí sale el viaje. Si eso la saca
  // por el borde de abajo, el scroll la acompaña con la curva del lugar.
  useLayoutEffect(() => {
    if (listaFase !== "abriendo" || iPropia < 0) return
    const y0 = offsetDeFila(iPropia)
    const s0 = scrollYRef.current
    origenRef.current = y0
    const sobra = y0 + ALTO_FILA + LIST_TOP_PADDING - (s0 + altoVistaRef.current)
    if (sobra <= 0 || manoRef.current) return
    animarScroll({ tipo: "lineal", s0, sobra, tope: tope(nFilas) }, ritmo.abrir, ritmo.curvaDelLugar)
  }, [listaFase, ritmo, iPropia, nFilas, animarScroll, tope])

  // Viajando: la fila va de donde estaba en la pantalla a donde descansa, a
  // ROWS_ABOVE del techo, sin pasarse del tope que la lista va a tener cuando
  // se cierre el hueco.
  useLayoutEffect(() => {
    if (listaFase !== "viajando" || iPropia < 0) return
    const origen = origenRef.current
    if (origen === null || manoRef.current) return
    const yFin = offsetDeFila(iPropia)
    const s0 = scrollYRef.current
    const topeAlCerrar = Math.max(0, tope(nFilas) - ALTO_FILA_PX)
    const sFin = Math.min(enReposo(iPropia), topeAlCerrar)
    const dY = yFin - origen
    animarScroll(
      {
        tipo: "vuelo",
        yFin,
        dY,
        pant0: origen - s0,
        pantFin: yFin - sFin,
        adelanto: Math.min(ADELANTO_PX, Math.abs(dY) * 0.3),
        tope: tope(nFilas),
      },
      saltoMs,
      curvaDelViaje,
    )
  }, [listaFase, saltoMs, curvaDelViaje, iPropia, nFilas, animarScroll, tope])

  // Cambiar de puesto siempre reacomoda, salvo que en el teléfono la persona
  // esté mirando otra parte de la lista por su cuenta.
  useEffect(() => {
    if (myRank === null || !settled) return
    if (mobile && manoRef.current) return
    snapToMe(true)
  }, [myRank, settled, snapToMe, mobile])

  // Recentrado a pedido del layout.
  const [primerCenterKey] = useState(centerKey)
  useEffect(() => {
    if (centerKey === primerCenterKey) return
    snapToMe(true)
  }, [centerKey, primerCenterKey, snapToMe])

  // Recentrado por inactividad: se rearma con cada scroll.
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const snapRef = useRef(snapToMe)
  useEffect(() => {
    snapRef.current = snapToMe
  })
  const armarRecentrado = useCallback(() => {
    clearTimeout(timerRef.current)
    if (mobile && manoRef.current) return
    timerRef.current = setTimeout(
      () => snapRef.current(true),
      mobile ? IDLE_RECENTER_MS_MOVIL : IDLE_RECENTER_MS,
    )
  }, [mobile])
  useEffect(() => {
    armarRecentrado()
    return () => clearTimeout(timerRef.current)
  }, [armarRecentrado, entries.length])

  // El gesto, y no el scroll: el scroll lo disparan también los programáticos.
  const alTocar = useCallback(() => {
    manoRef.current = true
    manoSV.set(true)
    cancelAnimation(progreso)
    guardarMemoria?.({ mano: true, top: scrollYRef.current })
    armarRecentrado()
  }, [armarRecentrado, guardarMemoria, manoSV, progreso])

  const alScrollear = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y
      scrollYRef.current = y
      // Dónde QUEDÓ la lista (el momentum sigue después de soltar), que es lo
      // que se restaura al volver a montarse; y dónde quedó la fila propia
      // respecto de la ventana, que es lo que el salto conserva al agacharse.
      topRef.current = y
      guardarMemoria?.({ mano: manoRef.current, top: y })
      if (iPropia >= 0) relRef.current = offsetDeFila(iPropia) - y
      armarRecentrado()
    },
    [armarRecentrado, guardarMemoria, iPropia],
  )

  const alMedir = useCallback(
    (e: LayoutChangeEvent) => {
      altoVistaRef.current = e.nativeEvent.layout.height
      colocar()
    },
    [colocar],
  )

  // Mientras la fila vuela la lista no crece: un bache a mitad de salto mueve el
  // piso por debajo de algo que ya está en el aire.
  const cargarArriba = useCallback(() => {
    if (settled && hasPreviousPage && !isFetchingPreviousPage) void fetchPreviousPage()
  }, [settled, hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage])
  const cargarAbajo = useCallback(() => {
    if (settled && hasNextPage && !isFetchingNextPage) void fetchNextPage()
  }, [settled, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Una identidad por valor y no por render: es prop de todas las filas, que
  // están memoizadas.
  const previewValor = boostPreview?.multiplier ?? null
  const previewColor = boostPreview?.color ?? null
  const previewMultiplier = useMemo(
    () => (previewValor !== null && previewColor !== null ? { value: previewValor, color: previewColor } : null),
    [previewValor, previewColor],
  )

  // `isPending` y no `isLoading`: con la consulta deshabilitada (todavía no hay
  // jugador) `isLoading` da falso y la lista diría «no hay ranking» sobre datos
  // que nunca se pidieron.
  if (isPending) return <ListSkeleton />
  if (entries.length === 0) {
    return <Text style={ESTILOS_FILA.vacio}>Todavía no hay ranking.</Text>
  }

  return (
    <View style={estilos.caja}>
      <Animated.FlatList
        ref={listaRef}
        data={ordered}
        keyExtractor={(entry) => (entry === null ? "hueco" : String(entry.player_id))}
        style={estilos.lista}
        contentContainerStyle={ESTILOS_FILA.lista}
        showsVerticalScrollIndicator={false}
        itemLayoutAnimation={transicion}
        getItemLayout={(_, index) => ({ length: ALTO_FILA, offset: offsetDeFila(index), index })}
        initialScrollIndex={meIndex > ROWS_ABOVE ? meIndex - ROWS_ABOVE : undefined}
        onLayout={alMedir}
        onContentSizeChange={colocar}
        onScroll={alScrollear}
        scrollEventThrottle={16}
        onScrollBeginDrag={alTocar}
        onStartReached={cargarArriba}
        onStartReachedThreshold={UMBRAL_BACHE}
        onEndReached={cargarAbajo}
        onEndReachedThreshold={UMBRAL_BACHE}
        ListFooterComponent={
          isFetchingNextPage ? <ActivityIndicator style={estilos.spinner} color={TEMA.mutedForeground} /> : undefined
        }
        extraData={[liveXp, counting, xpColor, attachXpTarget, boostByUni, previewMultiplier, transicion]}
        renderItem={({ item: entry }) => {
          if (entry === null) return <FilaHueca quieto={quieto} />
          const mine = entry.is_current_player
          return (
            <Row
              entry={entry}
              // En la propia, hasta que el viaje arranca, el puesto viejo; durante
              // el viaje, el número cuenta con la fila.
              shownRank={mine && (listaFase === "agachado" || listaFase === "abriendo") ? desde : entry.rank}
              rankDesde={mine && listaFase === "viajando" ? desde : null}
              // Mientras el conteo corre manda él; después, el mayor de los dos,
              // para que el número no retroceda si el ranking viene atrasado.
              xp={mine && liveXp !== null ? (counting ? liveXp : Math.max(liveXp, entry.xp)) : entry.xp}
              delta={entry.rank_delta}
              saltoMs={saltoMs}
              curva={curvaDelViaje}
              sort={sort}
              boostMultiplier={entry.university ? (boostByUni.get(entry.university) ?? null) : null}
              xpColor={mine ? xpColor : null}
              attachXpTarget={mine ? attachXpTarget : undefined}
              previewMultiplier={previewMultiplier}
            />
          )
        }}
      />
      {/* Encima y no en el flujo: un encabezado que aparece y desaparece correría
          todas las filas, y las cuentas de arriba suponen que la fila `i` está
          en `4 + i × 52`. */}
      {isFetchingPreviousPage && (
        <View style={estilos.cargandoArriba} pointerEvents="none">
          <ActivityIndicator color={TEMA.mutedForeground} />
        </View>
      )}
    </View>
  )
}

const estilos = StyleSheet.create({
  caja: { flex: 1, minHeight: 0 },
  lista: { flex: 1, minHeight: 0 },
  spinner: { paddingVertical: 8 },
  cargandoArriba: { position: "absolute", top: 8, left: 0, right: 0, alignItems: "center" },
})
