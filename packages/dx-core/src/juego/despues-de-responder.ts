// Qué diapo sigue después de responder (o de cerrar el ranking, un hito, el
// cafecito…). Es la escalera del juego en el teléfono, y vive acá y no en
// mobile-flow.tsx para que la app nativa recorra exactamente el mismo orden.
//
// Solo DECIDE: no escribe en el almacén, no anota eventos ni mueve pantallas.
// Lee los disparadores (`toca*`, que miran el almacén instalado) y devuelve el
// paso; los `marcar*`, las refs de la sesión y la telemetría los hace quien
// llama, guiado por el resultado. Lo que depende de la plataforma —si se puede
// ofrecer instalar o pedir permiso de avisos, y si existe el cafecito— entra
// ya resuelto.
//
// Escritorio tiene su propia escalera (desktop-layout.tsx) y no pasa por acá.

import type { GameAnswer } from "./UseGameExercise"
import type { GamePlayer } from "./game-keys"
import type { CafecitoTrigger } from "./cafecito-trigger"
import { readPwaDesde } from "./game-storage"
import { tocaInstalar, tocaNotificaciones } from "./instalacion-trigger"
import { tocaEncuesta } from "./encuesta-trigger"
import { HITO_PERFIL, tocaRegistro } from "./hitos-del-juego"
import { tocaPreguntar } from "./opinion-trigger"
import {
  tocaPreguntarFrecuencia,
  tocaRanking,
  type FrecuenciaRanking,
} from "./ranking-frecuencia"
import { tocaReclutar } from "./reclutas-trigger"
import { REGLAS_DE_LA_DIAPO, tocaReglas } from "./reglas-trigger"

// Cuántas novedades sin ver hacen falta para frenar a alguien y mostrárselas.
//
// El pedido era "cada vez que haya novedades", y ese número es 1 — pero con la
// actividad del juego corriendo hay eventos casi todo el tiempo, así que con 1
// la pantalla aparecería después de CADA respuesta y dejaría de ser una novedad
// para ser un peaje. Con tres, la interrupción llega cuando de verdad pasó algo
// y el resto del tiempo el juego no se detiene.
//
// Es la perilla de esta feature: subirlo la hace más rara, bajarlo más
// frecuente.
export const NOVEDADES_MINIMAS = 3

/** Lo que se acaba de cerrar: `null` es «recién respondió». */
export type EntradaDespuesDeResponder =
  | "ranking"
  | "novedades"
  | "milestone"
  | "cafecito"
  | "reclutas"
  | "instalar"
  | "notificaciones"
  | "opinion"
  | "repetitividad"
  | "encuesta"
  | "frecuencia"
  | "username"
  | "reglas"
  | null

export type PasoDespuesDeResponder =
  | {
      paso: "ranking"
      /** Si subió de puesto: lo que se anota como `game_rank_change` y desde
       *  dónde arranca la trepada. */
      subida: { desde: number; hasta: number; delta: number } | null
    }
  | { paso: "username" }
  | { paso: "reglas"; cuales: number[] }
  | { paso: "novedades" }
  | { paso: "perfil" }
  | { paso: "registro" }
  | { paso: "instalar" }
  | { paso: "notificaciones"; enPwa: number }
  | { paso: "cafecito"; trigger: CafecitoTrigger; correctToday: number }
  | { paso: "reclutas"; trigger: "hito" }
  | { paso: "frecuencia" }
  | { paso: "encuesta" }
  | { paso: "opinion" }
  | { paso: "repetitividad" }
  | { paso: "siguiente-ejercicio" }

export type DespuesDeResponder = PasoDespuesDeResponder & {
  /** La correcta no pasa por el ranking (por la frecuencia elegida): quien
   *  llama desarma el festejo que esperaba esa diapo y refresca el ranking. */
  saltaRanking: boolean
  /** Se detectó la app instalada: quien llama anota desde cuándo
   *  (`marcarPwaDesde`), que escribe solo la primera vez. Va ANTES de los
   *  `marcar*` del paso, como iba en la escalera. */
  anotarPwaDesde: boolean
}

