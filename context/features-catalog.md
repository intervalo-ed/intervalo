# Features catalog

Inventario pantalla por pantalla. Rutas relativas a `web/src/app/`. Grupo `(app)` = shell autenticado con tab bar.

## Dashboard / Home (`dashboard-entry.tsx`, ruta `/`)

Pantalla principal. Selector de curso (`CourseSwitcher`, entre `analisis`/`probabilidad`/`algebra`), grilla de belts mostrando progreso por unidad (`BeltGrid`), CTAs "Repasar"/"Practicar" que arrancan una sesión (`useStartSession`). XP y nivel del usuario, indicador de racha.

**Editor de curso inline**: desde el dashboard se puede entrar en modo edición para suspender/reactivar topics, ajustar `active_cap`/`session_size` (stepper con debounce), y reiniciar el curso (con confirmación — botón de reset en rojo, guardar en verde; reiniciar incrementa `iteration` y archiva el `UnitState` actual en `UnitStateArchive`).

Transición deliberada antes de entrar a una sesión: fade-out de 200ms + delay forzado de 500ms, para que el prefetch de la sesión siempre resuelva antes de mostrar cualquier loading state.

## Sesión — runner (`session/[sessionId]/session-runner.tsx`)

El loop central de ejercicios. Tarjeta swipeable (Framer Motion, `drag="x"`, elástico, con snap-back) para pasar entre ejercicios. Grilla de opciones 2×2 solo si hay exactamente 4 opciones y todas ≤35 caracteres; si no, lista apilada (regla espejada en `backend/content/authoring-context.md` del lado de contenido). Trackea intentos por ítem (`wrongOptions`) para alimentar `quality_from_attempts`.

Micro-encuesta post-ejercicio (canales A/B/C/D — dificultad, utilidad de la explicación "¿Por qué?", reporte de contenido, e interés del problema): se dispara como una slide intermedia con la misma mecánica de interacción que un ejercicio (seleccionar → Continuar → banner verde de agradecimiento + sonido), gateada por `feedback_survey.py` (caps anti-fatiga: máx 1 por sesión, nunca 1er/último ejercicio, alternancia entre sesiones, pausa tras 3 skips seguidos). Deliberadamente **sin XP** — el motor es el reconocimiento ("esto ayuda a elegir mejor qué mostrarte"), no la recompensa.

El canal **D** (aburrido / justo / interesante, con un chip de razón opcional en los extremos) es el norte para análisis de contenido y retención, y por eso se lleva la mayoría del cupo muestreado: 60% D, 25% A, 15% B. A diferencia de los otros tres canales, su targeting cuenta impresiones **por canal** — un ítem con votos de dificultad no está "cubierto" para interés, son preguntas distintas. Las reglas anti-fatiga, en cambio, cuentan a D igual que a los demás. Al leer estos datos hay que controlar por acierto al primer intento (`answers.quality_score = 5`): el interés reportado correlaciona fuerte con "me salió".

## Resumen de sesión (`session/[sessionId]/summary/`)

XP ganada (con el bonus por racha separado), confetti con los colores de belt (`BELT_VIVID_COLORS`). No hay nivel: la feature se descartó y el código de curva de niveles se eliminó de `algorithm/xp.py` y de los payloads (2026-08) — no asumir que existe UI ni API de nivel.

## Práctica (`practice/`)

Volumen libre e ilimitado a elección del usuario, sin gate diario, XP plano y bajo (ver [gamification.md](gamification.md)) para que no sea farmeable, pero sí escala con el multiplicador de racha diaria.

## Test (`test/`)

Pantalla de configuración estilo examen, flujo separado de Repaso/Práctica.

## Leaderboard (`leaderboard/`)

Ranking global y **por universidad** — ver [gamification.md](gamification.md), es el objetivo de retención de largo plazo del producto, no una pantalla secundaria.

## Perfil (`profile/`)

Edición de nombre/username, configuración de notificaciones (hora local en pasos de 15 min + timezone), árbol de badges de emoji (desbloqueables, se pueden "vestir" para mostrar en el ranking), flujo de feedback libre.

## Onboarding (`onboarding/`)

Intake de curso/carrera/universidad/motivación (los datos de universidad son los que alimentan directamente el ranking universitario y la segmentación de notificaciones), secuencia animada de colores de belt, termina en `onboarding/complete` con prompt de instalación PWA.

## Minijuego de derivadas (`derivadas/`, backend `game/`)

Producto aparte, con identidad y economía propias pero la misma tabla de
cafecitos. Lo único documentado acá es **cómo elige qué ejercicio servir**, que
es la mecánica que gobierna la experiencia entera:

### Quién es cada uno cuando vuelve (la cookie `dx_token`, desde el 28/09)

El juego se juega sin cuenta, así que toda la identidad de la mayoría de la
gente es un `guest_token` en el `localStorage`. Eso tenía una fuga grande y
silenciosa: **Safari borra todo el almacenamiento escribible por script de un
sitio al que no se vuelve en siete días**, y sin token guardado cada carga de
página se anota como un jugador nuevo — `reglas-trigger.ts` ya lo decía con
todas las letras, como un detalle sin consecuencias.

Las consecuencias, medidas el 28/09 sobre la base propia desde el 14/09:

| | Escritorio | iOS | Android |
|---|---:|---:|---:|
| se le sirvió la 1ª derivada | 80,6% | **58,1%** | 76,5% |
| engancha, dado que se le sirvió | 58,2% | 57,5% | 59,3% |
| vuelve otro día, dado que enganchó | 12,5% | **13,6%** | **27,5%** |

La fila del medio es la que orienta: **una vez que la derivada aparece, las tres
plataformas se comportan igual**. Nadie se va por culpa de iOS jugando. Toda la
pérdida está en el escalón anterior, y una sola mecánica explica sus dos
mitades — filas nuevas que nunca resuelven nada, y vueltas que no se cuentan
como vueltas.

**El arreglo es una cookie, y hay dos detalles que no son detalles.** La pone el
servidor en un `Set-Cookie`, que no entra en el tope de siete días (ese tope es
sobre lo que escribe un script). Y la pone `intervalo.xyz` y **no la API**: la
API vive en otro origen, así que su cookie sería de tercera parte y Safari las
bloquea enteras. De ahí que el juego tenga el primer route handler de Next
bajo `/api` de toda la app (`app/api/dx/token/route.ts`; los que ya había
generan íconos), con su `DELETE` para que cerrar sesión no deje al invitado
viejo listo para resucitar.

La cookie se lee **del lado del servidor** en `app/derivadas/page.tsx` y viaja
como prop hasta `GameRoot`, que la adopta en el inicializador de un `useState`
— antes de `useGamePlayer`, porque si el token se adopta después el alta ya
salió sin él y el server creó el jugador nuevo que esto viene a evitar. Pedirla
con un `fetch` habría costado un viaje de red entero en el arranque, y
justamente a quien menos lo puede pagar.

**Y es a la vez la medición.** Cada apertura escribe una fila en
`game_device_samples` con dos banderas: `sin_token_local` (llegó sin token) y
`token_rescatado` (la cookie lo devolvió). La proporción entre las dos dice
cuántas de las «altas» de iOS eran vueltas, que es el número que hace falta para
saber si esto alcanzó.

### Entrar con Google desde el primer aparato nuevo (desde el 09/10)

El progreso vive en el `guest_token` del navegador, y la única forma de llevarlo
a otro aparato es la cuenta de Google. Hasta acá, el botón para entrar aparecía
solo en la diapo de registro —a las diez correctas— o tocando el @ en
Configuración, que no dice que sirve para eso. Dos personas lo escribieron en la
varita la misma semana: una abrió el juego «en otro equipo y no me reconoció»;
la otra perdió diez derivadas porque el teléfono le dio un invitado nuevo (otro
navegador, o el de WhatsApp), se registró sobre ESE, y el de la víspera quedó
huérfano. Ninguna de las dos tenía un lugar visible donde entrar.

Ahora está en **«Elegí tu @»** (`username-slide.tsx`), que es la primera
pantalla que ve cualquier aparato nuevo: debajo del campo, «Vincular con
Google» y la línea «Vinculá tu cuenta para no perder tu progreso».
El login es el mismo de la diapo de registro, movido a `google-login.tsx` para
que las dos pantallas no lo repitan; si la persona ya escribió un @ antes de
tocar, viaja como «alias deseado» y se aplica al volver.

Lo que NO resuelve, dicho: el servidor engancha al invitado del aparato actual y
nada más. Quien jugó como invitado en el aparato nuevo y DESPUÉS entra, pierde
ese rato (`_jugador_del_usuario` devuelve el jugador de la cuenta y descarta el
invitado); y un invitado viejo del mismo aparato en otro navegador no se puede
rescatar. El botón existe para que las dos cosas pasen menos, no para que no
puedan pasar.

De paso la diapo se ordenó como el resto: el Continuar va al pie
(`ConSalidaAbajo` en el teléfono, el pie de la columna en escritorio), sin el
chip de enter, y en el teléfono el campo ya no se enfoca solo —el teclado del
sistema tapaba la mitad de la diapo, incluido el botón nuevo.

### Con qué aparato juega cada uno (`game_device_samples`)

La misma fila guarda **el FCP de la primera pintura** y **el modelo del
teléfono**, y las dos elecciones tienen un porqué medido:

- **Por qué no alcanza PostHog, que ya mide web vitals.** Pierde el 11% del
  tráfico: quien entra con Brave, Firefox u Opera manda el `$pageview` y
  después casi nada — el 54,9% de ellos no deja ni un `game_start`, contra el
  1,6% del resto. Es el mismo motivo por el que los carteles se escriben en las
  dos puntas (`game_cta_events`), y acá pesa más.
- **Por qué el FCP y no el LCP o el INP.** Los dos crecen con el uso: el LCP
  deja de actualizarse recién en la primera interacción, y el INP de una
  persona es el PEOR de todos sus toques — quien juega doscientas derivadas
  tiene doscientas oportunidades de que uno salga lento. Cortando por cuartil de
  LCP, el cuartil «más lento» enganchaba **25 puntos MÁS** que el rápido. Eso no
  es un hallazgo: es el uso medido dos veces. El FCP se mide una sola vez y
  temprano, antes de que la persona haya hecho nada.
- **Y para qué sirve el modelo.** De ahí sale la gama del aparato, que está
  decidida antes de que la persona llegue. Se pide por **Client Hints**
  (`navigator.userAgentData.getHighEntropyValues(["model"])`) y no del
  User-Agent: Chrome lo redujo y manda `(Linux; Android 10; K)` para todos los
  teléfonos — 30.274 de 31.055 eventos de Android en 30 días, el 97,5%. La
  primera versión leía el User-Agent y dejaba la columna vacía; se vio con las
  dos primeras muestras reales de Android. Es la única variable de exposición
  exógena que hay, y con ella el resultado es que **la gama no predice el
  abandono**: dentro de Android, los teléfonos de entrada enganchan igual o
  mejor que los de gama alta, con 2,1 veces más de tiempo de pintura y 3 veces
  más de CPU.

El endpoint **recorta y no rechaza** (`/dispositivo`, 204 siempre). Un 422 no
descartaría el campo raro sino la fila entera, y con ella las dos banderas del
rescate, que son lo caro. Una pestaña abierta en segundo plano y pintada una
hora después manda un FCP de tres millones y medio, y esa visita tiene que
contar igual.

### La puerta, y los dos experimentos que la corrieron

Entre aterrizar y ver la primera derivada no hay nada: el logo quieto, el saludo,
una línea (`PuertaMinima`) y el botón. Eso es el resultado de un experimento, no
una decisión de diseño, así que conviene leerlo con el experimento al lado.

#### Lo que había, y lo que `dx-puerta-1` probó (13/09 – 18/09)

Hasta el 18/09 la puerta tenía tres peajes: la presentación animada del logo
(`game-intro.tsx`, corría en CADA carga), los cuatro párrafos de reglas
(`intro-panel.tsx :: IntroParagraphs`) y —la primera vez en ese dispositivo— el
pedido de apodo (`username-slide.tsx`). El brazo test, `derivada-primero`, los
sacaba todos y corría las reglas y el @ a después de la primera correcta.

**Ganó, y por mucho.** Con 527 por brazo contra los 373 comprometidos:

| | control | derivada primero |
|---|---|---|
| Se le muestra una derivada | 55,6% | **80,6%** |
| Del aterrizaje al primer intento (mediana) | 39,4 s | **14,2 s** |

+25,0 puntos, IC95 [19,6 · 30,5], p prácticamente cero: dos veces y media el
efecto mínimo que se había declarado. Los 25 segundos que se ahorran son la
puerta entera, porque una vez que la derivada está en pantalla los dos brazos
tardan lo mismo en contestar (11,9 s contra 10,6 s).

#### Lo que ese experimento también dejó, y es de lo que se ocupa el segundo

Las 132 personas de más que el brazo ganador metía por cada 527 **duraban una
sola derivada**. Contadas en absoluto, sobre las mismas 527:

| llega a | control | derivada primero |
|---|---|---|
| 1 correcta | 245 | 310 |
| 2 | 224 | 229 |
| 3 | 216 | 218 |
| 5 | 193 | 181 |
| 20 | 63 | 52 |

Para la tercera están empatados y de la quinta en adelante gana el control. El
brazo ganador produjo 3.995 derivadas resueltas en primeras tandas contra 4.663
del control, con la misma cantidad de gente.

**La causa está en el código y no en la composición.** Entre la primera correcta
y la segunda derivada, el brazo test pone tres pantallas seguidas —el @, el
ranking y las reglas— y ahí se va el **26,1%**, contra el **8,6%** del control,
donde el @ y las reglas ya estaban pagos en la puerta. El porcentaje es el mismo
en las tres plataformas (26,8 / 24,7 / 26,5), así que no es «entró gente peor»:
la composición no se reparte pareja. El peaje no se sacó, se mudó — y cobrado
sobre alguien que acaba de acertar sale tres veces más caro.

