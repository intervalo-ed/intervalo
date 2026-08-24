# Informe — dónde inyectar ejercicios con tabla en `algebra`, con foco en la primera sesión

> **Estado: ejecutado (ago-2026).** Se escribieron **30 ejercicios con tabla** en cinco de
> los seis topics de `white/aritmetica`, más las correcciones de auditoría del §8. Lo que
> se decidió y lo que quedó afuera está al final, en el §9. **El §8 tenía un error sobre
> `absolute_value` y está corregido abajo.**

Convención de evidencia, la misma de `table-format-context.md`:
**[COD]** = verificado leyendo el código o el contenido del repo · **[LIT]** = fuente primaria leída
(literatura pedagógica o material de cátedra) · **[INF]** = inferencia razonada.

---

## 1. Resumen ejecutivo

1. **La "primera unidad" no es la unidad de análisis correcta. La ventana real de la primera
   sesión son 8 *units* concretas, y las tengo identificadas una por una** (§2). Dos de los tres
   topics que `table-format-context.md` §3.3 marca como mejor encaje —`scientific_notation`
   (*fuerte*) y `logarithms` (*fuerte*)— **quedan afuera de la primera sesión**. Ese es el hallazgo
   que más cambia el plan.
2. **`powers` es el único topic que combina "mejor encaje del formato" con "está garantizado en la
   primera sesión"**. Es el objetivo prioritario, y dentro de él `FORM` es el host natural.
3. **`fracciones` no está analizado en `table-format-context.md` y sin embargo es el topic #1, con
   sus 3 skills garantizadas en la primera sesión.** Este informe lo analiza por primera vez
   (§4.1): entra, pero **solo por la puerta de `cell`/desglose**, no por la de patrón.
4. **"Un par" no alcanza, y la aritmética es implacable** (§3.3). El ejercicio de cada unit se
   sortea `random.choice` sobre un pool de 15. Inyectar 2 tablas en 3 units da **~31% de chance de
   que el alumno vea una tabla en su primera sesión**. Para pasar el 50% hacen falta ~20 ejercicios
   con tabla, o un cambio de producto.
5. **Hay una palanca de producto que sí garantiza el 100% y cuesta poco: el ejercicio de prueba del
   onboarding** (§6.3). Para `algebra` es un ítem de potencias hardcodeado en el front que el
   usuario ve **antes** de registrarse. Convertirlo en tabla pone el formato en la primerísima
   impresión, sin depender del sorteo.
6. **El inventario de `probabilidad` da tres patrones reutilizables, no uno** (§3.2). El que más
   viaja no es el de patrón (`n → f(n)`) sino el de **desglose en modo `cell`**, que no necesita
   una familia parametrizada por un entero y por eso abre topics que el análisis original
   descartaba.
7. **El relevamiento curricular (12 fuentes primarias) devuelve un hallazgo incómodo y hay que
   mirarlo de frente: en ninguna guía argentina hay una sola tabla en potencias, radicales,
   logaritmos, notación científica, fracciones o valor absoluto** (§5.1). Las tablas sí son
   canónicas, pero en Funciones y Trigonometría. **El precedente local apunta a `logarithms` y
   `scientific_notation` —los dos fuera de la primera sesión—, no a `powers` ni a `fracciones`.**
   El canje que se está haciendo es alcance en la sesión 1 a cambio de calidad de respaldo, y
   conviene hacerlo con los ojos abiertos.
8. **El relevamiento aporta dos reglas editoriales nuevas** (§5.4), sacadas de que dos cátedras de
   ingreso desaconsejan por escrito la tabla-contenedor-de-cálculos: la tabla se justifica cuando el
   patrón **no** se deduce de los parámetros, y el ítem tiene que pedirle algo a la tabla **como
   conjunto**. Coinciden de forma independiente con la doctrina anti-descarte de R71.
9. **Recomendación**: 7 ejercicios en 3 units (`powers/FORM` ×3, `powers/RESL` ×2,
   `fracciones/RESL` ×2) como ronda 1, más la decisión de producto sobre el onboarding. Detalle y
   diseños ya verificados contra A1/A2/A3 en §6.

---

## 2. La ventana real de la primera sesión

Esto es lo que hay que tener claro antes de decidir dónde inyectar. Todo **[COD]**.

### 2.1 Qué se desbloquea

`ACTIVE_CAP_DEFAULTS["algebra"] = 12` ([session_store.py:664](backend/session_store.py:664)).
`_ensure_active_units` desbloquea topics **enteros** en orden de catálogo, y **frena** (no saltea)
si el próximo no entra completo.

Orden real de `white/aritmetica` en `course.json`, con sus skills:

| # | Topic | Skills (en orden) | Units acumuladas |
|---|---|---|---:|
| 1 | `fracciones` | LEXI, ESTR, RESL | 3 |
| 2 | `powers` | LEXI, RESL, FORM | 6 |
| 3 | `radicals` | LEXI, RESL, FORM | 9 |
| 4 | `logarithms` | LEXI, RESL, FORM | **12 = cap** |
| 5 | `scientific_notation` | FORM, RESL | ❌ no se desbloquea |
| 6 | `absolute_value` | FORM, RESL | ❌ no se desbloquea |

**Consecuencia directa:** `scientific_notation`, que `table-format-context.md` §3.3 califica de
encaje *fuerte* ("tabla de órdenes de magnitud: es calibración"), **es inalcanzable el día uno**.
Sigue siendo un buen candidato, pero no sirve al objetivo de retención post-primera-sesión.

### 2.2 Qué se sirve

`session_size` default = 8 ([models.py:146](backend/models.py:146),
[algorithm/config.py:26](algorithm/config.py:26)). `build_session`
([algorithm/session.py:32](algorithm/session.py:32)) ordena por `(no-es-nueva, next_review)` y
**corta en 8**. Para un usuario virgen las 12 units son nuevas y vencen hoy, así que el orden es el
de creación —que es el de catálogo— y **la primera sesión son las primeras 8 units de la tabla de
arriba**.

