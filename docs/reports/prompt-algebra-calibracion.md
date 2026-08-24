# Prompt para la sesión de `algebra`

> Copiar y pegar tal cual al abrir la sesión de álgebra.

---

Vengo de una auditoría de los datos de producción (respuestas, sesiones y micro-encuesta)
que hicimos en la sesión de probabilidad. El informe completo está acá y quiero que lo
leas antes de tocar nada:

**https://claude.ai/code/artifact/c4a538cf-2993-43f1-aefe-288eba3e5913**

En esta sesión vamos a aplicar a `algebra` lo que salió de ahí. Te resumo lo que
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
- **El análisis por ítem sólo cubre desde el 2-ago-2026**, que es cuando se empezó a
  guardar `exercise_external_id`. La exposición media por ítem es 2,2, así que ningún
  ítem individual tiene n estadístico. Las listas por ítem son pistas para mirar a mano.

## Lo que dice el informe de `algebra`

1.257 respuestas, 109 usuarios, P1 global 69 % (70 % excluyendo al owner) — **el curso
mejor calibrado de los tres**. Casi todas las unidades caen entre 61 % y 75 %. Eso es
bueno y conviene no romperlo: acá el trabajo es de bisturí, no de reescritura.

**Las tres unidades fuera de banda** (n ≥ 20):

| Unidad | n | Usuarios | P1 | Agotó las 4 | Veredicto |
|---|---:|---:|---:|---:|---|
| `white/radicals/RESL` | 68 | 36 | **51 %** | 12 % | muy difícil |
| `white/fracciones/RESL` | 59 | 41 | **54 %** | 3 % | muy difícil |
| `white/fracciones/LEXI` | 62 | 45 | **85 %** | 0 % | muy fácil |

Y `white/radicals/FORM` está justo en el borde (55 %, con 13 % de intentos agotados):
vale mirarla junto con `radicals/RESL`, porque el problema parece ser del topic entero.

**El voto de la encuesta coincide.** De 44 votos de dificultad en álgebra: 17 «muy
fácil», 23 «justo», 4 «muy difícil». Los cuatro «muy difícil» son
`white_logarithms_LEXI_12`, `white_logarithms_RESL_06`, `white_radicals_FORM_08` y
`white_radicals_RESL_01` — o sea que `radicals` se lleva la mitad.

**Cobertura: 40 %.** De 990 ejercicios, 604 no se sirvieron nunca. Es la peor cobertura
de los tres cursos, y significa que el catálogo de álgebra está sobredimensionado para el
tráfico que tiene. No hace falta escribir más: hace falta arreglar lo que se sirve.

## Trabajo propuesto, en orden

1. **El topic `radicals` completo.** `RESL` 51 %, `FORM` 55 %, y en las dos el 12-13 % de
   las respuestas agota las cuatro opciones, que es la señal de «no tengo idea» y no de
   «me confundí». Los dos ítems a mirar primero:

   - `white_radicals_FORM_08` (simplificar una raíz de radicando grande en un paso):
     **17 % de P1 y 67 % de intentos agotados**. Es el ítem más sospechoso de todo el
     corpus, en los tres cursos. Tiene además un voto «muy difícil».
   - `white_radicals_LEXI_06` (raíz de índice `n` con radicando negativo): 20 % de P1 y
     **70 s de mediana para un LEXI**, cuando la mediana de la skill es 16 s.

   La hipótesis que usamos para Laplace en probabilidad aplica igual acá: sospechar que
   el ítem apila dos dificultades a la vez y separarlas.

2. **`white/fracciones/RESL` a la banda.** 54 % de P1 pero sólo 3 % de intentos agotados:
   es distinto de `radicals`. Acá la gente sabe qué hacer y se equivoca en el camino —
   eso apunta a cuentas largas, no a un concepto faltante. Vale revisar si el cálculo
   final se puede hacer mental.

3. **`white/fracciones/LEXI` por arriba.** 85 % de P1, **cero** intentos agotados. El
   criterio: **al menos un distractor tiene que ser el resultado de un error real y
   frecuente**, no un término plausible. `white_fracciones_LEXI_03` está en la lista de
   ítems triviales del informe (100 % de P1, 13 s de mediana) y tiene un voto «muy
   fácil», igual que `_13`.

4. **Los 2 reportes de contenido.** Poquitos pero concretos:

   | Ítem | Tipo | Qué dijeron |
   |---|---|---|
   | `white_fracciones_ESTR_09` | enunciado | «no está muy claro el enunciado» |
   | `white_logarithms_FORM_12` | opción ambigua | «la opción se explica de forma rústica» |

5. **Nada de violeta ni marrón.** Se llevan 11 % del consumo entre los dos, y blanco se
   lleva 78 %. Con los números actuales, una hora puesta en blanco vale unas siete veces
   más.

## Restricción de coordinación, importante

`external_id` se deriva de la **posición** en el JSON (`{belt}_{topic}_{skill}_{idx+1}`).
Si borrás o insertás un ejercicio en el medio de un archivo, todos los que siguen se
renumeran y las respuestas históricas quedan apuntando a otro contenido. En `algebra` ya
hay 6 ids servidos que no existen en el catálogo actual.

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
where course_id = 2
group by 1, 2, 3
having count(*) >= 15
order by p1;
```

Para bajar a ítem, agrupar por `exercise_external_id` y filtrar
`exercise_external_id is not null`.
