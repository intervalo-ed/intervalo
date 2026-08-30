"use client"

// Cómo se llaman las teclas EN ESTE teclado.
//
// El juego se maneja entero con Enter y Alt, y los carteles decían "alt" y
// "enter" en todas las máquinas. En una Mac ninguna de las dos se llama así: la
// que hace de Alt está impresa "option" y la de Enter está impresa "return". El
// atajo funcionaba igual —`altKey` es true con Option, y `key` es "Enter" con
// Return— pero el cartel nombraba una tecla que no existe en ese teclado.
//
// Los nombres viven acá y no repartidos por los componentes justamente porque
// son ocho lugares: la intro, el botón de la tabla, los dos botones del
// ejercicio, los tres de la diapo del cafecito y el tip del campo. Con el nombre
// escrito a mano en cada uno, agregar una plataforma es encontrarlos todos.
//
// Todo en minúscula, como el resto de los <KeyCap>: imitan lo que escribe una
// terminal, no lo que está serigrafiado en la tecla.

import { useSyncExternalStore } from "react"

export type Teclas = {
  enter: string
  alt: string
  altEnter: string
  shiftEnter: string
}

const PC: Teclas = {
  enter: "enter",
  alt: "alt",
  altEnter: "alt + enter",
  shiftEnter: "shift + enter",
}

const MAC: Teclas = {
  enter: "return",
  alt: "option",
  altEnter: "option + return",
  shiftEnter: "shift + return",
}

/** ¿El teclado de esta máquina es el de una Mac?
 *
 * Se mira `userAgentData.platform` primero, que es lo que reemplaza al user
 * agent en los navegadores nuevos y es el único que no está congelado. Detrás
 * quedan `navigator.platform` —obsoleto pero todavía exacto— y el user agent
 * como último recurso.
 *
 * El iPad se reporta como Macintosh y acá eso NO es un problema que haya que
 * corregir: si alguien juega en un iPad con teclado, ese teclado también dice
 * "option" y "return". Lo que importa es qué está impreso en la tecla, y en un
 * teclado de Apple es lo mismo con o sin iPad detrás. */
function esMac(): boolean {
  if (typeof navigator === "undefined") return false
  const conDatos = navigator as Navigator & {
    userAgentData?: { platform?: string }
  }
  const plataforma =
    conDatos.userAgentData?.platform || navigator.platform || navigator.userAgent
  return /mac/i.test(plataforma)
}

// Las tres piezas del `useSyncExternalStore`, a nivel de módulo porque tienen
// que ser las MISMAS funciones en cada render: creadas adentro del hook, React
// volvería a suscribirse en cada uno.
//
// Nadie emite cambios —nadie cambia de teclado con la página abierta— así que
// desuscribirse no hace nada. Y las dos instantáneas devuelven un objeto
// CONSTANTE, no uno nuevo: si armaran el objeto en cada llamada, React vería
// una instantánea distinta cada vez y renderizaría para siempre.
const SIN_SUSCRIPCION = () => () => {}
const enElCliente = () => (esMac() ? MAC : PC)
// En el servidor no hay teclado que mirar. Se asume PC —que es la mayoría— y en
// el cliente React vuelve a renderizar con el valor de verdad sin acusar una
// hidratación distinta. En una Mac eso significa un primer pintado que dice
// "alt": dura un fotograma y es el precio de no adivinar en el servidor.
const enElServidor = () => PC

/** Los nombres de las teclas para mostrar. */
export function useTeclas(): Teclas {
  return useSyncExternalStore(SIN_SUSCRIPCION, enElCliente, enElServidor)
}

/** ¿El destino del teclazo es un campo de TEXTO LIBRE? Ahí una letra es una
 *  letra y ningún atajo del juego puede pisarla.
 *
 *  Cubre los campos por su tag (el @ del registro, la universidad "otra") y los
 *  desplegables por su rol: los filtros del ranking no son un `<select>` nativo
 *  sino un `<button role="combobox">` con su lista aparte
 *  (components/ui/select.tsx, sobre Base UI), así que el tag no alcanza. Sin esa
 *  última parte, elegir una universidad con Enter caía en el handler del juego:
 *  el filtro no se aplicaba y encima se mandaba la respuesta a medio escribir.
 *
 *  El campo de la RESPUESTA no está acá y es a propósito. Es un
 *  `<math-field>` contenteditable, pero no es texto libre: lo que se escribe ahí
 *  es matemática, y en este juego la variable es siempre `x`. Quien decide si un
 *  atajo puede robarle una tecla es cada handler, mirando qué tecla es — ver el
 *  listener de `w` y `c`. */
// Tipos de `<input>` en los que NO se escribe: se arrastran, se tildan o se
// tocan. La lista va por exclusión y no al revés —enumerar los que sí son texto—
// porque un tipo que nadie previó tiene que caer del lado seguro, que es
// «tratalo como texto y no le robes la tecla».
//
// Existe por un caso concreto y medido: la diapo del cafecito le da el foco a su
// slider al abrirse (cafecito-panel.tsx), así que con el slider contando como
// campo de texto TODA esa pantalla se quedaba sin Enter — y solo esa, porque es
// la única con un control así. El síntoma era desconcertante: no andaba al
// llegar, y andaba después de irse a otra ventana y volver, porque el clic de
// vuelta desenfocaba el slider.
const NO_SE_ESCRIBE = new Set([
  "range",
  "checkbox",
  "radio",
  "button",
  "submit",
  "reset",
  "file",
  "color",
  "image",
])

export function enCampoDeTexto(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  const tag = el?.tagName
  if (tag === "INPUT") {
    return !NO_SE_ESCRIBE.has((el as HTMLInputElement).type)
  }
  if (tag === "TEXTAREA" || tag === "SELECT") return true
  // El destino de un keydown casi siempre es un elemento, pero no siempre: si el
  // foco está en el `body` o el evento se despacha sobre el documento, `closest`
  // no existe y llamarlo tira. Y una excepción acá no rompe una línea, rompe el
  // atajo entero — el listener muere antes de decidir nada.
  if (typeof el?.closest !== "function") return false
  return !!el.closest('[role="combobox"], [role="listbox"], [role="option"]')
}
