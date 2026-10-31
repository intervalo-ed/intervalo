"use client"

// El cliente del juego llega por contexto y no se arma acá: cómo se consigue el
// JWT y qué plataforma se reporta depende de dónde corre (Clerk + navegador en
// la web). Los hooks del juego solo lo leen.

import { createContext, useContext } from "react"
import type { Client } from "openapi-fetch"
import type { paths } from "../api/schema"

export type GameApiClient = Client<paths>

const GameApiContext = createContext<GameApiClient | null>(null)

export const GameApiProvider = GameApiContext.Provider

export function useGameApi(): GameApiClient {
  const api = useContext(GameApiContext)
  if (api === null) {
    throw new Error("useGameApi necesita un <GameApiProvider> más arriba en el árbol")
  }
  return api
}
