// Por qué apareció la diapo. Los tres primeros los decide el juego después de
// una respuesta; `pedido` es cuando la persona la abrió ella misma con el botón
// de la barra, y eso cambia dos cosas: no se la felicita por un hito que no
// acaba de pasar, y al salir vuelve a SU ejercicio en vez de pedir uno nuevo.
//
// Solo el tipo vive acá: las reglas que eligen el motivo siguen en
// web/src/app/derivadas/cafecito-cta.tsx, porque la app nativa no muestra el
// cafecito (las reglas de pago de Apple y Play) y no tiene nada que decidir.
export type CafecitoTrigger = "record" | "big_climb" | "milestone" | "pedido"
