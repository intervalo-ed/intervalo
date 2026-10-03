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

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { KeyCap } from "./exercise-card"
import { useTeclas } from "./teclas"
import { useBienvenida } from "./UseBienvenida"
import { useCachedPlayer, useGameToken } from "./UseGamePlayer"
import { TextoConHuecos } from "./texto-con-huecos"

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
// Lo único que resalta en estos párrafos. Antes compartía el papel con el número
// de cada regla; sin los números, la palabra clave es la jerarquía entera.
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
 *  (reglas-trigger.ts :: reglasDeLaDiapo). */
export const BIENVENIDA_MINIMA = "¡Bienvenido!"

/** Qué es esto, para quien llega por primera vez.
 *
 *  Es la primera oración del preview de WhatsApp (layout.tsx :: DESCRIPCION),
 *  igual palabra por palabra. Se escribe de nuevo y no se importa de
 *  `layout.tsx` igual: son dos textos con dos trabajos distintos —uno vende el
 *  link, el otro recibe a quien ya entró— y atarlos obligaría a que el día que
 *  uno cambie el otro lo siga sin motivo.
 *
 *  **Va también en el texto de respaldo, y eso mueve un experimento.** El
 *  respaldo es la rama de CONTROL de `dx-rampa-1`: desde este cambio, el cuarto
 *  brazo se mide contra una puerta que ya explica el producto. Fue una decisión
 *  de producto tomada a sabiendas; quien lea el resultado de `dx-rampa-1` tiene
 *  que partir la serie en la fecha de este cambio. */
export const QUE_ES =
  "Memorizá todas las derivadas y llegá mejor preparado a tus parciales con este minijuego."
export const INSTRUCCION_MINIMA =
  "Resolvé la siguiente derivada para comenzar."

/** Lo que reemplaza a la instrucción cuando la persona ya jugó hoy.
 *
 *  A alguien que lleva ocho derivadas hechas hace dos horas no hay que
 *  explicarle qué es esto. La pregunta hace el trabajo que hacía la
 *  instrucción, y además lo hace mejor: «¿Seguimos?» es una invitación a
 *  retomar, y la instrucción era una orden para empezar algo que ya empezó. */
export const SEGUIMOS = "¿Seguimos?"

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
/** Cuánto se espera al digest antes de caer al texto de siempre.
 *
 *  **La espera existe porque el respaldo se pintaba antes de tiempo.** El juego
 *  entero es cliente —el HTML del servidor no trae este texto— así que la
 *  pantalla ya está en blanco hasta que hidrata, y lo único que esta espera
 *  agrega es el viaje de `/bienvenida`. Medido en local el 02/10: el pedido sale
 *  1.028 ms después de navegar y tarda 53 ms. O sea que lo que se veía cambiar no
 *  era un endpoint lento sino el respaldo dibujado y reemplazado 50 ms después.
 *
 *  Dos segundos y medio es el TECHO y no la espera normal: cubre el viaje en una
 *  red lenta más el alta del invitado, que en una primera visita va antes. Era
 *  uno y medio; se subió para que una red de teléfono floja alcance a traer las
 *  novedades antes de que salga el respaldo. Si vence, sale el texto de siempre
 *  en el mismo lugar exacto donde ya estaba reservado, así que no se mueve nada.
 *
 *  **Vencido el plazo, el digest igual se muestra si llega.** El plazo decide
 *  cuándo deja de estar en blanco la pantalla, no cuándo se deja de esperar: el
 *  pedido sigue en vuelo y, cuando contesta, las novedades reemplazan al
 *  respaldo. Llegar tarde es mejor que no llegar. */
const ESPERA_MAX_MS = 2_500

/** Verdadero cuando pasaron `ms` desde que se montó. */
function useVencio(ms: number): boolean {
  const [vencio, setVencio] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVencio(true), ms)
    return () => clearTimeout(t)
  }, [ms])
  return vencio
}

