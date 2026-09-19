"use client"

// La primera pantalla del juego en escritorio, en CADA carga de la página.
//
// Se mostraba una sola vez por navegador y se recordaba en localStorage. Volvió
// a salir siempre porque la presentación del logo también corría en cada carga y
// terminaba entregando la pantalla a un ejercicio a medio empezar. Hoy esa
// presentación ya no existe (ver abajo) y la pantalla igual sale siempre: es una
// línea, y esconderle una línea a quien vuelve no ahorra nada.
//
// Acá viven las dos cosas: la puerta que se muestra, y la lista de las cuatro
// reglas —que la puerta ya NO dice, pero que se escriben acá porque son el texto
// del juego y no pueden decir una cosa en el teléfono y otra en escritorio—.
// Quien las muestra es `reglas-slide.tsx`, cuando corresponde.
//
// La lista existe porque la card del ejercicio dejó de preguntar "¿cuál es la
// derivada de la siguiente función?". Esa pregunta era idéntica en los 26 tipos
// de ejercicio y en el renglón más visible de la pantalla: leerla una vez
// alcanza, y a partir de ahí ocupaba el lugar donde ahora van los marcadores. El
// trato es este —se explica en serio, y después no se repite nunca.

import { Button } from "@/components/ui/button"
import { KeyCap } from "./exercise-card"
import { useTeclas } from "./teclas"