`min_distance_same_topic = 2` solo reordena después del corte; no cambia qué units entran.

### 2.3 Las 8 units, y el efecto del ejercicio de onboarding

`_INTRO_ITEM_BY_COURSE["algebra"] = (white/powers, "LEXI")`
([session_store.py:361](backend/session_store.py:361)): el ejercicio de prueba del wizard **es** el
ítem `powers/LEXI`, y su resultado se persiste con SM-2. Acierto al primer intento → agendado para
mañana → **sale** de la primera sesión. Fallo → queda para hoy.

| Escenario | Las 8 units de la primera sesión |
|---|---|
| **A — acertó el onboarding** (mayoría esperada) | `fracciones` LEXI·ESTR·RESL · `powers` RESL·FORM · `radicals` LEXI·RESL·FORM |
| **B — falló el onboarding** | `fracciones` LEXI·ESTR·RESL · `powers` LEXI·RESL·FORM · `radicals` LEXI·RESL |

**Garantizadas en los dos escenarios (7 units)** — y por eso son el único blanco legítimo si el
objetivo es la primera sesión:

> `fracciones/LEXI` · `fracciones/ESTR` · `fracciones/RESL` · **`powers/RESL`** · **`powers/FORM`** ·
> `radicals/LEXI` · `radicals/RESL`

`radicals/FORM` entra solo en el escenario A; `powers/LEXI` solo en el B. **`logarithms` no aparece
en ninguno de los dos.**

> ⚠️ **Salvedad honesta:** `_load_unit_states` consulta `UnitState` sin `ORDER BY`, así que el orden
> de catálogo se sostiene por orden de inserción (id), que es lo que pasa en la práctica pero no
> está garantizado por contrato. Antes de escribir contenido conviene confirmarlo empíricamente con
> un usuario nuevo real. Si el orden fuera otro, cambia **qué** units son la ventana, no el
> razonamiento.

---

## 3. Qué tenemos hoy, y qué se puede reusar

### 3.1 El formato es agnóstico del curso **[COD]**

`seed_content.py` serializa `table` sin mirar el curso
([seed_content.py:104](backend/seed_content.py:104)), y `check_tables` corre con
`--course <curso>`. No hace falta ningún cambio de código para llevar tablas a `algebra`.

### 3.2 Los tres patrones que dejó `probabilidad` **[COD]**

17 ejercicios con tabla en `probabilidad/white/conteo`, y **no son un solo patrón sino tres**:

| Patrón | Modo | Slug de tag | Dónde vive | Qué pide |
|---|---|---|---|---|
| **Patrón** | `column` | `patron-tabla`, `cociente-tabla`, `recursiva-tabla` | `reglas/FORM`, `factoriales/FORM` | La expresión que genera la columna. La fila simbólica `n → ?` es el corazón |
| **Desglose** | `cell` | `total-desde-tabla`, `regla-desde-tabla` | `reglas/RESL`, `reglas/ESTR` | La tabla lista los pasos y sus opciones, deja `Total` vacío. El alumno calcula/elige |
| **Valor** | `cell` | `valor-desde-tabla` | `factoriales/RESL` | Falta una celda del medio; se calcula |

**El patrón de desglose es el más transferible, y es el que el análisis original subestimó.** No
necesita una familia parametrizada por un entero: solo necesita que el enunciado tenga datos
enumerables por etapas. Eso lo vuelve aplicable a topics de `algebra` que §3.3 de
`table-format-context.md` ni menciona —empezando por `fracciones`.

Nota de precedente: `reglas/topic-context.md` dejó `regla-desde-tabla` (modo `cell` sobre `ESTR`)
con **cupo deliberadamente chico, 2, como piloto**, porque `ESTR` es la skill de modelado y ahí la
tabla regala parte del trabajo. Ese criterio se hereda tal cual.

### 3.3 La aritmética del sorteo — el número que hay que mirar **[COD]**

`get_exercise_db` hace `random.choice` sobre el pool de la unit, excluyendo lo ya servido
([exercise_bank.py:176](backend/exercise_bank.py:176)). Los 16 archivos de `white/aritmetica` tienen
**exactamente 15 ejercicios cada uno**.

Para un usuario virgen, si inyectamos $k$ tablas en una unit, la chance de que **esa** unit sirva
una tabla es $k/(15+k)$. Con tablas repartidas en varias units:

$$P(\text{al menos una tabla en la sesión 1}) = 1 - \prod_i \frac{15}{15+k_i}$$

| Inyección | P(ve una tabla en la sesión 1) |
|---|---:|
| 2 tablas en 1 unit | **11,8 %** |
| 2 tablas en 3 units (la lectura literal de "un par") | **31,3 %** |
| 2 tablas en 5 units | **46,5 %** |
| 3 en `powers/FORM` + 2 en `powers/RESL` + 2 en `fracciones/RESL` | **35,1 %** |
| 4 tablas en 5 units (20 ejercicios) | **69,3 %** |

**Esta tabla es la que hay que discutir antes de escribir una sola línea de contenido.** El pedido
—"meter un par para mejorar la retención post-primera-sesión"— entrega, en el mejor de los casos,
un tercio de las primeras sesiones con variedad de formato. **[INF]** Si el objetivo es que la
variedad sea parte confiable de la primera impresión, la inyección de contenido sola no lo logra a
un costo razonable: hace falta la palanca de §6.3.

---

## 4. Encaje topic por topic, dentro de la ventana

Reevaluación de `table-format-context.md` §3.3 restringida a lo que la primera sesión alcanza, y
cruzada con las sub-familias reales de cada `topic-context.md`.

### 4.1 `fracciones` — topic #1, no analizado hasta ahora

Skills: `LEXI`, `ESTR`, `RESL`. **No tiene `FORM`**, que es el host natural del formato. Ese solo
dato ya explica por qué el análisis original lo salteó.

