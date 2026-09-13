"use client"

// La primera pantalla del juego en escritorio, en CADA carga de la página.
//
// Se mostraba una sola vez por navegador y se recordaba en localStorage. Volvió
// a salir siempre por dos razones: la presentación del logo también corre en
// cada carga y terminaba entregando la pantalla a un ejercicio a medio empezar,
// y esta es la única pantalla del juego donde se nombra el cafecito con todas
// las letras — esconderla a quien vuelve era esconderla justo a quien más juega.
//
// Existe porque la card del ejercicio dejó de preguntar "¿cuál es la derivada de
// la siguiente función?". Esa pregunta era idéntica en los 26 tipos de ejercicio
// y en el renglón más visible de la pantalla: leerla una vez alcanza, y a partir
// de ahí ocupaba el lugar donde ahora van los marcadores. El trato es este —se
// explica acá, en serio, y después no se repite nunca.

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { KeyCap } from "./exercise-card"
import { useTeclas, type Teclas } from "./teclas"

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

export const INTRO_CLOSE = "¿Arrancamos?"

// ── El brazo `derivada-primero` del experimento de la puerta ────────────────
//
// Hipótesis: entre aterrizar y ver una derivada hay tres peajes —la animación
// del logo, estos cuatro párrafos y el pedido de apodo— y la persona no pidió
// ninguno: hizo clic en un link de WhatsApp sin saber a qué se juega. La primera
// derivada es `x` (generator.ONBOARDING la fija así, trivial a propósito), o sea
// que el producto se explica solo. Medido: solo el 47,6% llega a verla, y en el
// teléfono —que es el 83% del tráfico— baja al 45,2%.
//
// Lo que el brazo NO hace es borrar la explicación: la CORRE. Sacarla del todo
// arriesga cambiar gente que no entra por gente que entra y se va en la segunda
// derivada, y eso sería ganar el número y perder el producto.
//
// Corrida, se paga cuando ya hay con qué pagarla. El orden del brazo es:
//
//   logo quieto + `INSTRUCCION_MINIMA` → la derivada → «elegí tu @» → el
//   ranking, con la XP entrando ya con ese @ → las reglas 2, 3 y 4
//   (reglas-slide.tsx) → el resto del juego.
//
// Cada pieza llega cuando significa algo: el @ se pide cuando hay un puesto que
// ponerle el nombre, y las tres reglas se leen con el Elo recién movido y el
// ranking recién visto, que es de lo que hablan. La 1 la dice la puerta.
//
// Antes de esto las tres reglas venían de a una, en los aciertos 1, 2 y 5, y
// metidas en el marcador de la card (`piezaDeTutorial`). Se fue porque repartía
// tres interrupciones donde hay una sola cosa para contar, y porque un renglón
// arriba del enunciado no se lee como una regla del juego: se lee como un pie
// de página del ejercicio que está abajo.

/** El saludo, y lo único que se explica antes de la primera derivada.
 *
 *  La instrucción es la regla 1 de `IntroParagraphs` dicha en imperativo:
 *  aquella explica qué es un ejercicio, esta pide que se resuelva. Por eso la
 *  diapo de reglas la saltea (`REGLAS_DESDE`) — ya se dio acá, en la puerta. */
export const BIENVENIDA_MINIMA = "¡Bienvenido!"
export const INSTRUCCION_MINIMA =
  "Resolvé la siguiente derivada para comenzar a jugar."

