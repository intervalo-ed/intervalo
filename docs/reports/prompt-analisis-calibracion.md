# Prompt para la sesión de `analisis`

> Copiar y pegar tal cual al abrir la sesión de análisis.

---

Vengo de una auditoría de los datos de producción (respuestas, sesiones y micro-encuesta)
que hicimos en la sesión de probabilidad. El informe completo está acá y quiero que lo
leas antes de tocar nada:

**https://claude.ai/code/artifact/c4a538cf-2993-43f1-aefe-288eba3e5913**

En esta sesión vamos a aplicar a `analisis` lo que salió de ahí. Te resumo lo que
necesitás saber para que no tengas que reconstruirlo.

## Cómo se leen los datos (esto cambia todo)

- **`is_correct` no mide acierto.** En `session_store.py` es `attempts <= 3`, así que con
  3 o 4 opciones da 90-100 % en todo y no discrimina nada. **No la uses.**
- La métrica buena es **P1 = % de respuestas resueltas al primer intento**, o sea
  `quality_score = 5`. El mapeo completo es `5`=1 intento, `4`=2, `3`=3, `1`=agotó las
  cuatro. Sin nulos, serie completa desde mayo.
- **La banda de calibración es 55-77 %, con centro en 61 %.** No es arbitraria: sale de
  cruzar 183 votos de la micro-encuesta con el P1 medido de los ítems votados. Los ítems
  votados «muy fácil» promedian 77 % de P1; los «justo», 61 %; los «muy difícil», 55 %.
  Un ejercicio bien calibrado cae adentro de esa banda.
- **El análisis por ítem sólo cubre desde el 2-ago-2026**, que es cuando se empezó a
  guardar `exercise_external_id`. La exposición media por ítem es 2,2, así que ningún
  ítem individual tiene n estadístico. Las listas por ítem son pistas para mirar a mano.

## Lo que dice el informe de `analisis`

Es el curso más consumido: 6.659 respuestas, 272 usuarios, 73 % del catálogo servido.
P1 global 66 % (68 % excluyendo al owner). El 79 % del consumo es cinturón blanco.

**El cinturón blanco está partido en dos, y ése es el hallazgo principal.**

| Unidad | n | Usuarios | P1 | Veredicto |
|---|---:|---:|---:|---|
| `white/definition/CLSF` | 443 | 148 | **52 %** | muy difícil |
| `white/linear/CLSF` | 144 | — | **77 %** | muy fácil |
| `white/linear/GRAF` | 300 | — | **78 %** | muy fácil |
| `white/linear/FORM` | 278 | — | **82 %** | muy fácil |
| `white/quadratic/GRAF` | 249 | — | **90 %** | muy fácil |

`white/definition/CLSF` es **la unidad más transitada de toda la plataforma** y está del
lado duro. `linear` completo y `quadratic/GRAF` están regalados. Un alumno nuevo cruza
primero una unidad demasiado dura y enseguida cuatro demasiado fáciles.

La encuesta lo confirma por separado: `linear/GRAF` se votó «muy fácil» 10 veces sobre
13, y `linear/FORM` 7 sobre 7.

**Otras unidades fuera de banda** (n ≥ 20):

- Duras: `blue/rationalization/RESL` 29 %, `blue/factorization/RESL` 30 %,
  `violet/geometric_interpretation/ESTR` 43 %, `violet/quotient/ESTR` 43 %,
  `violet/limit_definition/GRAF` 50 %, `blue/continuity/RESL` 50 %,
  `white/logarithmic/FORM` 50 %, `white/trigonometric/FORM` 52 %,
  `violet/geometric_interpretation/GRAF` 53 %, `blue/lateral_limits/RESL` 53 %.
- Fáciles: `blue/definition/RESL` 96 %, `white/trigonometric/CLSF` 94 %,
  `blue/algebraic_limits/RESL` 90 %, `blue/lateral_limits/LEXI` 88 %,
  `blue/algebraic_limits/ESTR` 81 %.

Ojo con racionalización y factorización: las respuestas están partidas entre el slug en
castellano (hasta el 11-jul) y el inglés. Sumando cada par, la unidad real mide **30 % y
34 % de P1**. Después de Laplace en probabilidad, es lo más duro que tenemos.

## Trabajo propuesto, en orden