| Skill | Veredicto | Razón |
|---|---|---|
| `LEXI` | ❌ **no** | Sus 3 sub-familias son identificación visual (`identificar-fraccion-compuesta`, `signo-equivalente`, `fraccion-simplificada`). Una tabla no agrega nada: el objeto ya está a la vista en la opción |
| `ESTR` | ⚠️ **piloto ≤2, o nada** | Es la skill de modelado, la contraindicación nº1 del formato. Mismo criterio que `regla-desde-tabla`. **Mi recomendación es dejarlo en 0 en la ronda 1** y reevaluar con datos |
| `RESL` | ✅ **sí, modo `cell`** | `resl-fraccion-compuesta` es literalmente "repartos sucesivos en etapas": la tabla lista las etapas y deja el resultado vacío. Idéntico en forma a `total-desde-tabla` |

**El riesgo específico de `fracciones`** **[INF]**: las celdas llevan fracciones, y R74 avisa que la
altura del encabezado se decide una sola vez para todo el ejercicio cuando algún estado posible
lleva fracción. Hay que fijarla arriba desde el diseño, no descubrirlo en el testeo.

### 4.2 `powers` — el objetivo prioritario

Skills: `LEXI`, `RESL`, `FORM`. `table-format-context.md` §3.3 lo marca **muy fuerte**, y §2.4 le
dedica la familia de explosión entera con su evidencia (Wagenaar & Sagaria 1975: el crecimiento
exponencial se subestima groseramente, y **ni la instrucción explícita ni la experiencia cotidiana
mejoran las extrapolaciones**). **[LIT]**

| Skill | Veredicto | Razón |
|---|---|---|
| `LEXI` | ❌ **no** | `identificar-base-exponente` y compañía son vocabulario. Además solo aparece en el escenario B (el alumno falló el onboarding) |
| `RESL` | ✅ **sí, modo `cell`** | `resl-cadena-igual-base` desglosa una cadena de producto/cociente por etapas; el resultado va en la fila vacía |
| `FORM` | ✅✅ **sí, modo `column` — el mejor encaje del curso** | Ver abajo |

**Ojo con un detalle de diseño en `powers/FORM`:** sus 3 sub-familias actuales son todas
*"elegir qué propiedad aplicar primero"*, o sea decisión de estrategia, **no** "qué expresión genera
esta columna". Una tabla de patrón **no encaja en ninguna sub-familia existente**: hay que abrir una
sub-familia nueva en el `topic-context.md`, no colgarla de una que ya está. Es exactamente lo que se
hizo en `reglas/FORM`.

### 4.3 `radicals` — entra en la ventana, pero el formato rinde poco

`table-format-context.md` §3.3 lo marca **medio**: "salidas irracionales salvo que se elijan
cuadrados perfectos". Confirmado contra sus sub-familias reales (`resl-simplificar-radical`,
`resl-racionalizar`, `resl-combinar-radicales-semejantes`): son todas manipulación simbólica de una
expresión, no familias parametrizadas por un entero.

**[INF]** Se podría forzar un desglose en `radicals/RESL` (etapas de una simplificación), pero
compite mal contra `powers` por el mismo cupo de trabajo y no aporta el argumento pedagógico del
formato. **Recomendación: afuera de la ronda 1.**

### 4.4 Fuera de la ventana, para tenerlo anotado

