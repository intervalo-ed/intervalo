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
  ajedrez (`rating = 1000 + 200·θ`) porque 1166 se lee y 0.83 no.
- **Rampa de arranque.** Los tres primeros ejercicios son fijos (x, x², 2x²) y
  hasta la quinta respuesta el tier disponible crece de a uno, para que el juego
  no abra con una exponencial por cómo haya caído el Elo.
- **Antes de repetir, se afloja la dificultad.** No se sirve ninguna de las
  últimas 8 plantillas (`generator._RECENT_EXCLUDE`), y cuando esa exclusión
  deja la banda vacía se ENSANCHA la banda —`_BANDAS`: [0.70, 0.80], después
  [0.55, 0.92], después [0.35, 0.98]— y recién si ninguna tiene candidatas se
  acorta la ventana, de 8 a 4 a 2 a 0. El criterio: una derivada un poco mal
  calibrada se nota menos que la cuarta vez de la misma.

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
- **Piso de Elo por plantilla** (`templates.PISO_TRIGONOMETRICAS`, hoy 1200).
  Es el único criterio de la lista que NO es adaptativo, y por eso existe: el
  ancla frena que una β se desboque pero no la revierte, y las trigonométricas
  se habían desplomado hasta servirse desde 760 de rating. Un piso dice «esto
  no antes de acá» aunque el motor crea lo contrario; pasada la barrera vuelven
  a competir por la banda como cualquier otra. El panel de la tecla `p` muestra
  el piso como Elo de desbloqueo de la fila, así que la promesa de la pantalla y
  lo que el generador hace son el mismo número.

### El feed de eventos (`game/events.py`)

La lista que corre debajo del CTA, y que en el panel del chat se intercala con lo
que escribe la gente: es **una sola columna**, así que cada línea de más del
sistema es un mensaje de una persona que se pierde. Es solo del sistema —ninguna
línea la escribe un usuario, así que no hay nada que moderar— y todo el diseño
está puesto en que no sea ruido. Nueve tipos:

| tipo | qué anuncia |
|---|---|
| `top` 🚀 | entrar al top 3, 10, 25 o 50 del ranking general |
| `uni_top` 🏆 | ser el número 1, o entrar al top 3, de la propia universidad |
| `lead` 👑 | llegar al puesto 1 del juego entero |
| `streak` 🔥 | rachas de 10, 25, 50, 100 y 250 sin errar |
| `level` ⚡ | desbloquear derivadas más difíciles |
| `signup` 🎓 / `referral` 🪖 | un registro, o el registro de alguien que trajo otro |
| `boost` ☕ | una donación de cafecitos, o el aforo del día de una universidad |
| `uni_pass` 🏛️ / `uni_close` 👀 | una universidad que pasa a otra en experiencia, o que se le viene encima |

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

- **«le pasó a»** sale cuando cambia el líder CONFIRMADO de un par, y confirmado
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

### El chat (`game/chat.py`, `chat-panel.tsx`)

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

### Los dos pedidos de la pantalla de inicio (`pedido-instalar.tsx`, `pedido-notificaciones.tsx`)

Dos diapos que interrumpen la partida, en ese orden y no en otro: en iOS el push
web **no existe** fuera de la app instalada, así que instalar es el
prerrequisito de notificar.

- **Instalar** sale en la derivada 5 y vuelve en la 25 y en la 45, tres veces
  como máximo. El número sale de la curva de supervivencia real: en la 5 sigue el
  46% de la cohorte y en la 15 el 10%, y la 5 es además el punto más calmo del
  tramo (8,3% de abandono contra 25% en la 3). Es el único pedido que **no**
  consume el cooldown compartido, porque es el único que no le pide nada a la
  persona; si eso cambia, entra al cooldown como los otros.
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

Última verificación: 2026-08-01