// El texto de la intro, uno solo para las dos versiones: es lo único que se
// explica en todo el juego y no puede decir una cosa en el teléfono y otra en
// escritorio.
//
// Cada párrafo presenta una de las cosas que el juego tiene y las nombra con el
// MISMO emoji con el que después aparecen en el marcador (exercise-card.tsx ::
// Counters): 🧩 los ejercicios, ♟ el Elo, ☕ los cafecitos. Así, cuando la
// partida arranca, los contadores ya se leyeron una vez y no hay que adivinar
// qué es cada número. El cuarto —la tabla— no tiene contador, pero sigue la
// misma forma: una palabra en negrita y su emoji.
// El `︎` del peón fuerza presentación de TEXTO: sin él el navegador lo
// dibuja como emoji, una imagen oscura de color fijo que sobre este fondo se
// apaga. Es el mismo tratamiento que en el contador.
// El mismo peso y el mismo color que los números de la lista: lo que resalta en
// estos párrafos es la numeración y la palabra clave, y si cada una tuviera su
// tratamiento serían dos jerarquías compitiendo en cuatro renglones.
function Fuerte({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>
}

// ── La puerta ───────────────────────────────────────────────────────────────
//
// Entre aterrizar y ver una derivada no hay nada: el logo quieto, el saludo, una
// línea y el botón. No fue siempre así. Hasta el 18/09 acá había una animación
// de logo, los cuatro párrafos de abajo y el pedido de apodo, y eso estuvo bajo
// experimento (`dx-puerta-1`) contra esta puerta.
//
// Lo ganó esta, y no por poco: de 55,6% a 80,6% de gente a la que se le llega a
// mostrar una derivada, +25,0 puntos con IC95 [19,6 · 30,5] sobre 527 por brazo.
// Del aterrizaje al primer intento se pasó de 39,4 s a 14,2 s.
//
// Lo que el experimento NO consiguió, y por eso hay un `dx-puerta-2`: esas 132
// personas de más por cada 527 duraban una sola derivada. Para la tercera
// correcta los dos brazos empataban, y de la quinta en adelante el que ganaba
// era el otro. La explicación no se había borrado, se había CORRIDO a después
// de la primera correcta — y ahí, apilada con el @ y el ranking, se llevaba al
// 26,1% de los que acababan de acertar contra el 8,6% del control.
//
// O sea que la puerta no era un peaje que se sacó: era un peaje que se mudó, y
// al mudarlo se lo puso en el momento más caro. De eso se ocupa el brazo
// `sin-peaje` (reglas-trigger.ts), que las reparte de a una y más adelante.

/** El saludo, y lo único que se explica antes de la primera derivada.
 *
 *  La instrucción es la regla 1 de `IntroParagraphs` dicha en imperativo:
 *  aquella explica qué es un ejercicio, esta pide que se resuelva. Por eso
 *  ninguna de las dos formas de decir las reglas la incluye — ya se dio acá
 *  (reglas-trigger.ts :: REGLAS_DE_LA_DIAPO y CALENDARIO). */
export const BIENVENIDA_MINIMA = "¡Bienvenido!"
export const INSTRUCCION_MINIMA =
  "Resolvé la siguiente derivada para comenzar a jugar."

/** La puerta, entera.
 *
 *  Componente y no dos constantes sueltas en cada layout por el mismo motivo
 *  que `IntroParagraphs`: son dos pantallas —teléfono y escritorio— y la
 *  separación entre el saludo y la instrucción es parte del texto, no del
 *  layout. Con el markup duplicado, dentro de un mes una de las dos tiene el
 *  renglón pegado y la otra no.
 *
 *  `gap-6` es el doble del `gap-3` con el que los dos layouts separan párrafos:
 *  un renglón en blanco entre el saludo y lo que hay que hacer. */
export function PuertaMinima() {
  return (
    <div className="flex flex-col gap-6">
      <p className="font-semibold text-foreground">{BIENVENIDA_MINIMA}</p>
      <p className="font-semibold text-foreground">{INSTRUCCION_MINIMA}</p>
    </div>
  )
}

// Los párrafos numerados. El número NO va en el texto sino acá, sobre el
// índice: son cosas que se cuentan una por vez, y si alguna vez se suma o se
// saca una, la numeración se acomoda sola en las dos pantallas.
//
// Componente y no un `map` en cada layout porque son dos —teléfono y
// escritorio— y lo único que cambia entre ellos es el cuerpo de letra, que
// entra por `className`. Duplicar el map era la forma segura de que dentro de
// un mes uno tuviera números y el otro no.
export function IntroParagraphs({
  className,
  // Cuáles, y en qué orden. Índices de la lista de abajo.
  //
  // Quien las muestra pide una SELECCIÓN y no tiene lista propia: el día que se
  // agregue una quinta regla acá, está disponible del otro lado. Con dos listas
  // separadas, ese día una de las dos se queda vieja — que es justo lo que le
  // pasó al tutorial repartido que esto reemplazó una vez.
  //
  // Y es una lista y no un corte porque `sin-peaje` las reparte en un orden que
  // no es el de acá: el Elo, la tabla y recién después los cafecitos, cada una
  // donde tiene referente (reglas-trigger.ts :: CALENDARIO).
  cuales,
  // Numerarlas. La numeración es sobre `cuales` y arranca en 1 siempre: durante
  // un rato las tres de la diapo salieron como 2, 3 y 4, con un renglón arriba
  // explicando cuál faltaba, y se lee peor de lo que suena — tres ítems que
  // empiezan en 2 hacen buscar el 1 aunque el texto diga dónde quedó.
  //
  // Una sola regla va sin número: un «1.» arriba de un renglón único promete
  // una lista que no viene.
  numera = true,
}: { className?: string; cuales: number[]; numera?: boolean }) {
  // Los párrafos se arman ACÁ y no en una constante del módulo. Cuando eran
  // JSX de nivel de módulo, los elementos quedaban creados una sola vez al
  // evaluarse el archivo, y Fast Refresh no puede reconciliar eso: al editar el
  // texto convivían los viejos con los nuevos y la lista se veía duplicada en
  // el navegador (no en el código). Armados en cada render, el problema no
  // existe.
  //
  // La palabra que nombra cada cosa va en negrita y no en mayúscula: destaca
  // igual —que es lo que se busca, que las tres se encuentren de un vistazo y
  // se reconozcan después en el marcador— sin convertirlas en nombres propios a
  // mitad de una oración. "Elo" sí lleva mayúscula, pero porque es un apellido
  // (Árpád Élő), no por énfasis.
  const parrafos: React.ReactNode[] = [
    <>
      Cada <Fuerte>ejercicio</Fuerte> 🧩 es una función que tenés que derivar.
    </>,
    <>
      Tu puntaje <Fuerte>Elo</Fuerte> ♟︎ define la dificultad y se ajusta con tus
      aciertos y errores.
    </>,
    <>
      Podés usar <Fuerte>cafecitos</Fuerte> ☕ para que vos y tu universidad
      escalen el ranking más rápido que el resto.
    </>,
    // El cuarto llegó con la tabla en el teléfono, pero se explica en los dos
    // lados porque en los dos existe: acá se toca un botón y en escritorio se
    // mantiene Alt. Lo que importa es lo mismo — que se puede mirar, y que no
    // sale gratis.
    <>
      Si te trabás podés mirar la <Fuerte>tabla</Fuerte> 📖, pero esa derivada
      te va a sumar mucho menos.
    </>,
  ]
  return (
    <>
      {cuales.map((idx, i) => (
        // La lista es fija, así que el índice en ella alcanza como clave.
        <p key={idx} className={className}>
          {numera && (
            <>
              <span className="font-semibold text-foreground">{i + 1}.</span>{" "}
            </>
          )}
          {parrafos[idx]}
        </p>
      ))}
    </>
  )
}

// La card y el botón son DOS componentes y no uno que devuelve los dos, aunque
// siempre aparezcan juntos. El motivo es el volteo: lo que gira al empezar es la
// card y nada más — el botón y el historial se quedan quietos abajo, porque no
// son parte de lo que se está reemplazando. Con los dos adentro del mismo
// componente, el layout no tenía forma de meter el volteo entre medio.
//
// El historial lo pone la columna, que es la que sabe que va desenfocado hasta
// que se empieza.
// Solo la indicación y nada más. Los atajos de teclado que esta pantalla listaba
// no se reparten después porque no hace falta: la card enseña Alt con su propio
// tip y el Enter lo dice el KeyCap del botón.
export function IntroPanel() {
  return (
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card p-6">
      <div className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 text-center">
        {/* Sin titular ni fórmula de muestra. Los dos estuvieron y los dos se
            fueron por lo mismo: decían con otras palabras lo que ya dicen los
            tres párrafos. El operador se conoce en el primer ejercicio, que llega
            a un toque de acá.

            Cuerpo normal y `text-foreground/85`, igual que el teléfono
            (mobile-flow.tsx) y que la bienvenida del onboarding: en la primera
            pantalla del juego este texto ES el contenido, y en `text-sm
            text-muted-foreground` se leía como una aclaración al pie. */}
        <div className="flex flex-col gap-3 leading-relaxed text-foreground/85">
          <PuertaMinima />
        </div>
      </div>
      </div>
  )
}

// El botón de la intro. Vive en el mismo renglón que el "Revisar" del ejercicio
// —mismo alto, mismo lugar— para que al empezar no se mueva nada abajo mientras
// la card de arriba gira.
//
// "Empezar" anuncia que algo va a arrancar, y eso es exactamente lo que esta
// puerta no quiere decir: del otro lado no hay una partida inaugurándose, hay
// una derivada. "Continuar" es además la palabra que ocupa este mismo lugar
// durante todo el resto del juego, así que el primer botón deja de ser el único
// distinto. El teléfono ya decía "Continuar" desde antes.
export function IntroStartButton({
  onStart,
  disabled,
}: {
  onStart: () => void
  disabled?: boolean
}) {
  const teclas = useTeclas()
  return (
    <Button
      size="lg"
      disabled={disabled}
      onClick={onStart}
      className="h-[var(--cta-h)] w-full shrink-0 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
    >
      Continuar
      <KeyCap>{teclas.enter}</KeyCap>
    </Button>
  )
}