export function PuertaMinima() {
  const player = useCachedPlayer()
  const token = useGameToken()
  const { isSignedIn } = useAuth()

  // **El pedido espera a que haya jugador.** `/game/derivemos/bienvenida` pasa
  // por `get_current_player`, que sin `X-Game-Token` y sin sesión contesta 401
  // (backend/game/deps.py). En una primera visita este componente monta ANTES de
  // que el alta termine —medido: los dos pedidos salen en el mismo milisegundo—
  // así que salía 401, y con `retry: false` no había segundo intento: la rama
  // `primera`, que es la escrita justo para quien nunca resolvió nada, no se veía
  // NUNCA. El token entra por `useGameToken`, que es reactivo, así que el pedido
  // sale solo apenas el invitado existe.
  const hayJugador = token !== null || isSignedIn === true
  const { data, isError } = useBienvenida(hayJugador)
  const vencio = useVencio(ESPERA_MAX_MS)

  // **El texto de siempre es el fallback, no el caso raro.** Si el pedido falla
  // —o tarda más que el techo— esta pantalla se ve exactamente como se veía
  // antes. Es lo que hace que la feature no pueda costar activación por un
  // endpoint lento: lo peor que puede pasar es que no cuente nada, que es lo que
  // contaba hasta ayer.
  //
  // Mientras tanto se dibuja igual pero `invisible`: ocupa su lugar sin pintarse,
  // así que cuando llega el digest crece hacia abajo y cuando vence el plazo
  // aparece donde ya estaba. Lo que no vuelve a pasar es que se lea una cosa y
  // medio segundo después otra.
  //
  // Y si el pedido FALLÓ no hay nada que esperar: el respaldo sale ya, en vez
  // de dejar la pantalla en blanco hasta que venza el plazo.
  const esperando = data === undefined && !vencio && !isError
  if (esperando || !data || data.novedades.length === 0) {
    return (
      <div className={cn("flex flex-col gap-5", esperando && "invisible")}>
        <p className="font-semibold text-foreground">{BIENVENIDA_MINIMA}</p>
        {/* Que es esto, tambien aca.
         *
         *  Esta rama la ven los tres brazos que no reciben el digest —control,
         *  teclado y ayudas— y hasta ahora era la unica pantalla del juego que
         *  no decia a que vino: saludo e instruccion, sin nada en el medio.
         *
         *  **Y esto mueve la base de `dx-rampa-1`**, porque este texto es su
         *  rama de control. Se hace a sabiendas: el contraste del cuarto brazo
         *  pasa a medir la pantalla de arranque CONTRA una puerta que ya
         *  explica el producto, que es una pregunta distinta de la que se
         *  declaro. Lo que se gana es que nadie entre sin saber que es esto. */}
        <p className="text-balance text-foreground/85">{QUE_ES}</p>
        <p className="text-balance font-semibold text-foreground">
          {INSTRUCCION_MINIMA}
        </p>
      </div>
    )
  }

  // **Con `@` y el resto del juego sin él.** No es un descuido: el feed habla DE
  // la gente ("sobreasado se puso la camiseta de la UNSAM") y esto le habla A la
  // persona. Un vocativo pide el handle, que es como se la llama, y no el
  // nombre en tercera persona. El `@` va adentro del span para que se pinte con
  // el color del nivel: separarlo dejaría un arroba gris colgando de un nombre
  // de color.
  const saludo = (
    <p className="font-semibold text-foreground">
      <TextoConHuecos
        texto={data.saludo}
        actorAlias={player?.alias ? `@${player.alias}` : null}
        actorLevel={player?.level ?? null}
      />
    </p>
  )

  // A mitad del día: una línea y una pregunta. Sin encabezado y sin lista —lo
  // que pasó mientras no estaba no existe, porque estuvo hace un rato— y con la
  // pregunta en vez de la instrucción, que es lo que convierte «ya llevás 8» en
  // un motivo para tocar el botón y no en un recibo.
  if (data.modo === "sigue") {
    const n = data.novedades[0]
    return (
      <div className="flex flex-col gap-6">
        {saludo}
        <p className="text-foreground/85">
          <TextoConHuecos texto={n.texto} /> {n.emoji}
          <br />
          {SEGUIMOS}
        </p>
      </div>
    )
  }

  const primera = data.modo === "primera"
  const NBSP = String.fromCharCode(160)

  return (
    <div className="flex flex-col gap-5">
      {saludo}
      {/* Después del saludo y antes de los hechos: el saludo abre, esta dice a
          qué vino y recién entonces los números significan algo. Sin negrita —la
          llevan el saludo y la instrucción, que son los dos extremos— así que la
          pantalla se lee de arriba abajo como título, cuerpo, caja, acción. */}
      {primera && (
        <p className="text-balance text-foreground/85">{QUE_ES}</p>
      )}
      {/* Las novedades van en una caja, y la caja NO lleva fondo.
       *
       *  Sueltas se leían como tres renglones más del saludo, en una pantalla
       *  donde todo lo demás ya es texto centrado sobre el fondo del juego: el
       *  borde es lo que las junta en UNA cosa que se puede mirar y después
       *  dejar de mirar. Sin relleno porque un bloque opaco acá pesa más que el
       *  logo, y el logo es el título de esta pantalla.
       *
       *  El encabezado entra ADENTRO: es el rótulo de esta caja y no una sección
       *  de la pantalla, y afuera quedaba flotando entre el saludo y el borde. */}
      {/* La caja ES la lista: sin encabezado adentro.
       *
       *  Tenía uno —«LO QUE ESTÁ PASANDO», «MIENTRAS NO ESTABAS»— y con el borde
       *  puesto pasó a sobrar: el borde ya dice que esto es un bloque aparte, y
       *  el rótulo encima repetía eso gastando un renglón en la pantalla más
       *  apretada del juego. `GameBienvenidaOut.titulo` sigue viniendo del
       *  servidor y ya no lo dibuja nadie.
       *
       *  `text-sm` y no el cuerpo de afuera: son hechos de apoyo, no lo que la
       *  pantalla viene a decir. Un escalón alcanza para que se lean como nota
       *  al margen sin que haya que entrecerrar los ojos.
       *
       *  Lista y no párrafos: son hechos sueltos, cada uno con su emoji al
       *  final. El emoji va DESPUÉS del texto y fuera de él porque llega
       *  aparte del servidor —misma convención que el feed, y lo que deja que el
       *  mismo hecho se cuente con redacciones distintas sin tocar el símbolo. */}
      {/* `w-fit` y centrada: la caja mide lo que mide el renglón mas largo y
          no lo que mide la columna. Estirada al ancho del panel dejaba una
          franja vacía a la derecha de cada hecho, que se leía como un bloque a
          medio llenar. `max-w-full` es el techo: una novedad larga envuelve
          adentro de la columna en vez de empujar la caja afuera.

          El techo es la columna MÁS dos rem, y la caja se centra con
          `self-center`: en el teléfono la columna mide 320 px y «Se resolvieron
          284 derivadas esta semana» se quedaba a un emoji de entrar en un
          renglón. Esos 16 px por lado salen del margen de la pantalla, que
          sobra. Y el emoji va pegado con un espacio duro: si igual no entra,
          baja con la última palabra y no solo. */}
      <ul className="flex w-fit max-w-[calc(100%+2rem)] flex-col self-center gap-2.5 rounded-lg border border-border/60 px-4 py-3 text-left text-sm">
        {data.novedades.map((n) => (
          <li key={n.clave} className="text-foreground/85">
            <TextoConHuecos
              texto={n.texto}
              actorAlias={n.actor_alias}
              actorLevel={n.actor_level}
              universities={n.universities}
              conTags
            />
            {NBSP}
            {n.emoji}
          </li>
        ))}
      </ul>
      {/* Y la primera vez, qué hay que hacer.
       *
       *  El digest reemplaza al texto de siempre, así que al estrenar esta
       *  pantalla se llevó puesta la única instrucción que el juego da —y se la
       *  llevó justo para quien nunca resolvió nada—. Alguien que entra por
       *  primera vez leía que ya hay 412 personas de la UTN jugando y nada que
       *  dijera que lo que sigue es una derivada.
       *
       *  Solo en `primera`: `vuelve` ya jugó y `sigue` cierra con «¿Seguimos?»,
       *  que dice lo mismo en el tiempo que corresponde. Y va al final, pegada
       *  al botón, porque es lo que hay que hacer al tocarlo. */}
      {/* El renglon de cierre, que es lo que invita a tocar el boton.
       *
       *  Las tres ramas tienen uno y antes `vuelve` era la excepcion: cerraba
       *  con la ultima novedad, asi que quien volvia despues de un dia leia tres
       *  hechos sobre los demas y nada que lo llamara a el. `sigue` ya cerraba
       *  con "¿Seguimos?" adentro de su parrafo, y esta rama usa la misma
       *  palabra a proposito: las dos le hablan a alguien que ya jugo, y dos
       *  formas de decir lo mismo en la misma pantalla son dos de mas.
       *
       *  `text-balance`: cuando no entra en un renglon, que los dos queden
       *  parejos en vez de dejar "comenzar." solo abajo. En escritorio entra entero
       *  desde los ~920 px de ventana (la oracion pide 388 y la columna llega a
       *  512); mas angosto envuelve, que es lo correcto: nunca se desborda. */}
      {(primera || data.modo === "vuelve") && (
        <p className="text-balance font-semibold text-foreground">
          {primera ? INSTRUCCION_MINIMA : SEGUIMOS}
        </p>
      )}
    </div>
  )
}

