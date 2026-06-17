"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useSfx, type SfxName } from "@/lib/audio/useSfx"
import { getSfxAnalyser } from "@/lib/audio/sfx-engine"

const SFX_NAMES: SfxName[] = [
  "pop", "select", "continue", "correct", "wrong", "iterate", "start", "end", "xpCount",
]
const MUTED = new Set<SfxName>(["wrong", "iterate"])

// Un sonido normal pica ≈ 0.1 en el master. Marcamos SPIKE cuando el nivel real
// supera holgadamente eso (el bug de WebKit salta a ~1.0).
const SPIKE_THRESHOLD = 0.3
const HOLD_MS = 4000

function db(linear: number): string {
  return linear <= 0.0001 ? "-∞" : (20 * Math.log10(linear)).toFixed(1)
}

type Line = { id: number; t: string; text: string; spike: boolean }

const subscribeNoop = () => () => {}

export default function AudioDebug() {
  // El motor crea el AudioContext al pedir el analyser, así que el panel debe
  // montarse solo en cliente (en SSR no existe AudioContext).
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false)
  if (!isClient) return null
  return <AudioDebugPanel />
}

function AudioDebugPanel() {
  const sfx = useSfx()
  const [analyser] = useState(() => getSfxAnalyser())
  const ctx = analyser.context as AudioContext
  const dataRef = useRef(new Float32Array(analyser.fftSize))

  const [info] = useState<string[]>(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    return [
      `standalone PWA: ${standalone}`,
      `sampleRate: ${ctx.sampleRate} Hz`,
      `baseLatency: ${(ctx as { baseLatency?: number }).baseLatency ?? "?"}`,
      navigator.userAgent,
    ]
  })

  const [peak, setPeak] = useState(0)
  const [hold, setHold] = useState(0)
  const [spikes, setSpikes] = useState(0)
  const [lines, setLines] = useState<Line[]>([])

  const lastSound = useRef("—")
  const lineId = useRef(0)
  const inSpike = useRef(false)
  const holdVal = useRef(0)
  const holdAt = useRef(0)
  const lastUi = useRef(0)

  const log = useCallback((text: string, spike = false) => {
    const d = new Date()
    const t =
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:` +
      `${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`
    lineId.current += 1
    const id = lineId.current
    setLines((prev) => [{ id, t, text, spike }, ...prev].slice(0, 60))
  }, [])

  useEffect(() => {
    let raf = 0
    const loop = () => {
      analyser.getFloatTimeDomainData(dataRef.current)
      const data = dataRef.current
      let p = 0
      for (let i = 0; i < data.length; i++) {
        const a = data[i] < 0 ? -data[i] : data[i]
        if (a > p) p = a
      }
      const now = performance.now()

      if (p >= SPIKE_THRESHOLD && !inSpike.current) {
        inSpike.current = true
        setSpikes((n) => n + 1)
        log(
          `⚠ SPIKE ${p.toFixed(3)} (${db(p)} dB) · último: ${lastSound.current} · ctx ${ctx.state} @ ${ctx.currentTime.toFixed(3)}s`,
          true,
        )
      } else if (p < SPIKE_THRESHOLD * 0.8) {
        inSpike.current = false
      }

      if (p > holdVal.current || now > holdAt.current + HOLD_MS) {
        holdVal.current = p
        holdAt.current = now
      }

      if (now - lastUi.current > 50) {
        lastUi.current = now
        setPeak(p)
        setHold(holdVal.current)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [analyser, ctx, log])

  function play(name: SfxName) {
    lastSound.current = name
    log(`▶ ${name}${MUTED.has(name) ? " (muted)" : ""}`)
    sfx[name]()
  }

  function reset() {
    setLines([])
    setSpikes(0)
    holdVal.current = 0
    setHold(0)
    inSpike.current = false
  }

  const meterColor = peak >= SPIKE_THRESHOLD ? "#ef4444" : peak >= 0.15 ? "#eab308" : "#22c55e"

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0b0f14",
        color: "#e6edf3",
        font: "13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace",
        display: "flex",
        flexDirection: "column",
        padding: "12px",
        gap: "10px",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 15 }}>Audio debug</strong>
        <button
          onClick={reset}
          style={{ background: "#1f2937", color: "#e6edf3", border: "1px solid #374151", borderRadius: 6, padding: "6px 12px" }}
        >
          Reset
        </button>
      </div>

      <div
        style={{
          borderRadius: 8,
          padding: "10px 12px",
          background: spikes > 0 ? "#3b0d0d" : "#111827",
          border: `1px solid ${spikes > 0 ? "#ef4444" : "#1f2937"}`,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, color: spikes > 0 ? "#fca5a5" : "#9ca3af" }}>
          {spikes > 0 ? `⚠ SPIKES: ${spikes}` : "sin spikes"}
        </div>
        <div style={{ marginTop: 6 }}>
          peak <b>{peak.toFixed(3)}</b> ({db(peak)} dB) · HOLD{" "}
          <b style={{ color: hold >= SPIKE_THRESHOLD ? "#fca5a5" : "#e6edf3" }}>{hold.toFixed(3)}</b> ({db(hold)} dB)
        </div>
        <div style={{ position: "relative", height: 16, marginTop: 6, background: "#0b0f14", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, width: `${Math.min(peak, 1) * 100}%`, background: meterColor }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${SPIKE_THRESHOLD * 100}%`, width: 2, background: "#f87171" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${Math.min(hold, 1) * 100}%`, width: 2, background: "#fff" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {SFX_NAMES.map((name) => (
          <button
            key={name}
            onClick={() => play(name)}
            style={{
              background: MUTED.has(name) ? "#1f2937" : "#1d4ed8",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "14px 6px",
              fontSize: 13,
              fontWeight: 600,
              opacity: MUTED.has(name) ? 0.5 : 1,
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 11, color: "#9ca3af", wordBreak: "break-word" }}>
        {info.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", borderTop: "1px solid #1f2937", paddingTop: 8 }}>
        {lines.map((l) => (
          <div
            key={l.id}
            style={{
              padding: "2px 6px",
              borderRadius: 4,
              background: l.spike ? "#7f1d1d" : "transparent",
              color: l.spike ? "#fff" : "#cbd5e1",
              whiteSpace: "pre-wrap",
            }}
          >
            <span style={{ color: "#6b7280" }}>{l.t}</span> {l.text}
          </div>
        ))}
      </div>
    </div>
  )
}