El corte por plataforma, que era el único desglose declarado, dice además dónde
estuvo la ganancia. Llegando a 3 correctas, cada 100 que aterrizan:

| | control | derivada primero |
|---|---|---|
| Android | 47,5 | 42,1 |
| iOS | 26,4 | **38,6** |
| Escritorio | 50,0 | 44,0 |

iOS venía en 34,5% de gente que veía una derivada contra 65,3% de Android: ahí la
puerta no era un peaje, era una puerta rota. Android, que la pasaba bien, solo
recibió el peaje mudado y quedó peor. **La suma da empate**, y por eso el flujo
se implementó igual: nadie está peor en agregado y un tercio del tráfico está
mucho mejor.

**Consecuencia sobre el panel:** el OMTM dejó de ser «respondió una derivada» y
pasó a ser **«resolvió 3 en su primera tanda»** (`game_queries.py :: ENGANCHE`).
La medida vieja subió 13,8 puntos en este experimento sin que cambiara nada más;
una vara que se mueve así no es un objetivo, es un contador de clics.

#### `dx-puerta-2`, cerrado el 27/09 por futilidad

Los dos brazos tenían la misma puerta. Lo que cambiaba era dónde se cobra lo que
la puerta no cobró.

- **`control`** — el flujo que ganó `dx-puerta-1`, tal cual: después de la
  primera correcta, **@ → ranking → reglas 2, 3 y 4 juntas**
  (`reglas-slide.tsx`, una sola vez por dispositivo). Fue el flujo hasta el
  02/10; lo que quedó está en «Qué explica el juego, y cuándo», más abajo.
- **`sin-peaje`** — entre la primera correcta y la segunda derivada no había
  nada salvo el ranking: el **@** se corría a la tercera correcta y las
  **reglas** se repartían de a una (el Elo en la 5, los cafecitos en la 12, la
  tabla en la 17), ninguna antes de la tercera y ninguna compartiendo respuesta
  con otra pantalla.

La métrica primaria era **llegar a 3 correctas en la primera tanda**, base 0,414
y efecto mínimo 8 puntos → **606 por brazo**.

**Cómo terminó.** Con 509 y 547 el brazo tratado iba **+2,2 pp** (39,1% → 41,3%,
p 0,46, IC95 [−3,7 ; +8,1]). Se paró antes del n comprometido y el motivo es la
única razón que puede parar antes: **no quedaba ningún futuro en el que ganara.**
Aunque a las 156 personas que faltaban se les regalara el efecto declarado
entero de 8 pp, el contraste final daría z = 0,99 contra el 1,96 que hace falta;
para que diera significativo, los 59 que le faltaban al brazo tratado tendrían
que llegar a tres en el 75,6% de los casos contra el 39,1% del control.

Parar por futilidad **no es la parada prohibida**. Lo que infla el error de tipo
I es mirar todos los días y frenar cuando el p-valor cruza 0,05; frenar porque
ningún futuro posible lo cruza es la operación opuesta y no puede fabricar un
falso positivo. Lo que sí cuesta es potencia para efectos chicos, y eso queda
dicho: un efecto de 2 o 3 pp puede existir y este diseño nunca lo iba a ver.

**En forma sí hizo lo que prometía, y esa es la conclusión que importa.** El
brazo ganaba +4,8 pp en llegar a la 2ª derivada y +6,3 pp en llegar a la 3ª — o
sea, recuperaba exactamente a la gente que el peaje se llevaba— y la ventaja se
consumía entera en la 5ª. En personas: +39 en k=2, +41 en k=3, +11 en k=5, +3 en
k=10 y −6 en k=20.

Leído contra `dx-puerta-1`, que movió otro peaje en otro momento y ganó 71
personas en la primera derivada y ninguna en la tercera, queda una sola
afirmación: **cada peaje que se mueve compra exactamente un paso y ni uno más.**
Después del primer escalón, el riesgo de abandono es ~6,3% por derivada y es
plano (tendencia con k: −0,07 pp), y las vueltas siguientes abandonan igual que
las primeras tandas de la quinta derivada en adelante. La cantidad de pantallas
antes de la primera derivada, y el momento en que se cobran, están agotados como
palanca. Los dos informes están en la carpeta de reportes.

El brazo `sin-peaje` se fue con el experimento: el calendario de las reglas ya no
existe en `reglas-trigger.ts`. Está en el git y en el PDF del cierre.

#### Qué explica el juego, y cuándo (desde el 02/10)

Eran cuatro reglas: el ejercicio, el Elo, los cafecitos y la tabla. La primera la
dice la puerta en imperativo y las otras tres salían juntas después de la primera
correcta. Quedaron así:

| | dónde | quién la ve |
|---|---|---|
| el ejercicio | la puerta, en imperativo | todos |
| la tabla y el salteo | **antes** de la primera derivada, pantalla propia | `ayudas` y `bienvenida` |
| el Elo | después de la primera correcta en `control` y `teclado`; de la **segunda** en `ayudas` y `bienvenida` (`reglasTras`) | todos |
| la tabla | después de la primera correcta | `control` y `teclado` |
| los cafecitos | — | nadie |

**Los cafecitos ya no se explican.** El cafecito sigue entero —el pedido, el
empuje a la universidad, el ranking—; lo que se sacó es contarle la mecánica a
alguien que todavía no resolvió nada. Era la única de las cuatro que no hace falta
para jugar y se llevaba un tercio de la única pantalla que el juego dedica a
explicarse. Con eso también se fue el contador ☕ del marcador, que existía para
que el emoji de la regla tuviera dónde reconocerse.

**La tabla y el salteo se explican ANTES de jugar, no después**, y solo donde los
botones existen. La atrición por derivada es 20,4% en la PRIMERA y entre 5,7% y
8,9% de la cuarta en adelante: el momento en que alguien se va es justo el que
esa pantalla cubre, y decirle después que podía haber salteado es llegar tarde a
la única vez que importaba. En `control` y en `teclado` la fila de ayudas no está
en el pie, así que ahí la pantalla prometería un botón que no se puede tocar y la
regla de la tabla se queda donde siempre estuvo (`reglas-trigger.ts ::
reglasDeLaDiapo`, `herramientas-slide.tsx`).

La condición de la pantalla nueva es «todavía no contestó ninguna» y sale del
servidor (`exercises_attempted`), no de localStorage: recargar antes de resolver
la primera la vuelve a mostrar, que es lo correcto —esa persona sigue sin haber
empezado—.

#### El mapa de interrupciones

Seis sistemas independientes deciden cuándo el juego deja de servir derivadas y
pide algo, cada uno con su propia cadencia. El **18/09 se adelantaron dos** —el
registro de la 12 a la 10 y la primera oferta de cafecito de la 20 a la 14— y
eso obligó a mover un tercero, porque los números no viven solos:

| derivada | qué sale |
|---|---|
| 1 | el @ (`username-slide.tsx`) —en el teléfono, **después** del ranking— y la diapo de reglas: el Elo y la tabla en `control` y `teclado`. En `ayudas` y `bienvenida` la diapo sale en la 2 y dice solo el Elo |
| 3 | carrera y universidad (`HITO_PERFIL`) |
| 8 | la primera encuesta de la escalera (`OPINION_PRIMERA`), y de ahí vuelve para siempre |
| 10 | registrarse (`HITO_REGISTRO`), y se vuelve a ofrecer cada 12 |
| 14 | invitar a un amigo (`RECLUTAS_RESTO`, desde el 28/09; antes en la 9) |
| 15 | **cada cuánto ver el ranking** (`FRECUENCIA_EN`, solo teléfono, desde el 09/10), una sola vez en la vida del aparato |
| 18 | la pregunta de la varita (`ENCUESTA_EN`), una sola vez en la vida |
| 20 | el cafecito, por primera vez (`CAFECITO_PRIMERA`, desde el 28/09; antes en la 14) y de ahí cada 20 |
| 21 | instalar la app (`INSTALAR_PRIMERA`), y después cada 12 |
| 30 | *(experimento `dx-muro-1`, la mitad de los jugadores NUEVOS — los de antes del 27/09 no tienen tope)* el **tope diario**: no hay más derivadas hasta mañana, salvo cafecito |

**El tope de la 30 no es un escalón de esta escalera y por eso está en su propia
fila.** Los demás interrumpen algo que estaba pasando y se salen con un botón;
ése **es** lo que está pasando, y solo se sale comprando o esperando a mañana.
Sale último de la escalera —después del ranking, del festejo y de lo que tocara—
y apaga la diapo del cafecito de esa misma respuesta, para no pedir plata dos
veces seguidas. Ver `game/muro.py` y la sección del tope en
[gamification.md](gamification.md).

#### El teclado en rampa y la fila de ayudas (`dx-rampa-1`, desde el 27/09)

El teclado del juego tenía **dos zonas**: un bloque FIJO que estaba siempre
completo —numérico, `x`, las cuatro operaciones, paréntesis, flechas— y una fila
DINÁMICA arriba que crecía a medida que las derivadas pedían teclas nuevas
(`game/keyboard.py`, `game_players.unlocked_keys`). `dx-rampa-1` mete el bloque
fijo en el mismo mecanismo.

**La rampa.** El teclado arranca con las teclas que la respuesta necesita y
crece. Como las tres primeras derivadas son fijas —`x` → `1`, `x²` → `2x`,
`2x²` → `4x`— eso da literalmente: una tecla, después tres, después cuatro. De la
cuarta en adelante entran los operadores, y **a la octava se desbloquea todo lo
que falte**, haya salido o no (`RAMPA_COMPLETA_EN`). Ese techo es lo que la hace
una rampa y no una jaula.

Dos invariantes que el mecanismo garantiza y `check_game_rampa.py` verifica:

- **la tecla que la respuesta necesita SIEMPRE está**, porque se desbloquea en el
  mismo ejercicio que la pide. Sin esto alguien queda trabado sin salida;
- **el inventario nunca encoge**, y lo que se ganó **no se pierde si el
  experimento se apaga**: la columna conserva las fijas aunque dejen de crecer.

**Mientras el bloque fijo está incompleto, el teclado se EMPAQUETA**: filas
centradas y parejas del mismo tamaño en vez de la grilla de calculadora con
huecos. La grilla de la Casio existe para que el dedo encuentre el 7 sin mirar, y
eso no se puede cumplir con tres teclas; con huecos, además, se lee como un
teclado roto en vez de como uno que crece. El costo —las teclas se mueven de
lugar mientras crece— es el mismo trato que ya tenía la fila dinámica.

**Y cuando el empaquetado pediría cuatro filas, va directo el definitivo**
(`math-keyboard.tsx :: rampaDibujada`). Cuatro filas es lo que mide el teclado
completo, así que a esa altura empaquetar no ahorra alto y lo que se veía era lo
peor de los dos: una grilla sin orden de calculadora a un paso de reacomodarse
entera. El costo, asumido: en el definitivo se ven TODAS las fijas, también las
que el calendario del servidor todavía no soltó. Para quien llega a ese punto la
rampa del cliente termina antes que `RAMPA_COMPLETA_EN`; el inventario de
funciones se sigue desbloqueando de a una.

**Es palanca de TELÉFONO.** En escritorio el teclado no tiene números —se
tipean— y el físico sigue funcionando en paralelo, así que la rampa ahí no
significaría nada; el cliente la ignora cuando no dibuja numérico.

**La fila de ayudas** (los brazos `ayudas` y `bienvenida`) sube **Tabla** y **Saltear** a una
fila propia partida por la mitad, arriba del botón principal, con el ícono a la
derecha de la palabra. El alto sale del teclado, que en rampa mide hasta tres
filas en vez de cuatro — por eso las dos mitades viajan juntas y no como un
factorial. Con la fila puesta, el botón de la tabla **sale de la barra de
arriba** (aparecería dos veces); en la pantalla del ranking se queda, porque ahí
no hay fila. Al errar, el botón principal se **bifurca** y queda una grilla 2×2:
Tabla, Saltear, ¿Por qué? y Revisar a la vista al mismo tiempo, que es el momento
en que se va el 41,5% de los que no aciertan al primer intento.

**El cuarto escalón: la pantalla de arranque.** El 28/09 la escalera pasó de tres
brazos a cuatro:

    control  →  teclado  →  + ayudas  →  + pantalla de arranque

La bienvenida (`game/bienvenida.py`) había salido **al 100% el 27/09**, un día
antes del arranque de la inscripción, y acá se vuelve variable. Tres reglas la
gobiernan (`game/rampa.py :: muestra_digest`):

- **el veterano la conserva.** Quien nació antes del corte no está en el
  experimento y ya la tiene puesta; sacársela sería desinstalarle una feature
  para medir a otra gente;
- **con `RAMPA_ENABLED=0` vuelve a ser de todos**, porque apagar el experimento
  tiene que devolver el producto a como estaba;
- **entre los que entran, solo el cuarto brazo.**

**Es de otra naturaleza que los otros dos escalones**, y conviene tenerlo a la
vista al leer el resultado: el teclado y las ayudas cambian la pantalla del
ejercicio, y la bienvenida cambia la ANTERIOR. Es la única de las tres que puede
mover la **base** de la métrica —cuánta gente llega a que se le sirva la primera
derivada— y no solo el numerador. Por eso su contraste hay que mirarlo también
sobre los aterrizados, no solo sobre los que resuelven.

**Y cuesta seis días.** A ~94 altas por día, 547 por brazo pasa de 17,5 a 23,3
días sobre el contraste primario —el que de verdad tiene potencia—. Se aceptó a
cambio de subir el caudal de las campañas de difusión; si el caudal no sube, lo
que se retrasa es la única pregunta que este diseño puede contestar.