export function despuesDeResponder({
  entrada,
  respuesta,
  jugador,
  yaPreguntoUsername,
  reglasMostradas,
  yaPreguntoPerfil,
  yaPreguntoRegistro,
  sinVer,
  frecuenciaRanking,
  cafecito,
  puedeOfrecerInstalar,
  puedeOfrecerNotificaciones,
}: {
  entrada: EntradaDespuesDeResponder
  respuesta: Pick<
    GameAnswer,
    "correct" | "rank_before" | "rank_after" | "exercises_correct" | "correct_today"
  >
  jugador: Pick<GamePlayer, "is_guest" | "alias_is_generated" | "university"> | null
  yaPreguntoUsername: boolean
  reglasMostradas: boolean
  yaPreguntoPerfil: boolean
  yaPreguntoRegistro: boolean
  /** Novedades sin ver. */
  sinVer: number
  frecuenciaRanking: FrecuenciaRanking
  /** Lo que decidió el cafecito para esta respuesta (cafecito-cta.tsx), o
   *  `null` donde no existe —la app nativa— o no tiene motivo. */
  cafecito: { trigger: CafecitoTrigger; toca: boolean } | null
  puedeOfrecerInstalar: boolean
  puedeOfrecerNotificaciones: boolean
}): DespuesDeResponder {
  const a = respuesta
  const totalCorrectas = a.exercises_correct
  const rankBefore = a.rank_before ?? null
  const rankAfter = a.rank_after ?? null

  // ── ¿Esta correcta pasa por el ranking? ─────────────────────────────
  //
  // Hasta el 09/10 la respuesta era siempre sí. Ahora lo decide la
  // preferencia de la persona (ranking-frecuencia.ts): cada derivada, cada
  // cinco o solo cuando sube. Cuando NO pasa, el resto de la escalera corre
  // igual que si acabara de salir del ranking —el @, las reglas, las
  // novedades y los hitos miran `consumed === "ranking"`—, así que la
  // entrada se traduce acá y una sola vez.
  const subio = rankBefore !== null && rankAfter !== null ? rankAfter < rankBefore : null
  const saltaRanking =
    entrada === null &&
    a.correct &&
    !tocaRanking({ frecuencia: frecuenciaRanking, totalCorrectas, subio })
  const consumed = saltaRanking ? ("ranking" as const) : entrada

  let anotarPwaDesde = false
  const listo = (paso: PasoDespuesDeResponder): DespuesDeResponder => ({
    ...paso,
    saltaRanking,
    anotarPwaDesde,
  })

  // Toda correcta pasa por el ranking: ahí está el marcador y ahí sube el
  // número. Las erradas siguen de largo al próximo ejercicio.
  //
  // Es lo PRIMERO que sale después de responder, antes incluso del @ (ver
  // abajo): el festejo es la respuesta al toque, y cualquier cosa que se
  // meta en el medio lo corre de donde se ganó.
  if (consumed === null && a.correct) {
    const subida =
      rankBefore !== null && rankAfter !== null && rankAfter < rankBefore
        ? { desde: rankBefore, hasta: rankAfter, delta: rankBefore - rankAfter }
        : null
    return listo({ paso: "ranking", subida })
  }

  // ── El @, DESPUÉS del ranking ────────────────────────────────────────
  //
  // **Esto rompe a propósito el trato que tenía esta pantalla.** El @ entraba
  // antes del ranking para que la XP cayera en una fila que ya tenía el
  // nombre elegido; invertido, el primer festejo se mira con el alias
  // generado y el nombre llega después. Se aceptó ese costo para que el
  // orden sea el mismo en los dos layouts: en escritorio el ranking es la
  // columna de al lado y la XP vuela hacia ella en el instante de responder,
  // así que allá el ranking SIEMPRE se vio primero. El teléfono era la
  // excepción, y lo que se pide primero cuando recién se acierta no puede
  // depender del aparato.
  //
  // La condición de fondo es del servidor (`alias_is_generated`), así que se
  // apaga sola en cuanto hay un @ elegido y no hace falta anotar nada. Sigue
  // sin `isFirstVisit`: la pregunta no es «primera vez en este aparato» sino
  // «todavía no elegiste», y a quien se fue antes de resolver la primera hay
  // que poder preguntarle cuando vuelva.
  //
  // **Correrlo a la tercera fue el brazo `sin-peaje` de `dx-puerta-2`.** La
  // apuesta era la atrición —en la primera correcta se va el 20,4% y en la
  // tercera el 6,2%, así que el mismo pedido costaría un tercio— y no se
  // pagó: el brazo terminó +2,2 pp en llegar a tres, con el intervalo
  // conteniendo al cero. Queda en la primera.
  if (
    consumed === "ranking" &&
    a.correct &&
    !yaPreguntoUsername &&
    jugador?.is_guest &&
    jugador.alias_is_generated
  ) {
    return listo({ paso: "username" })
  }

  const sinUniversidad = jugador !== null && !jugador.university
  // La universidad se pregunta UNA VEZ y no es una condición permanente. Que lo
  // fuera es lo que rompió esto: como el paso se pregunta una sola vez por
  // visita, quien lo salteaba quedaba sin universidad Y sin la pregunta, y el
  // cafecito no volvía a salir nunca.
  //
  // Ahora el adelanto vale solo mientras la pregunta esté pendiente. Preguntada
  // —contestada o salteada— el cafecito sale igual, y si todavía no hay
  // universidad la diapo se encarga sola: tiene su propia versión para ese caso.
  const faltaPreguntarUniversidad = sinUniversidad && !yaPreguntoPerfil

  // ── Las reglas, después del ranking ──────────────────────────────────
  //
  // Antes que las novedades y que todo el resto del ladder, que es lo único
  // que hace que la explicación caiga donde se pensó: pegada al festejo del
  // que habla.
  //
  // Las tres de un saque, después del primer ranking. Con una sola correcta
  // encima ninguno de los otros escalones dispara, así que en la práctica no
  // le saca el turno a nada.
  //
  // Repartirlas de a una —en la 5, la 12 y la 17— era el brazo `sin-peaje`
  // de `dx-puerta-2`. Se fue con el experimento: el calendario entero vive
  // en el git y en el PDF del cierre, no colgando de un `if` que nadie
  // puede tomar.
  if (consumed === "ranking" && !reglasMostradas && tocaReglas(totalCorrectas)) {
    return listo({ paso: "reglas", cuales: REGLAS_DE_LA_DIAPO })
  }

  // Recién salido del ranking: si mientras jugaba pasaron cosas, se muestran
  // antes de seguir. Va acá y no antes del ranking porque el orden importa —
  // primero el marcador propio, que es la consecuencia de LO QUE ACABA DE
  // HACER, y después el mundo.
  if (consumed === "ranking" && sinVer >= NOVEDADES_MINIMAS) {
    return listo({ paso: "novedades" })
  }

  if (consumed === null || consumed === "ranking" || consumed === "novedades") {
    // La universidad va ANTES que el cafecito, siempre. La diapo del café
    // ofrece multiplicar el XP "de toda tu universidad": sin universidad no
    // tiene qué ofrecer, y lo que quedaba era una pantalla que pedía algo y
    // de paso pedía otra cosa primero.
    //
    // Este hito NUNCA se adelanta —antes se adelantaba apenas el café
    // quería salir, pero eso lo disparaba en el PRIMER acierto casi
    // siempre: alcanza con pasarle a un solo jugador con más XP en cero
    // (`delta >= 3`, "big_climb") para que un invitado nuevo dispare esta
    // condición en su primera derivada, mucho antes de `HITO_PERFIL`.
    // Sale justo en `HITO_PERFIL` y en ningún otro momento, sea cual sea
    // el motivo que tenga el café para querer salir ese mismo acierto
    // (mientras tanto, el café se queda callado sin gastar su cooldown,
    // ver más abajo).
    //
    // Los dos van con `totalCorrectas` —las acumuladas que manda el
    // servidor— y no con un contador de la pestaña, que vuelve a cero en
    // cada carga de página. Ver hitos-del-juego.ts.
    if (faltaPreguntarUniversidad && totalCorrectas >= HITO_PERFIL) {
      return listo({ paso: "perfil" })
    }
    if (
      tocaRegistro(totalCorrectas) &&
      jugador !== null &&
      jugador.is_guest &&
      !yaPreguntoRegistro
    ) {
      return listo({ paso: "registro" })
    }
  }
  // La pantalla de inicio va después de los hitos de perfil y registro
  // —que son del embudo— y antes de los dos pedidos, porque es lo único de
  // acá que no le pide nada a la persona.
  //
  // No consume el cooldown compartido y por eso no desplaza al resto: ver
  // INSTALAR_SEPARACION en instalar-separacion.ts. La condición de aparato
  // entra como `puedeOfrecerInstalar` y no en el trigger, que tiene que poder
  // correrse sin navegador.
  if (consumed !== "instalar" && tocaInstalar(totalCorrectas) && puedeOfrecerInstalar) {
    return listo({ paso: "instalar" })
  }
  // Y adentro de la app instalada, los recordatorios. La cadencia se cuenta
  // desde que se instaló y no desde el total: quien instaló en la derivada
  // 30 ya demostró todo lo que había que demostrar, y hacerlo esperar hasta
  // la 50 es perder a la persona más comprometida del embudo.
  //
  // «Desde que se instaló» se anota una sola vez, la primera que se detecta
  // la app instalada (`marcarPwaDesde`, que hace quien llama con
  // `anotarPwaDesde`); hasta entonces vale la respuesta actual.
  if (consumed !== "notificaciones" && puedeOfrecerNotificaciones) {
    anotarPwaDesde = true
    const enPwa = totalCorrectas - (readPwaDesde() ?? totalCorrectas)
    if (tocaNotificaciones({ enPwa, totalCorrectas })) {
      return listo({ paso: "notificaciones", enPwa })
    }
  }
  // Sin universidad no se marca el cooldown: el cafecito no se mostró, así
  // que no gastó su turno y vuelve en el próximo hito, ya con una
  // universidad que nombrar.
  if (
    cafecito !== null &&
    cafecito.toca &&
    consumed !== "cafecito" &&
    !faltaPreguntarUniversidad
  ) {
    return listo({
      paso: "cafecito",
      trigger: cafecito.trigger,
      correctToday: a.correct_today,
    })
  }
  // Reclutar va DESPUÉS del café en el orden de este ladder, pero antes en el
  // tiempo: el primero sale a las diez resueltas y el primer café a las
  // veinte. Nunca compiten en la misma respuesta —el cooldown que comparten
  // no lo permite— así que quién está escrito primero acá no cambia nada.
  if (consumed !== "reclutas" && tocaReclutar(totalCorrectas)) {
    return listo({ paso: "reclutas", trigger: "hito" })
  }
  // Cada cuánto ver el ranking: en la 15, una vez, y antes de la varita de
  // la 18. No consume el cooldown compartido, así que no corre a nadie; el
  // porqué de la 15 está medido en ranking-frecuencia.ts.
  if (consumed !== "frecuencia" && tocaPreguntarFrecuencia(totalCorrectas)) {
    return listo({ paso: "frecuencia" })
  }
  // La pregunta abierta va antes que la de dificultad y después de todo lo
  // que convierte. Sale UNA vez en la vida (derivada 18) y no consume el
  // cooldown compartido, así que no le corre el turno al cafecito de la 20:
  // el porqué de las dos cosas está medido en encuesta-trigger.ts.
  if (consumed !== "encuesta" && tocaEncuesta(totalCorrectas)) {
    return listo({ paso: "encuesta" })
  }
  // Las dos encuestas van ÚLTIMAS del ladder y es deliberado: no convierten a nadie,
  // así que no pueden quedarse con el turno de algo que sí. Igual salen, y
  // temprano — los otros escalones piden en hitos puntuales y la mayoría de
  // las respuestas no los dispara, así que el turno libre aparece enseguida.
  //
  // Comparten una sola escalera y el ocupante alterna, así que el ladder
  // pregunta una vez y despacha lo que le contesten (opinion-trigger.ts). Los
  // dos `consumed` se chequean juntos: el que acaba de cerrarse no puede
  // volver a abrirse en la misma respuesta, y tampoco puede abrir al otro.
  if (consumed !== "opinion" && consumed !== "repetitividad") {
    const pregunta = tocaPreguntar(totalCorrectas)
    if (pregunta !== null) {
      return listo({ paso: pregunta === "dificultad" ? "opinion" : "repetitividad" })
    }
  }
  return listo({ paso: "siguiente-ejercicio" })
}
