# El motor de dificultad de `/derivemos`: cómo funciona y qué dato le falta

**Fecha:** 2026-08-27 · **Código:** `backend/game/elo.py`, `backend/game/generator.py` ·
**Panel:** `/panel/<token>/derivemos`, sección 3

El minijuego existe para dos cosas: financiar el proyecto con cafecitos y traer gente
a Intervalo. Las dos dependen de lo mismo — que la persona **se quede jugando**— y lo
único que el juego controla para lograrlo es **qué derivada sirve a continuación**.
Este documento explica el modelo que decide eso, qué sabe hoy, qué no sabe, y qué dato
hay que juntar para que lo sepa.

---

## 1 · El modelo en una línea

Cada estudiante tiene un número, `θ` (habilidad). Cada plantilla generadora tiene otro,
`β` (dificultad). Están **en la misma escala**, y la probabilidad de que ese estudiante
acierte esa derivada al primer intento es:

```
p̂ = σ((θ − β) · 0,818)
```

`σ` es la logística. El `0,818` no es un número elegido a ojo: es la **temperatura
medida en producción de Intervalo** sobre ~10k respuestas
(`docs/reports/2026-08-26-motor-de-sesiones.md` §5). Con `θ = β` la predicción es 50%;
cada unidad de diferencia vale ~1,6 en odds.

Después de **cada primer intento** los dos números se corrigen con el error:

```
e = (acertó ? 1 : 0) − p̂
θ  += 0,8 / (1 + 0,15·n_estudiante)   · e
β  −= 1,2 / (1 + 0,05·n_plantilla) · e
```

Eso es todo. **No hay reentrenamiento, ni job, ni pipeline**: son tres líneas de
aritmética dentro de la misma transacción que escribe la respuesta
(`game/router.py`, `answer_exercise`).

### Por qué el paso decrece

| | paso inicial | a las 20 obs. | a las 100 obs. |
|---|---:|---:|---:|
| estudiante (`θ`) | 0,80 | 0,20 | 0,05 |
| plantilla (`β`) | 1,20 | 0,60 | 0,20 |

Un estudiante nuevo se ubica en pocas respuestas; uno veterano casi no se mueve, que es lo
que hace que el marcador no salte por una distracción. La plantilla arranca moviéndose
**más rápido** que el estudiante (1,2 vs. 0,8) porque su primera observación es la única
evidencia que hay contra una semilla puesta a mano, pero decae **más lento**
(0,05 vs. 0,15) porque va a acumular evidencia de mucha gente y conviene que la siga
escuchando.

### Qué NO mueve el Elo

Tres cosas, todas deliberadas:

- **El segundo intento.** Ya vio el feedback: no dice nada sobre la habilidad.
- **Responder con la tabla abierta.** Con la tabla a la vista la derivada dejó de ser
  una pregunta. No toca `θ` ni `β` ni cuenta para la rampa.
- **Saltear.** Baja `θ` un plano de 0,15 (un cuarto de tier) pero **no toca `β`**:
  pedir algo más fácil es información sobre el estudiante, no sobre la plantilla.

---

## 2 · Qué hace el generador con eso

`pick_template` (`game/generator.py`) elige así:

1. **Rampa inicial.** Mientras el estudiante lleve menos de 5 respuestas, `tier ≤ n`. El
   juego arranca en `y = k` y `y = x` aunque el θ inicial sea 0 — la primera derivada
   tiene que salir sí o sí.
2. **Anti-repetición.** Fuera las últimas 3 plantillas servidas.
3. **ε-exploración (15%).** Servir la plantilla con **menos observaciones** dentro de la
   banda ampliada 0,65–0,85. Es Thompson pobre y se apaga solo a medida que el banco se
   cubre: sin esto la rampa se queda pegada a lo que ya conoce y las plantillas nuevas
   nunca salen de su semilla.
4. **La banda.** Entre las que caen en `p̂ ∈ [0,70 ; 0,80]`, una al azar. Si no hay
   ninguna, la más cercana a 0,75.
5. **Tope del salteo.** El botón promete una más fácil, así que se garantiza
   `tier ≤ tier_anterior − 1`. Bajar θ solo inclina la banda y con el castigo chico
   podría volver a caer el mismo tier.

Las semillas de `β` por tier salen de que, con `θ = 0`, T0 dé `p̂ ≈ 0,86` y T5
`p̂ ≈ 0,32`: `{0: −2,2, 1: −1,6, 2: −1,0, 3: −0,4, 4: 0,3, 5: 0,9}`.

---

## 3 · La banda 0,70–0,80 es una hipótesis, no un hecho

Esto es lo más importante del documento.