**El 02/10 se movió la base, y hay que partir la serie ahí.** El texto de
respaldo de la puerta —que es lo que ven `control`, `teclado` y `ayudas`— ganó
una oración que antes no tenía: *«Memorizá todas las derivadas y llegá mejor
preparado a tus parciales con este minijuego.»* En el mismo cambio la
instrucción pasó a *«Resolvé la siguiente derivada para comenzar.»*, el botón a
*«¡Vamos!»*, y el digest del cuarto brazo cambió de contenido (conteos por
período, sin totales). Fue una decisión de producto tomada a sabiendas. Lo que
cuesta: desde esa fecha el contraste del cuarto brazo ya no mide «pantalla de
arranque contra puerta vacía» sino «pantalla de arranque contra una puerta que
ya explica el producto», y los tres primeros brazos tampoco son comparables con
sus propios inscriptos anteriores.

**El panel ya parte la serie: los experimentos abiertos del juego se leen desde
el lunes 05/10** (`metrics/game_queries.py :: LECTURA_DESDE`). Vale para
`dx-rampa-1`, `dx-banda-1` y `dx-muro-1`: lo inscripto antes no entra a ningún
resultado. Es un filtro del PANEL y no mueve nada del juego —quién está en qué
brazo, quién ve la pantalla de arranque (`rampa.NACIDO_DESPUES_DE`) y quién
tiene tope (`muro.ARRANQUE`) siguen como estaban—. En `dx-muro-1` eso separa
dos fechas que antes eran una: el panel inscribe desde el 05/10 a un
subconjunto de los que el servidor topea desde el 27/09, nunca al revés.
`dx-ab-imagen` no se movió: es de difusión, por grupos, y nada de este cambio
le toca la métrica.

Un detalle que hay que respetar si alguna vez se toca de nuevo: **`sorteo.brazo_de`
reparte con `% len(BRAZOS)`**, así que sumar o sacar un brazo re-sortea a todo el
mundo. El cuarto entró el 27/09, con cero inscriptos, que es la única ventana en
la que eso sale gratis.

Ver `game/rampa.py`, `web/src/app/derivadas/pie-rampa.tsx` y la sección del Elo
en [gamification.md](gamification.md), que cambia con esto.

**La escalera de encuestas es el único escalón que no se termina nunca.** Las dos
preguntas del juego —dificultad y repetitividad— comparten un solo turno y
alternan: los huecos nominales son 10, 10, 20, 30, 50 y 80 (el último se repite),
y la regla de separación los estira cuando caen encima de otra pantalla. En las
primeras 200 derivadas los turnos reales son **28, 44, 54 y 113** para dificultad
y **77 y 164** para repetitividad.

Simulado hasta la derivada 200 con las funciones reales —`bun run check:opinion`,
sección 6, que recorre el ladder entero escalón por escalón para un invitado en un
teléfono, que es el caso con más pantallas—: **ninguna pantalla comparte respuesta
con otra**, y no hay tres derivadas seguidas con pantalla. Hasta el 24/09 esa
simulación vivía en un scratchpad y el chequeo solo miraba café y reclutas; ahora
está en el check, que es lo que hace que la afirmación siga siendo verdad cuando
alguien mueva un número.

**Lo que hace que el mapa se sostenga son tres reglas, no la aritmética.**

1. **El cooldown compartido** (`readUltimoPedidoAt`): el cafecito y el
   reclutamiento se miden contra el último pedido de cualquier tipo, no contra
   el último propio. Son los dos que piden algo caro, y dos de ésos seguidos no
   son dos pedidos sino un peaje.
2. **La distancia con la pantalla de instalar** (`readUltimaInterrupcion`). Esa
   pantalla no consume el cooldown a propósito —si lo consumiera, correría a los
   otros dos— y eso resolvía una mitad dejando la otra abierta: nada impedía que
   un récord cayera pegado a ella. Con la ventana compartida más corta eso pasa
   en la derivada 46, un acierto después de la instalación de la 45.
3. **Que dos pantallas no compartan respuesta** (`readUltimaPantalla`). No es
   una distancia sino una igualdad, y cubre a TODAS —incluidas las que no piden
   nada: el registro, la varita y las dos encuestas de la escalera—. El ladder vuelve a
   entrar después de cada diapo con otro `consumed`, así que sin esto dos
   disparadores que apuntan al mismo número se dibujan uno atrás del otro sobre
   la misma derivada.

**Las reglas 2 y 3 son distintas a propósito y mezclarlas sale caro.** Con una
sola lectura y una distancia de cuatro, la pregunta de la varita de la 18
empujaba el segundo cafecito de la 20 a la 40: estar a dos derivadas de
distancia está bien, compartir la respuesta no. Las encuestas de la escalera son
las únicas que usan la regla 3 como distancia y no como igualdad, y es coherente
con su lugar: van últimas del ladder justamente porque no convierten a nadie. Con
huecos de diez son también las que más veces se topan con otra pantalla, así que
son las que más dependen de esa regla.

Por qué se movió el reclutamiento de la 10 a la 9: en la 10 compartía respuesta
con el registro —el registro sale primero y al cerrarlo el ladder vuelve a
entrar con el disparador todavía en pie— y además escribía el cooldown
compartido, lo que le dejaba al cafecito de la 14 solo cuatro derivadas de aire
y la oferta directamente no salía.

**Y por qué instalar se fue de la 5 a la 21.** Era el pedido más temprano y el
más barato —abandono 7,6% en esa derivada, contra 14,7% en la 10— pero también
ocupaba la única respuesta libre del tramo inicial. Ahora sale en la 24 y vuelve
cada 12 hasta seis veces (24, 36, 48, 60, 73, 85) en vez de tres. El precio está
medido y es alto: con la primera en la 5 el cartel le llegaba al **66,3%** de
los que resuelven una derivada, y desde la 21 le llega al **15,9%**. Repetir no
lo compensa, porque quien no llega a la 21 tampoco llega a la 36 — no es más
exposición, es otra: menos gente, más comprometida, y varias veces. El número
que justificaba el 5 (una curva de 52 jugadores donde la 15 retenía el 10%) dejó
de ser cierto: medida sobre 578, la 15 retiene 26,6% y la 30 todavía 11,2%.

**Ese cartel ahora se mide.** No estaba en la tabla de carteles del panel —solo
mandaba dos eventos a PostHog— así que las 16 instalaciones de toda la vida del
producto no se podían atribuir a ninguna posición. Su impresión entra ahora en
`game_cta_events` con la derivada en la que salió. El CTR se muestra como «—» y
no como 0%: la diapo explica cómo agregar la app y se cierra, no tiene botón que
lleve a ningún lado (`SIN_CLICK` en `game_queries.py`). Su conversión es la
tarjeta «Instalan la app» del titular.

Y por qué el registro se vuelve a ofrecer cada 12 y no cada 10: con 10 y 10 las
re-ofertas caían en la 20, la 30 y la 40, o sea en lockstep con los múltiplos
del cafecito. El pedido de cuenta y el de plata compartiendo respuesta, y no una
vez sino siempre.

#### Cómo se sortea y dónde queda

El brazo lo sortea el cliente (`lib/experiments/UseGameVariant.ts`) hasheando un
id de dispositivo propio, y **no** el `guest_token`: en una primera visita el
token todavía no existe —lo crea el POST del alta— y la primera visita es justo
lo que el experimento mide. El sorteo es sincrónico a propósito: si hubiera que
esperarlo se vería un parpadeo del control antes de entrar al otro brazo.

Se guarda en `game_players.variant` como `<experimento>:<brazo>`, **solo al crear
la fila** (`game/router.py :: _anotar_variante`). No es lo mismo que la
atribución de primer contacto, que sí se puede completar en una visita
posterior: anotarle un brazo a alguien que ya existía sería meterlo al
experimento después de que vio la pantalla del control. La columna existe porque
PostHog segmenta eventos y el final del embudo no es un evento — el cafecito
está en `game_boosts` y la profundidad en `game_attempts`.

Lo que fija `backend/scripts/check_game_variante.py`, que lee el experimento del
propio archivo del front para que no se pueda desincronizar.

**Hoy no hay ningún experimento de pantallas corriendo, y eso es un estado
declarado y no un olvido**: `EN_CURSO` está en `null` y `variant` viaja en NULL.
Que viaje en NULL importa más de lo que parece — si al cerrar `dx-puerta-2` se
hubiera seguido escribiendo `dx-puerta-2:control`, cada jugador nuevo habría
entrado al brazo control de un experimento ya leído y sus números seguirían
moviéndose para siempre, con un brazo creciendo y el otro congelado. Abrir el
próximo es volver a llenar esa constante: la máquina del sorteo —el id de
dispositivo, el hash y la avalancha— quedó intacta.

**Desde `dx-elo-1` (19/09) éste no es el único sorteo, y la diferencia importa.**
Aquél corre del lado del servidor y deriva el brazo de un hash del `player.id`
sin guardarlo en ninguna columna (`game/sorteo.py`). El write-once de acá arriba
sigue siendo lo correcto para un experimento de PANTALLAS, y es justamente lo que
lo vuelve inservible para uno del MOTOR: un parámetro que rige de la inscripción
en adelante no tiene nada de «ya visto» que contaminar, y todos sus elegibles
existen desde hace semanas.

El panel lo lee en su pestaña **Experimentación**
(`/panel/<token>/dx?s=experimentacion`), que tiene una particularidad: **se niega a
contestar hasta tener la muestra que se prometió.** Mientras falte gente no
calcula el p-valor ni dibuja un ganador, solo cuánto falta — mirar un A/B todos
los días y parar en cuanto cruza 0,05 no es leerlo, es repetir el sorteo hasta
que salga. Los guardarraíles (profundidad, vuelta otro día) sí se miran desde el
primer día, porque sirven para frenar un brazo que hace daño y no para declararlo
ganado.

Cada experimento declara además **cuál columna decide** (`metrica`), y la tabla
la marca con ▸. Era implícita —siempre «llegó a la 1ª»— hasta que `dx-puerta-1`
mostró por qué tenía que ser explícita.

#### La pestaña es un ÍNDICE y una vista por experimento

**No hay una página con los cinco.** La pestaña llegó a ser cuatro bloques
apilados de cuarenta tablas, ordenados por cuándo se escribieron, y con eso
puesto la pregunta «¿qué probamos sobre la retención?» se contestaba
scrolleando. Ahora son dos pantallas:

**El índice** (`?s=experimentacion`) es una tabla, una fila por experimento:
título, abstract, categoría, **desde**, **hasta**, dos tags y el link al informe.
Cada fila es la puerta de entrada. Las tres claves nuevas viven en la
DECLARACIÓN de cada experimento y no en un catálogo aparte, para que agregar uno
no lo pueda dejar fuera del índice sin que nadie se entere:

- **`categoria`** — una de las pestañas del panel, o sea contra qué tablero se lee
  su resultado, y de dónde sale su color. Hoy **Retención y Jugabilidad no tienen
  ninguno**, que es exactamente lo que los dos experimentos de la puerta dejaron
  dicho: la palanca sin probar es por qué hacer la derivada siguiente.
- **`abstract`** — la pregunta, en una o dos frases, sin números.
- **`cierre`** — `None` mientras corre.

**Un tag de estado y tres estados: Activo · Pausado · Finalizado.** El
RESULTADO no se dibuja en la tabla, y eso es deliberado: un «Ganó» o un «Sin
efecto» sin el intervalo, el n ni el motivo al lado es la forma más barata de
que un «no se detectó diferencia» se lea como «no sirvió», que son dos
afirmaciones distintas y solo una es cierta. El veredicto vive en la caja de
estado de la vista del experimento, pegado a sus números, y en el informe.
«Pausado» solo lo puede estar el tope, que es el único con interruptor de
ambiente (`MURO_ENABLED`).

**Los filtros ofrecen solo las categorías que tienen algo.** Un filtro que no
filtra nada no es un filtro: aparecen solas el día que alguien declare el
primero contra esa pregunta. Que falten se dice en la nota de abajo, calculada,
para que el día que Retención tenga uno la frase se caiga sola.

#### Un color por pregunta del producto

Las siete pestañas del panel tenían el mismo color y el color solo decía cuál
estaba abierta. Ahora dice **de qué se está hablando**, y el mismo tono aparece
en tres lugares —la barra de arriba, los chips del filtro y la columna de
categoría— que es lo que hace que «Monetización» se lea como una cosa y no como
tres rótulos parecidos (`game_render.COLORES_SECCION`):

| pestaña | color | |
|---|---|---|
| Activación | `#5fd39b` | verde claro |
| Retención | `#3da878` | verde oscuro |
| Jugabilidad | `#4f93e6` | azul |
| Motor | `#a473e0` | violeta |
| Monetización | `#d98e2b` | ámbar |
| Experimentación | `#7e80f7` | el índigo de marca: es la que habla de las otras |
| Feedback | `#e0789e` | rosa |

Los tonos están elegidos sobre el fondo del panel para que el texto llegue a
**4,5:1**, que es lo que obliga a que «verde oscuro» sea un verde medio y no el
que uno elegiría sobre papel.

El chip de la pestaña abierta **no lleva relleno**: se marca con el borde a 2px y
la negrita, y el `padding` baja un píxel para compensar el borde que sube uno —
sin eso el chip elegido es dos píxeles más grande que los otros y la barra entera
se corre al cambiar de pestaña.

Dos vecindades se cuidaron a mano porque caen en la MISMA FILA de la tabla:
Monetización (ámbar anaranjado) contra «Pausado» (amarillo), y Activación
(verde claro) contra «Activo» (lima), que se separan por matiz y no por brillo.
Queda una sin resolver y conviene saberlo: **Retención y «Finalizado» son dos
verdes a 31 de distancia en RGB**. Hoy no molesta porque Retención no tiene
ningún experimento; el día que tenga uno cerrado, hay que mover uno de los dos.

Todo esto va con estilo en línea y no con clases nuevas: `nav.jump` lo comparte
el panel de Intervalo (`metrics/render.py`), y una regla ahí le cambiaría los
chips a un panel que no pidió nada. Por el mismo motivo el tag de estado se
llama `.estado` y no `.tag`: ese nombre ya era el chip de universidad de
`theme.py`, que usan los dos paneles.

