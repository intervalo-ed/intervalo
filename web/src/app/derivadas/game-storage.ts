// Estado local del minijuego. Todo con try/catch: Safari en modo privado tira
// al escribir y nada de esto puede romper el juego.

import { RUTA_TOKEN } from "./token-cookie"

const TOKEN_KEY = "intervalo:game:token"
const CAFECITO_LAST_KEY = "intervalo:game:cafecito-last"
const CAFECITO_VISTOS_KEY = "intervalo:game:cafecito-vistos"
const REGISTRO_OFRECIDO_KEY = "intervalo:game:registro-ofrecido"
const INSTALAR_KEY = "intervalo:game:instalar"
const NOTIF_KEY = "intervalo:game:notificaciones"
const OPINION_KEY = "intervalo:game:opinion"
const ENCUESTA_KEY = "intervalo:game:encuesta"
// Si ya se le preguntó cada cuánto quiere ver el ranking (ranking-frecuencia.ts).
// Es la MARCA de que la diapo salió; la preferencia elegida vive en su propia
// clave, dentro de ese módulo, y no se borra con la identidad.
const RANKING_FRECUENCIA_KEY = "intervalo:game:ranking-frecuencia-pedido"
// La caja vieja de las reglas guardaba `vistas: 1` con UN solo significado:
// «las tres ya salieron», porque salían juntas. La nueva cuenta de 0 a 3, así
// que ese mismo 1 pasó a querer decir «salió una». Son dos idiomas distintos en
// la misma clave, y no se pueden distinguir mirando el valor.
//
// Por eso la caja nueva es otra clave, y la vieja queda de solo lectura para
// traducirla una vez (reglas-trigger.ts :: reglasDichas). Reutilizarla habría
// hecho que quien ya vio las tres se comiera dos de nuevo, en la 8 y en la 15.
const REGLAS_V1_KEY = "intervalo:game:reglas"
const REGLAS_KEY = "intervalo:game:reglas-2"
const CIERRE_KEY = "intervalo:game:cafecito-cierre"
const PWA_DESDE_KEY = "intervalo:game:pwa-desde"

// El token del invitado se lee además como STORE REACTIVO (`subscribeGameToken`
// + `getGameTokenSnapshot`, que consume `useGameToken` en UseGamePlayer.ts).
//
// No es una elegancia: `readGameToken()` suelta adentro de un componente es una
// lectura no reactiva, y el React Compiler la memoiza junto al resto de la
// expresión que la contiene. En el `enabled` de la query del jugador eso
// significaba que el gate se evaluaba UNA sola vez —cuando Clerk terminaba de
// cargar, con el invitado todavía sin crear y por lo tanto sin token— y quedaba
// clavado en `false` para el resto de la visita. La query nunca se activaba, las
// invalidaciones de cada respuesta no refrescaban nada, y los tres marcadores de
// la card (ejercicios, racha, elo) se quedaban en cero hasta recargar la página.
//
// Al recargar el token ya estaba guardado en ese único render, así que el bug
// solo se veía en la primera visita: exactamente el síntoma reportado.
//
// El caché de módulo es necesario para `useSyncExternalStore`, que exige que dos
// llamadas seguidas devuelvan el mismo valor mientras nada haya cambiado.
// `undefined` significa "todavía no leído"; `null` es "leído, no hay token".
let tokenCache: string | null | undefined
const tokenListeners = new Set<() => void>()

export function subscribeGameToken(onChange: () => void) {
  tokenListeners.add(onChange)
  return () => {
    tokenListeners.delete(onChange)
  }
}

export function getGameTokenSnapshot(): string | null {
  if (tokenCache === undefined) tokenCache = readGameToken()
  return tokenCache
}

/** En el servidor no hay localStorage y el snapshot tiene que ser estable. */
export function getGameTokenServerSnapshot(): string | null {
  return null
}

export function readGameToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

// Cuál token ya se mandó a la cookie en esta carga. El alta lo guarda una vez y
// el rescate lo vuelve a guardar apenas lo adopta, así que sin esto la misma
// carga haría dos POST idénticos.
let enLaCookie: string | null = null

/** Copia el token a la cookie de primera parte, que es la que sobrevive al
 *  borrado de Safari (ver `app/api/dx/token/route.ts`).
 *
 *  Sin `await` y tragando el error a propósito: es un respaldo, y que falle no
 *  puede frenar ni ensuciar el arranque del juego. Se vuelve a escribir en cada
 *  visita, o sea que el vencimiento es una ventana deslizante. */