- **`logarithms`** (topic #4): encaje *fuerte* según §3.3, y su `RESL` ya trabaja escala de Richter
  y decibeles —contextos de calibración logarítmica, justo lo que pide §2.4—. **No llega a la
  primera sesión**, pero es el mejor candidato de la ronda 2.
- **`scientific_notation`** (topic #5): encaje *fuerte*, órdenes de magnitud. No se desbloquea el
  día uno. Ronda 2.
- **`absolute_value`** (topic #6): sin encaje. Es una función definida por casos, no una familia
  paramétrica.

---

## 5. Relevamiento curricular UBA / UTN / UNLP

Relevamiento propio de esta ronda: **12 fuentes primarias leídas** (guías de TP, cuadernillos de
ingreso, programas analíticos) de UBA-CBC, UTN (FRBA, FRBB, FRRQ, FRLP, FRN, FRT) y UNLP. Los PDFs
y los textos extraídos quedaron en el scratchpad de la sesión, junto con los scripts de descarga y
barrido, por si hay que re-correrlo.

### 5.1 El hallazgo que hay que digerir primero

> **En las 12 fuentes leídas no hay una sola tabla en ninguna unidad de potencias, radicales,
> logaritmos, notación científica, fracciones o valor absoluto.** Sin excepción. **[LIT]**

Las tablas **sí** son un tipo de ejercicio canónico en las guías argentinas —encontré 7 géneros
distintos—, pero viven casi exclusivamente en **Funciones** y **Trigonometría**. Concretamente:

- Cero tablas en la Práctica 0 (aritmética) de CBC Matemática 51.
- Cero ocurrencias de "tabla" en todo el Módulo I (Números Reales, 188 pp) de UTN FRBB, que sí
  tiene secciones propias de notación científica y valor absoluto.
- Cero ocurrencias de "tabla" en la guía de práctica completa de UTN FRLP (23 pp).
- Cero tablas de órdenes de magnitud en todo el corpus.
- Cero ejercicios de patrones/regularidades que pidan la fórmula general, salvo dos, y los dos
  están en la unidad de Funciones de FRBB.

**Cómo leer esto, honestamente.** Es un arma de doble filo y conviene no elegir el filo cómodo:

- A favor: es un **hueco real**, no un terreno ocupado. Y **[INF]** hay una explicación benigna
  plausible —una tabla a completar ocupa mucho papel y no se puede autocorregir en una guía
  impresa—, lo que haría del hueco un artefacto del medio y no un juicio didáctico. **Pero no
  encontré ninguna fuente que lo diga**, así que es inferencia, no evidencia.
- En contra: no podemos justificar tablas en `powers` o `fracciones` diciendo "es lo que hacen las
  cátedras". No lo es. La justificación tiene que venir de la literatura pedagógica de
  `table-format-context.md` (§2.4, el sesgo de subestimación exponencial), no del relevamiento.

### 5.2 Dónde el corpus SÍ tiene precedente, y no coincide con la ventana de la primera sesión

Los tres mejores precedentes locales, ordenados por qué tan cerca están de nuestro formato:

**1. UTN FRRQ, Cuadernillo, Ejercicio 22** (p. 25) **[LIT]** — el mejor candidato de todo el
relevamiento, y es de `logarithms`:

```
log 267 =    log 26,7 =    log 2,67 =
log 0,267 =  log 0,0267 =  log 0,0008 =
```

La primera fila está construida para que el alumno **descubra que las tres comparten la parte
decimal y solo difieren en el entero**. Es una tabla de patrón sobre la estructura del logaritmo
decimal, aunque la consigna no lo diga. **[INF]** La disposición es demasiado sistemática para ser
casual, pero la fuente no lo explicita.

**2. UTN FRRQ, tabla logaritmo ↔ exponencial** (p. 21) **[LIT]** — dos columnas que enseñan una
traducción (`log_5 25 = 2` ↔ `5² = 25`). Portable directo: se da una columna y se pide la otra.

**3. UTN FRBB, Módulo II actividad 2** (p. 69) **[LIT]** — el único ejercicio del corpus que es
literalmente nuestro formato patrón en papel:

> "Si colgamos un resorte por un extremo y aplicamos un peso en el otro, se produce un alargamiento
> como se indica en la tabla. […] Establecé, si existe, **la relación entre peso (p) y alargamiento
> (l)**"

Tabla entrada-salida, relación lineal exacta, consigna que pide la fórmula. Pero está en
**Funciones**, o sea territorio de `analisis`, no de `algebra/white`.

**Consecuencia para el plan:** el precedente curricular apunta a `logarithms` y a
`scientific_notation` —los dos **fuera** de la primera sesión (§2.1)—, no a `powers` ni a
`fracciones`. Esto no invalida la propuesta de §6, pero sí obliga a decir en voz alta qué se está
canjeando: **alcance en la sesión 1 a cambio de calidad de respaldo**.

### 5.3 Un segundo género de tabla que no teníamos identificado

Además de la tabla de valores, el corpus usa intensivamente el **cuadro de propiedades**: filas =
objetos, columnas = atributos. Y aparece en materias universitarias, no solo en el ingreso:

- **UTN FRBA, AGA, Guía de TP, Ejercicios 2 y 3** (números complejos) **[LIT]**. El Ej. 2 tiene
  columnas `BINÓMICA | POLAR | EXPONENCIAL` y **huecos distribuidos irregularmente** —cada fila da
  una representación y pide las otras dos—, que es un diseño más rico que "completá la última
  columna". El Ej. 3 (`z | |z| | arg(z) | z⁴ | z⁶ | ⁴√z`) agrega una consigna interpretativa:
  *"interprete geométricamente los resultados obtenidos en la sexta columna"*.
- **UTN FRRQ, Ejercicio 1 de polinomios** **[LIT]**: *"consignando **si, no, o el número que
  corresponda**"* — columnas de tipos mixtos (booleano y numérico) en la misma tabla.
- **UNLP** declara los cuadros como recurso metodológico: *"se incluyeron cuadros con resúmenes […]
  la comparación de similitudes o diferencias que ayudan a la interpretación"* **[LIT]**.

**[INF]** Esto legitima el formato tabla para `violet/matrices` y `brown/spaces` mucho más de lo que
`table-format-context.md` §3.3 sugería (ahí `vectors/*` figura como *débil* y el resto como *medio*).
No es alcance de esta ronda, pero conviene anotarlo antes de que se pierda.

### 5.4 La advertencia que dos cátedras dejan por escrito

Éste es el aporte más útil del relevamiento para el diseño, y coincide de forma independiente con
la doctrina anti-descarte de R71.

**UTN FRN** repite como consigna *"graficar **sin tabla de valores**"* para lineales, cuadráticas en
forma canónica y módulo —donde el comportamiento se deduce de los parámetros— y en cambio pide
*"graficar **ayudándose con una tabla de valores**"* para exponenciales y logarítmicas **[LIT]**.

**UTN FRLP** lo dice conceptualmente **[LIT]**:

> "Las funciones se utilizan como herramienta para modelizar una situación problemática. **No se
> trata de una tabla de valores, no es una expresión simbólica, no es un gráfico. Es todo lo
> anterior de manera integrada.**"

Y los mejores ejemplares del corpus (FRBA AGA Ej. 3, FRRQ Ej. 22, FRBB resorte) **siempre le piden
algo a la tabla como conjunto**, nunca celda por celda.

**De acá salen dos reglas editoriales que conviene adoptar** y que hoy no están escritas en ningún
lado nuestro:

> **T-a.** La tabla se justifica cuando el patrón **no se deduce de la fórmula o de los parámetros**.
> Si el alumno puede leer la respuesta del enunciado sin mirar la tabla, la tabla es decoración.
>
> **T-b.** El ítem le pide algo a la tabla **como conjunto**, no el relleno de una celda. Es la
> versión editorial de lo que A1 (fila trampa) impone aritméticamente.

### 5.5 Errores documentados, citables para `feedback_incorrect`

Los que están en fuente primaria y sirven para la ventana de la primera sesión:

| Confusión | Fuente **[LIT]** | Topic |
|---|---|---|
| $(x+a)^2 = x^2+a^2$, refutado con contraejemplo numérico completo ($x=5$, $a=2$: $49 \neq 29$) | UNLP, *Curso de Nivelación*, p. 91 | `powers` |
| $(2+x)^2 = 4+x^2$ y $= 4x^2$, como distractores de multiple choice sin avisar que son errores | UBA CBC Mat. 51, Práctica 0, Ej. 4a | `powers` |
| $\dfrac{4}{2+2a} = \dfrac{2}{1+2a}$ (cancelar un solo sumando del denominador) y $= \dfrac{4}{2}+\dfrac{4}{2a}$ (distribuir la división sobre la suma) | UBA CBC Mat. 51, Práctica 0, Ej. 4c | `fracciones` |
| $\dfrac{5+b}{5} = b$ (cancelar el 5 contra el sumando) | UBA CBC Mat. 51, Práctica 0, Ej. 4e | `fracciones` |
| "que tenga el signo $-$ adelante no significa que sea negativo, ya que dependerá qué signo tenga $n$" (sobre $a^{-n}$) | UNLP, *Curso de Nivelación*, p. 39 | `powers` |
| $-3^3$ vs $(-3)^3$, $-2^4$ vs $(-2)^4$, contrastados como ítems consecutivos a propósito | UBA CBC Mat. 51, Práctica 0, Ej. 1 | `powers` |
| "No se puede dividir por cero" elevado a ítem propio del programa oficial | UTN FRT, Programa SU 2025, Módulo 2 | `fracciones` |

**Dos hallazgos negativos que hay que registrar**, porque afectan a los distractores que propone
§6.2:

- **$\log(a+b) = \log a + \log b$: no encontrado en ninguna fuente** **[LIT]**.
- **Confundir $2^n$ con $n^2$: no encontrado en ninguna fuente** **[LIT]**.

O sea: **la familia de distractores $\{2^n, 2n, n^2\}$ que R71 recomienda no tiene respaldo
documental argentino.** Su respaldo es la literatura de §2.4 (Wagenaar & Sagaria 1975; Thomas, Kapp
& Pöhler 2026) y la aritmética de la fila trampa, no el relevamiento. Es evidencia suficiente, pero
es de otra clase y conviene no confundirlas.

**Observación lateral con valor propio:** la mitad de los errores documentados en fuente primaria
son de **fracciones**, no de potencias, y los tres distractores del CBC (4c, 4e) son de altísima
calidad. **Vale una auditoría aparte de si `fracciones` los cubre**, independiente de todo el tema
tablas.

### 5.6 Contextos verificados, para no inventarlos

Contextos reales usados por las cátedras y accesibles a cualquier carrera (registro Paenza), útiles
para los ítems de §6:

- **Crecimiento / duplicación**: población de una región $300\cdot(1{,}02)^t$ (CBC Mat. 51, P4
  Ej. 22); bacterias en cultivo (FRRQ; FRLP práctica Ej. 4); población de una ciudad con
  duplicación (FRLP Ej. 5). **[LIT]**
- **Decaimiento**: enfriamiento de un jarro de agua en una habitación a 20 °C (CBC Mat. 51, P4
  Ej. 23) — **el mejor contexto de decaimiento del corpus para nuestro Diseño 2**, porque no exige
  explicar "vida media". Decaimiento radiactivo (FRRQ) queda como segunda opción. **[LIT]**
- **Órdenes de magnitud** (para la ronda 2, `scientific_notation`): edad del universo
  $1{,}5\times10^{10}$ años y diámetro del electrón $10^{-12}$ mm (FRBB §1.7); masa del átomo de
  carbono (FRRQ); Voyager a Neptuno; distancia Tierra–Sol; bacterias por mm³ de vacuna. **[LIT]**
- **Escala Richter**: un solo ejercicio en todo el corpus (FRRQ, cap. 4, Ej. 7). Nuestro
  `logarithms/RESL` ya usa Richter y decibeles, o sea que **estamos por encima del corpus en ese
  contexto, no por debajo**. **[LIT]**

**Hueco del corpus, para tenerlo en cuenta:** no hay **un solo ejercicio de interés compuesto** en
las 12 fuentes, pese a ser el contexto canónico de exponenciales en la literatura anglosajona.
Tampoco pH ni decibeles (salvo lo nuestro). Si usamos interés compuesto no tenemos respaldo local,
aunque sea accesible.

### 5.7 Notación — lo que hay que respetar o auditar

| Aspecto | Convención argentina verificada **[LIT]** | Estado nuestro |
|---|---|---|
| Logaritmo base 10 | **`\log` sin base**. FRRQ lo enuncia como regla explícita: *"la convención es omitir el número 10"* | auditar `logarithms` |
| Logaritmo natural | **`\ln`** universal; ninguna fuente usa $\log_e$ como notación de trabajo | ok |
| Notación científica | **`\times`** (FRRQ, UNLP) vs `.` (FRBB, FRLP). El `\times` es el de la definición formal y el más frecuente | ronda 2 |
| El exponente del 10 | se llama **"orden"** (FRRQ, textual) | vocabulario para la ronda 2 |
| Intervalos | **punto y coma**: $(9; +\infty)$, $[0; 2\pi]$ — porque la coma ya es el separador decimal | **auditar todo `algebra`** |
| Valor absoluto | **"módulo"** es sinónimo activo en el CBC, y ahí se define **como distancia al 0**, no por casos | `absolute_value` usa la def. por casos |
| MCD / MCM | UNLP escribe **`M.C.D.`** y **`m.c.m.`**, con esa distinción de mayúsculas | auditar `fracciones` |

Dos de estas filas son deuda que excede este informe y conviene levantar como tarea aparte: **la
notación de intervalos con punto y coma** (si en algún lado usamos coma, desafina fuerte en material
rioplatense) y la **doble definición de valor absoluto** (distancia vs. casos), que producen
ejercicios distintos y donde el enfoque-distancia del CBC es el más generativo.

### 5.8 Dos datos de encuadre que valen aparte

**a) Nuestra unidad 1 no existe en ninguna materia universitaria de álgebra.** Ni en el programa de
UTN FRBA AGA, ni en las prácticas de CBC Álgebra 27, ni en UNLP Álgebra **[LIT]**. Vive en dos
lugares: una "Práctica 0: Preliminares" y el curso de ingreso. Y el CBC lo dice con todas las letras
en la Práctica 0 de Álgebra A (62) **[LIT]**:

> "**Nota a los alumnos.** Los temas que se incluyen en esta práctica **se suponen conocidos por
> ustedes** y, debido a que éstos serán necesarios a lo largo de todo el curso, es fundamental que,
> a modo de repaso, resuelvan estos ejercicios consultando bibliografía y/o al docente."

Ésa es, literalmente, la posición institucional que define el nicho de Intervalo: la aritmética no
se enseña, se repasa, y la responsabilidad se transfiere al estudiante.

**b) Corrección de códigos del CBC**, para no seguir citándolos mal: **27 = Álgebra** (Exactas e
Ingeniería), **62 = Álgebra A** (Ingeniería), **71 = Álgebra** (Económicas), **51 = Matemática**
(cátedra única), **61 = Matemática** (Agronomía y Biología), **66 = Análisis Matemático**, **72 =
Análisis Matemático** (Económicas). No existen "Matemática 27" ni "Álgebra 28" **[LIT]**.

**c) Divergencia fuerte entre cátedras de ingreso:** los logaritmos **no existen** en el cuadernillo
de UTN FRBB (188 pp), ni en UNLP *Matemática inicial* (313 pp), ni en UNLP *Curso de Nivelación*
(213 pp), ni en el programa de UTN FRT **[LIT]**. Y UNLP tampoco enseña notación científica. Si
nuestro `white/aritmetica` los incluye, no es por alineación con esas cátedras.