1. **`white/definition/CLSF` a la banda.** 443 respuestas y 148 usuarios: es donde una
   corrección toca a más gente. Aporta además cuatro de los ocho ítems más difíciles del
   corpus: `_15` (38 % P1, 38 % agotó), `_17` (33 %), `_30` (17 %), `_12` (29 %). Hay
   también un reporte de contenido sobre `_22`: *«conjunto unitario?? no tiene sentido»*,
   y ese ítem mide 33 %. El reporte y el dato coinciden.

2. **`linear` (las tres skills) y `quadratic/GRAF` a la banda, por arriba.** El
   diagnóstico fino es que los distractores no compiten. En `white_linear_FORM_27`
   (`f(-1)` con `f(x) = -4x + 12`) el 100 % acierta en 15 segundos. Criterio: **al menos
   un distractor tiene que ser el resultado de un error real y frecuente**, no un número
   plausible. Hay una lista de 11 ítems triviales (100 % de P1 en menos de 15 s) en el
   informe, casi todos de `linear/LEXI` y `quadratic/LEXI`.

3. **`rationalization/RESL` y `factorization/RESL`.** 30 % y 34 % de P1 con ~21 % de
   intentos agotados. Vale la misma hipótesis que usamos para Laplace en probabilidad:
   sospechar que el ítem apila dos dificultades y separarlas en dos tandas.

4. **Los 10 reportes de contenido.** Son señal humana directa, sin ruido estadístico:

   | Ítem | Tipo | Qué dijeron |
   |---|---|---|
   | `white_logarithmic_GRAF_22` | enunciado | «No anda el gráfico» |
   | `white_linear_LEXI_20` | enunciado | «No se entiende qué es el parámetro m» |
   | `white_linear_LEXI_04` | enunciado | «en el contexto?? mal redactadas las opciones» |
   | `white_definition_CLSF_22` | enunciado | «conjunto unitario?? no tiene sentido» |
   | `white_quadratic_GRAF_20` | enunciado | «Distancia del despegue se debería referir a cuando sale del eje x» |
   | `brown_definition_LEXI_03` | enunciado | «ridículo» |
   | `white_quadratic_FORM_24` | explicación | «la explicación está mal redactada en estructura» |
   | `white_exponential_LEXI_23` | explicación | «acá hubiese estado buena la definición de logaritmo» |
   | `white_definition_LEXI_10` | explicación | (sin texto) |
   | `white_linear_graf_50` | enunciado | (id que ya no existe) |

5. **Nada de cinturón marrón ni negro.** Se llevan el 3 % del consumo entre los dos. Con
   los números actuales, una hora puesta en blanco vale unas 20 veces más.

## Restricción de coordinación, importante

`external_id` se deriva de la **posición** en el JSON (`{belt}_{topic}_{skill}_{idx+1}`).
Si borrás o insertás un ejercicio en el medio de un archivo, todos los que siguen se
renumeran y las respuestas históricas quedan apuntando a otro contenido. En `analisis` ya
hay **117 ids servidos que no existen en el catálogo actual** — es el curso más dañado.

Hasta que llegue el id estable (se está trabajando en la sesión de probabilidad):

- **Editar en el lugar está bien.** Reescribir el enunciado, las opciones o la
  explicación de un ítem no mueve a nadie.
- **Agregar va al final del array**, nunca en el medio.
- **No borrar ítems.** Si uno hay que sacarlo, archivalo con el procedimiento de siempre
  y avisá, pero no lo elimines del medio del archivo.

## Cómo consultar los datos vos mismo

Hay un helper en `backend/dbq.py` que toma la URL de `DB_URL`. La URL pública sale de
Railway → servicio **BBDD** → Variables → `DATABASE_PUBLIC_URL`. **Sólo lecturas.**

Consulta base para el P1 de una unidad:

```sql
select belt, topic, exercise_type,
       count(*) as n,
       count(distinct user_id) as usuarios,
       round(100.0 * avg(case when quality_score = 5 then 1.0 else 0 end)) as p1,
       round(100.0 * avg(case when quality_score = 1 then 1.0 else 0 end)) as agotado
from answers
where course_id = 1
group by 1, 2, 3
having count(*) >= 20
order by p1;
```

Para bajar a ítem, agrupar por `exercise_external_id` y filtrar
`exercise_external_id is not null`.