**`hasta` solo tiene fecha cuando cerró.** Los que corren dicen «en curso» y no
una fecha proyectada: la inscripción de este producto va a los saltos de las
olas de difusión —el 24/09 entraron 505 personas en un día y el 27 entraron 7—
así que cualquier proyección se mueve una semana entera según qué día la mires,
y una fecha que baila así se lee como compromiso.

**La vista de un experimento** (`?s=experimentacion&x=<clave>`) reemplaza al
índice —con un link para volver arriba a la izquierda— y trae tres cosas:

1. **Su bloque**, el mismo de siempre, a ancho completo.
2. **La curva de profundidad cortada por sus brazos**
   (`game_queries.curva_por_brazo`), sobre la población del experimento entero y
   no sobre la camada de la semana. Va **en personas y no en porcentaje**: cuando
   el tratamiento toca la entrada los brazos arrancan desde alturas distintas, y
   dos curvas normalizadas se ven más diferentes justo cuando menos lo son. Es
   lo que pasó con `dx-puerta-1` —en porcentaje el brazo ganador parecía peor, y
   en personas se ve que trajo 71 y perdió 68 de ellas en un paso—. Los
   experimentos que sortean GRUPOS no la tienen, y la sección lo dice.
3. **Los guardarraíles declarados** (`guardarrailes`): las mismas secciones que
   viven en otras pestañas y son de ese experimento — la profundidad para los de
   la puerta, el motor y la calibración para `dx-elo-1`, el embudo del cafecito
   para `dx-muro-1`. Se traen sin recortar, así que si dijeran otra cosa que en su
   pestaña, una de las dos estaría mintiendo.

Las secciones prestadas traen el número que les toca EN SU PESTAÑA, así que se
renumeran al pegarlas (`game_render._renumerar`): «1 El experimento», «2 La
curva» y de golpe «7 El motor» se lee como cuatro bloques que no cargaron.

Un experimento cerrado **no se borra del panel**: conserva sus números, con el
veredicto, la fecha y el **motivo** del cierre arriba de todo, y el link a su
informe. El motivo no tiene default en `game_queries.cerrado()` a propósito: es lo
único que separa «se cerró porque llegó al n» de «se cerró porque no daba», y un
cierre sin motivo invita a la lectura cómoda. Y es la única puerta por la que un
experimento se lee sin haber llegado al n — porque el único motivo que puede parar
antes es la futilidad, que es demostrar que ningún resultado posible cambia la
conclusión.

- **Cada 3 correctas, el festejo cuenta sobre la universidad.** La XP sigue
  siendo de la persona y le suma igual; lo que cambia es sobre qué fila trepa el
  número y adónde vuelan los orbes. Ver `vuelta-universitaria.ts` y
  `context/gamification.md`.
- **El ranking se filtra por universidad y por nada más.** La cabecera es la
  misma que la de Intervalo (`components/leaderboard-chrome.tsx`), pero la caja
  de carrera está apagada acá: son cinco carreras contra veintipico de
  universidades, y lo que la gente busca recortar es su universidad. Al acertar
  el ranking vuelve solo al individual y suelta el filtro, salvo que el filtro
  puesto sea el de la universidad propia — ahí la fila propia sigue en pantalla
  y sigue recibiendo la XP, así que sacarlo sería sacar a la persona del ranking
  en el que estaba compitiendo.
- **El @ se asigna y después se elige.** Quien entra sin cuenta arranca con un
  @ autogenerado (`game/aliases.py`): `casifinal`, `triplechoripan`,
  `goldenmedialuna` — comida rioplatense y vida de cursada, sin números. El
  formato viejo era palabra-del-temario + cuatro dígitos (`modulo4124`) y hacía
  dos cosas mal: el número delataba que el nombre no lo eligió nadie, y la
  palabra venía de la materia. Un invitado puede cambiarlo **una vez gratis**;
  de ahí en más elegir el @ es el gancho del registro.
- **Elo online, no niveles fijos.** Cada jugador tiene un θ y cada plantilla una
  β; el motor sirve lo que cae en la banda p̂ ∈ [0.70, 0.80], o sea lo que
  estima que va a acertar 3 de cada 4 veces. El θ se muestra en escala de
  ajedrez (`rating = 821 + 200·θ`, `elo.RATING_BASE`) porque 1166 se lee y 0.83
  no. La base bajó de 1000 a 821 al re-anclar la escala de β: sin compensarla,
  el mismo jugador habría amanecido con 180 puntos más sin haber jugado.
- **Rampa de arranque.** Los tres primeros ejercicios son fijos (x, x², 2x²) y
  hasta la quinta respuesta el tier disponible crece de a uno, para que el juego
  no abra con una exponencial por cómo haya caído el Elo.
- **Antes de repetir, se afloja la dificultad.** No se sirve ninguna de las
  últimas 8 plantillas (`generator._RECENT_EXCLUDE`), y cuando esa exclusión
  deja la banda objetivo vacía se sirve **lo más cercano a 0,75** entre lo no
  vetado, con un desempate al azar entre lo que quede a menos de
  `_CASI_EMPATE` = 0,02 de p̂. Recién si no queda nada se acorta la ventana, de
  8 a 4 a 2 a 0 (`_VENTANAS`). El criterio: una derivada un poco mal calibrada
  se nota menos que la cuarta vez de la misma.

  Hubo una versión con tres bandas que se ensanchaban (`_BANDAS`: 0,70-0,80 →
  0,55-0,92 → 0,35-0,98) y estuvo mal: la segunda banda era tan ancha que
  agarraba a la vez plantillas difíciles y fáciles, y el sorteo uniforme entre
  ellas diluía hacia lo fácil porque hay más plantillas de tier bajo. A un
  jugador fuerte el motor le servía MÁS fácil a igual θ. Se borró.

  La ventana estuvo en 3 y fabricaba un ciclo de 4: la banda tiene entre 3 y 8
  plantillas, restarle 3 dejaba a menudo UNA sola candidata legal, y las tres
  ramas de rescate devolvían en silencio lo recién visto. Medido en producción
  sobre 7.838 ejercicios, la repetición de enunciado era del 2,4% en los
  primeros diez, 50,1% entre el 26 y el 50 y 77,5% del 51 en adelante.
- **Cada plantilla tiene coeficientes, y no es decoración.** Ocho eran una sola
  expresión —`sen(x)/x` se sirvió 626 veces siendo siempre literalmente la
  misma— y como el motor cicla entre cuatro o cinco plantillas, una plantilla de
  una variante es una derivada que vuelve textual. `CyclingRandom`
  (`game/cycler.py`) agota el rango de cada ranura antes de repetir un valor.
- **La β se ancla a la semilla de su tier** (`elo.effective_beta`), pesada en
  PERSONAS distintas y no en respuestas. Sin ese ancla un motor adaptativo se
  autoengaña: lo difícil solo se le sirve a quien va bien, así que lo difícil
  solo recibe evidencia de quien va bien y termina pareciendo fácil.
- **La regla de la cadena son los tiers 6, 7 y 8** (`templates.py`, 15
  plantillas, semillas 1,4 / 2,0 / 2,6). Estaban reservados desde v1 y se
  cobraron en 2026-09 porque el banco se había quedado sin techo: con
  `sen(x)/x` (β creída +0,80) como lo más duro, desde θ = 2,50 no había NADA en
  banda, y las 35 personas que estaban ahí arriba generaban el **55% de las
  21.059 derivadas servidas**. El motor no fallaba estimando: fallaba por falta
  de inventario, que se arregla escribiendo derivadas y no tocando el
  estimador.

  Los tres tiers comparten UNA regla; lo que cambia es el interior. T6 es
  `f(ax+b)` con `a ≥ 2` —con `a = 1` la derivada de adentro es 1 y la plantilla
  deja de enseñar lo único que vino a enseñar—, T7 mete un polinomio adentro, y
  T8 anida dos trascendentes (`e^{k·sen x}`) o mete la cadena adentro de un
  producto o un cociente. El techo nuevo es **θ ≤ 4,25** contra un máximo
  observado de 4,56, y `check_game_techo.py` lo fija en vez de dejar que se
  redescubra leyendo un PDF. Medido el día del deploy: los jugadores sin nada
  en banda pasaron de **66 a 2**.

- **El último cinturón subió de θ 2,2 a 3,7** (`elo._LEVEL_CUTS`) en el mismo
  cambio, y **esta vez bajó gente**: contado en producción el 19/09, de los 89
  marrones quedaron 19, o sea **70 personas pasaron a violeta**. A cambio, los
  que no recibían nada en banda pasaron de 66 a 2 sobre 1.058 con historial. El cinturón de arriba significa «llegaste a lo más difícil
  que el juego tiene», y con los tiers nuevos eso dejaba de ser cierto a 2,2.
  La caída es silenciosa —el feed solo publica subidas de nivel— pero el color
  del nombre cambia a la vista de todos. Los otros dos cortes no se tocaron.

- **Piso de Elo por plantilla** (`templates.PISO_TRIGONOMETRICAS`, hoy 1200).
  Es el único criterio de la lista que NO es adaptativo, y por eso existe: el
  ancla frena que una β se desboque pero no la revierte, y las trigonométricas
  se habían desplomado hasta servirse desde 760 de rating. Un piso dice «esto
  no antes de acá» aunque el motor crea lo contrario; pasada la barrera vuelven
  a competir por la banda como cualquier otra. El panel de la tecla `p` muestra
  el piso como Elo de desbloqueo de la fila, así que la promesa de la pantalla y
  lo que el generador hace son el mismo número.
- **Y cada tanto se le pregunta** (`game/opinion.py`). Todo lo de arriba el motor
  lo mide; esto es lo que averigua preguntando. Desde la derivada 28 aparece una
  diapo con tres opciones —😴 muy fáciles / 👌 justas / 🤯 muy difíciles— y vuelve
  con huecos que crecen: 10, 10, 20, 30, 50, 80 y de ahí siempre 80
  (`opinion-trigger.ts :: OPINION_CADENCIAS`). Son los mismos tres valores que el
  canal A de la micro-encuesta de Intervalo, para que los dos productos se puedan
  cruzar sin traducir.

  **No tiene tope de apariciones, y lo que la corta es el silencio**: tres
  salteos seguidos y deja de salir, y una respuesta borra la racha. Hasta el
  24/09 volvía cada 30 y se terminaba a las tres veces; el cambio salió de
  medirla —91,8% de respuesta sobre 437 impresiones, más que cualquier otra cosa
  que el juego pregunte— y de notar que el tope se apagaba justo para los
  jugadores pesados, que son los que más tienen para decir.

  El voto **ajusta el θ de quien lo emite**, y ahí está lo que hay que entender:
  el voto elige el signo y la evidencia elige el tamaño. Sobre hasta 20
  respuestas de primer intento sin tabla se calcula un paso de Newton encogido
  —`Δθ = Σ(acertó − p̂) / (SCALE·Σp̂(1−p̂) + I₀)`— y se aplica solo si va para el
  mismo lado que el voto, con tope de un tier (0,60) y una banda muerta de 0,15
  abajo. Quien dice «muy fácil» sin estarle ganando al motor no se mueve: el
  color del ranking se sigue ganando resolviendo, y el ajuste solo lo acredita
  antes.

  **«Hasta 20» y no «las últimas 20»**, y esa palabra es la que permite preguntar
  cada diez. La ventana arranca en el último voto que cobró
  (`game_difficulty_votes.corte_ejercicio_id`), así que lo ya cobrado no se cobra
  de nuevo. Con un hueco de diez entran diez respuestas y el ajuste sale unas
  seis décimas del que saldría con veinte, porque el encogimiento de `I₀` pesa
  más cuando hay menos evidencia: una ventana más corta compra una corrección más
  chica, sin ninguna constante nueva. Y votar dos veces sin resolver nada en el
  medio da cero, que es de paso el primer freno de servidor que tuvo este
  endpoint —el tope de tres vivía solo en `localStorage`.

  No inventa una creencia. El paso de θ decae con la experiencia (a las 100
  respuestas vale 0,025 por acierto), así que a un veterano subvaluado el motor
  tarda decenas de respuestas en encontrarlo; esto aplica de una la corrección
  que iba a hacer igual. Medido el 2026-09-13 sobre 15.106 primeras respuestas:
  el motor promete 0,87 y la gente entrega 0,92, o sea 0,66 de θ — un tier
  entero de subvaluación.

  Lo que el ajuste NO puede arreglar es el techo del catálogo: subir θ mueve el
  color pero no el ejercicio si no hay ejercicio más difícil. Cuando esto se
  escribió la β creída más alta era 0,654 y el techo caía en θ ≈ 2,35; con la
  regla de la cadena adentro (ver más abajo) el techo pasó a θ ≈ 4,25.

- **Y la otra mitad de la escalera: si le salen repetidas**
  (`game/repetitividad.py`). 🎲 bien variadas / 👌 está bien así / 🔁 muy
  repetidas, alternando el turno con la de dificultad y entrando recién en el
  cuarto —a la 28-48 la repetición todavía no pasó: medida antes del arreglo del
  10/09 era del 2,4% en las primeras diez contra el 77,5% del ejercicio 51 en
  adelante.

  **Este voto no mueve nada**, y lo que lo hace útil es lo que viaja al lado:
  cuántas plantillas y cuántos enunciados distintos venía viendo en sus últimas
  30 derivadas, congelados en la fila. Sin eso, dificultad y repetitividad se
  mueven juntas y no hay manera de saber cuál arrastra a cuál —cuando el
  catálogo se queda sin tiers el selector repite, y cuando repite la derivada se
  siente fácil.

  **Los dos contadores miden cosas distintas y se guardan los dos**: ocho
  plantillas pueden ser ocho veces el mismo enunciado, que es exactamente el bug
  del 10/09 (`sen(x)/x` servida 626 veces y siempre la misma expresión). La
  ventana además cuenta TODO lo servido, salteados y mirados con la tabla
  incluidos, al revés que la de dificultad: lo que se mide acá es lo que la
  persona vio, y saltear es la reacción más probable a la cuarta vez de la misma.

  Existe porque el tema aparecía solo: cinco de las 109 respuestas a la varita
  hablan de repetición sin que se les pregunte, y las cinco son de jugadores
  pesados (76, 325, 356, 374 y 583 derivadas). El panel lo lee contra
  `generator._RECENT_EXCLUDE`: si quien vota «repetitivo» venía viendo casi
  tantos enunciados distintos como el largo de la ventana, el problema es que el
  banco es chico; si venía viendo pocos, la exclusión se está quedando corta.