### 5.9 Qué quedó sin verificar

- **UTN FRBA, guía de AGA: extracción parcial** (21 mil caracteres de 80 páginas, fuentes que el
  extractor no pudo decodificar). Los dos ejercicios de "complete el cuadro" son reales, pero
  **puede haber más tablas que no se vieron**. Re-extraer antes de sacar conclusiones cuantitativas.
- **UTN FRN**: extracción con acentos y símbolos degradados; no se pueden transcribir enunciados con
  fidelidad.
- **CBC Álgebra A (62) y Matemática (61)**: solo se leyó la primera página de cada Práctica 0. **No
  se puede afirmar que no tengan tablas.**
- **No relevado**: UBA XXI, CBC Análisis (66/72), prácticas 1–7 de Álgebra 27, UNC, UNGS, UNQ, y las
  guías de UNLP Matemática A.
- **UTN FRRO**: PDF caído (404).

---

## 6. Propuesta concreta

### 6.1 Qué inyectar, dónde y cuánto

| # | Unit | Modo | Sub-familia nueva (slug propuesto) | Cant. | Justificación |
|---|---|---|---|---:|---|
| 1 | `powers/FORM` | `column` | `patron-tabla-crecimiento` | 2 | Familia de explosión, §2.4. El mejor encaje del curso |
| 2 | `powers/FORM` | `column` | `patron-tabla-decaimiento` | 1 | Exponente negativo, que es donde el topic ya diagnostica más confusiones |
| 3 | `powers/RESL` | `cell` | `cadena-desde-tabla` | 2 | Desglose de `resl-cadena-igual-base` |
| 4 | `fracciones/RESL` | `cell` | `etapas-desde-tabla` | 2 | Desglose de `resl-fraccion-compuesta` |
| | **Total** | | | **7** | |