El modelo predice **acierto**. Lo que queremos es **retención**. Hoy suponemos que la
derivada que retiene es la que se acierta 3 de cada 4 veces — es la intuición del flow
y es lo que dio bien en las sesiones de Intervalo, donde la encuesta de interés mostró
que «aburrido» correlaciona con «demasiado fácil». Pero en un juego viral la función
puede tener otra forma: puede convenir 0,85 (racha larga, dopamina barata) o 0,60
(desafío, «una más y la saco»).

**Eso no se decide discutiendo, se mide**, y por eso el panel tiene la caja
*«¿La banda es la correcta?»* (sección 3). Para cada bin de `p̂` calcula qué fracción de
las derivadas de esa dificultad fue **seguida por otra derivada**, cortado por si la
persona acertó o erró.

- Si el pico de continuidad cae en 70–80% → la banda está bien y se deja.
- Si cae más arriba → estamos sirviendo demasiado difícil; hay que subir `TARGET_*`.
- Si errar una **fácil** espanta más que errar una difícil → no es un problema de
  dificultad sino de expectativa rota, y se arregla con copy, no con el motor.

Es un solo cambio de dos constantes en `elo.py` una vez que el dato exista.

---

## 4 · Los cinco agujeros del modelo actual

### a) No sabe de tiempo

`θ` es una sola foto sin fecha. Quien juega hoy y vuelve en una semana arranca con el θ
de la semana pasada, y las derivadas que le sirvan van a estar calibradas contra un
estudiante que ya no es. El arreglo es un decaimiento hacia 0 proporcional al hueco, o —más
barato— tratar el primer ejercicio de cada sesión con paso de aprendizaje aumentado.

**Cuándo:** cuando el panel muestre que hay gente que vuelve otra semana (sección 5,
columna «volvió otra semana»). Hoy es una corrección para un caso que casi no existe.

### b) `β` es por plantilla, no por instancia

`t1_pow` genera `x²` y `x⁷` con la misma `β`, y no cuestan lo mismo. Lo mismo pasa con
los coeficientes de `t2_sum3`. El dato para arreglarlo tenía su columna
(`game_exercises.params_json`) y se escribía siempre en `NULL`.

**Hecho en esta tanda:** `serve_exercise` ahora guarda `{"f": "8*x**5 - 6*x**2 + 4"}`.
Se persiste la **expresión** y no un dict de parámetros porque no obliga a tocar las 26
plantillas y es estrictamente más información: de la expresión salen los parámetros, al
revés no. Era dato que se estaba tirando y no se puede recuperar hacia atrás.

**Lo que falta:** cuando haya volumen, partir `β` en
`β_plantilla + ajuste_por_instancia` con encogimiento hacia la plantilla
(`w = n_inst / (n_inst + 4)`, igual que la capa de ítem del motor de sesiones).

### c) Un solo eje de habilidad

Alguien puede tener las potencias muy cómodas y las trigonométricas no. Un `θ` escalar
promedia las dos y le sirve a esa persona cocientes de senos cuando todavía le falta
`cos`.

**Arreglo:** `θ` por familia —potencias, exponenciales/logaritmos, trigonométricas,
producto, cociente— con encogimiento al `θ` global (`w = n_fam / (n_fam + 6)`), o sea
exactamente la estructura jerárquica que ya propone el motor de sesiones para
`beta_item`. Cinco floats más por estudiante.

**Cuándo:** con ~2.000 primeros intentos repartidos. Antes, cada familia tendría 3
observaciones y el encogimiento la dejaría igual al θ global de todos modos.

### d) Nadie mide el abandono como abandono

La derivada que perdió a la persona es **la última de cada partida**, y hasta ahora no
se miraba nunca. El panel lo arregla con la curva de supervivencia (sección 2): de los
que llegaron a la derivada `k`, qué fracción hizo la `k+1`, sobre partidas cerradas.

El escalón más grande del tramo 1–20 es el número accionable de todo el panel. Si cae en
la 5 o en la 12, no es la dificultad: son los pedidos de facultad y de registro
pinchando la partida.

### e) El modelo no sabe en qué aparato estás

Y debería, porque `θ` está absorbiendo algo que no es habilidad. Errar una derivada
porque no la sabés y errarla porque no pudiste escribirla en un teclado matemático
apoyado sobre uno táctil son el mismo `e = 0 − p̂` para el Elo: en los dos casos baja
`θ` y el juego pasa a servir más fácil. Si la brecha entre teléfono y escritorio en el
«% ilegible» de la sección 9 es grande, **parte de lo que el motor cree que es falta de
habilidad es fricción de input**, y la respuesta correcta no es bajar la dificultad sino
arreglar el teclado.

