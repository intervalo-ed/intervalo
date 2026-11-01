// Permiso y token de Expo de los avisos del juego: el par nativo de
// `subscribeToPush` de la web (web/src/lib/push/register.ts).

import { Platform } from "react-native"
import Constants from "expo-constants"
import * as Notifications from "expo-notifications"
import { unwrap } from "@intervalo/dx-core/api/client"
import { almacen } from "@intervalo/dx-core/almacen/key-value-store"
import type { GameApiClient } from "@intervalo/dx-core/juego/game-api-context"

const TOKEN_KEY = "intervalo:game:expo-push-token"

// Lo lee el ladder adentro de un callback, así que tiene que ser sincrónico: se
// llena al arrancar con `refrescarPermisoDeAvisos()` y después de cada pedido.
let permiso: Notifications.PermissionStatus | null = null

/** Verdadero solo si todavía no se preguntó: `denied` ya lo decidió la persona
 *  y `granted` es que ya está. Sin el refresco del arranque, falso. */
export function puedeOfrecerAvisosNativos(): boolean {
  return permiso === Notifications.PermissionStatus.UNDETERMINED
}

export async function refrescarPermisoDeAvisos(): Promise<void> {
  try {
    permiso = (await Notifications.getPermissionsAsync()).status
  } catch {
    permiso = null
  }
}

/** El token con el que se registró este aparato, o null. Es el `endpoint` de
 *  la fila en el backend, y el beacon del tap lo manda igual que el SW. */
export function tokenDeAvisosGuardado(): string | null {
  return almacen().store.get(TOKEN_KEY)
}

export async function suscribirAvisosNativos({ api }: { api: GameApiClient }): Promise<void> {
  // En Android 13+ el diálogo del permiso no aparece hasta que hay un canal.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Recordatorios",
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }
  const respuesta = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  })
  permiso = respuesta.status
  if (!respuesta.granted) throw new Error("denied")
  await subirToken({ api })
}

/** Al arrancar, con el permiso ya dado: vuelve a mandar el token en silencio
 *  (puede haber rotado, o la fila haberse podado). */
export async function reafirmarTokenDeAvisos({ api }: { api: GameApiClient }): Promise<void> {
  try {
    const { granted } = await Notifications.getPermissionsAsync()
    if (granted) await subirToken({ api })
  } catch (e) {
    if (__DEV__) console.warn("[avisos] no se pudo reafirmar el token", e)
  }
}

let avisoSinProyecto = false

async function subirToken({ api }: { api: GameApiClient }) {
  const projectId: string | undefined =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  // Hasta que el proyecto exista en EAS no hay token de Expo: el permiso y la
  // preferencia siguen, el aparato simplemente todavía no recibe nada.
  if (!projectId) {
    if (!avisoSinProyecto) {
      avisoSinProyecto = true
      console.warn("[avisos] sin projectId de EAS: no se pide el token de Expo")
    }
    return
  }
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
  unwrap(await api.POST("/game/derivemos/push/expo", { body: { token } }))
  almacen().store.set(TOKEN_KEY, token)
}