function espejarEnCookie(token: string) {
  // `fetch` con una ruta relativa TIRA en el servidor, y lo hace antes de
  // devolver la promesa —así que el `.catch` de abajo no lo agarraría—. Este
  // módulo lo importan componentes de cliente, que Next igual renderiza del
  // lado del servidor para hidratar.
  if (typeof window === "undefined") return
  if (enLaCookie === token) return
  enLaCookie = token
  void fetch(RUTA_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
    keepalive: true,
  }).catch(() => {})
}

export function saveGameToken(token: string) {
  // El caché y el aviso van SIEMPRE, aunque el localStorage falle: en Safari
  // privado el token igual sirve para la sesión en curso, y lo que no puede
  // pasar es que quien lo esté esperando no se entere.
  const changed = tokenCache !== token
  tokenCache = token
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Sin persistencia el juego sigue: se pierde el progreso al recargar.
  }
  espejarEnCookie(token)
  if (changed) for (const listener of tokenListeners) listener()
}

/** Qué encontró esta carga: si había token guardado, y si hubo que ir a
 *  buscarlo a la cookie. */
export type Rescate = { sinTokenLocal: boolean; rescatado: boolean }

/** Adopta el token que vino en la cookie, si en este navegador no hay ninguno.
 *
 *  Es a la vez el arreglo y la medición, y por eso devuelve las dos banderas en
 *  vez de un booleano. Safari borra el localStorage de un sitio al que no se
 *  vuelve en siete días, y sin `guest_token` guardado cada carga de página es
 *  un jugador nuevo — que es la explicación más probable de que iOS tenga el
 *  41,9% de sus filas sin una derivada servida y retenga la mitad que Android.
 *
 *  · `sinTokenLocal: false` → visita normal, no pasó nada.
 *  · `sinTokenLocal: true, rescatado: true` → el borrado ocurrió y se recuperó
 *    la identidad. Contar estas contra las de arriba ES la medición.
 *  · `sinTokenLocal: true, rescatado: false` → alguien nuevo de verdad, o
 *    alguien que borró los datos del sitio a mano. Los dos son correctos.
 *
 *  Corre durante el PRIMER render de `GameRoot`, antes de `useGamePlayer`, para
 *  que el alta salga ya con el token puesto y el server devuelva al jugador de
 *  siempre en vez de crear uno. */
export function adoptarTokenDeRescate(deLaCookie: string | null): Rescate {
  // En el render del servidor no hay nada que adoptar ni a dónde guardarlo. El
  // inicializador de `useState` que llama a esto vuelve a correr en el cliente
  // al hidratar, que es cuando de verdad importa.
  if (typeof window === "undefined") {
    return { sinTokenLocal: false, rescatado: false }
  }
  const propio = readGameToken()
  if (propio !== null) {
    tokenCache = propio
    espejarEnCookie(propio)
    return { sinTokenLocal: false, rescatado: false }
  }
  if (deLaCookie === null) return { sinTokenLocal: true, rescatado: false }
  saveGameToken(deLaCookie)
  return { sinTokenLocal: true, rescatado: true }
}

/** Borra toda huella local de quién era este jugador: el token de invitado y
 *  los contadores que cuelgan de él (el cooldown de cafecito/reclutar, cuántas
 *  veces se mostró el café, el estado del pedido de instalación y los envíos
 *  recientes del chat).
 *
 *  La usa "Cerrar sesión" en `settings-panel.tsx`: cerrar la sesión de Clerk
 *  sin esto dejaría el token de invitado viejo guardado, y el próximo alta
 *  (`useGamePlayer`) lo mandaría de vuelta tal cual, o sea que "cerrar sesión"
 *  no cerraría nada — solo volvería a mostrar al mismo jugador sin cuenta. */
