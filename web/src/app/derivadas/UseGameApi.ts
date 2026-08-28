"use client"

import { useMemo } from "react"
import { useAuth } from "@clerk/nextjs"
import { createGameApiClient } from "./game-api"

export function useGameApi() {
  const { getToken } = useAuth()
  return useMemo(() => createGameApiClient(getToken), [getToken])
}
