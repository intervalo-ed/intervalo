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

#### `dx-puerta-2`, en curso desde el 18/09

Los dos brazos tienen la misma puerta. Lo que cambia es dónde se cobra lo que la
puerta no cobró.

- **`control`** — el flujo que ganó, tal cual: después de la primera correcta,
  **@ → ranking → reglas 2, 3 y 4 juntas** (`reglas-slide.tsx`, una sola vez por
  dispositivo).
- **`sin-peaje`** — entre la primera correcta y la segunda derivada no hay nada
  salvo el ranking. Las dos piezas se corren:
  - **el @** va a la tercera correcta, donde ya se pregunta carrera y
    universidad (`HITO_PERFIL`). Sigue yendo antes del ranking, que es lo que
    hace que la fila estrene el nombre elegido; lo único que cambia es el
    acierto. La atrición manda: 20,4% en la primera contra 6,2% en la tercera.
  - **las reglas** se reparten de a una, cada una donde tiene referente
    (`reglas-trigger.ts :: CALENDARIO`): el **Elo en la 5**, cuando la dificultad
    ya se movió y en el punto más calmo del tramo temprano; los **cafecitos en
    la 12**, dos antes de que la diapo del cafecito aparezca por primera vez,
    para que esa diapo no sea la primera noticia; la **tabla en la 17**, cuando
    los ejercicios empezaron a costar de verdad y la regla es una salida y no un
    dato.

  Ninguna cae antes de la tercera correcta, y eso no es prolijidad: la métrica
  primaria es llegar a tres, así que una regla que saliera antes estaría adentro
  de lo que se está midiendo. Y ninguna comparte respuesta con otra pantalla:
  las tres esquivan las derivadas donde el juego ya interrumpe (ver el mapa de
  abajo).

**Esto no es el tutorial repartido que ya se sacó una vez.** Hasta el 13/09 las
tres reglas venían de a una en los aciertos 1, 2 y 5, metidas ARRIBA DEL
ENUNCIADO. Se fueron porque un renglón sobre la fórmula se lee como pie de página
del ejercicio que tiene abajo, y porque caían donde la persona todavía no había
decidido quedarse. El calendario de ahora son pantallas enteras y empiezan
después de que esa decisión ya está tomada.

La métrica primaria es **llegar a 3 correctas en la primera tanda**, base 0,414 y
efecto mínimo 8 puntos → **606 por brazo**. La predicción declarada: Android es
la que más se mueve, porque es donde `dx-puerta-1` perdió terreno y donde el
desbarranco se lleva más gente en absoluto (149 → 109); iOS debería moverse
menos, porque su ganancia vino de la puerta y no del peaje.

#### El mapa de interrupciones

Seis sistemas independientes deciden cuándo el juego deja de servir derivadas y
pide algo, cada uno con su propia cadencia. El **18/09 se adelantaron dos** —el
registro de la 12 a la 10 y la primera oferta de cafecito de la 20 a la 14— y
eso obligó a mover un tercero, porque los números no viven solos:

| derivada | qué sale |
|---|---|
| 3 | carrera y universidad (`HITO_PERFIL`); en `sin-peaje`, el @ va pegado antes |
| 5 | *(sin-peaje)* la regla del Elo |
| 9 | invitar a un amigo (`RECLUTAS_RESTO`) |
| 10 | registrarse (`HITO_REGISTRO`), y se vuelve a ofrecer cada 12 |
| 12 | *(sin-peaje)* la regla de los cafecitos |
| 14 | el cafecito, por primera vez (`CAFECITO_PRIMERA`) |
| 17 | *(sin-peaje)* la regla de la tabla |
| 18 | la pregunta de la varita (`ENCUESTA_EN`), una sola vez en la vida |
| 20 | el cafecito otra vez, y de ahí cada 20 |
| 24 | instalar la app, y después cada 12: 36, 48, 60, 73, 85 |
| 28 | la encuesta de dificultad (`OPINION_PRIMERA`, corrida por su separación) |

Simulado hasta la derivada 95 con las funciones reales: **ninguna pantalla
comparte respuesta con otra**, y no hay tres derivadas seguidas con pantalla.

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
   nada: el registro, la varita y la encuesta de dificultad—. El ladder vuelve a
   entrar después de cada diapo con otro `consumed`, así que sin esto dos
   disparadores que apuntan al mismo número se dibujan uno atrás del otro sobre
   la misma derivada.

**Las reglas 2 y 3 son distintas a propósito y mezclarlas sale caro.** Con una
sola lectura y una distancia de cuatro, la pregunta de la varita de la 18
empujaba el segundo cafecito de la 20 a la 40: estar a dos derivadas de
distancia está bien, compartir la respuesta no. La encuesta de dificultad es la
única que usa la regla 3 como distancia y no como igualdad, y es coherente con
su lugar: va última del ladder justamente porque no convierte a nadie.

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