**Cómo se ve:** en la sección 9 del panel, comparando el «% ilegible» y el acierto entre
aparatos. Si el acierto del teléfono es más bajo *y* el ilegible más alto, son la misma
cosa contada dos veces.

**Arreglo, si el dato lo pide:** `β` no se toca (la plantilla no es más difícil en un
teléfono), pero `θ` puede llevar un ajuste por aparato, igual que un handicap. Es la
última opción: antes hay que intentar que el input no falle.

---

## 5 · Qué dato se junta hoy, y qué se agregó para esto

**Ya se persistía** (una fila por ejercicio y una por intento):

| dato | dónde | para qué |
|---|---|---|
| `p_hat`, `theta_at_serve`, `beta_at_serve` | `game_exercises` | calibración: comparar lo predicho con lo que pasó |
| `theta_before` / `theta_after` | `game_attempts` | la curva de aprendizaje, sin recalcular nada |
| `response_ms` | `game_attempts` | dificultad percibida, que no es la misma que la real |
| `status = skipped` | `game_exercises` | el escape: qué se rechaza y con qué `p̂` |
| `n_observations`, `n_correct` | `game_template_stats` | cuánta evidencia tiene cada `β` |

**Se agregó en esta tanda** (migración `20260827_0046`), porque sin esto el panel no
podía contestar preguntas que ya se estaban haciendo:

- **`game_exercises.peeked`** — mirar la tabla ya cambiaba la mecánica pero no se
  guardaba. Sin la columna, «resolvió» y «copió» quedan mezclados en la misma tasa de
  acierto y en la misma calibración.
- **Los envíos que no parsean se registran** (`game_attempts` con `parse_ok = false` y
  `attempt_number` sin avanzar). Antes el endpoint devolvía temprano y la fricción del
  teclado matemático no dejaba rastro — y desde el otro lado de la pantalla se ve igual
  que un error de matemática: la persona escribió algo, el juego le dijo que no, y se
  fue. Es la única parte del juego donde el que pierde no es el estudiante.
- **`game_cta_events`** — impresiones y clicks de los llamados a la acción. Es lo que
  permite cerrar el embudo del cafecito de punta a punta contra `game_boosts`, algo que
  PostHog no puede hacer porque no conoce esa tabla.
- **`game_players.platform` y `game_exercises.platform`** (migración `20260827_0047`) —
  el aparato de primer contacto y el de cada ejercicio. Lo manda el cliente en
  `X-Game-Platform` y **no** se deduce del `User-Agent`: el layout lo elige
  `getPlatform()`, que además del UA mira `maxTouchPoints` porque un iPad se reporta
  como Macintosh y juega el flujo de teléfono. Deducirlo en el server diría «escritorio»
  para alguien que está jugando con el dedo, y el panel afirmaría lo contrario de lo que
  pasó.

- **`game_exercises.params_json`** — la expresión concreta que se sirvió, que hasta
  ahora se escribía siempre en `NULL` (ver §4b).

---

## 6 · Cuánto dato hace falta

Con el paso de aprendizaje actual, `β` deja de moverse en serio alrededor de las **20–30
observaciones** (a las 30 el paso ya bajó a 0,48; a las 100, a 0,20). Con 26 plantillas:

| hito | primeros intentos | qué habilita |
|---|---:|---|
| banco fuera de la semilla | ~700 | las `β` dejan de ser la creencia inicial del tier |
| calibración confiable | ~1.200 | `ECE < 3 pp` medible por bin, no ruido |
| mover la banda con evidencia | ~1.200 con «siguiente» conocida | ~200 por bin en la caja de continuidad |
| `θ` por familia | ~2.000 repartidos | el encogimiento deja de dominar |

El panel muestra el numerador de todas: sección 3 (`servidos`, `n` por bin) y sección 4
(cuántas plantillas siguen «verdes», o sea con menos de 20 respuestas).

---

## 7 · El orden

1. **Mirar la calibración una semana después de difundir.** Si el `ECE` se va por encima
   de ~5 pp de forma sistemática, revisar las semillas de `β` antes que cualquier otra
   cosa: con el modelo descalibrado, todo lo demás de la sección 3 mide otra cosa.
2. **Validar la banda con la caja de continuidad.** Es un cambio de dos constantes.
3. **Recién entonces**, `θ` por familia y decaimiento temporal.

Lo que **no** hay que hacer, por si tienta: reentrenar nada offline, sumar features al
modelo de `p̂` (el reporte del motor de sesiones ya mostró que la habilidad del usuario y
la dificultad del ítem se llevan casi toda la señal, y el resto es ruido), ni tocar la
banda por intuición antes de tener la caja de continuidad con base.