### La pantalla de arranque cuenta lo que pasó (desde el 27/09)

La puerta dejó de decir *«Resolvé la siguiente derivada para comenzar a jugar»*
—nueve palabras que no informaban nada— y pasa a contar qué pasó mientras la
persona no estaba. `PuertaMinima` sigue siendo un solo componente y por eso el
cambio entra igual en teléfono y en escritorio.

**No es un sistema de eventos nuevo: es un digest del feed que ya corría.** Los
hechos salen de `game_events` y de cuatro agregaciones, y se escriben con la
convención del feed —oración con huecos (`{a}`, `{u0}`), punto final, y el emoji
aparte—. El renderer es literalmente el mismo: `texto-con-huecos.tsx`, extraído
de `event-feed.tsx` cuando pasó a tener dos consumidores.

#### Las tres ramas las decide `correct_today`, no un reloj

| | cuándo | qué dice |
|---|---|---|
| `sigue` | `correct_today > 0` | «¡Hola, @x!» · *Hoy ya resolviste N derivadas* · ¿Seguimos? |
| `vuelve` | ya jugó, hoy no | «¡Bienvenido, @x!» · hasta 3, con *Llevás N derivadas resueltas* siempre entre ellas · ¿Seguimos? |
| `primera` | nunca resolvió nada | «¡Bienvenido!» · qué es el juego · hasta 3 · *Resolvé la siguiente derivada para comenzar.* |

**Las tres cierran invitando, y dos de las tres no lo hacían.** `vuelve`
terminaba en la última novedad —tres hechos sobre los demás y nada que llamara a
la persona— y `primera` se había llevado puesta la única instrucción que el juego
da, justo para quien nunca resolvió nada: el digest REEMPLAZA al texto de
siempre, así que al estrenarse se la comió. Hoy `vuelve` cierra con la misma
pregunta que `sigue` y `primera` con la instrucción de siempre.

**Y `vuelve` dice algo sobre la persona.** Sus candidatas hablaban todas del
mundo. `_n_mio` suma lo
acumulado (`exercises_correct`), no lo de hoy —que en esa rama es cero por
definición— y no el puesto —que pudo BAJAR mientras no estaba, y esta pantalla no
señala pérdidas—.

**Los encabezados ya no se dibujan.** *Mientras no estabas* y *Lo que está
pasando* siguen viajando en `GameBienvenidaOut.titulo` y desde el 02/10 no los
muestra nadie: las novedades pasaron a una caja con borde, y el rótulo encima
repetía lo que el borde ya dice gastando un renglón en la pantalla más apretada
del juego.

Se probó con un umbral de horas y no cierra: con «menos de un día», quien jugó
ayer a las 23 y vuelve hoy a las 8 lleva nueve horas afuera y **cero derivadas
hoy**, y «hoy ya resolviste 0» es un renglón roto. Ramificando por el contador la
frase no puede decir cero, el corte es la medianoche argentina que el juego ya usa
para el tope, y un solo booleano decide saludo, encabezado y cantidad de renglones.

#### Qué renglones hay, y los conteos nombran su período

Hasta tres, por prioridad. El tono es impersonal y de hecho consumado —«se
resolvieron», «llegaron»—, no de comunidad: no hay «ya somos» ni totales
acumulados. **Los renglones van sin punto final** (03/10): cada uno lo cierra su
emoji, y el texto del feed que se reusa llega con el punto ya sacado y con la
XP pasada al hueco `{xp:N}` («por 1.200 XP» → el número con su ícono). Un podio
de universidad (`uni_top`) lleva a su protagonista como `{a}`; si la frase
nombra a un segundo, va escrito en el texto.

| rama | renglón | cuándo sale |
|---|---|---|
| `vuelve` | *Tus N reclutas te dejaron X* + ícono de XP (hueco `{xp:N}`) 🪖 | XP nueva de reclutas desde el último digest |
| `vuelve` | *Llevás N derivadas resueltas* 💪 | siempre |
| `vuelve` | el último movimiento de su universidad, con la frase del feed | si pasó desde el último digest (a lo sumo 14 días) |
| las dos | *Hoy / Esta semana / Este mes llegaron N estudiantes* 🎓 | ver abajo |
| `primera` | *La UTN va 3ª en el ranking* 🏆 | universidad conocida, con tabla de al menos tres |
| las dos | *Se resolvieron N derivadas hoy / esta semana / este mes* 🧩 | ver abajo |

Hay dos clases de hecho:

- **evento** (pasó o no pasó) — los reclutas te dejaron XP, tu universidad superó
  a otra. Ventana desde el último digest, **sin mínimo**: 6.644 XP son 6.644 XP.
- **conteo** (es un número) — estudiantes que llegaron, derivadas resueltas.
  **Siempre con su período dicho en la oración**, y es el más corto en el que el
  número llega a `MIN_CONTEO` (5): hoy, si no la semana, si no el mes. Si no
  llega ni en el mes, el renglón no sale. «Esta semana» son los últimos siete
  días y «este mes» los últimos treinta, no los del calendario: el día 2 el mes
  del calendario diría menos que la semana.

Medido el 27/09: en 24 h entraron **8 personas en todo el juego** (UBA 3, UTN 3,
UNC 1, UNLP 1) contra 108/97/69/55 en la semana. Sin la escalera, el renglón
diría «hoy llegó 1 estudiante» casi siempre, que es peor que el silencio.

**Cada período se usa una vez por pantalla** (03/10). Dos renglones seguidos con
«hoy» repiten la palabra y cuentan el mismo día dos veces. El conteo de más
arriba (las llegadas) elige primero; el de derivadas saltea el período que ese
ya usó: «Hoy llegaron 7 estudiantes» + «Se resolvieron 412 derivadas esta
semana». Saltea ese y nada más: si las llegadas quedaron en la semana, las
derivadas pueden ser las de hoy. Si al segundo no le queda ningún período que
llegue al mínimo, no sale.

**Las llegadas cuentan el juego entero, sin sigla.** Con la universidad, el
renglón no entraba en una línea de la caja y quedaba pegado al del puesto, dos
seguidos nombrando a la misma universidad. La sigla la lleva solo el del puesto.
Quien lee no se cuenta entre los que llegaron, y los sembrados tampoco.

**Lo que se sacó el 02/10**, para que no vuelva por descuido: el total por
universidad («Ya hay N personas de la UTN jugando»), el total del juego («Ya
somos N en M universidades»), «La última persona se sumó hace N minutos», el
tamaño de la tabla en el renglón del puesto («va 3ª de 8»), y las ventanas
«desde tu última visita» y «mientras tanto» de los conteos.

#### `digest_seen_at` existe porque `last_seen_at` no sirve

`last_seen_at` se pisa **durante** la sesión —la tocan `/next`, `/answer`,
`/skip` y el generador—, así que para cuando la pantalla se dibuja ya vale
«ahora» y la ventana saldría vacía siempre. El síntoma sería «la pantalla no
cuenta nada», que se ve idéntico a «no pasó nada» y por eso nadie lo reporta.

La marca avanza cuando el digest **se sirve**, no cuando se toca «¡Vamos!»: una
pantalla que se mostró ya se contó, y esperar haría que quien cierra la pestaña
reciba mañana la misma novedad. Repetir una novedad es peor que perderla.
`referral_xp_digest_seen` es el tercer canal del mismo mecanismo, al lado de los
de push y mail: ninguno puede enterarse por el otro.

#### La universidad de quien llega por primera vez sale del link

El **76,8%** de los jugadores aterriza con un `?g=<grupo>`, y de esos el **100%**
tiene el grupo en `game_groups` con su universidad. O sea que para tres de cada
cuatro sabemos de dónde son antes de que la carguen — y solo el 37% la carga
alguna vez. Se usa **solo para elegir de quién hablarle**; no se le asigna nada.

#### Lo que esto le debe al experimento de la puerta

`dx-puerta-1` ganó **+25,0 pp** vaciando esta pantalla, así que devolverle
contenido no es gratis y hay que decirlo. Tres cosas acotan el riesgo:

1. **La pantalla ya existía y ya tenía su botón.** No se agrega un paso; se
   cambia qué dice un texto que igual había que leer.
2. **Hay un texto de respaldo**, y no es el caso raro: si el pedido falla, o
   tarda más de 2,5 s (`ESPERA_MAX_MS`), la puerta dice «¡Bienvenido!», la
   oración de qué es el juego y la instrucción. Mientras el pedido viaja el
   lugar queda reservado sin pintarse, para que no se lea una cosa y medio
   segundo después otra; si falla, el respaldo sale en el acto; y si la
   respuesta llega tarde, reemplaza al respaldo igual. Lo peor que puede pasar
   es que no cuente nada.
3. **Nada que le saque algo a la persona** —«te pasaron 3 puestos», «se te cayó
   la racha»— en la rama `sigue`. Esta pantalla se ve en CADA arranque: un
   renglón que señala una pérdida funciona una vez y a la quinta es el motivo por
   el que no se vuelve.

Salió **sin brazo de control**, que es la decisión de producto que hay que tener
a la vista al leer la activación de las próximas semanas: cualquier movimiento va
a estar mezclado con la variación de las olas de difusión, y separarlos va a
requerir cruzar contra el clickrate en vez de leer una diferencia entre brazos.

### `dx-elo-1`: la velocidad del Elo (desde el 19/09)

**El primer experimento del juego que no toca una pantalla.** Los dos brazos ven
exactamente lo mismo; lo único distinto es a qué velocidad se mueve un número.

El paso con el que cada respuesta corrige θ decae con la experiencia y no tiene
piso, así que el rating deja de moverse justo para los que más juegan. Medido el
19/09 sobre los 7 días previos, leyendo el `theta_at_serve` de cada ejercicio
servido:

| experiencia | gente | ej. en 7d | Δrating | **rating por ejercicio** | paso |
|---|---|---|---|---|---|
| < 25 respuestas | 52 | 24 | +118 | **4,92** | 0,348 |
| 25-99 | 101 | 52 | +239 | **4,57** | 0,203 |
| 100-399 | 38 | 163 | +449 | **2,75** | 0,070 |
| 400+ | 14 | 724 | +511 | **0,71** | 0,016 |

Siete veces menos por el mismo trabajo. Y el grupo congelado no es un rincón: 68
personas, el 3% de los jugadores, que ponen el **65% de las derivadas servidas**.

El brazo `rapido` le pone un **piso de 0,20** al paso. Tres decisiones de diseño
que hacen que esto se pueda correr y leer:

- **Muerde recién en la respuesta 43**, que es donde el paso natural cae hasta
  0,20. El número se calcula con `elo.n_donde_muerde`, no se escribe. Abajo de
  ahí los dos brazos son **bit a bit el mismo motor**, y por eso esto puede
  correr al mismo tiempo que `dx-puerta-2`, que mide las tres primeras
  correctas. Bajar `_B_USER` —el otro camino al mismo efecto— habría acelerado
  desde la respuesta 1 y contaminado el experimento que ya estaba en la calle.
- **El sorteo es del lado del servidor y no se guarda**: sale de un hash del
  `player.id` (`game/sorteo.py`). `game_players.variant` se escribe al crear la
  fila, y todos los elegibles existen desde hace semanas, así que con el sorteo
  de siempre este experimento habría medido a cero personas para siempre. El
  motivo de aquella regla —no meter a alguien que ya vio la pantalla del
  control— no aplica acá: no hay pantalla, y el resultado se mide hacia adelante.
- **El piso va solo del lado del jugador.** `game_template_stats` es una sola
  tabla para los dos brazos, así que tocar el paso de la β haría que el brazo
  test le moviera la dificultad al control. θ vive en la fila del jugador y es lo
  único que se puede repartir.

**La métrica es continua y eso no es una preferencia, es la única salida.** Con
139 elegibles, cualquier proporción pediría ~600 por brazo y no se podría leer
nunca. Se mide **días activos en 14 días**, base medida 2,70 ± 2,02 sobre los
propios elegibles, efecto mínimo **1 día** → **65 por brazo**. No se usó la
quincena anterior como covariable porque está vacía (0,13 días) — para esta
gente el producto tiene doce días de vida.

**La inscripción es rodante, y ahí se jugó que esto se pueda leer o no.** La
primera versión congelaba la cohorte el día del despliegue: los 139 que ya
estaban arriba del umbral, y nadie más. El hash los reparte **80/59**, así que
el brazo chico se quedaba en 59 contra 65 **para siempre** — ninguna espera lo
arreglaba, porque los que cruzaran después no entraban. Un experimento así no da
un resultado malo; da un panel que dice «faltan 6» hasta el fin de los tiempos.
Con inscripción rodante cada uno entra el día que llega a las 43 y su ventana
corre desde ahí, así que los 46 que hoy están entre 30 y 42 respuestas llegan
solos y el desbalance se lava con ellos. El control se lee el 03/10; `rapido`,
unas dos semanas después.

El costo de la cohorte rodante, dicho en voz alta: la base de 2,70 se midió sobre
gente que ya estaba bien arriba del umbral, y los que entren de acá en más entran
justo al cruzarlo. Si un recién llegado a las 43 respuestas juega distinto que
alguien con 300, las dos medias se mueven — pero se mueven **en los dos brazos
por igual**, porque el sorteo es independiente de cuándo entró cada uno.

Un día entero sobre una base de 2,70 es un +37%, y es mucho. Se declara igual
porque es **lo que se puede ver**: pedirle medio día serían 257 por brazo. Si el
efecto real es de medio día, este experimento lo va a dejar pasar, y eso está
escrito de antemano en vez de descubierto después.

Los guardarraíles, que se miran desde el primer día:

