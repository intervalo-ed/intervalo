# Decisiones, RESL.json (topic: white/conteo/factoriales)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `factorial-directo` | 3 | 1 | 2 | 3 |
| `cociente-factoriales` | 5 | 1 | 4 | 5 |
| `suma-resta-evaluada` | 3 | 1 | 2 | 3 |
| `comparacion-factoriales` | 2 | 1 | 1 | 2 |
| `fraccion-producto-denominador` | 2 | 1 | 1 | 2 |
| **Total** | **15** | **5** | **10** | **15** |

## Contextos usados

Igual que en `FORM.json`, este topic no tiene tabla de "Contextos variados"
(es manipulación/evaluación directa de $n!$, sin contexto narrativo). La
variedad se logró variando los valores de $n$ en cada sub-familia, sin
repetir ninguno ya usado:

- `factorial-directo`: $4!$, $5!$ (existía $6!$; los tres $\leq 7$ como pide el topic).
- `cociente-factoriales`: $6!/4!$, $8!/6!$, $5!/2!$, $8!/7!$ (existía $7!/5!$).
- `suma-resta-evaluada`: $4!+3!$, $6!-5!$ (existía $5!-4!$).
- `comparacion-factoriales`: $7!$ vs $8!$ (existía $5!$ vs $6!$).
- `fraccion-producto-denominador`: $5!/(2!\,3!)$ (existía $6!/(2!\,3!)$).

## Decisiones de contenido

- **`fraccion-producto-denominador` nuevo usa $5!/(2!\cdot3!)=10$
  deliberadamente**, siguiendo la regla propia del topic ("la división final
  tiene que ser mental... no $6!/(2!\cdot3!)=60$, que ya obliga a dividir un
  número de 3 cifras a mano"). Ver más abajo la nota sobre el ejercicio
  existente que sí usa $6!/(2!\cdot3!)=60$, en contradicción con esa misma
  regla.
- `correct_index` de los 10 ejercicios nuevos se redistribuyó (reordenando
  `options`+`feedback_incorrect` en paralelo, nunca su contenido) para
  balancear el archivo completo: los 5 preexistentes ya concentraban 3/5 en
  `correct_index=2`. El archivo completo terminó en
  `{0: 3, 1: 5, 2: 5, 3: 2}` sobre 15 ítems, dentro del máximo de 50%.
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno en `RESL.json` tras el ajuste de correct_index y del formato de la
explicación de `fraccion-producto-denominador` (se sacó el `$...$` alrededor
de "5!=120, 2!=2 y 3!=6" para igualar el estilo del ejercicio existente y no
disparar la regla 21 de 3+ fragmentos LaTeX inline en el mismo párrafo).

## Ejercicios existentes con problema real

- **`RESL.json`, ejercicio existente de `fraccion-producto-denominador`**
  ($6!/(2!\cdot3!)=60$): viola la regla propia del topic citada arriba (la
  división final debería ser mental, y $720/12=60$ obliga a dividir un
  número de 3 cifras). Es exactamente el contraejemplo que el propio
  `topic-context.md` usa para ilustrar qué NO hacer. No se editó siguiendo
  la instrucción de no tocar ejercicios existentes salvo problema real
  confirmado y avisando en vez de corregir en silencio: **se marca acá para
  que se decida si conviene corregirlo en esta ronda o dejarlo para una
  posterior** (cambiar el numerador a $5!$ como se hizo en el ejercicio
  nuevo resolvería el problema, pero movería el ejercicio existente a un
  valor idéntico al nuevo, por lo que si se corrige habría que elegir un
  tercer numerador, ej. $7!/(2!\cdot 4!) = 5040/48$, no da entero limpio;
  mejor opción sería $5!/(3!\cdot 1!)=20$ o similar si se decide corregir).