Las 3 units son de las 7 garantizadas en los dos escenarios de §2.3. **P(ver una tabla en la sesión
1) = 35,1 %.**

**Qué NO hacer en esta ronda**, y la razón por escrito para que no se "arregle" después:
`fracciones/ESTR` (contraindicación de modelado, ver §4.1), `fracciones/LEXI` y `powers/LEXI` (la
tabla no agrega nada a identificación), `radicals/*` (rinde poco, §4.3), `logarithms` y
`scientific_notation` (buenos, pero fuera de la primera sesión).

**Y una contraindicación nueva, que el relevamiento hizo visible.** UNLP tiene un cuadro teórico
*"propiedades de las operaciones con potencias de base real y exponente racional"*, con filas
`Producto de igual base | a^(m/n)·a^(p/q) = …` **[LIT]**. Es lo más cerca que llega el corpus a
tabular `powers`, y por eso es tentador convertirlo en un ítem a completar. **No hacerlo.** Sería
memorización tabulada: la tabla no revelaría nada que la fórmula no diga ya, que es exactamente lo
que la regla T-a de §5.4 prohíbe. Es el mismo error de categoría que §3.4 de
`table-format-context.md` describe para las matrices —confundir "mostrar un objeto" con "usar el
campo `table`"—, aplicado a las propiedades.

**El canje que se está haciendo, explícito** (§5.2): esta ronda va a `powers` y `fracciones` porque
son lo que la primera sesión alcanza, no porque sean lo mejor respaldado. El respaldo de `powers`
es la literatura de §2.4 (el sesgo de subestimación exponencial), sólido pero de otra clase que el
precedente curricular. Los ítems mejor respaldados del relevamiento —la tabla de mantisa de FRRQ y
la de traducción log↔exponencial— son de `logarithms`, y quedan para la ronda 2.

### 6.2 Diseños ya verificados contra A1/A2/A3

Los dos de `column` son los que tienen restricción aritmética dura, así que los dejo resueltos.

**Diseño 1 — `patron-tabla-crecimiento`** (contexto: capas de una hoja que se dobla)

| $n$ | capas | ← visible |
|---:|---:|---|
| 2 | 4 | **fila trampa** |
| 3 | 8 | fila decisiva |
| 5 | — | |
| $n$ | — | fila simbólica |

Opciones: $2^{n}$ (correcta) · $2n$ · $n^{2}$.

- **A1 ✓** en $n=2$: $2^2 = 2\cdot 2 = 2^2 = 4$, las tres dan $4$. Es la familia canónica que R71
  recomienda.
- **A2 ✓** los dos distractores coinciden con la correcta en $n=2$.
- **A3 ✓** en $n=3$: $8$ vs $6$ vs $9$, los tres se separan.
- **R72 ✓** entradas $2,3,5$: no consecutivas, espaciado irregular (fórmula cerrada).