/** La puerta del brazo test, entera.
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
  // Desde qué regla arrancar, contando desde cero.
  //
  // La diapo de reglas pide un CORTE y no tiene lista propia: el día que se
  // agregue una quinta regla acá, aparece sola del otro lado. Con dos listas
  // separadas, ese día una de las dos se queda vieja — que es justo lo que le
  // pasó al tutorial repartido que esto reemplaza.
  desde = 0,
  // Numerar desde 1 en vez de conservar la posición en la lista completa.
  //
  // El brazo `derivada-primero` corta en la segunda regla, y durante un rato
  // las mostró como 2, 3 y 4 con un renglón arriba explicando cuál faltaba. Se
  // lee peor de lo que suena: tres ítems que empiezan en 2 hacen buscar el 1
  // aunque el texto diga dónde quedó. Numeradas desde 1 y sin ese renglón, son
  // simplemente tres reglas.
  renumera = false,
}: { className?: string; desde?: number; renumera?: boolean }) {
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
      {parrafos.slice(desde).map((p, i) => (
        // La lista es fija y su orden también, así que el índice alcanza como
        // clave.
        <p key={desde + i} className={className}>
          <span className="font-semibold text-foreground">
            {(renumera ? i : desde + i) + 1}.
          </span>{" "}
          {p}
        </p>
      ))}
    </>
  )
}

// Los tres atajos, con el nombre de la tecla como lo escribe una terminal. Van
// acá y no en la card porque son justo lo que no se descubre solo.
//
// El renglón de arriba los presenta como una recomendación y no como una lista
// de datos: el juego se puede jugar entero con el mouse, pero quien lo hace
// pierde contra el reloj en cada respuesta. Decirlo antes de la lista es lo que
// convierte tres atajos sueltos en un consejo.
const KEYBOARD_HINT = "Te conviene jugar con el teclado."

// Verbo y complemento: "Revisar" a secas no decía qué se revisa, y en una lista
// de tres renglones cortos entra la palabra que lo aclara. El nombre de la tecla
// sale de `useTeclas` porque en una Mac son otras (teclas.ts).
const atajos = (t: Teclas): { keys: string; what: string }[] => [
  { keys: t.enter, what: "Revisar solución" },
  { keys: t.altEnter, what: "Saltear ejercicio" },
  // Alt es un gesto SOSTENIDO —la tabla se cierra al soltar, y tarda un instante
  // en abrir a propósito (ver PEEK_OPEN_MS en desktop-layout.tsx)—, cosa que el
  // rótulo no dice. Lo enseña el tip de la card, que aparece jugando y ahí sí lo
  // explica entero ("Mantené {k} para ver la tabla de derivadas").
  { keys: t.alt, what: "Ver tabla" },
]

// La card y el botón son DOS componentes y no uno que devuelve los dos, aunque
// siempre aparezcan juntos. El motivo es el volteo: lo que gira al empezar es la
// card y nada más — el botón y el historial se quedan quietos abajo, porque no
// son parte de lo que se está reemplazando. Con los dos adentro del mismo
// componente, el layout no tenía forma de meter el volteo entre medio.
//
// El historial lo pone la columna, que es la que sabe que va desenfocado hasta
// que se empieza.
// `minima` = brazo `derivada-primero`: solo la indicación y nada más. Los
// atajos no se reparten después porque no hace falta — la card ya enseña Alt
// con su propio tip, y el Enter lo dice el KeyCap del botón.
export function IntroPanel({ minima = false }: { minima?: boolean } = {}) {
  const teclas = useTeclas()
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
          {minima ? <PuertaMinima /> : <IntroParagraphs />}
        </div>
        <div className={cn("flex flex-col items-center gap-3", minima && "hidden")}>
          <p>{KEYBOARD_HINT}</p>
          <dl className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            {atajos(teclas).map((s) => (
              <div key={s.keys} className="contents">
                <dt className="text-right">{s.what}</dt>
                <dd className="text-left">
                  <KeyCap className="ml-0">{s.keys}</KeyCap>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        {/* El cierre va último de todo, pegado al botón: es la pregunta que el
            botón contesta. Arriba de los atajos quedaba cerrando la explicación
            y después seguía habiendo cosas para leer. */}
        {!minima && <p className="font-semibold text-foreground">{INTRO_CLOSE}</p>}
      </div>
      </div>
  )
}

// El botón de la intro. Vive en el mismo renglón que el "Revisar" del ejercicio
// —mismo alto, mismo lugar— para que al empezar no se mueva nada abajo mientras
// la card de arriba gira.
export function IntroStartButton({
  onStart,
  disabled,
  minima = false,
}: {
  onStart: () => void
  disabled?: boolean
  // Brazo `derivada-primero`. "Empezar" anuncia que algo va a arrancar, y eso
  // es exactamente lo que esta puerta no quiere decir: del otro lado no hay una
  // partida inaugurándose, hay una derivada. "Continuar" es además la palabra
  // que va a ocupar este mismo lugar durante todo el resto del juego, así que
  // el primer botón deja de ser el único distinto.
  //
  // Solo el brazo test: cambiarlo también en el control sería mover el control
  // en medio del experimento. El teléfono ya dice "Continuar" en los dos
  // (mobile-flow.tsx), y esa diferencia entre plataformas es anterior a esto.
  minima?: boolean
}) {
  const teclas = useTeclas()
  return (
    <Button
      size="lg"
      disabled={disabled}
      onClick={onStart}
      className="h-[var(--cta-h)] w-full shrink-0 rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
    >
      {minima ? "Continuar" : "Empezar"}
      <KeyCap>{teclas.enter}</KeyCap>
    </Button>
  )
}
