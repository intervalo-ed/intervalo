# MVP — Lanzamiento a UADE, UNC y UNSAM

Plan de validación para la primera distribución real de Intervalo, repartida por
los grupos de WhatsApp de las universidades del tracker de difusión.

Define **qué hipótesis vamos a poner a prueba**, **con qué dato**, y **qué falta
hacer**. El marco es *The Lean Startup* (Ries) para el ciclo de aprendizaje y
*Actionable Gamification* (Chou, Octalysis) para razonar sobre engagement.

Contexto: [product-overview](../context/product-overview.md) ·
[student-journey](../context/student-journey.md) ·
[gamification](../context/gamification.md) ·
[KPIs](../web/docs/KPIs-MPV-intervalo.md)

---

## 0. La idea rectora

Ries separa dos cosas que es fácil confundir:

- **Hipótesis de valor** — ¿el producto le sirve a quien ya lo usa?
- **Hipótesis de crecimiento** — ¿cómo llegan usuarios nuevos, de forma repetible?

**Este lanzamiento pone a prueba la de valor, no la de crecimiento.** Repartir un
link a mano en grupos de WhatsApp es siembra manual: no se repite ni escala solo.
Si entran 200 usuarios porque mandamos 97 mensajes, eso no dice nada sobre
adquisición, y leerlo como señal de crecimiento nos haría optimizar lo que no
toca.

Lo que sí podemos aprender, y es lo valioso: **si los que entran se quedan.**

---

## 1. Línea de base

Medido en PostHog sobre los 90 días previos al lanzamiento. Es el punto de
comparación contra el que se van a leer los resultados.

| Etapa | Personas | % del anterior |
|---|---|---|
| Vieron alguna página | 1.629 | — |
| Llegaron al onboarding | 798 | 49% |
| **Completaron el onboarding** | **171** | **21%** |
| …hicieron alguna sesión | 71 | 42% |
| …abrieron el ranking | 40 | 23% |
| …usaron Practicar | 11 | 6% |

Tres lecturas que ordenan las prioridades:

**1. El onboarding es el cuello de botella.** Por mes: mayo 45%, junio 21%,
**julio 7,4%**, agosto 44%. El desplome de julio coincide con el bug que arregla
`f77e1b05` (*"Ya tengo una cuenta" ya no deja usuarios sin onboarding*): un mes
entero perdiendo 9 de cada 10 usuarios, descubierto sin mirar el dato. **44% es
el número a batir.**

**2. El ranking llega al 23%, pero ese 23% lo usa muchísimo** (~45 vistas por
persona). Parece intenso para pocos, no transversal — que es una hipótesis
distinta de la que `gamification.md` da por hecha. Ver H4.

**3. Nunca hubo un solo UTM.** Todo el tráfico histórico es `$direct`. La
atribución de esta tanda es señal completamente nueva.

> Los números de "hizo sesión" salen de pageviews `/session/*` y son un piso. La
> fuente correcta es la tabla `sessions` en Postgres.

---

## 2. Las hipótesis

Ordenadas por **riesgo** (cuánto se cae el producto si son falsas), no por
facilidad de medición.

### H1 — Valor (la principal)

> Un estudiante sostiene un hábito de práctica diaria si las sesiones son cortas
> y el progreso es visible.

- **Riesgo:** la repetición espaciada solo funciona si hay repetición. Si la gente
  hace 2 sesiones y se va, el SM-2 no tiene nada que optimizar y el producto no
  tiene razón de existir en su forma actual.
- **Métrica:** retención por cohorte, con las dos definiciones de "activo" del doc
  de KPIs: *abrió la app* y *completó una sesión*.
- **Decisión:** no importa el valor absoluto de D7 o D30, sino **si la curva se
  aplana**. Aplanarse en 12% = hay núcleo con hábito → *perseverar*. Caer a cero =
  nadie forma hábito → *pivotar*.

### H2 — Onboarding

> El onboarding no pierde gente de forma significativa.

- **Ya sabemos que es falsa en su forma fuerte:** se pierde ~56%. La pregunta útil
  es **en qué paso**.
