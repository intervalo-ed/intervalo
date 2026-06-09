/**
 * Browser-side Web Push helpers: service-worker registration + PushManager
 * subscribe/unsubscribe. The caller is responsible for persisting the
 * subscription to the backend (`POST /push/subscribe`).
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export type SerializedSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    updateViaCache: "none",
  })
  return navigator.serviceWorker.ready
}

function serialize(sub: PushSubscription): SerializedSubscription {
  const json = sub.toJSON()
  return {
    endpoint: json.endpoint!,
    keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
  }
}

export async function getCurrentSubscription(): Promise<SerializedSubscription | null> {
  if (!isPushSupported()) return null
  const reg = await getRegistration()
  const sub = await reg.pushManager.getSubscription()
  return sub ? serialize(sub) : null
}

/**
 * Request permission and subscribe. Throws if the browser is unsupported, the
 * VAPID key is missing, or the user denies permission.
 */
export async function subscribeToPush(): Promise<SerializedSubscription> {
  if (!isPushSupported()) throw new Error("unsupported")
  if (!VAPID_PUBLIC_KEY) throw new Error("missing-vapid-key")

  const permission = await Notification.requestPermission()
  if (permission !== "granted") throw new Error("permission-denied")

  const reg = await getRegistration()
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }))
  return serialize(sub)
}

/** Unsubscribe from the browser PushManager. Returns the removed endpoint, if any. */
export async function unsubscribeFromPush(): Promise<string | null> {
  if (!isPushSupported()) return null
  const reg = await getRegistration()
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return null
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  return endpoint
}

export function getTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