Lo que fija `backend/scripts/check_game_variante.py`, que lee el nombre del
experimento del propio archivo del front para que no se pueda desincronizar.

**Desde `dx-elo-1` (19/09) éste no es el único sorteo, y la diferencia importa.**
Aquél corre del lado del servidor y deriva el brazo de un hash del `player.id`
sin guardarlo en ninguna columna (`game/sorteo.py`). El write-once de acá arriba
sigue siendo lo correcto para un experimento de PANTALLAS, y es justamente lo que
lo vuelve inservible para uno del MOTOR: un parámetro que rige de la inscripción
en adelante no tiene nada de «ya visto» que contaminar, y todos sus elegibles
existen desde hace semanas.

El panel lo lee en su pestaña **Experimentos**
(`/panel/<token>/dx?s=experimentos`), que tiene una particularidad: **se niega a
contestar hasta tener la muestra que se prometió.** Mientras falte gente no
calcula el p-valor ni dibuja un ganador, solo cuánto falta — mirar un A/B todos
los días y parar en cuanto cruza 0,05 no es leerlo, es repetir el sorteo hasta
que salga. Los guardarraíles (profundidad, vuelta otro día) sí se miran desde el
primer día, porque sirven para frenar un brazo que hace daño y no para declararlo
ganado.

Cada experimento declara además **cuál columna decide** (`metrica`), y la tabla
la marca con ▸. Era implícita —siempre «llegó a la 1ª»— hasta que `dx-puerta-1`
mostró por qué tenía que ser explícita.

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
- **Y una vez cada tanto se le pregunta** (`game/opinion.py`). Todo lo de
  arriba el motor lo mide; esto es lo único que averigua preguntando. A las 10
  resueltas, después cada 30 y como mucho tres veces, aparece una diapo con tres
  opciones: 😴 muy fáciles / 👌 justas / 🤯 muy difíciles. Son los mismos tres
  valores que el canal A de la micro-encuesta de Intervalo, para que los dos
  productos se puedan cruzar sin traducir.

  El voto **ajusta el θ de quien lo emite**, y ahí está lo que hay que entender:
  el voto elige el signo y la evidencia elige el tamaño. Sobre las últimas 20
  respuestas de primer intento sin tabla se calcula un paso de Newton encogido
  —`Δθ = Σ(acertó − p̂) / (SCALE·Σp̂(1−p̂) + I₀)`— y se aplica solo si va para el
  mismo lado que el voto, con tope de un tier (0,60) y una banda muerta de 0,15
  abajo. Quien dice «muy fácil» sin estarle ganando al motor no se mueve: el
  color del ranking se sigue ganando resolviendo, y el ajuste solo lo acredita
  antes.

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
propios elegibles, efecto mínimo **1 día** → **65 por brazo**, y ya hay ~70: lo
que falta no es gente sino calendario. No se usó la quincena anterior como
covariable porque está vacía (0,13 días) — para esta gente el producto tiene doce
días de vida.

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

### La pregunta abierta (`encuesta-slide.tsx`, `game/encuesta.py`)

Una diapo en la **derivada 18**, una sola vez en la vida, con un campo de texto y
nada más:

> Si tuvieras una varita mágica, ¿qué le cambiarías o le agregarías al juego?

Existe porque es lo único que el juego no puede medir. θ y β salen de los
aciertos, el embudo sale de las derivadas resueltas, y la encuesta de dificultad
tiene tres respuestas y las tres las elegimos nosotros. Ninguna de esas fuentes
puede devolver algo que no se nos haya ocurrido preguntar.

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
| 14 | encuesta de dificultad | 321 |
| **18** | **libre** | **277** |
| 20 | cafecito | 258 |

La 20 es el hito del cafecito, y su disparador es `% CAFECITO_EVERY === 0`:
ganarle el turno no lo corre a la 24 sino a la 40, porque entre medio no hay
múltiplo. Correr el cafecito a la 14 para liberar la 20 obliga a correr reclutas
—que escribe el cooldown compartido desde la 10— y con reclutas movido la grilla
se desfasa: en 60 derivadas pasa de salir 3 veces a salir 1. La 18 está vacía,
deja el calendario intacto y **llega a más gente que la 20**.

Por el mismo motivo **no consume el cooldown compartido**, solo lo respeta (con
la separación de 4 de instalar y opinión). Consumiéndolo, el cafecito de la 20
quedaría tapado hasta la 40. Una pregunta que se hace una vez en la vida no puede
costar una oferta de tres; el check `check:encuesta` clava esa propiedad.

El texto se guarda **como lo escribieron**, sin la allowlist de caracteres del
chat: aquella existe porque allá el texto se vuelve público, y esto lo lee solo el
panel (pestaña **Voces**), donde las respuestas se listan sin resumir.

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
- Tab bar / shell (`app-chrome.tsx`).
- PWA: manifest, splash screens iOS generados por script.

Última verificación: 2026-09-13