**Diseño 2 — `patron-tabla-decaimiento`** (contexto: señal que pierde la mitad de intensidad por
tramo)

| $n$ | fracción de la intensidad | ← visible |
|---:|---:|---|
| 1 | $1/2$ | **fila trampa** |
| 3 | $1/8$ | fila decisiva |
| 4 | — | |
| $n$ | — | fila simbólica |

Opciones: $2^{-n}$ (correcta) · $\dfrac{1}{2n}$ · $\dfrac{n}{2}$.

- **A1 ✓** en $n=1$: $2^{-1} = \tfrac{1}{2\cdot 1} = \tfrac{1}{2}$, las tres dan $1/2$.
- **A2 ✓** los dos coinciden en $n=1$.
- **A3 ✓** en $n=3$: $1/8$ vs $1/6$ vs $3/2$, los tres se separan.
- **R72 ✓** entradas $1,3,4$: no consecutivas.
- Los dos distractores son errores reales ya listados en el `topic-context.md` de `powers`:
  aplicar el negativo al denominador sin invertir la base, y leer "la mitad $n$ veces" como
  división por $n$.
- ⚠️ Las celdas llevan fracción → fijar la altura del encabezado desde el diseño (R74).

> **Cuidado con no repetir a `probabilidad`:** `reglas/FORM` ya tiene un ítem de códigos de barras
> con exactamente $\{2^{n}, 2n, n^{2}\}$ y trampa en $n=2$. La aritmética es la misma —es la familia
> que R71 recomienda— pero el **contexto tiene que ser otro**, y los dos cursos no se cruzan en la
> misma sesión.

**Procedencia de los distractores, dicha con precisión** (§5.5): la familia $\{2^{n}, 2n, n^{2}\}$
**no tiene respaldo documental argentino** —confundir $2^n$ con $n^2$ no aparece en ninguna de las
12 fuentes—. Su respaldo es la literatura de §2.4 y la aritmética de la fila trampa. En cambio los
distractores del Diseño 2 (aplicar el negativo sin invertir la base) **sí** tienen respaldo:
UNLP advierte textualmente que *"que tenga el signo $-$ adelante no significa que sea negativo"*
**[LIT]**. Los dos son válidos, pero son evidencia de distinta clase y conviene no mezclarlas al
justificar el diseño.

**Contextos con respaldo verificado** para estos ítems, en vez de inventarlos (§5.6): para el
crecimiento, población de una región o bacterias en cultivo (CBC Mat. 51 P4 Ej. 22; FRRQ; FRLP
Ej. 4). Para el decaimiento, la señal que pierde la mitad por tramo —que ya está en el
`topic-context.md` de `powers`— o el enfriamiento de un jarro de agua (CBC Mat. 51 P4 Ej. 23), que
tiene la ventaja de no exigir explicar "vida media".

### 6.3 La decisión de producto: el ejercicio de onboarding

**[COD]** `ONBOARDING_EXERCISES.algebra` está hardcodeado en
[onboarding-wizard.tsx:89](web/src/app/onboarding/onboarding-wizard.tsx:89): es un ítem de producto
de potencias de igual base ($2^2 \cdot 2^3 = 2^x$), y el usuario lo resuelve **antes de
registrarse**. Es la única pieza de contenido que **todos** los usuarios de `algebra` ven, con
probabilidad 1.

Convertirlo en un ejercicio con tabla pone el formato en la primerísima impresión sin depender de
ningún sorteo, y además el contexto actual (reenvíos que se multiplican por tanda) ya es de la
familia de crecimiento.

**Costo, honesto:** el wizard renderiza su propio ejercicio, no reusa `ExerciseCard`, así que habría
que cablear `exercise-table.tsx` adentro del wizard. Es trabajo de front, no de contenido, y no lo
resuelve este informe. Lo dejo señalado porque es, por lejos, la palanca con mejor relación
impacto/costo para el objetivo declarado.

**Segunda opción, más invasiva:** sesgar un slot de la primera sesión hacia un ejercicio con tabla
en `get_exercise_db`. Garantiza el 100% pero mete una regla de contenido adentro del algoritmo de
selección, que hoy es agnóstico del formato. **[INF]** No lo recomiendo sin más datos.

### 6.4 Verificación de cierre

```bash
python content/validate_content.py --course algebra --check tables
```

```bash
python content/validate_content.py --course algebra
```

Cero ERROR es condición de cierre. `check_tables` cubre forma, paralelismo con `options`, la regla
70 completa y A3 como ERROR; A2 y el ancho de celda como WARNING. **A1 (fila trampa) no es
automatizable**: va al checklist manual de cada `topic-context.md` tocado, como se hizo en
`reglas`.

Además hay que actualizar los `topic-context.md` de `powers` y `fracciones` con las sub-familias
nuevas, sus slugs y su cupo, y sumar al checklist del topic tres líneas manuales:

- [ ] **A1**: existe una fila visible donde todos los candidatos dan el mismo valor
- [ ] **T-a** (§5.4): el patrón no se deduce de la fórmula ni de los parámetros del enunciado — si
      el alumno puede contestar sin mirar la tabla, la tabla es decoración
- [ ] **T-b** (§5.4): el ítem le pide algo a la tabla **como conjunto**, no el relleno de una celda

Si T-a y T-b se adoptan, corresponde subirlas a `authoring-context.md` como reglas 76 y 77 y
referenciarlas desde `table-format-context.md`, en vez de dejarlas solo en este informe.

---

## 7. Lo que hay que decidir antes de escribir contenido

1. **¿Se acepta el ~35%?** Si sí, la propuesta de §6.1 sale tal cual. Si no, hay que elegir entre
   subir mucho el volumen (~20 ejercicios) o tomar la palanca del onboarding (§6.3).
2. **¿`fracciones/ESTR` va en 0 o en piloto de 2?** Mi recomendación es 0 en la ronda 1, por la
   contraindicación de modelado.