- **Métrica:** conversión paso a paso (`onboarding_step`).
- **Sospecha a confirmar: son 13 pasos**, y el registro está al final.

  ```
  intro → nombre → bienvenida → motivacion → curso → unidades → ejercicio →
  felicitacion → modo-repasar → modo-practicar → carrera → universidad → registro
  ```

  Pedir la cuenta en el paso 13, después de invertir todo ese esfuerzo, es donde
  más duele abandonar. Si el dato lo confirma, **acortar el wizard es la palanca
  de mayor retorno de todo el producto**: actúa sobre el punto donde se pierde más
  de la mitad de los usuarios.

#### Lo que dijo la primera tanda (11-ago-2026)

La sospecha estaba **equivocada de punta**. La pérdida no está al final sino en el
primer contacto, y el resto del wizard casi no pierde a nadie:

| paso | personas | |
|---|---|---|
| intro | 46 | |
| nombre | 52 | |
| bienvenida | 22 | **−58%** |
| motivacion → curso | 22 | −0% |
| unidades → ejercicio | 21 → 20 | |
| felicitacion | 16 | −20% |
| modo-repasar → registro | 16 | −0% |

Completación `intro → registro`: **35%**. Pedir el apodo antes de mostrar nada de
valor se lleva puesta más de la mitad de la gente; el paso 13 no es el problema.

⚠️ Pendiente: 8 personas tienen evento `nombre` sin `intro`. El conteo de `intro`
(46) coincide exacto con los `$pageview` de `/onboarding`, así que el sospechoso
es `nombre`. Sin explicación todavía.

#### Experimento en curso: `onboarding-orden-apodo`