export function clearGameIdentity() {
  tokenCache = null
  // Y la cookie también, o cerrar sesión no cerraría nada: en la carga
  // siguiente el rescate resucitaría al invitado viejo, que es exactamente el
  // bug que esta función existe para no tener.
  enLaCookie = null
  void fetch(RUTA_TOKEN, { method: "DELETE" }).catch(() => {})
  try {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(CAFECITO_LAST_KEY)
    window.localStorage.removeItem(CAFECITO_VISTOS_KEY)
    window.localStorage.removeItem(REGISTRO_OFRECIDO_KEY)
    window.localStorage.removeItem(INSTALAR_KEY)
    window.localStorage.removeItem(NOTIF_KEY)
    window.localStorage.removeItem(OPINION_KEY)
    window.localStorage.removeItem(OPINION_SALTOS_KEY)
    window.localStorage.removeItem(TOPE_VISTO_KEY)
    window.localStorage.removeItem(ENCUESTA_KEY)
    window.localStorage.removeItem(RANKING_FRECUENCIA_KEY)
    window.localStorage.removeItem(REGLAS_KEY)
    window.localStorage.removeItem(REGLAS_V1_KEY)
    window.localStorage.removeItem(CIERRE_KEY)
    window.localStorage.removeItem(PWA_DESDE_KEY)
    window.localStorage.removeItem(CHAT_SENDS_KEY)
  } catch {
    // Nada que limpiar si tampoco se pudo escribir.
  }
  for (const listener of tokenListeners) listener()
}

// Cuándo se le pidió algo a esta persona por última vez: el número de derivada
// resuelta en el que apareció la última diapo que interrumpe para pedir.
//
// Es UNO SOLO para las dos —el cafecito y el reclutamiento— y ahí está su
// gracia. Con un cooldown por diapo, cada una respetaba su propio turno y las
// dos podían caer seguidas: el café por un récord y el reclutamiento por llegar
// a diez, con una sola derivada en el medio. Dos pedidos pegados no son dos
// pedidos, son un peaje. Compartiendo el contador, la regla queda escrita una
// vez y es la que se quiere: un pedido por vez, del tipo que sea.
//
// La clave de localStorage sigue diciendo "cafecito" a propósito: renombrarla
// resetearía el cooldown de todo el mundo, y lo que guarda no cambió.
export function readUltimoPedidoAt(): number {
  if (typeof window === "undefined") return -Infinity
  try {
    const raw = window.localStorage.getItem(CAFECITO_LAST_KEY)
    return raw === null ? -Infinity : Number(raw)
  } catch {
    return -Infinity
  }
}

/** Cuándo interrumpió el juego por última vez, contando TAMBIÉN las pantallas
 *  que no consumen el cooldown compartido: instalar y el registro.
 *
 *  Distinta de `readUltimoPedidoAt`, que es el cooldown compartido. Instalar no
 *  lo consume a propósito (ver INSTALAR_SEPARACION) y el registro nunca estuvo
 *  adentro. Esa excepción resuelve una mitad —que ninguna de las dos corra al
 *  café ni al reclutamiento— y deja la otra abierta: nada impedía que el café
 *  cayera pegado a ellas.
 *
 *  Con la ventana compartida en diez no se veía, porque diez derivadas de
 *  silencio tapaban cualquier cosa. Con la ventana más corta aparecen las dos
 *  formas: un récord justo después de la pantalla de instalar (derivada 46, un
 *  acierto después de la instalación de la 45), y la re-oferta de registro
 *  compartiendo respuesta con un récord del café.
 *
 *  La encuesta de dificultad queda AFUERA y es a propósito: meterla correría el
 *  primer cafecito de la 14 a la 20, y la encuesta es la única de las tres que
 *  no pide nada que el juego quiera.
 *
 *  Devuelve -Infinity si todavía no interrumpió nada, igual que las que
 *  compara. */
export function readUltimaInterrupcion(): number {
  return Math.max(readUltimoPedidoAt(), readPedidoState(INSTALAR_KEY).ultima)
}

/** La última respuesta en la que YA salió una pantalla, sea cual sea.
 *
 *  Sirve para UNA sola cosa y por eso es otra función: que dos pantallas no
 *  compartan respuesta. No es una distancia, es una igualdad — el ladder vuelve
 *  a entrar después de cada diapo con otro `consumed`, así que sin esto dos
 *  disparadores que apuntan al mismo número se dibujan uno atrás del otro sobre
 *  la misma derivada, que es la pila que el mapa de hitos existe para no tener.
 *
 *  Separada de `readUltimaInterrupcion` porque las dos reglas son distintas y
 *  mezclarlas sale caro: con una sola lectura y una distancia de cuatro, la
 *  pregunta de la varita de la 18 empujaba el segundo cafecito de la 20 a la 40.
 *  Estar a dos derivadas de distancia está bien; compartir la respuesta, no. */