- **% de salteo.** Se espera que SUBA, y eso es parte de la hipótesis: el castigo
  por saltear es plano (0,15 θ), así que medido en aciertos el botón cuesta 1,7
  respuestas correctas para un novato y 37,5 para un veterano — el uso sigue al
  precio casi perfecto (10,9% abajo, 0,25% arriba). Con el piso, al veterano le
  vuelve a costar ~3. Lo que importa es que no se dispare.
- **Calibración** (acierto real menos el p̂ prometido). Si el brazo con piso se
  pasa de largo, ese número se va a negativo: significa que le está sirviendo a
  la gente cosas más difíciles de lo que el motor cree.

El riesgo conocido: el desvío estacionario de θ es `0,783·√paso`, o sea 20 puntos
de rating hoy y 70 con el piso. Ese temblor ES el efecto buscado, pero a quien
esté parado justo en un corte de nivel se le va a prender y apagar el color — y
el corte de 3,7 acaba de dejar a 70 personas ahí cerca.

### `dx-banda-1`: a qué dificultad apuntamos (28/09 → cancelado el 09/10)

**Cancelado sin leerse.** Desde el 09/10 todos apuntan a la banda de siempre y
el motor no sortea; el panel lo muestra con el estado «Cancelado» —el cuarto,
después de Activo, Pausado y Finalizado— con el motivo en la caja y la tabla de
lo que se juntó, sin contraste ni informe. La razón no fue el resultado sino
que la dificultad se va a elegir de otra forma, y medir la banda sobre un
selector que está por cambiar no decide nada. Lo que era:

Dos brazos sorteados por hash del id en el servidor (`game/banda.py`), sin
columna: `control` con la banda de siempre (p̂ 0,70–0,80) y `exigente` corrida un
ancho entero hacia abajo (0,58–0,72). Entra quien se creó el 28/09 o después,
desde su primer ejercicio — la banda gobierna cada elección de plantilla, así
que a quien ya venía jugando le cambiaría a mitad de camino.

Es el primer experimento del juego cuya métrica es **lo que la gente dice** y no
lo que hace: la fracción del primer voto de dificultad que contesta «muy fácil».
Un motor puede estar perfectamente calibrado y sentirse plano igual, y la
profundidad no lo distingue — sube tanto con un juego bien graduado como con uno
fácil y entretenido.

Corre encima de la recalibración del 27/09 (ver `context/gamification.md`), que
ya sirvió unos diez puntos más difícil para todos. La predicción escrita de
antemano es que este contraste salga MÁS CHICO que aquella diferencia
antes/después.

### La flecha del ranking: lo subido hoy (`game/simulation.py`)

Al lado de cada fila del ranking individual por XP, una flecha verde o naranja
con un número: **cuántos puestos subió o bajó hoy**. Es el puesto con el que
empezó el día menos el de ahora.

- **Una foto por día.** El primer tick posterior a la medianoche de Buenos Aires
  escribe el puesto de todos en `game_players.rank_snapshot`, en una sola
  sentencia. No hay tabla nueva ni historial: solo la foto de hoy.
- **Quien entra al ranking hoy arranca de abajo de todo.** No tiene foto —a la
  medianoche no había resuelto nada—, así que su referencia es el último puesto.
  La flecha cuenta desde su primera derivada, que es cuando más puestos se
  suben: la cola del ranking es densa, y el primer acierto ya pasa a cientos.
- **Se apaga a la medianoche** y vuelve a contar de cero.
- **Sin flecha** en el orden por Elo y con un filtro de universidad o carrera:
  la foto es del ranking entero por XP, y contra el puesto de otra tabla la
  resta no es el movimiento de nadie.

Hasta el 05/10 medía otra cosa —lo movido en los últimos 2,5 a 5 minutos, con
dos fotos que se corrían cada 150 s— y se cambió por un caso real: alguien subió
unos 875 puestos en su primera tanda y la flecha decía ↑136. Olvidaba a los
cinco minutos, y no empezaba a contar hasta la primera foto posterior al primer
acierto. De paso numeraba a los de `xp > 0` cuando el ranking muestra a los de
`exercises_correct > 0`. La versión de ahora además escribe menos: un UPDATE de
la tabla por día en vez de uno cada dos minutos y medio.

### El feed de eventos (`game/events.py`)

La lista que corre debajo del CTA, y que en el panel del chat se intercala con lo
que escribe la gente: es **una sola columna**, así que cada línea de más del
sistema es un mensaje de una persona que se pierde. Es solo del sistema —ninguna
línea la escribe un usuario, así que no hay nada que moderar— y todo el diseño
está puesto en que no sea ruido. Nueve tipos:

| tipo | qué anuncia |
|---|---|
| `top` 🪜 | entrar al top 3, 10, 25 o 50 del ranking general |
| `uni_top` 🏆 | ser el número 1, o entrar al top 3, de la propia universidad — **solo lo ve esa universidad** |
| `lead` 👑 | llegar al puesto 1 del juego entero |
| `streak` 🔥 | rachas de 10, 25, 50, 100 y 250 sin errar |
| `level` 🎨 | desbloquear la familia siguiente, **de nivel 2 para arriba** (los productos, los cocientes) |
| `welcome` 👋 | alguien nuevo cargó su universidad, y la línea la nombra |
| `signup` 🎓 / `referral` 🪖 | un registro, o el registro de alguien que trajo otro |
| `boost` ☕ | una donación de cafecitos, o el aforo del día de una universidad |
| `uni_pass` 🏛️ / `uni_close` 👀 | una universidad que pasa a otra en experiencia, o que se le viene encima |

**`welcome` reemplazó al desbloqueo de nivel 1**, y es la segunda vez que el feed
se inunda por lo mismo. Medido el 14/09 sobre 24 h de producción: **57 de 74
eventos eran `level`, y los 57 eran de nivel 1** — tres de cada cuatro líneas
decían que alguien había desbloqueado las sumas, que es lo que le pasa a
cualquiera en sus primeras derivadas. De nivel 2 no hubo ninguno.

No era la primera advertencia: el comentario de `events_copy._NIVEL` ya anotaba
«110 de 122 en una semana fueron al nivel 1». Aquella vez se arregló lo que la
línea DECÍA —antes los tres niveles compartían la misma frase— y no cuántas
eran. El evento sobrevive porque desbloquear los productos o los cocientes sigue
siendo noticia, y con los tiers 6-8 ya hay más para contar.

En su lugar el feed **saluda a quien llega**. Ese saludo ya se movió una vez y
conviene leer las dos posiciones juntas, porque la segunda arregla lo que la
primera no había visto.

Primero salió con la **primera derivada resuelta** y no al entrar: hasta ahí el
alias es el generado al azar, y de 149 altas por día solo 80 resuelven una. Eso
arreglaba a quién se saludaba, pero dejaba la línea sin nada que decir: la
universidad se pregunta recién en la tercera derivada (`HITO_PERFIL`), así que
cuando el saludo salía todavía no había ninguna. **Medido sobre 314 saludos de
una semana: 5 nombraban una universidad.** Las otras 309 eran «@fulano arrancó a
derivar» y ahí se terminaban, entre 45 y 116 por día.

Desde el 17/09 sale cuando la persona **carga su universidad** (`on_universidad`,
llamado desde el PATCH del perfil) y la línea la nombra: «@fulano se sumó a las
filas de la UTN». El corte de volumen es chico —**56 por día contra 73**, porque
casi todo el que resuelve una termina cargando universidad— y no es el punto: el
punto es que ahora cada línea suma a alguien a un bando, que es de lo que el
resto del feed habla.

Sigue siendo la línea más frecuente y por eso la más débil de todas
(`FUERZA_WELCOME`). Dentro de su emisor no compite con nada —es el único
candidato— pero pierde contra cualquier cosa que la persona haya hecho en los
últimos `COOLDOWN_PERSONA_MINUTES`: quien carga la universidad justo después de
entrar al top 50 ya tuvo su línea, y esa es la que vale.

**`top` y `uni_top` reemplazaron a la escalada por puestos** («@fulano pasó a 17
personas de una»), que era **el 83% del feed**: 609 de 731 eventos en un día de
producción, y 33 de las últimas 40 líneas —la primera pantalla entera—
cubriendo veintiocho minutos. Todo lo demás que el juego tiene para contar vivía
menos de media hora antes de quedar tapado.

El umbral viejo no estaba mal elegido, era barato por estructura: en el fondo de
la tabla la gente está amontonada, así que la mediana de una escalada eran diez
puestos y la mitad no llegaba a diez. Pasar a diez personas que tienen 20 XP no
es una hazaña. Los cortes salieron de simular la escalera contra siete días
reales: **18 eventos por día** para el ranking general y **5** para los podios de
universidad, contra los 609 de antes.

Cuatro frenos, y cada uno tapa una forma distinta de volverlo ruido:

- **Es una entrada, no un estado.** Pide `puesto_antes > corte >= puesto_después`,
  así que responder bien sentado adentro del top 10 no anuncia nada.
- **Un solo corte por respuesta**, el más alto: del puesto 150 al 40 se anuncia
  «entró al top 50» y no además «al top 100».
- **El corte tiene que existir**: hace falta que compitan por lo menos el doble
  del corte (`MULTIPLO_DEL_CORTE`), o entrar al top 50 con 51 jugadores sería
  «no sos el último». Para el podio de universidad el equivalente es un piso de
  10 jugadores —el mismo `MIN_PLAYERS_RANKED` que usa la tabla—, sin el cual
  «@fulano es el número 1 de la UNR» sale con un solo jugador en la UNR.
- **Deduplicación con ventana de 7 días**, no «una sola vez para siempre»:
  caerse del top 10 y volver tres semanas después es una noticia de verdad; el
  ping-pong de la misma tarde no. La ventana está atada a `PRUNE_DAYS` porque la
  deduplicación se resuelve mirando la tabla, y una ventana más larga que lo que
  se guarda no se cumpliría.

Los puestos los cuenta `game/ranking.py::puesto`, la misma función que usa el
endpoint de respuesta —el feed anuncia posiciones y tiene que contar exactamente
igual que la tabla o va a anunciar entradas que la tabla no muestra.

#### Una línea por persona cada veinte minutos

Los cuatro frenos de arriba miran el HECHO, y hay un ruido que ninguno puede ver:
cinco hechos distintos de la misma persona en una sesión son cinco líneas, cada
una cumpliendo su regla. Medido en producción: alguien puso 5 líneas en un día
(top 50, top 25, racha 25, racha 50, racha 100), otro 6, y entre cuatro personas
armaron **20 de los 47 eventos del día** que no eran de universidad — contra 38
mensajes de gente en el mismo rato.

Así que hay un quinto freno, y mira a la PERSONA: `COOLDOWN_PERSONA_MINUTES`
(veinte, menos de lo que dura una sesión). Dos reglas:

- **Dentro de una respuesta gana la más fuerte, no la primera.** Cada noticia
  tiene un peso (`FUERZA_*`), y la fuerza depende del corte y no del tipo: entrar
  al top 10 del juego pesa más que ser el número 1 de una universidad de doce,
  pero eso pesa más que entrar al top 50. Antes el orden lo decidía el orden en
  que estaban escritas las líneas de `on_answer`.
- **Entre respuestas, la nueva se calla** salvo que sea de las que interrumpen
  pase lo que pase (`FUERZA_INTERRUMPE`: el puntero, el top 3, la racha de 250) o
  que MEJORE lo dicho por `SALTO_PARA_MEJORAR`. Este segundo número es lo que
  frena una escalera, que por definición es creciente: con +25, de los cinco
  escalones quedan la entrada y el remate.

Callarse **no quema la clave**: la deduplicación se resuelve mirando la tabla y
la fila no llegó a existir, así que el hito sigue disponible. El registro
(`signup`/`referral`) está exento —es la única línea que dice que el juego tiene
gente nueva— pero sí ANCLA el reloj, así que «se sumó @fulano» y «@fulano entró
al top 50» treinta segundos después son una línea. `boost`, `uni_pass` y
`uni_close` tienen `player_id` en NULL y quedan fuera del mecanismo en las dos
direcciones: no son de nadie.

El puntero (`lead`) tuvo el mismo problema en su propia escala: la clave era una
POR PERSONA, así que dos que se turnan el 1 tenían dos ventanas corriendo y
ninguna veía a la otra (cinco líneas en un día por una disputa entre dos). Ahora
la clave es del HECHO —una sola, global, con tres horas de ventana— y además se
pide que el puntero nuevo no sea el mismo de la vez pasada: anunciarlo dos veces
seguidas es decir dos veces lo mismo.

#### Lo que solo ve una universidad (`KINDS_INTERNOS`)

El podio de adentro de una casa de estudios es la tabla que más se disputa —el
número 1 global lo pelean siempre los mismos, el de una universidad se lo pelea
gente que cursa junta— y es exactamente por eso que a los de afuera no les dice
nada. «@fulano destronó a @mengano en el ranking de la UNC» es una escena para
doce personas y una línea de ruido para las otras doscientas; fueron 21 en una
semana.

Así que `uni_top` es la primera noticia con audiencia: la ve quien estudia ahí y
nadie más. Quien no cargó universidad —un invitado— no ve ninguna, que es lo
correcto: no hay casa de estudios de la que le sea de puertas adentro.

Se decide por `kind` y no con una columna nueva porque acá la audiencia ES el
tipo de noticia: no existe un podio de universidad que además sea público. El día
que exista, esto se convierte en una columna y no antes.

**El filtro vive en el SQL de `recent` y no en un `if` posterior**, y eso no es
una optimización. El cliente pagina hacia atrás con `before_id`, y una página más
corta que el `limit` pedido significa «no hay más atrás» (el endpoint no manda un
`has_more` a propósito). Filtrando después de traer las filas, una tanda de
podios internos le cortaría el scroll a quien no es de esa universidad.

Y como la escena tiene dos personas, la línea nombra a las dos: quien queda
SEGUNDO en la universidad es exactamente quien tenía el número 1, porque una
respuesta mueve a una persona sola. El mismo razonamiento que `lead`, un piso
más abajo, y con la misma salvedad — solo se nombra si es alguien de verdad.