// Los párrafos de las reglas.
//
// **Sin numerar, desde el 02/10.** Los números existían cuando esto era una
// lista de cuatro que se leía de corrido; hoy lo que queda en cada pantalla son
// una o dos reglas sueltas, y una lista de dos con «1.» y «2.» se lee como un
// procedimiento —primero esto, después aquello— cuando en realidad son dos
// cosas independientes que pasan a la vez. La palabra en negrita ya hace de
// ancla, que es lo que los números venían a hacer.
//
// Componente y no un `map` en cada layout porque son dos —teléfono y
// escritorio— y lo único que cambia entre ellos es el cuerpo de letra, que
// entra por `className`.
export function IntroParagraphs({
  className,
  // Cuáles, y en qué orden. Índices de la lista de abajo.
  //
  // Quien las muestra pide una SELECCIÓN y no tiene lista propia: el día que se
  // agregue una quinta regla acá, está disponible del otro lado. Con dos listas
  // separadas, ese día una de las dos se queda vieja — que es justo lo que le
  // pasó al tutorial repartido que esto reemplazó una vez.
  //
  // Y es una lista y no un corte porque no todos ven las mismas: con la fila de
  // ayudas, la tabla se explica antes de la primera derivada y en su propia
  // pantalla, así que acá queda el Elo solo (reglas-trigger.ts ::
  // reglasDeLaDiapo).
  cuales,
}: { className?: string; cuales: number[] }) {
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
    // Acá hubo un tercero sobre los cafecitos —«para que vos y tu universidad
    // escalen el ranking más rápido que el resto»— y se fue el 02/10. El cafecito
    // sigue entero: el pedido, el empuje a la universidad y el ranking (el
    // contador ☕ del marcador se fue con la regla). Lo que se sacó es EXPLICÁRSELO a alguien que todavía no
    // resolvió nada: es la única de las reglas que no hace falta para jugar, y
    // ocupaba un tercio de la única pantalla que el juego dedica a explicarse.
    // La tabla se explica en los dos lados porque en los dos existe: en el
    // teléfono se toca un botón y en escritorio se mantiene Alt.
    //
    // **No dice lo que cuesta, y antes lo decía** («pero esa derivada te va a
    // sumar mucho menos»). Mirarla sigue bajando la XP del ejercicio y
    // salteándose el ajuste de Elo —eso no cambió—; lo que se sacó es
    // anunciárselo de entrada a alguien que todavía no se trabó. La frase
    // convertía la única salida que el juego ofrece en una multa, y el momento
    // en que se lee es justo el que decide si alguien sigue o se va.
    <>
      Si te trabás podés mirar la <Fuerte>tabla</Fuerte> 📖.
    </>,
  ]
  return (
    <>
      {cuales.map((idx) => (
        // La lista es fija, así que el índice en ella alcanza como clave.
        <p key={idx} className={className}>
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
      {/* `max-w-lg` y no `max-w-sm`.
          Con 384 px, «Resolvé la siguiente derivada para comenzar a jugar»
          envolvía en dos renglones y partía la única instrucción del juego al
          medio. Con 512 entra entera, y de paso las novedades dejan de cortarse
          a mitad de oración. Es ancho que en escritorio sobra: la card mide 592
          y el texto llegaba hasta los 384. */}
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 text-center">
        {/* Sin titular ni fórmula de muestra. Los dos estuvieron y los dos se
            fueron por lo mismo: decían con otras palabras lo que ya dicen los
            tres párrafos. El operador se conoce en el primer ejercicio, que llega
            a un toque de acá.

            Cuerpo normal y `text-foreground/85`, igual que el teléfono
            (mobile-flow.tsx) y que la bienvenida del onboarding: en la primera
            pantalla del juego este texto ES el contenido, y en `text-sm
            text-muted-foreground` se leía como una aclaración al pie. */}
        {/* Cuerpo normal también acá. Fue `text-lg` un tiempo —la card de
            escritorio tiene aire de sobra— pero con el digest adentro el saludo
            y la caja de novedades se leían grandes, como un cartel. */}
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
// Dice «¡Vamos!» y no «Continuar», en las dos pantallas (el del teléfono está
// en mobile-flow.tsx). Es la respuesta al renglón de arriba, que siempre
// termina invitando: «Resolvé la siguiente derivada para comenzar.» a quien
// llega, «¿Seguimos?» a quien vuelve. «Continuar» era la palabra del resto del
// juego, pero acá no hay nada que continuar todavía: es el único botón que se
// toca ANTES de la primera derivada, y puede decir algo propio.
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
      ¡Vamos!
      <KeyCap>{teclas.enter}</KeyCap>
    </Button>
  )
}
