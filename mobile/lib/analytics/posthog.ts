// El cliente de PostHog, uno solo y armado al cargar el módulo para que `track()`
// lo encuentre aunque se llame fuera de React. Sin key no hay cliente.

import PostHog from "posthog-react-native"
import { mmkv } from "@/lib/almacen/mmkv-store"
import { env } from "@/lib/env"

export const posthog: PostHog | null = env.posthogKey
  ? new PostHog(env.posthogKey, {
      host: env.posthogHost,
      // El mismo MMKV del juego: sincrónico y sin sumar async-storage.
      customStorage: {
        getItem: (key) => mmkv.getString(`posthog.${key}`) ?? null,
        setItem: (key, value) => mmkv.set(`posthog.${key}`, value),
      },
    })
  : null