#### La carrera entre universidades

`uni_pass` y `uni_close` corren sobre la **experiencia histórica**: la misma suma
que muestra la tabla del juego (`sum(GamePlayer.xp)` de quien resolvió acá), y
solo entre las universidades que la tabla muestra arriba —las que pasan el piso
de calificados—.

Fue el aviso más ruidoso que el feed llegó a tener: **43 líneas en 54 horas
contra UN sobrepaso real**, y encima narrando una carrera invisible. Corría sobre
la XP de la SEMANA, que no aparece en ninguna pantalla, así que la UNSAM podía
encabezar las dos vistas que existen —82.296 de experiencia contra 76.116 de la
UNC, y 1063 de Elo contra 1037— mientras el feed anunciaba que estaba a nada de
pasarla. Un aviso que contradice la pantalla no se lee como un matiz.

Que la experiencia histórica se mueva despacio no es un defecto: fue el argumento
para irse a la semana —«la acumulada no cambia nunca»— y es justo al revés, es lo
que hace que un sobrepaso SEA una noticia en vez del temblor de una métrica que
oscila.

Las dos noticias son **transiciones** y no estados:

- **El sobrepaso** sale cuando cambia el líder CONFIRMADO de un par, y confirmado
  quiere decir adelante por más de `UNI_PASS_MARGEN` (2%). Guardar el líder por
  PAR es lo que hace que el sobrepaso exista: detectándolo por el orden, un cruce
  ajustado no se anunciaba tarde sino nunca, porque en el barrido del cruce el
  margen es cero y en el siguiente el orden ya coincidía con la foto.
- **«está a nada de pasar a»** sale cuando un par ENTRA en la banda de disputa
  (`UNI_CLOSE_RATIO`, el mismo 2% — la banda es exactamente la zona donde el
  sobrepaso todavía no se puede afirmar), y no vuelve a salir hasta que primero
  se separen más de `UNI_CLOSE_SALIDA` (5%). Sin esos dos umbrales, un par parado
  en el 2,0% entra y sale con cada barrido.

La clave de deduplicación es del **par no ordenado**: «la UNC viene atrás de la
UNSAM» y «la UNSAM viene atrás de la UNC» son el mismo hecho. Era direccional, o
sea dos claves por par corriendo sus ventanas en paralelo — una línea cada quince
minutos mientras durara, que es de donde salieron las 43.

La foto anterior vive en `game_sim_state.uni_order_json` y guarda el orden, el
líder de cada par y los pares pegados. Un par que aparece por primera vez se
anota sin anunciar; con la foto en el formato viejo tampoco se anuncia nada, para
que un deploy no dispare una ráfaga de sobrepasos que nunca ocurrieron.

#### Cómo está escrita cada línea (`game/events_copy.py`)

El ruido no es la única forma de que un feed se deje de leer. Medido después de
que los frenos de arriba bajaran el volumen a la mitad: **74 líneas en 48 horas,
escritas con DIEZ frases**. La de subir de nivel salió idéntica dieciocho veces
—«@fulano desbloqueó derivadas más difíciles»— y las trece de racha se
diferenciaban en un número. Un feed que se repite así se vuelve papel pintado.

Cada noticia tiene un **pool de frases** (69 en total) y la variante la elige una
semilla, que es la clave del hecho. Determinístico y no `random`, por tres
motivos y el tercero es el que importa: el mismo hecho re-emitido no puede salir
redactado de dos maneras; el check queda reproducible; y `random` repite la
variante anterior una de cada N veces, cuando lo que se busca no es azar sino que
dos líneas SEGUIDAS no se parezcan.

**La forma es fija: sujeto — verbo — objeto, una sola oración, sin remate.**
Quién lo hizo, qué hizo, a quién o a qué. No es preferencia de estilo: es lo que
hace que la columna se pueda barrer con el ojo, y son treinta y siete líneas por
día intercaladas con el chat. De ahí salen tres reglas, las tres con chequeo:

- **Nada de frases dadas vuelta** («Puntero nuevo: {a}», «Se picó: 1.200 XP entre
  A y B», «Llegó {a}»): dicen lo mismo que su versión derecha y no se leen más
  rápido. El check exige que cada frase abra con su sujeto — el marcador del
  protagonista, o el artículo de la universidad en mayúscula.
- **Ni un punto en el medio.** Lo que no entra antes del punto final no entra. Lo
  que se cayó por esto fueron los remates que opinaban sobre el hecho recién
  contado: «Alguien avise si respira», «Ahora se complica», «No estuvo cerca».
- **La variedad va en el VERBO**, que es donde no cuesta legibilidad: superó,
  dejó atrás, le serruchó el piso; encadenó, clavó, enganchó.

Ninguna línea pasa los 80 caracteres medida con el alias más largo que hay en
producción.

Y las frases dicen lo que la versión de una sola no decía, en los cinco casos con
datos que ya estaban a mano:

- **`level` dice CUÁL familia se desbloqueó** —las sumas, los productos, los
  cocientes— en vez de «derivadas más difíciles». Es la línea más frecuente del
  feed (110 de 122 en una semana son al nivel 1) y ahora son tres palabras:
  «@fulano desbloqueó los productos». Es la única categoría donde el verbo NO
  varía, a propósito — con el verbo fijo la cabeza deja de leerlo y va derecho a
  qué se desbloqueó; la variedad está en si se nombra corto o por la regla. El
  ícono 🎨 y el nombre ya pintado del color nuevo cuentan la otra mitad. Cuál
  familia corresponde a cuál nivel NO está tabulado: sale de `elo.tier_objetivo`,
  que lo deriva de los cortes de nivel y de las semillas de dificultad, así que
  el día que alguno se mueva la frase se mueve con él en vez de quedar mintiendo.
- **`lead` dice a quién se le sacó el 1.** Quien está segundo ahora es
  exactamente quien lo tenía —una respuesta mueve a una persona sola—, y se
  nombra solo si es alguien de verdad: los sembrados no se nombran nunca.
- **`top` dice de qué puesto venía** («entró al top 50 desde el puesto 84»). El
  router ya lo había calculado para armar la respuesta del endpoint.
- **`uni_close` dice cuánta XP falta** en vez de «están cerca», que es lo único
  accionable que ese aviso puede decir.
- **`boost` dice cuánto dura** además de cuánto multiplica. Con la universidad ya
  en el techo el multiplicador no se mueve y lo que la donación compró fue
  tiempo: es el mismo agujero que el cartel del cafecito dejó de tener.

Dos reglas de castellano, y ninguna es de gusto. **Los artículos se piden
armados** (`Articulos`: «la UBA», «del ITBA», «al ITBA»), porque «superó a el
ITBA» es un error que no se ve probando con universidades que llevan «la» —solo
el día que un instituto entra en la tabla—. Y **nada de adjetivos ni pronombres
que concuerden**, ni con la universidad (los institutos van en masculino) ni con
la persona (un alias no dice el género de nadie). El «le» de «le serruchó el
piso» sí va: es objeto indirecto y es invariable en género.

«La UBA **le pasó** a la UNSAM» estuvo en producción y es el testigo de
`check_game_events_copy.py`: en rioplatense «a la UNSAM le pasó» se lee como que
a la UNSAM le OCURRIÓ algo. Pero «pasó a» a secas tampoco alcanzaba —el verbo más
pálido que había para el hecho más grande de la tabla—, así que el sobrepaso usa
**superó**, **dejó atrás**, **desplazó** y **le serruchó el piso**. Y hay un pool
aparte para cuando no estuvo cerca («barrió», «pasó por arriba», con el número),
que solo sale con más de 10% de ventaja: un sobrepaso recién confirmado pasa el
margen por poco, y decir «barrió» sobre un 2% es la clase de afirmación que hace
que el feed deje de creerse.

Dos decisiones de vocabulario más, las dos con chequeo propio para que no vuelvan
solas: las rachas **alternan «errar» y «pifiar»** —la misma idea con dos
registros, el doble de frases sin agregar ninguna— y **no se cuentan «al hilo»**.

### Escritorio: los atajos a la vista, y las ventanas chicas (desde el 09/10)

**Los atajos.** El teclado físico siempre hizo todo en escritorio —`^` es el
exponente, `/` arma la fracción, Tab sale del hueco— pero solo lo contaban las
«tips» del campo vacío, y la potencia y la fracción en pantalla aparecían recién
al desbloquearse. «No tenés la opción de poner la potencia o la división», «se me
pone la llave», decía la varita. Ahora (`math-keyboard.tsx`):

- la potencia y la fracción están **siempre** en la fila de inventario de
  escritorio, con el chip de su tecla (`^`, `/`);
- en las tiras fijas, las teclas con carácter propio —`(`, `)`, `·` con `*`, el
  retroceso— ocupan dos columnas y llevan el chip; y hay una tecla nueva,
  «salir» (`□→`, chip `tab`), que es el `moveToNextGroup` de MathLive;
- cuando se aprieta la tecla física, la de pantalla **pulsa en blanco**: el
  mismo pulso de las flechas `w`/`s` de «¿Por qué?», ahora en `pulso.tsx`.

Las teclas sin chip (x, +, −, C, las flechas) siguen de una columna y pulsan
igual. Con el inventario completo (más de siete teclas desbloqueadas) las tiras
se juntan en una sola fila de diez y los chips de las fijas no entran: ahí se
vuelve a la fila de siempre; los de `^` y `/` quedan.

**Las ventanas chicas.** El layout se elige por user agent y no por tamaño
(`game-root.tsx`), así que una notebook de 1366×768 con la barra del navegador,
una ventana a media pantalla o una tablet caen en el de escritorio, que pedía
900 px de ancho y unos 683 de alto y recortaba lo demás sin scroll —«hay cosas
que se ocultan de la pantalla». Dos cortes, en `desktop-layout.tsx`:

- **menos de 700 px de alto**: se saca el piso de alto de la columna, la caja
  usa toda la ventana, el historial queda en una línea y lo que hay adentro de
  la caja que gira se achica entero (`zoom: 0.85`, que a diferencia de
  `transform` reacomoda el layout): «¿Qué estudiás?», el cafecito, la encuesta
  y el propio ejercicio bajan juntos en vez de quedarse del mismo tamaño y
  perder el título por arriba. Medido a 1366×660: entran las tres filas del
  teclado, los botones y el historial;
- **menos de 900 px de ancho**: una sola columna, y el ranking se vuelve un
  cajón que sale del borde derecho con una pestaña («ranking»). El ranking no
  se pierde, se pide.

Las clases de los dos cortes están escritas literales en cada sitio y no
interpoladas desde una constante: Tailwind genera el CSS a partir de los textos
que encuentra en el fuente, y una clase armada con `${…}` no existe para él.

### El veredicto adelantado, y qué cuesta leerlo (`local-verdict.ts`)

El color de la respuesta no espera al servidor. El cliente deriva el enunciado
numéricamente, evalúa lo que escribió la persona en una grilla de diez puntos y
decide ahí mismo; el servidor sigue siendo la autoridad y si alguna vez difieren
la card se corrige sola. Se dispara en el **96,9%** de las respuestas de Android
y en el **99,6%** de las primeras respuestas de cada persona, y lo que tapa es
un viaje real: la mediana medida de ida y vuelta a Railway es de **436 ms** en
Android y de **503 ms** en la gama de entrada.

Por eso el veredicto local no necesita ser infalible: necesita ser **prudente**.
Ante cualquier duda devuelve `null` y se espera como antes.

**Hasta el 28/09 el parseo lo hacía `@cortex-js/compute-engine`**, un sistema de
álgebra completo de 2.581 kB descomprimidos — el 46% de todo el JavaScript de
`/derivadas` — usado para dos llamadas, las dos para convertir LaTeX en
MathJSON. Y sobre un lenguaje que emitimos nosotros: el enunciado lo genera
`game/generator.py` desde plantillas propias y la respuesta la escribe un teclado
con teclas cerradas, así que 60 días de producción dan **18 comandos LaTeX
distintos en 64.943 respuestas y 9 en 61.606 enunciados**.

Ahora lo hace `latex-a-mathjson.ts`, que lee ese vocabulario y devuelve `null`
ante cualquier otra cosa. Dos consecuencias además del peso:

- **el parseo es sincrónico**, así que desapareció la ventana en la que el
  motor todavía se estaba bajando y el veredicto no podía contestar aunque
  quisiera. En un teléfono de gama de entrada esa ventana eran segundos, y caía
  justo en la primera respuesta de la partida;
- **se arregló un veredicto que estaba mal desde el 20/09.** compute-engine lee
  `\ln{\left(x \right)}^{4}` como ln(x⁴), y la plantilla que lo genera
  (`t8_pow_ln`) quiere decir (ln x)⁴ — el servidor espera `4*log(x)**3/x`. O
  sea que el cliente venía derivando otra función: **677 ejercicios servidos a
  43 personas, con 640 respuestas correctas que vieron un rojo** (y su sonido)
  antes de que el servidor las corrigiera a verde medio segundo después.
  `veredictoLocal` devuelve `false` y no `null` en cuanto un punto se desvía más
  de 1e-3, así que era un veredicto seguro y equivocado.

Lo que lo sostiene es `check:parser`: pasa las **16.451 respuestas y los 3.165
enunciados distintos** de producción por el parser nuevo y por el motor viejo y
exige que, donde los dos contestan, den el mismo número en la grilla. Además
mide **cobertura** —94,5% del peso en respuestas, 99,0% en enunciados— porque un
parser que contestara `null` a todo pasaría el chequeo en verde sin haber
comprado nada. La única divergencia aceptada es la de arriba, y está fijada
contra la derivada que espera el servidor y no contra el motor viejo.

## El chat (`game/chat.py`, `chat-panel.tsx`)