3. **¿`radicals` entra?** Mi recomendación es que no.
4. **Confirmar empíricamente el orden de las 8 units** de §2.3 con un usuario nuevo real, antes de
   comprometer contenido a una ventana que depende de un orden de BD sin `ORDER BY` explícito.
5. **¿Se aceptan T-a y T-b como reglas 76 y 77 de `authoring-context.md`?** (§5.4). Son baratas, no
   rompen nada de lo ya escrito y le dan al formato un criterio de "cuándo NO" que hoy solo existe
   como lista de contenidos contraindicados.

---

## 8. Deuda que este informe destapó y no resuelve

Tres cosas aparecieron de costado, no son de tablas, y se pierden si no quedan anotadas:

1. **Los distractores de fracciones del CBC son mejores que los nuestros.** $\frac{4}{2+2a} =
   \frac{2}{1+2a}$ (cancelar un solo sumando) y $\frac{5+b}{5} = b$ están en fuente primaria
   **[LIT]** y son de altísima calidad. Vale una auditoría de si `fracciones` los cubre,
   independiente de todo esto.
2. **Notación de intervalos.** La convención rioplatense verificada es **punto y coma** —$(9;
   +\infty)$, $[0; 2\pi]$— porque la coma ya es el separador decimal. Si en algún lado de `algebra`
   usamos coma, desafina fuerte. Amerita un barrido.
3. ~~**`absolute_value` está definido por casos**~~ — **esto era falso y la medición lo desmintió.**
   La definición por casos **no aparece en ninguno de los 30 ejercicios**; existe en un solo lugar del
   repo (`topic-context.md:9`), que además ya abría por la distancia. Y **21 de 30 ejercicios** ya
   usaban lenguaje de distancia. Lo que sí faltaba, y era mucho más angosto: la palabra **"módulo"**
   (0 apariciones, y es la que usa el apunte del CBC) y el salto de *"distancia al cero"* del interior
   abstracto a *"distancia de $x$ a $a$"*, que es la lectura geométrica y no estaba escrita en ningún lado.
   Las dos cosas quedaron resueltas.

---

## 9. Qué se ejecutó y qué quedó afuera

### Lo que se escribió

| Topic | `FORM` | `RESL` | Modo | Sub-familias nuevas |
|---|---:|---:|---|---|
| `fracciones` | — | 3 | `cell` | `etapas-desde-tabla` |
| `powers` | 6 | 4 | `column` + `cell` | `patron-tabla-crecimiento`, `patron-tabla-decaimiento`, `cadena-desde-tabla` |
| `logarithms` | 4 | 2 | `cell` | `traduccion-desde-tabla`, `etapas-desde-tabla` |
| `scientific_notation` | 4 | 2 | `cell` | `orden-desde-tabla`, `comparar-desde-tabla` |
| `absolute_value` | 3 | 2 | `column` + `cell` | `patron-tabla-distancia`, `ramas-desde-tabla` |
| **Total** | **17** | **13** | | **30 ejercicios** |

Más, del §8: 3 ítems nuevos en `fracciones` que modelan los errores del CBC, 39 campos migrados a
punto y coma, 4 `feedback_incorrect` idénticos reescritos, la lectura de distancia instalada en 9
ítems de `absolute_value`, y dos defectos de `logarithms` resueltos.

### Decisiones que cambiaron respecto de lo que este informe proponía

1. **`scientific_notation` no admite modo `column`.** El §6.1 lo daba por hecho. Al diseñarlo quedó
   claro que sus objetos son números sueltos de escalas distintas, no términos de una familia
   parametrizada por un entero, que es lo que `column` necesita. Van los 6 en modo `cell`.
2. **Los dos defectos de `logarithms` no eran el mismo caso.** La base 7 de `LEXI` #13 no cumplía
   ninguna función y migró a base 5; la de `FORM` #14 es parte de un diseño deliberado (cinco ítems
   con cinco bases distintas, para que la sub-familia no enseñe que la propiedad depende de la
   base) y **se mantuvo**, ampliando la regla del topic en la dirección de su propia justificación.
3. **Los cinco ítems de decibeles no se unificaron.** Leídos completos, los cuatro que "no aplican
   el $\times 10$" preguntan explícitamente por el $\log_{10}$ del factor total, y el
   `feedback_incorrect` de `RESL` #6 diagnostica justamente el error de aplicar el coeficiente
   cuando no corresponde. Unificarlos habría destruido ese distractor.
4. **`patron-tabla-distancia` y `patron-tabla-crecimiento` rotan cuál es la respuesta correcta.**
   No estaba previsto. Apareció al pasar de 2 ítems por sub-familia a 4: si la correcta es siempre
   del mismo tipo, el formato enseña una meta-estrategia. Quedó promovido a regla 77.

### Recortes deliberados, para que la próxima ronda no los "arregle"

- **`radicals`**: afuera por decisión del usuario. Sus sub-familias son manipulación simbólica, no
  familias parametrizadas por un entero.
- **`fracciones/ESTR`**: afuera. Es la skill de modelado, o sea la contraindicación principal del
  formato.
- **Todo lo `LEXI`**: afuera. La tabla no agrega nada a un ítem de identificación.
- **El patrón de mantisa de UTN FRRQ** ($\log 267$, $\log 26{,}7$, $\log 2{,}67$ comparten la
  parte decimal), que el §5.2 llamaba *"el mejor candidato de todo el relevamiento"*: es
  **estructuralmente imposible** bajo las reglas vigentes de `logarithms`, que exigen argumentos que
  sean potencias exactas de la base y resultados enteros en `RESL`. Un $\log 2{,}67 \approx
  0{,}4265$ viola las dos. Incorporarlo requiere relajar esas reglas a propósito, que es una
  decisión de otra ronda.
- **La probabilidad de aparición** (§3.3): se resuelve del lado del producto, con un contrapeso en
  la probabilidad de selección que se desvanece con las sesiones. Por eso los 30 ejercicios se
  repartieron por mérito pedagógico y no por cobertura estadística, y por eso la tabla de
  probabilidades del §3.3 ya no es el criterio de decisión que era.
