// El logo de Mercado Pago, para el botón que lleva a pagar.
//
// **Es el archivo real** (`public/mercadopago.png`) y no un dibujo armado acá, y
// eso costó dos intentos fallidos que conviene dejar escritos para que nadie los
// repita. El trazo que publica Simple Icons —que es el que aparece si uno busca
// «mercadopago svg»— es SOLO LÍNEA: tiene los contornos del apretón y del óvalo,
// pero no las regiones. Con él se puede pintar el óvalo de celeste y dibujar las
// líneas en navy, y `fill-rule="evenodd"` no lo arregla: cambia de qué lado de la
// línea se rellena, así que da líneas blancas en vez de un apretón blanco. La
// mancha blanca que cruza el logo no está en ese archivo y no se puede deducir.
// El logo a color tampoco está en Wikimedia ni en los repositorios de logos
// habituales, porque es marca registrada.
//
// Va como `<img>` y no inline por lo mismo que los escudos de las universidades
// (`components/onboarding-fields.tsx`), incluido el `eslint-disable`: es un
// archivo de marca que no se retoca desde el código.
//
// El PNG está a 176px de ancho —ocho veces los 22 a los que se muestra, o sea
// que aguanta cualquier densidad de pantalla— y cuantizado a 16 colores, que
// para tres colores planos con antialias alcanza y lo deja en 2,6 kB. No tiene
// aire transparente alrededor: el óvalo toca los cuatro bordes, y eso es lo que
// hace que `align-items: center` lo centre de verdad en el botón en vez de
// centrarle la caja.
//
// **Por qué no cambia de color.** El resto de los íconos del panel usan
// `currentColor` y acompañan la animación del botón, que va de tinta oscura a
// blanco mientras se corre la barra. Este no puede ni debe: un logo de marca con
// el color cambiado deja de ser reconocible, que es lo único que tiene que
// lograr.
//
// **Qué dice y qué no.** Está para avisar CON QUÉ se paga. El cafecito se cobra
// por Cafecito y Mercado Pago es quien procesa; el logo es informativo y no puede
// usarse en ningún lugar donde se lea como que esto es un producto de ellos.

// El alto del logo contra su ancho, para que `size` sea una sola medida.
const PROPORCION = 122 / 176

export function MercadoPagoIcon({
  size = 22,
  className,
}: {
  /** Ancho en px. El alto sale de la proporción del logo. */
  size?: number
  className?: string
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mercadopago.png"
      // Decorativo: el botón ya dice en palabras lo que hace, y un alt acá
      // haría que el lector de pantalla lea «Mercado Pago» en medio de
      // «Invitar 10 cafecitos».
      alt=""
      aria-hidden="true"
      width={size}
      height={Math.round(size * PROPORCION)}
      className={className}
      // Explícito y no por CSS: sin las dos medidas el botón se reacomoda
      // cuando la imagen termina de cargar.
      style={{ width: size, height: size * PROPORCION }}
    />
  )
}