Una sola columna donde se intercalan las novedades del sistema y lo que escribe
la gente, ordenadas por cuándo pasó cada cosa. No son dos widgets apilados a
propósito: que «alguien invitó 5 cafecitos para la UTN» aparezca entre dos
mensajes es lo que hace que el panel se lea como un lugar, y es la única forma de
que un anuncio se comente. Las dos listas viajan en el mismo sondeo que ya corría
cada ocho segundos (`GET /events`, con un cursor por lista), así que abrirlo no
le cuesta nada al servidor.

**Escribe cualquiera, invitados incluidos.** Pedía cuenta, con el argumento de
que un invitado se crea con un POST sin credenciales y su token no vence ni se
puede revocar, así que no hay a quién pedirle cuentas — y además el chat de paso
empujaba el registro. Se decidió en contra: la mayoría de la gente que está
jugando no tiene cuenta, y un chat al que esa mayoría no puede contestar no es un
chat. Lo único que se conserva de aquello es que a quien SÍ tiene cuenta se le
sigue pidiendo la sesión viva de Clerk, porque su token de invitado queda
guardado después del link y publicar bajo el nombre de alguien no se deshace.

Lo que queda de freno: **tres mensajes por minuto** por jugador, **140
caracteres** y **seis renglones**, y una **allowlist** de caracteres que deja
afuera los enlaces, el marcado y los emojis (con una excepción para el arte ASCII
de más de un renglón). No hay filtro de malas palabras y es deliberado: escribir
una lista a mano es garantizar falsos positivos en un país donde media
conversación es puteada afectuosa. Para bajar un mensaje está la columna
`hidden`, y con la puerta abierta esa es la única herramienta de moderación que
hay.

El chat se puede apagar entero desde el server (`GAME_CHAT_ENABLED`, opt-in): eso
frena escribir, nunca leer.

### Cada cuánto ver el ranking (`ranking-frecuencia.ts`, `ranking-frecuencia-slide.tsx`)

Desde el 09/10, en el **teléfono**, la persona elige después de qué correctas
aparece la diapo del ranking: **después de cada derivada** (lo de siempre, y el
valor por defecto), **cada 5** (`RANKING_CADA_N`, contadas sobre las correctas
acumuladas del servidor) o **solo cuando sube de puesto** (`rank_after <
rank_before`; sin puestos del servidor, se muestra). Cuando una correcta no pasa
por el ranking, el festejo optimista se desarma, el ranking se refresca por
detrás y la escalera de hitos corre igual que si acabara de salir de él.

La preferencia vive en **localStorage**, como el sonido: es cómo esta persona
quiere ver esta pantalla en este aparato, y escritorio no tiene la diapo —allá
el ranking es la columna de al lado y no interrumpe nada—. Reiniciar el
progreso o cerrar sesión no la borra. Se cambia desde una fila de Ajustes que
rota al tocarla (solo teléfono).

**La diapo que la ofrece sale en la derivada 15**, una vez en la vida del
aparato, y es un aviso más que una pregunta: lo que se toca se guarda al
instante, y pasarla de largo deja lo de siempre. El 15 salió de medir la primera
sesión de 2.200 personas (09/10): hasta la 12 casi nadie saltea el ranking (lo
mira 6-8 s), en la 15 el salteo (< 1,5 s) se duplica al 11,7% y la mediana cae
a 4 s. Antes de eso la diapo ofrecería una solución a un problema que la persona
todavía no tiene.

**Sale pegada a reclutas (14), y es deliberado.** Reclutas escribe el cooldown
compartido, así que con la separación de cuatro que usan la varita e instalar
esta diapo se caería a la 18 y le quitaría la respuesta a la varita. Por eso
respeta solo la regla 3 del mapa (dos pantallas no comparten respuesta) y no la
distancia; y tampoco escribe el cooldown, así que no corre a nadie. Lo verifica
`check:frecuencia`.

### La pregunta abierta (`encuesta-slide.tsx`, `game/encuesta.py`)

Una diapo en la **derivada 18**, una sola vez en la vida, con un campo de texto y
nada más:

> Si tuvieras una varita mágica, ¿qué le cambiarías o le agregarías a Intervalo?

Existe porque es lo único que el juego no puede medir. θ y β salen de los
aciertos, el embudo sale de las derivadas resueltas, y las dos encuestas de la
escalera tienen tres respuestas cada una y las seis las elegimos nosotros. Ninguna
de esas fuentes puede devolver algo que no se nos haya ocurrido preguntar — de
hecho la pregunta de repetitividad existe porque cinco respuestas de esta
hablaron de repetición sin que nadie la mencionara.

**No hay botón de saltar, y el campo no valida nada.** Las dos mitades son la
misma decisión: sin botón, salir cuesta un acto deliberado y eso sube mucho
cuánta gente contesta de verdad; sin validación, ese acto sale barato (un punto
alcanza) y la pantalla no se convierte en un peaje. Agregarle un largo mínimo
cierra la salida y la vuelve la puerta que `dx-puerta-1` midió en 668 respuestas
perdidas. El «.» se guarda como cualquier otra respuesta y se clasifica **al
leer**: son tres estados y no dos —se fue sin contestar, dijo que no, contestó— y
el primero es el que decide si la pregunta se saca.

**Por qué la 18 y no la 20**, que era el número pedido. Se simuló el ladder
entero con las constantes reales (18/09):

| casillero | quién lo ocupa | gente que llega |
|---|---|---|
| 10 | reclutas | 451 |
| 12 | registro | — |
| 14 | encuesta de dificultad *(en ese momento la única, y con cadencia fija)* | 321 |
| **18** | **libre** | **277** |
| 20 | cafecito | 258 |

La 20 es el hito del cafecito, y su disparador es `% CAFECITO_EVERY === 0`:
ganarle el turno no lo corre a la 24 sino a la 40, porque entre medio no hay
múltiplo. Correr el cafecito a la 14 para liberar la 20 obliga a correr reclutas
—que escribe el cooldown compartido desde la 10— y con reclutas movido la grilla
se desfasa: en 60 derivadas pasa de salir 3 veces a salir 1. La 18 está vacía,
deja el calendario intacto y **llega a más gente que la 20**.

Por el mismo motivo **no consume el cooldown compartido**, solo lo respeta (con
la separación de 4 de instalar y de las dos encuestas). Consumiéndolo, el
cafecito de la 20
quedaría tapado hasta la 40. Una pregunta que se hace una vez en la vida no puede
costar una oferta de tres; el check `check:encuesta` clava esa propiedad.

El texto se guarda **como lo escribieron**, sin la allowlist de caracteres del
chat: aquella existe porque allá el texto se vuelve público, y esto lo lee solo el
panel (pestaña **Feedback**), donde las respuestas se listan sin resumir.

### Los dos pedidos de la pantalla de inicio (`pedido-instalar.tsx`, `pedido-notificaciones.tsx`)

Dos diapos que interrumpen la partida, en ese orden y no en otro: en iOS el push
web **no existe** fuera de la app instalada, así que instalar es el
prerrequisito de notificar.

- **Instalar** sale en la derivada 24 y vuelve cada 12 hasta seis veces (36, 48,
  60, 73, 85). Estuvo en la 5 con tope de tres hasta el 18/09: el cinco se había
  elegido contra una curva de 52 jugadores donde la 15 retenía el 10%, y esa
  curva dejó de ser cierta — medida sobre 578, la 15 retiene 26,6% y la 30
  todavía 11,2%. El precio del cambio está medido: desde la 5 el cartel llegaba
  al 66,3% de los que resuelven una derivada y desde la 21 llega al 15,9%, y
  repetir no lo compensa. Lo que se compra es el tramo temprano, que era donde
  este pedido ocupaba la única respuesta libre. Es el único pedido que **no**
  consume el cooldown compartido, porque es el único que no le pide nada a la
  persona; si eso cambia, entra al cooldown como los otros. Desde el 18/09 su
  impresión se registra en `game_cta_events`, así que el panel puede decir a
  cuánta gente le llegó y en qué derivada.
- **Recordatorios** sale solo dentro de la app instalada, a las 3 derivadas
  hechas desde que se instaló —no desde el total: quien instaló en la 30 no puede
  esperar hasta la 50— y vuelve cada 20, tres veces. Sí consume el cooldown, y
  tiene cuenta regresiva antes de poder saltearlo: pide un permiso del sistema,
  que se quema para siempre si dicen que no.
- Los dos se apagan solos cuando la persona acciona: `isStandalone()` para el
  primero y `Notification.permission !== "default"` para el segundo, sin marcador
  que mantener.

### Avisos del minijuego (`game/notifications.py`, `game/notification_copy.py`)

Canal propio de push, porque el de Intervalo no le llega: `push_subscriptions`
exige un usuario, `due_notifications` corta en repasos SM-2 pendientes y todo su
copy sale de tablas que el juego no toca.

- **Le llega al invitado**, que es la mitad del punto: `game_push_subscriptions`
  cuelga del jugador y los endpoints van con el token de invitado.
- **Tres por día como máximo, y el cupo es de la PERSONA**: uno programado en el
  horario elegido y hasta dos reactivos. Un jugador registrado reclama contra los
  contadores de su `User`, así que un día en que dx tenga tres cosas que decir
  Intervalo no manda nada. El orden lo fija el cron del notifier, que corre las
  tandas del juego tres y seis minutos antes que las de Intervalo.
- **Programadas**: `social` (compañeros de tu universidad que jugaron hoy, XP de
  la semana, tu aporte), `reactivacion` y `record`. Si no hay ningún hecho que
  contar, no se manda nada: no existe un «vení a jugar» genérico.
- **Reactivas**, por orden de prioridad: `empuje` (cafecito), `recluta`,
  `ranking` y `universidad`.
- **La reactivación termina.** Sale a los días 1, 3, 7 y 14 de silencio y nunca
  más; al mes se apaga el canal solo para esa persona.
- **Qué se mide con qué.** El ranking de personas va por XP y el de universidades
  por Elo promedio (que es lo que impide que un cafecito compre puesto), así que
  ningún aviso puede prometer XP para escalar la tabla de universidades.

### La diapo del cafecito, y sus cuatro caras

**La primera sale en la derivada 14 y las siguientes cada 20**
(`cafecito-cta.tsx :: CAFECITO_PRIMERA` y `CAFECITO_EVERY`). Son dos números
desde el 18/09 porque son dos preguntas distintas —cuándo se presenta el
cafecito, y cada cuánto se insiste— y con uno solo la presentación estaba a
veinte derivadas de la puerta. Desde el 14/09, además, no siempre pide.
Cuál cara dibuja lo contesta el servidor (`GET /cafecito-status`), no una bandera
local, así que sobrevive a cerrar la pestaña y a cambiar de aparato:

| cara | cuándo |
|---|---|
| **oferta** | lo de siempre: la barra, el multiplicador que se compra, el precio |
| **vuelta** | acabás de volver de Cafecito, en esta misma visita (`PanelDeVuelta`) |
| **impacto** | donaste y el empuje está corriendo: **«1.240 XP extra para la UBA»**, y cuánta gente lo sumó |
| **cierre** | el empuje venció: el total final, **una sola vez** en las 48 h que el servidor lo recuerda |

Con el empuje vivo pero sin número —nadie jugó todavía— el titular es el
multiplicador y **nunca un cero**: es la misma regla que ya seguía el mail del
vencimiento, donde «tu cafecito generó 0 XP» es peor que no decir nada.

**Donde NO reemplaza a la oferta** es cuando la persona abre el cafecito a
propósito (botón de cabecera, tecla `i`, configuración): ahí el número va arriba
en un renglón y la oferta queda. Ese es el camino que convierte, y taparlo sería
cambiar «dejá de pedirle a quien ya donó» por «no lo dejes donar de nuevo».

En el teléfono la diapo va a pantalla completa con el tinte café y conserva las
tres cajas de universidades vecinas; en escritorio va en su card, con Enter, y el
ranking de al lado hace ese trabajo. Lo que se apaga en la cara de impacto es
`Shift+Enter` (no hay dónde ir) y la previsualización del ranking (no hay barra
que previsualizar).

**Mails** (solo para quien tiene cuenta: `users.email` viene de Clerk, así que al
invitado solo se lo alcanza por push). Se reusan los dos que ya eran conscientes
del juego —el resumen semanal de reclutas y el efecto del cafecito— y se agrega
el **"volvé" del minijuego**: cinco días sin derivar, uno por ausencia, con
marcador propio en `game_players` porque quien dejó el juego puede seguir
estudiando en Intervalo. Se descartan los de racha y de gracias-por-reportar,
que miran tablas que el juego no tiene.

## Misceláneo

- Splash animado con colores de belt al cargar (`splash-context.tsx`/`splash-gate.tsx`).
  **Se apaga para siempre en cuanto la persona termina su primera sesión**
  (desde el 21/09). Son ~2,6 s de piso en cada carga fría, y
  una carga fría es lo normal en una PWA que se abre desde el ícono: la primera
  vez es la marca presentándose, la número veinte es un peaje. Quien ya vino
  cae directo en el skeleton del home, que era lo que el splash tapaba.
  - Quién ya vino lo dice la base, no el dispositivo: `/user/status` devuelve
    `has_finished_session` (`session_store.termino_alguna_sesion`, modos
    `main`/`practice` con `finished_at`; la sesión sintética del onboarding
    **no** cuenta) y el home lo anota en una cookie con el id de Clerk adentro
    (`lib/nav/bienvenida.ts`).
  - La cookie existe porque la decisión se toma en el layout raíz, que corre en
    el servidor: desde `localStorage` habría que leerla después de hidratar, o
    sea con el splash ya pintado. Y guarda el id de la persona, no un `1`, para
    que en un teléfono prestado el que se acaba de registrar vea la bienvenida
    igual. Cambiar de dispositivo cuesta una bienvenida de más y ninguna otra.
- Tab bar / shell (`app-chrome.tsx`). `signedIn` (hay cuenta: tab bar y puntitos
  de novedad) y `splash` (además le toca la bienvenida) son dos props distintos:
  hasta el 21/09 eran uno solo, y apagar la bienvenida habría apagado la tab bar.
- PWA: manifest, splash screens iOS generados por script.

Última verificación: 2026-09-13