Feature flag multivariante 50/50 ([PostHog](https://us.posthog.com/project/386340/feature_flags/815185)),
arrancado el 12-ago-2026.

- **control** — orden actual, el apodo abre el wizard:

  ```
  intro → nombre → bienvenida → motivacion → curso → unidades → ejercicio →
  felicitacion → modo-repasar → modo-practicar → carrera → universidad → registro
  ```

- **test** — el apodo baja a la posición 9, pegado a carrera, de modo que las tres
  preguntas personales quedan juntas al final y las primeras ocho slides son puro
  valor:

  ```
  intro → bienvenida → motivacion → curso → unidades → ejercicio → felicitacion →
  modo-repasar → modo-practicar → nombre → carrera → universidad → registro
  ```

  La bienvenida pasa a abrir el wizard: saluda con «¡Bienvenido!» (todavía no hay
  nombre) y se lleva el botón «Ya tengo una cuenta». La slide del apodo deja de ser
  pantalla de bienvenida y se ve como cualquier otra pregunta — título «¿Cómo te
  llamás?» en el formato de carrera o motivación, y el Continuar en la barra de
  abajo. **Ese restyle vive solo en test**: en control la slide sigue idéntica a
  hoy, porque ahí sigue siendo la pantalla de apertura y es justamente la variable
  bajo prueba.

- **Métrica primaria:** funnel `onboarding_step` de `intro` a `registro`, breakdown
  por la propiedad `variant`. Secundaria: `intro → motivacion`.
- **Criterio de corte:** 12 tandas de difusión (~550 personas). Con base 35% eso
  detecta ~12 pp con 80% de potencia y α=0.05; el umbral acordado de 15 pp se
  alcanza alrededor de la tanda 7.
- **Si no llega al umbral:** inconcluso. Se decide por criterio de producto, no se
  declara ganador.
- `variant: "unavailable"` marca a quien no le resolvieron los flags (adblock,
  red). Corre el orden de control pero **hay que excluirlo del análisis**.
- Mientras corra, no tocar el orden ni el copy del wizard: cualquier cambio en el
  medio contamina los dos brazos.

### H3 — Contenido

> El banco está bien calibrado: ni tan fácil que aburra, ni tan difícil que frustre.

- **Métrica:** % de acierto en primer intento por ítem (solo fase Entendimiento),
  intentos hasta graduación, micro-encuesta (`exercise_feedback`).
- **Decisión:** ítems con <40% o >90% de acierto en primer intento entran a
  revisión. Cola larga de intentos = problema pedagógico, no de dificultad.

### H4 — Competencia universitaria ⚠️ la más cargada

> La competencia en el ranking, especialmente **entre universidades**, es lo que
> sostiene el uso a largo plazo.

- **Riesgo:** `gamification.md` lo afirma **como un hecho**, y el 65% del peso del
  copy de push está construido encima. Es una apuesta fuerte al **CD5 (Social
  Influence)** por sobre el **CD2 (Development & Accomplishment)**. Nunca se probó.
- **Primera evidencia (§1):** 23% de alcance, uso intenso en ese 23%. Compatible
  con "es el motor de los power users, no de todos".
- **Decisión:** si se confirma, la conclusión **no** es apagar el ranking sino
  dejar de asumir que le habla a todo el mundo, y **revisar el peso del copy
  social en las push**.

### H5 — Canal de retorno (push + email)

> Las notificaciones push traen gente de vuelta.

- **Riesgo:** en PWA el permiso es caro, y en iOS solo funciona si la app está
  instalada. Si el grant rate es bajo, el canal no existe y hay que apoyarse en
  email.
- **Métrica:** embudo `pedido → concedido → enviado → abierto → sesión en 30 min`.
- **Lectura de `push_permission`:**

  | `result` | Qué pasó | Qué hacer si predomina |
  |---|---|---|
  | `granted` | concedió | nada, el canal existe |
  | `denied` | tocó bloquear | el pedido llega en mal momento; mover el prompt |
  | `default` | cerró el prompt sin elegir | falta contexto antes de pedirlo |
  | `unsupported` | el navegador no puede | iOS sin PWA → el canal es el email |

  `denied` y `default` se ven igual en el producto pero piden arreglos opuestos.

- **Instalación de la PWA:** es manual (el onboarding muestra los pasos, no hay
  `beforeinstallprompt` que interceptar, y en iOS `appinstalled` no existe), así
  que se mide detectando si la app corre en modo standalone en cada carga.

  ⚠️ **La instalación se mide por `pwa_standalone`, no por el evento
  `pwa_install`.** El evento sale una sola vez por dispositivo y en la primera
  tanda perdió 3 de 4 instalaciones reales (contó 1 de 12 registrados cuando
  fueron 4): el guard de localStorage se escribía antes de que el evento se
  confirmara enviado, así que si la página se descargaba antes del flush el evento
  se perdía para siempre sin reintento — y la primera carga de la PWA suele
  redirigir enseguida por `/sso-callback`. Ya está arreglado (`send_instantly` +
  guard después del capture), pero el número confiable sigue siendo la super
  property, que se re-registra en cada carga y viaja en todos los eventos
  (`pwa_standalone`, `platform`). Además, al identificar se copia
  `first_pwa_use_at` al perfil de la persona, así que también se puede segmentar
  sin tocar eventos.

  ```sql
  -- Cuántos registrados usaron la app instalada (la cuenta correcta)
  select distinct_id, countIf(properties.pwa_standalone = true) as eventos_en_pwa
  from events
  where timestamp >= '2026-08-11' and distinct_id like 'user_%'
  group by distinct_id having eventos_en_pwa > 0;
  ```

  Es el cruce que define si el canal push existe: en iOS **sin PWA instalada no
  hay push posible**, y ahí el canal de retorno pasa a ser el email.

  De la primera tanda: **4 de 12 registrados** usaron la app instalada, todos
  Android. Los que instalan lo hacen en segundos (5s, 37s, 80s desde ver la
  pantalla) — o lo hacen ahí mismo o no lo hacen nunca. Instalar tampoco garantiza
  usar: uno de los 4 instaló y nunca hizo una sesión.

---

## 3. Difusión y atribución

La difusión sale de un **tracker de grupos de WhatsApp** (Google Sheet, una fila
por comisión) con **97 grupos**: 10 de UADE (Económicas) y 87 de UNC (Ingeniería,
FCEFyN). **UNSAM está pendiente de fuente.** Cada fila tiene el link del grupo, la
materia, el curso asociado, el tier y la columna *Link intervalo*.

### Esta tanda: solo universidad

**El único dato que se recolecta es la universidad.** Sin `utm_medium`,
`utm_campaign`, `utm_content` ni `utm_term`.

```
https://www.intervalo.xyz/?utm_source=uade
https://www.intervalo.xyz/?utm_source=unc
https://www.intervalo.xyz/?utm_source=unsam   (cuando se cargue)
```

Dos links para 97 grupos. La columna *Link intervalo* del tracker ya está cargada.

No requiere código: PostHog captura los `utm_*` solo, los guarda como propiedad de
persona (`$initial_utm_source`) — así que la etiqueta **persiste por todo el
embudo**, no solo en el primer pageview — y se cruza con Postgres por
`clerk_user_id`.

### Qué se resigna, a propósito

- **El A/B de copy no se puede medir.** Sin `utm_content` no hay forma de separar
  variantes. Si igual se mandan copys distintos, la comparación sale a mano
  cruzando la fecha de envío del tracker contra las altas.
- **No se distinguen comisiones ni materias.** Los 87 grupos de UNC entran como un
  bloque. Duele especialmente porque el tracker **ya tiene** el corte Tier 1 vs
  Tier 2, que es probablemente el más informativo: Tier 1 cursa exactamente
  nuestro contenido, Tier 2 lo usa como prerrequisito, y no hay razón para
  esperar que conviertan igual.

Se conserva lo principal: **qué universidad convierte mejor, con el embudo entero
segmentado por ella.**

### Para la próxima tanda

| Parámetro | Valores | Para qué |
|---|---|---|
| `utm_source` | `uade` · `unc` · `unsam` | universidad |
| `utm_medium` | `whatsapp` | canal (deja lugar a `instagram`, `mail`) |
| `utm_campaign` | `<curso>-t<tier>-<mes>` | curso + tier, ej. `prob-t1-ago26` |
| `utm_content` | `epico` · `social` | variante de copy |
| `utm_term` | slug del grupo | comisión puntual |

Con 97 grupos hay volumen para un A/B de copy **sin confundirlo con la
universidad**: alcanza con alternar variantes entre comisiones de la misma materia
(Análisis I en UNC tiene 18). Regla a respetar: **alternar por universidad, no por
materia** — las 10 materias de UADE tienen un grupo cada una, así que alternar por
materia deja a UADE entero en una sola variante y reintroduce el confound.

---

## 4. Qué falta

| # | Trabajo | Hipótesis | Prioridad |
|---|---|---|---|
| 1 | **Desplegar el fix de detección de PWA** (`send_instantly` + `first_pwa_use_at`) | H5 | 🔴 alta |
| 2 | Probar el flujo completo en un **iPhone real** — de 26 visitas iOS en la primera tanda, **cero** se registraron | H2 | 🔴 alta |
| 3 | Cargar la fuente de grupos de **UNSAM** en el tracker | difusión | 🟠 alta |
| 4 | Revisar el **ejercicio de prueba**: 7 de 10 lo fallaron, y los que fallan tardan más (28-68s vs 16-36s) | H3 | 🟠 alta |

**Ya en producción y verificado con datos reales:** `onboarding_step` (H2),
`push_permission` (H5), `pwa_install` + super properties (H1/H5), `first_utm_source`
(atribución, ya arreglado el `reset()` que la borraba en visitantes anónimos), y el
barrido de sesiones abandonadas — `sweep_abandoned_sessions` + migración
`20260811_0027` + tick horario del notifier, que dejan `sessions.abandoned`
confiable por primera vez.

**Lo que no hay que construir:** dashboard de métricas (con este N, SQL y PostHog
alcanzan), tabla de eventos propia (PostHog ya la es), ni `User.signup_ref` (la
atribución ya viaja por PostHog y se cruza por `clerk_user_id`).

### Checklist antes de postear

- [ ] El link abre bien en el **navegador interno de WhatsApp** (Android y iPhone).
- [ ] El `utm_source` **sobrevive** el redirect a `/onboarding` → verificar en
      PostHog con un click de prueba.
- [ ] `onboarding_step` y `push_permission` llegan a PostHog.
- [ ] Registro completo funciona en un **Android de gama baja**.
- [ ] Ningún ejercicio roto en los cursos que se van a difundir.
- [ ] La preview del link en WhatsApp se ve bien (título, imagen).

---

## 5. Gamificación: qué mirar

Chou divide la experiencia en cuatro fases. Sirve para ver **dónde no hay nada**:

| Fase | Qué es | En Intervalo | Estado |
|---|---|---|---|
| **Discovery** | por qué lo probaría | el mensaje de WhatsApp, nada más | ⚠️ eslabón débil |
| **Onboarding** | primera sesión, primer logro | wizard de 13 pasos | ⚠️ pierde ~56% |
| **Scaffolding** | el loop diario | XP, racha, multiplicador, push, ranking | ✅ construido |
| **Endgame** | qué retiene al veterano | — | ❌ no existe |

**Discovery es el eslabón más débil y el más barato de mejorar:** el mensaje de
WhatsApp *es* toda la fase. Dos ángulos con Core Drives distintos:

- **Épico (CD1, Epic Meaning)** — le habla a la persona sola con su problema.
  *"Estudiar probabilidad a los ponchazos no funciona."* Funciona con N=1.
- **Social (CD5, Social Influence)** — le habla como miembro de un grupo.
  *"Todos los de la 1.1 rendimos el mismo parcial."*

⚠️ **El copy social promete algo que el producto no puede cumplir el día 1.** Si
decís "a ver si le ganamos a UNC" y el ranking tiene cuatro personas, la promesa
se rompe en el primer segundo. Por eso, si se usa el ángulo social, hay que
apoyarlo en **el grupo de WhatsApp** (que ya existe y es real) y no en el ranking
de la app. Y si el social rinde peor, eso **no** prueba que CD5 no traccione:
queda confundido con "todavía no hay masa crítica".

**Endgame no existe, y está bien** — es la fase correcta para no tener en un MVP.
Pero si H1 se confirma y la curva se aplana, el techo va a aparecer ahí.

Una nota sobre el diseño actual: la racha con multiplicador que se pierde es
**CD8 (Loss & Avoidance)**, un Black Hat driver. Funciona muy bien para el uso
diario, y a la vez hace que perder una racha larga se sienta lo bastante mal como
para abandonar del todo. Vale la pena vigilar **qué pasa el día después de romper
una racha larga**: no requiere instrumentación nueva y puede revelar una fuga que
ninguna métrica agregada muestra.

---

## 6. Cuánto vamos a poder aprender

97 grupos con comisiones de 40-100 personas dan un alcance nominal del orden de
**4.000-8.000 estudiantes**. Pero el alcance nominal no es la muestra: aplicando
el embudo de §1 y una tasa de click de 5-10% (optimista, y **nunca medida** —
nunca hubo un UTM), el rango realista es **~100-350 usuarios completando
onboarding**. Esa tasa de click es, en sí misma, uno de los aprendizajes más
valiosos de la tanda.

Con N en las centenas:

- ✅ **Alcanza para:** H1 a H5; comparar universidades con algo de rigor;
  encontrar el paso exacto donde se traba el onboarding.
- ⚠️ **Al límite para:** comparar variantes de copy de notificación entre sí (7
  categorías con rotación → cada variante ve una fracción chica).
- ❌ **No alcanza para:** efectos de tamaño chico, ni cortes de tres dimensiones a
  la vez (universidad × tier × copy).

**Consecuencia:** con este volumen el lanzamiento ya no es solo "validar o matar
la hipótesis de valor" — alcanza para empezar a afinar. Lo que lo limita esta vez
no es la muestra sino la instrumentación: al mandar solo `utm_source`, buena parte
de ese poder estadístico queda sin usar. Es una decisión consciente, no un
descuido.

### El riesgo de lanzar todo junto

Los grupos de WhatsApp son **munición de un solo uso**: no se puede volver a
postear "che, ahora sí anda" sin quemar credibilidad. Si aparece un bug como el de
julio, se come el lanzamiento entero en vez de una parte.

Mitigación barata que conserva casi toda la ventaja: **postear por tandas con unas
horas de diferencia.** Primero un puñado de grupos, y si en 2-3 horas el embudo se
ve sano en PostHog, van los demás. Cuesta medio día y no sacrifica la
comparabilidad entre universidades.

### Lo que no sale de los números

Ries es explícito: el aprendizaje validado no sale solo del dato.

- **5-8 entrevistas** de 15 minutos con gente que hizo una sesión y no volvió. Son
  los únicos que ninguna métrica explica: el dato dice *que* se fueron, nunca
  *por qué*.
- Leer **a mano** todo el feedback libre y la micro-encuesta. A esta escala, 40
  comentarios leídos uno por uno valen más que cualquier promedio.

---

## 7. Consultas

### PostHog

```sql
-- Embudo por universidad
select coalesce(properties.$initial_utm_source, 'directo')                as universidad,
       uniq(distinct_id)                                                  as llegaron,
       uniqIf(distinct_id, properties.$pathname = '/onboarding')          as vieron_onboarding,
       uniqIf(distinct_id, properties.$pathname = '/onboarding/complete') as completaron,
       uniqIf(distinct_id, properties.$pathname = '/leaderboard')         as vieron_ranking
from events
where event = '$pageview'
  and timestamp > '2026-08-XX'   -- fecha del lanzamiento
group by universidad
order by llegaron desc;

-- Dónde se cae la gente dentro del onboarding (H2)
select properties.$initial_utm_source as universidad,
       properties.step                as paso,
       uniq(distinct_id)              as personas
from events
where event = 'onboarding_step'
group by universidad, paso
order by universidad, personas desc;

-- A/B del orden del apodo: embudo por brazo (experimento onboarding-orden-apodo).
-- `unavailable` = flags sin resolver, no entra en el análisis.
select properties.variant                                as brazo,
       uniq(person_id)                                   as entraron,
       uniqIf(person_id, properties.step = 'motivacion') as llegaron_a_motivacion,
       uniqIf(person_id, properties.step = 'registro')   as completaron,
       round(100.0 * uniqIf(person_id, properties.step = 'registro')
                   / uniq(person_id), 1)                 as pct_completado
from events
where event = 'onboarding_step'
  and timestamp >= '2026-08-12'   -- arranque del experimento
  and properties.variant in ('control', 'test')
group by brazo;

-- Embudo de permiso de push, cortado por plataforma e instalación (H5)
select properties.platform       as plataforma,
       properties.pwa_standalone as instalada,
       properties.result         as resultado,
       uniq(distinct_id)         as personas
from events
where event = 'push_permission'
group by plataforma, instalada, resultado
order by personas desc;

-- Cuánta gente llega a instalar la PWA, por plataforma (H1, H5)
-- Se cuenta por pwa_standalone, no por el evento pwa_install: ver H5.
select properties.platform as plataforma,
       uniqIf(distinct_id, properties.pwa_standalone = true) as instalada,
       uniq(distinct_id)                                     as total
from events
where event = '$pageview'
  and timestamp >= '2026-08-11'
group by plataforma order by total desc;
```

### Postgres

```sql
-- Retención por cohorte semanal (H1)
with cohortes as (
  select id as user_id, date_trunc('week', created_at) as cohorte from users
),
actividad as (
  select distinct s.user_id, date_trunc('week', s.finished_at) as semana
  from sessions s
  where s.finished_at is not null and s.mode in ('main', 'practice')
)
select c.cohorte,
       floor(extract(epoch from (a.semana - c.cohorte)) / 604800)      as semana_n,
       count(distinct a.user_id)                                      as activos,
       (select count(*) from cohortes c2 where c2.cohorte = c.cohorte) as tamano_cohorte
from cohortes c join actividad a on a.user_id = c.user_id
group by 1, 2 order by 1, 2;

-- Abandono de sesión
select mode,
       count(*) filter (where abandoned)               as abandonadas,
       count(*) filter (where finished_at is not null) as completadas,
       round(100.0 * count(*) filter (where abandoned) / nullif(count(*), 0), 1) as pct_abandono
from sessions group by mode order by 1;

-- Efectividad de push por categoría (H4, H5)
select ns.category, ns.variant_key,
       count(*)                                          as enviadas,
       count(ns.opened_at)                               as abiertas,
       round(count(ns.opened_at)::numeric / count(*), 3) as tasa_apertura,
       count(distinct s.user_id)                         as con_sesion_30min
from notification_sends ns
  left join sessions s on s.user_id = ns.user_id
    and s.started_at between ns.sent_at and ns.sent_at + interval '30 minutes'
group by 1, 2 order by enviadas desc;

-- Fuga post-ruptura de racha (§5)
select u.streak_days,
       count(*) filter (where s.finished_at > u.streak_last_date + interval '2 days') as volvieron
from users u left join sessions s on s.user_id = u.id
where u.streak_last_date is not null and u.streak_last_date < current_date - 2
group by 1 order by 1 desc;
```

### Cruzar los dos

La clave es `users.clerk_user_id` ↔ `distinct_id` de PostHog. Para segmentar el
aprendizaje por origen: sacar de PostHog los `distinct_id` por
`$initial_utm_source` y filtrar `users.clerk_user_id in (...)` en Postgres.

> **`sessions.mode`** incluye `onboarding` (ejercicio de prueba) y `test` (QA
> interno) además de `main` y `practice`. **Filtrar siempre**, o los números salen
> inflados.

---

Última actualización: 2026-08-11