export function readUltimaPantalla(): number {
  return Math.max(
    readUltimaInterrupcion(),
    readRegistroOfrecidoAt(),
    readPedidoState(ENCUESTA_KEY).ultima,
    readPedidoState(RANKING_FRECUENCIA_KEY).ultima,
    readPedidoState(OPINION_KEY).ultima,
  )
}

export function saveUltimoPedidoAt(solvedCount: number) {
  try {
    window.localStorage.setItem(CAFECITO_LAST_KEY, String(solvedCount))
  } catch {}
}

// Cuántas veces le salió sola la diapo del café a esta persona.
//
// Es OTRA cosa que el cooldown de acá arriba, que cuenta derivadas: este cuenta
// APARICIONES, y existe para una sola regla —la primera es siempre «¿Café?»—.
// Ver `elegirTriggerDeCafecito` en cafecito-cta.tsx.
//
// Si no se puede leer, cero: peor caso, alguien ve la copy neutra una vez de
// más, que es exactamente el lado hacia el que conviene errar.
export function readCafecitosVistos(): number {
  if (typeof window === "undefined") return 0
  try {
    const raw = window.localStorage.getItem(CAFECITO_VISTOS_KEY)
    const n = raw === null ? 0 : Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function bumpCafecitosVistos() {
  try {
    window.localStorage.setItem(
      CAFECITO_VISTOS_KEY,
      String(readCafecitosVistos() + 1),
    )
  } catch {}
}

// En qué derivada se le ofreció registrarse por última vez, o -Infinity si
// nunca.
//
// Guardado y no en memoria porque el hito pasó a contarse con las correctas
// ACUMULADAS del jugador (las del servidor) en vez de con las de la pestaña. Con
// un contador de pestaña, recargar reseteaba la cuenta y la oferta no volvía a
// salir; con el del servidor pasa lo contrario —recargar la haría salir de nuevo
// en la primera respuesta, porque la condición ya está cumplida— y una oferta de
// registro en cada recarga es peor que ninguna. Esto es lo que la espacia.
export function readRegistroOfrecidoAt(): number {
  if (typeof window === "undefined") return -Infinity
  try {
    const raw = window.localStorage.getItem(REGISTRO_OFRECIDO_KEY)
    return raw === null ? -Infinity : Number(raw)
  } catch {
    return -Infinity
  }
}

export function marcarRegistroOfrecido(totalCorrectas: number) {
  try {
    window.localStorage.setItem(REGISTRO_OFRECIDO_KEY, String(totalCorrectas))
  } catch {}
}

// Cuándo se mandaron los últimos mensajes al chat, en milisegundos de época —
// los que todavía cuentan para el tope de frecuencia. Guarda una LISTA y no un
// solo instante porque el tope de verdad (limits.por_jugador en el backend,
// hoy tres por minuto) es una ventana corrediza: alcanza con no haber mandado
// tres en el último minuto, no con haber esperado un minuto entero desde el
// anterior.
//
// Clave propia y no la de arriba: aquella cuenta DERIVADAS RESUELTAS y sirve
// para espaciar interrupciones; esta cuenta tiempo de reloj y sirve para que el
// botón sepa que el servidor va a rechazar el próximo mensaje. Son dos cosas
// distintas que se miden en unidades distintas.
//
// Es una copia del tope que manda de verdad: si se pierde —otro navegador,
// borrar datos— no pasa nada, el servidor contesta 429 igual. Lo único que se
// pierde es poder avisarlo antes.
const CHAT_SENDS_KEY = "intervalo:game:chat-sends"

export function readEnviosRecientes(): number[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(CHAT_SENDS_KEY)
    if (raw === null) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((n): n is number => typeof n === "number")
      : []
  } catch {
    return []
  }
}

/** Registra un envío y de paso poda los que ya salieron de la ventana — así
 *  la lista no crece para siempre en una sesión larga. */
export function registrarEnvio(at: number, ventanaMs: number) {
  try {
    const vigentes = readEnviosRecientes().filter((t) => t > at - ventanaMs)
    vigentes.push(at)
    window.localStorage.setItem(CHAT_SENDS_KEY, JSON.stringify(vigentes))
  } catch {}
}

// Cuántas veces se ofreció algo que se REPITE, y en qué derivada fue la última.
//
// Son DOS números y no uno porque estos pedidos vuelven: cada tantas derivadas
// mientras la persona no haya accionado, con un tope de apariciones. Con un solo
// marcador —como el del registro— no hay forma de dejar de insistir, y un pedido
// que vuelve para siempre deja de ser un pedido.
//
// Un solo valor JSON en vez de dos claves: se leen y se escriben siempre juntos,
// y dos claves permiten el estado imposible de tener cuenta sin última.
//
// Cualquier cosa ilegible cuenta como "nunca se ofreció". Peor caso, alguien ve
// el pedido una vez de más — que es el lado hacia el que conviene errar, porque
// el otro es no ofrecérselo nunca a quien sí lo quería.
export type PedidoRepetido = { vistas: number; ultima: number }

/** Los dos pedidos que se repiten, cada uno con su cuenta propia.
 *
 * Separados a propósito: el de la pantalla de inicio y el de los recordatorios
 * son escalones distintos del mismo camino —hay que instalar para poder
 * notificar— así que compartir el contador significaría que quien vio uno nunca
 * llega al otro. Es exactamente el motivo por el que Intervalo lleva dos
 * contextos en `notify-hint-seen.ts`. */
export const PEDIDO_INSTALAR = INSTALAR_KEY
export const PEDIDO_NOTIFICACIONES = NOTIF_KEY
/** Y la encuesta de dificultad, que se repite con su propia cuenta por lo
 *  mismo: es otro pedido y no un escalón de aquellos dos. */
export const PEDIDO_OPINION = OPINION_KEY
/** La pregunta abierta, que NO se repite: `vistas` llega a 1 y se queda ahí.
 *  Caja propia y no la de la encuesta de dificultad porque son dos preguntas
 *  distintas y quien contestó una tiene que poder recibir la otra. */
export const PEDIDO_ENCUESTA = ENCUESTA_KEY
/** La pregunta de cada cuánto ver el ranking, que tampoco se repite. Misma caja
 *  que la varita y por lo mismo: lo único que hay que guardar es que ya salió y
 *  en qué derivada, para que ninguna otra pantalla comparta esa respuesta. */
export const PEDIDO_RANKING_FRECUENCIA = RANKING_FRECUENCIA_KEY
/** Las reglas del juego, que NO se repiten: usan la misma caja porque lo único
 *  que necesitan guardar es cuántas ya se dijeron, y una caja con dos números es
 *  más barata que una tercera forma de guardar lo mismo. `vistas` cuenta de 0 a
 *  3 —las tres de un saque en el brazo `control`, de a una en `sin-peaje`— y
 *  `ultima` es la correcta en la que salió la última, que es lo que las mantiene
 *  espaciadas (reglas-trigger.ts). */
export const PEDIDO_REGLAS = REGLAS_KEY
/** La caja vieja, de solo lectura y solo para traducirla. Ver arriba. */
export const PEDIDO_REGLAS_V1 = REGLAS_V1_KEY

const SIN_PEDIR: PedidoRepetido = { vistas: 0, ultima: -Infinity }

export function readPedidoState(clave: string): PedidoRepetido {
  if (typeof window === "undefined") return SIN_PEDIR
  try {
    const raw = window.localStorage.getItem(clave)
    if (raw === null) return SIN_PEDIR
    const v = JSON.parse(raw) as Partial<PedidoRepetido>
    if (typeof v?.vistas !== "number" || typeof v?.ultima !== "number") {
      return SIN_PEDIR
    }
    return { vistas: v.vistas, ultima: v.ultima }
  } catch {
    return SIN_PEDIR
  }
}

export function savePedidoState(clave: string, estado: PedidoRepetido) {
  try {
    window.localStorage.setItem(clave, JSON.stringify(estado))
  } catch {}
}

// Cuántas veces seguidas se cerró una encuesta sin contestarla.
//
// Es el freno que reemplazó al tope de tres apariciones que tenía la encuesta de
// dificultad. La diferencia importa: el tope contaba lo que el juego preguntaba y
// cortaba también a quien contestaba siempre, que es justo la persona que hay que
// seguir escuchando. Esto cuenta lo que la persona IGNORA, así que corta solo
// donde molesta. Con 91,8% de respuesta medido, son muy pocos.
//
// Es la misma idea que `feedback_survey.SKIP_STREAK_LEN` en el clásico.
//
// **Clave propia y no un tercer campo de `PedidoRepetido`.** Ese tipo lo
// comparten cinco cajas y `readPedidoState` devuelve un objeto reconstruido campo
// por campo, así que un campo nuevo se descartaría en silencio al leer; y las
// otras cuatro cajas no tienen nada que hacer con una racha de salteos.
//
// Un número pelado y no JSON porque es un número pelado. Ilegible cuenta como
// cero, o sea «no viene salteando»: el lado hacia el que conviene errar es
// preguntar una vez de más, no dejar de escuchar a alguien por un dato perdido.
const OPINION_SALTOS_KEY = "intervalo:game:opinion-saltos"

export function readOpinionSaltos(): number {
  if (typeof window === "undefined") return 0
  try {
    const n = Number(window.localStorage.getItem(OPINION_SALTOS_KEY))
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    return 0
  }
}

export function saveOpinionSaltos(n: number) {
  try {
    window.localStorage.setItem(OPINION_SALTOS_KEY, String(n))
  } catch {}
}

// Qué día se le mostró por última vez el cartel del tope diario, como "AAAA-MM-DD".
//
// **Existe para que la impresión se cuente UNA vez por día y no una por
// montaje**, y sin eso el CTR del experimento de monetización sería mentira:
// desde el cartel se sale al ranking y del ranking se vuelve al cartel, así que
// alguien que rebota diez veces dejaría diez impresiones y un click —10% de CTR
// cuando la verdad es 100%—. Es el mismo error que el panel ya denuncia en
// `settings` (24 clicks y cero impresiones), al revés.
//
// El mismo valor decide los cinco segundos de espera del botón de esperar: se
// cobran la primera vez del día, que es cuando hay algo para leer, y no en cada
// rebote, donde serían una traba.
//
// La fecha la manda el SERVIDOR (el "hoy" del juego es el de Buenos Aires, ver
// game/router.py :: _inicio_del_dia) y acá solo se compara como texto: sin eso,
// alguien jugando desde Madrid tendría un día propio y el cupo se le renovaría
// cuando no corresponde.
const TOPE_VISTO_KEY = "intervalo:game:tope-visto"

export function readTopeVisto(): string {
  if (typeof window === "undefined") return ""
  try {
    return window.localStorage.getItem(TOPE_VISTO_KEY) ?? ""
  } catch {
    return ""
  }
}

export function saveTopeVisto(dia: string) {
  try {
    window.localStorage.setItem(TOPE_VISTO_KEY, dia)
  } catch {}
}

// Qué empuje ya se cerró en pantalla: el `boost_id` del último cafecito cuyo
// total final se le mostró a quien lo invitó.
//
// Existe para que la cara de cierre salga UNA vez y no en cada aparición de la
// diapo durante las 48 h que el servidor la recuerda
// (game/boosts.py :: MEMORIA_CIERRE_HORAS). Un número y no una lista: cada
// donación cierra después de la anterior, así que recordar la última alcanza.
//
// Si no se puede leer ni escribir, se muestra de nuevo. Es el lado barato: el
// costo de repetir un agradecimiento es mucho menor que el de no darlo.
export function readCierreMostrado(): number | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CIERRE_KEY)
    const n = raw === null ? NaN : Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function marcarCierreMostrado(boostId: number) {
  try {
    window.localStorage.setItem(CIERRE_KEY, String(boostId))
  } catch {}
}

// En qué derivada esta persona empezó a jugar desde la app instalada.
//
// El pedido de recordatorios se cuenta desde ACÁ y no desde el total: quien
// instaló en la derivada 30 ya demostró todo lo que había que demostrar, y
// hacerlo esperar hasta la 50 para ofrecerle lo único que puede traerlo de vuelta
// es perder a la persona más comprometida del embudo.
//
// Se escribe una sola vez, la primera vez que se detecta la app instalada.
export function readPwaDesde(): number | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(PWA_DESDE_KEY)
    return raw === null ? null : Number(raw)
  } catch {
    return null
  }
}

export function marcarPwaDesde(totalCorrectas: number): number {
  const ya = readPwaDesde()
  if (ya !== null) return ya
  try {
    window.localStorage.setItem(PWA_DESDE_KEY, String(totalCorrectas))
  } catch {}
  return totalCorrectas
}
