"use client"

// Una muestra por carga: con qué aparato se abrió el juego y cuánto tardó en
// pintar lo primero.
//
// POR QUÉ NO ALCANZA POSTHOG, QUE YA MIDE ESTO. Por dos cosas medidas el 28/09:
//
//   · pierde el 11% del tráfico. Quien entra con Brave, Firefox u Opera manda
//     el `$pageview` y después casi nada — el 54,9% de ellos no deja ni un
//     `game_start`, contra el 1,6% del resto—, y ese 11% es justo el que una
//     medición de rendimiento no se puede dar el lujo de perder;
//   · sus métricas crecen con el uso. El LCP deja de actualizarse recién en la
//     primera interacción y el INP de una persona es el PEOR de todos sus
//     toques: quien juega doscientas derivadas tiene doscientas oportunidades
//     de que uno salga lento. Cortando por cuartil de LCP, el cuartil «más
//     lento» enganchaba 25 puntos MÁS. Eso es el uso medido dos veces.
//
// Por eso lo que se manda es el FCP —una sola pintura, temprano, antes de que
// la persona haya hecho nada— y el modelo del teléfono, que ya estaba decidido
// antes de que llegara. Las dos son anteriores al desenlace, que es lo que
// permite cruzarlas contra él sin que la correlación salga al revés.

import { useEffect } from "react"

import { getPlatform } from "@/lib/platform/detect"
import type { Rescate } from "./game-storage"
import { useGameApi } from "./UseGameApi"

// Una por carga de página y no una por montaje: `GameRoot` y el layout que
// elige se montan los dos, y sin esto habría dos filas por visita. Misma
// decisión y mismo motivo que `bootstrapStarted` en UseGamePlayer.ts.
let yaMandada = false

/** El modelo del teléfono, cuando el aparato lo dice.
 *
 * Android lo pone en el User-Agent —`(Linux; Android 14; SM-A155M)`, con un
 * ` Build/…` pegado en las WebView— y iOS no lo pone nunca: ahí esta función
 * devuelve null y el dato se pide prestado al `os_version`, que iOS sí da.
 *
 * `K` es el modelo de mentira que Chrome manda desde que redujo el User-Agent.
 * Guardarlo sería llenar la columna de una etiqueta que no distingue nada. */
export function modeloDelAparato(ua: string): string | null {
  const m = /Android\s[\d.]+;\s*([^;)]+)/.exec(ua)
  if (m === null) return null
  const modelo = m[1].replace(/\s+Build\/.*$/, "").trim()
  if (modelo === "" || modelo === "K") return null
  return modelo.slice(0, 64)
}

/** El FCP en milisegundos, o null si este navegador no lo publica.
 *
 * `buffered: true` es lo que hace que sirva: la pintura casi siempre ocurrió
 * antes de que este hook se monte, y sin eso el observador se quedaría esperando
 * un evento que ya pasó. El corte a los quince segundos es para no dejar una
 * promesa colgada en un navegador que no tiene `paint` timing (Safari recién lo
 * agregó en la 14.1) — ahí se manda la fila igual, sin el número. */
function esperarFcp(): Promise<number | null> {
  return new Promise((resolver) => {
    try {
      const ya = performance.getEntriesByName("first-contentful-paint")[0]
      if (ya !== undefined) return resolver(Math.round(ya.startTime))
    } catch {
      return resolver(null)
    }
    let observador: PerformanceObserver | null = null
    const corte = setTimeout(() => {
      observador?.disconnect()
      resolver(null)
    }, 15_000)
    try {
      observador = new PerformanceObserver((lista) => {
        const e = lista.getEntriesByName("first-contentful-paint")[0]
        if (e === undefined) return
        clearTimeout(corte)
        observador?.disconnect()
        resolver(Math.round(e.startTime))
      })
      observador.observe({ type: "paint", buffered: true })
    } catch {
      clearTimeout(corte)
      resolver(null)
    }
  })
}

/** Cuándo terminó de parsearse el documento con su JavaScript.
 *
 * Va con el FCP porque separan dos problemas que se arreglan distinto: «tarda
 * en llegar» y «tarda en compilar». Un teléfono de entrada con buena conexión
 * tiene el segundo. */
function domContentLoaded(): number | null {
  try {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined
    if (nav === undefined || nav.domContentLoadedEventEnd <= 0) return null
    return Math.round(nav.domContentLoadedEventEnd)
  } catch {
    return null
  }
}

/** Manda la muestra una vez por carga, cuando ya hay jugador con quien firmarla.
 *
 * `listo` es «el jugador existe»: sin él el endpoint no sabría de quién es la
 * fila, y esperar es gratis porque el FCP ya ocurrió y queda guardado en el
 * buffer de performance. */
export function useMuestraDelAparato(listo: boolean, rescate: Rescate) {
  const api = useGameApi()
  useEffect(() => {
    if (!listo || yaMandada) return
    yaMandada = true
    void (async () => {
      const fcp = await esperarFcp()
      // Sin await y con el error tragado, igual que el resto de la telemetría
      // del juego: que esto falle no puede ensuciar lo que la persona está
      // haciendo.
      void api
        .POST("/game/derivemos/dispositivo", {
          body: {
            platform: getPlatform(),
            device_model: modeloDelAparato(navigator.userAgent),
            fcp_ms: fcp,
            dcl_ms: domContentLoaded(),
            sin_token_local: rescate.sinTokenLocal,
            token_rescatado: rescate.rescatado,
          },
        })
        .catch(() => {})
    })()
  }, [listo, api, rescate])
}
