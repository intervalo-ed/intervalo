// Cómo se ve lo que todavía no está en juego: el ranking, el historial y la
// identidad mientras se lee la intro. Están puestos y en su lugar desde el
// primer fotograma —el juego se ve entero antes de tocar nada— y lo único
// nítido es lo que hay que leer.
//
// Va sobre el CONTENIDO de cada panel, nunca sobre la caja que lo enmarca: un
// borde de 1px desenfocado no se lee como algo apagado sino como un error de
// dibujo. Los marcos quedan sólidos y lo de adentro se despierta.
//
// Es un `filter` sobre el contenido y no una capa con `backdrop-filter` encima,
// que era lo primero que había. La capa andaba en el historial y en la barra del
// @, pero en el ranking no dibujaba nada: entonces esa card cambiaba de cara
// girando en 3D, y un ancestro con `transform-style: preserve-3d` corta el fondo
// que `backdrop-filter` tiene para muestrear. Ese impedimento ya no existe —el
// cambio de cara es un fundido (derivatives-table.tsx :: FlipCard)— pero el
// filtro sobre el contenido se queda igual: da el mismo resultado y no depende
// de qué transformaciones tenga encima, que es una condición que no hay que
// volver a tener que cumplir.
//
// Tres píxeles. Estuvo en uno y medio, elegido para que el historial —renglones
// de 11px— siguiera siendo legible, y eso resultó ser el error: si se puede leer,
// se lee, y entonces compite con el único texto que en ese momento importa. Que
// las novedades no se puedan leer todavía no es un costo, es el punto.
//
// El límite de arriba sigue siendo el mismo: tiene que verse QUÉ hay debajo —un
// ranking, una lista de novedades, la barra del @— porque de eso se trata, de
// que el juego ya esté ahí antes de tocar nada. Lo que no tiene que poder es
// leerse.
//
// `pointer-events-none` mientras dura: un ranking al que se le puede hacer
// scroll estando borroso invita a pelearse con él.
// No es solo desenfoque: es VIDRIO. Un blur a secas deja los colores y el
// contraste intactos, así que lo de atrás sigue gritando —el verde del ranking,
// el blanco del botón— y lo único que perdió es el filo. Tres filtros más lo
// convierten en algo mirado a través de un vidrio grueso:
//
//   · `saturate(0.45)` — el vidrio se come el color antes que la forma. Es lo que
//     más hace por sacarle protagonismo a lo de atrás sin taparlo.
//   · `contrast(0.8)` + `brightness(1.15)` — la niebla: acerca los negros y los
//     blancos al medio y levanta el piso, que es lo que hace que se lea como algo
//     con espesor adelante y no como algo que está fuera de foco.
//   · La opacidad termina de fundirlo con el fondo.
//
// LO QUE SE ANIMA ES SOLO LA OPACIDAD. El filtro entra y sale de golpe.
//
// Antes se animaban los dos, y para eso el estado nítido repetía la misma lista
// de funciones con valores neutros —el navegador interpola función por función
// entre dos listas iguales, y contra `none` el resultado depende del motor—. Se
// veía lindo y costaba caro: animar un filtro obliga a volver a rasterizar todo
// el subárbol en CADA fotograma, y el subárbol acá es el ranking entero con sus
// filas, el historial y la barra del @. Medio segundo de eso, justo en el
// instante en que alguien toca «Empezar»: la primera impresión del juego era el
// fotograma más caro de la pantalla.
//
// Sacando el filtro de la transición se gana dos veces. Durante el cambio no hay
// re-rasterizado, y una vez adentro del juego —que es casi todo el tiempo— el
// estado nítido ya no tiene filtro NINGUNO, así que tampoco queda un contexto de
// filtrado colgado sobre esos tres subárboles.
//
// El costo es que el contenido se ve nítido de una en vez de aclararse de a poco.
// La opacidad, que sí se anima, es lo que sostiene la sensación de que algo
// despierta; el enfoque pasa a ser instantáneo.
//
// Las dos clases van ENTERAS y literales, sin armarlas por partes: Tailwind
// encuentra las clases leyendo el código como texto, así que una construida con
// template no existe en el CSS final. Es la misma razón por la que en este
// proyecto los colores interpolados van por `style` y no por clase.
const VIDRIO =
  "pointer-events-none opacity-60 [filter:blur(3px)_saturate(0.45)_contrast(0.8)_brightness(1.15)] transition-opacity duration-500"
const NITIDO = "opacity-100 transition-opacity duration-500"

export function outOfFocus(on: boolean): string {
  return on ? VIDRIO : NITIDO
}
