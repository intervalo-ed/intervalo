"use client"

import { useEffect, useState } from "react"

// TEMPORAL: diagnóstico en pantalla para entender por qué la tab bar no reduce
// su altura en algunos iPhone. Quitar una vez resuelto.
function resolvePadding(value: string): string {
  const probe = document.createElement("div")
  probe.style.position = "absolute"
  probe.style.visibility = "hidden"
  probe.style.paddingBottom = value
  document.body.appendChild(probe)
  const px = getComputedStyle(probe).paddingBottom
  document.body.removeChild(probe)
  return px
}

export function PwaDebug() {
  const [lines, setLines] = useState<string[]>([])

  useEffect(() => {
    const html = document.documentElement
    const cs = getComputedStyle(html)
    const navStandalone = (navigator as Navigator & { standalone?: boolean })
      .standalone
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines([
      `dm-standalone: ${matchMedia("(display-mode: standalone)").matches}`,
      `nav.standalone: ${navStandalone}`,
      `coarse: ${matchMedia("(pointer: coarse)").matches}`,
      `pwa-query: ${matchMedia("(display-mode: standalone) and (pointer: coarse)").matches}`,
      `--nav-safe-pb token: ${cs.getPropertyValue("--nav-safe-pb").trim() || "(vacío)"}`,
      `--nav-safe-pb px: ${resolvePadding("var(--nav-safe-pb)")}`,
      `env-bottom px: ${resolvePadding("env(safe-area-inset-bottom)")}`,
      `--nav-pt: ${cs.getPropertyValue("--nav-pt").trim() || "(vacío)"}`,
    ])
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        top: "env(safe-area-inset-top)",
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.88)",
        color: "#7CFC00",
        fontFamily: "monospace",
        fontSize: "12px",
        lineHeight: 1.45,
        padding: "8px 10px",
        whiteSpace: "pre-wrap",
      }}
    >
      {lines.join("\n")}
    </div>
  )
}
