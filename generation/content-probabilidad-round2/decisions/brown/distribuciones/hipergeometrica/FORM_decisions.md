# Decisiones, FORM.json (topic: brown/distribuciones/hipergeometrica)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| identificar-parametros | 4 | 1 | 3 | 4 |
| formula-directa | 6 | 1 | 5 | 6 |
| esperanza-y-contraste-binomial | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- `identificar-parametros` (ya había: pesca de peces marcados): nuevos en mazo de cartas, urna de bochas, lista de empleados sorteados por equipo. 3 contextos distintos.
- `formula-directa` (ya había: mazo de cartas): nuevos en urna de bochas, lote de componentes (control de calidad), lista de empleados sorteados, panel de jurados, estanque de peces. 5 contextos nuevos distintos, ninguno repetido; junto con el existente cubre los 6 contextos de la tabla de "Contextos variados" del `topic-context.md`.
- `esperanza-y-contraste-binomial` (ya había: lote de componentes fallados): nuevos en urna de bochas, mazo de cartas, lista de empleados, panel de jurados.

Todos los valores numéricos ($N,K,n,k$) de los ejercicios nuevos son distintos entre sí y de los ya existentes en el mismo archivo; las probabilidades de `formula-directa` se calcularon y verificaron con `python3`/`fractions.Fraction` antes de escribirlas (numerador = $\binom{K}{k}\binom{N-K}{n-k}$, denominador = $\binom{N}{n}$, fracción reducida).

## Decisiones de contenido

- En `formula-directa`, los 3 distractores numéricos de cada ejercicio nuevo son valores reales de la distribución (P en $k-1$, P en $k+1$ u otro $k$ vecino) en vez de números inventados, para que cada uno corresponda a un error de lectura de $k$ plausible y verificable, siguiendo el mismo criterio que ya usaba el ejercicio preexistente de este ítem.
- En `esperanza-y-contraste-binomial`, los 3 distractores de cada ejercicio nuevo replican el patrón del ejercicio preexistente: $K/N$ solo (sin multiplicar por $n$), $n$ solo, y $K$ solo; mismo criterio, distinto contexto.
- `correct_index` se repartió entre las 4 posiciones (0 a 3) a lo largo de los 12 ejercicios nuevos para evitar concentración en un solo índice; combinado con los 3 preexistentes (fijos en `correct_index=0`, no se tocaron), el archivo completo queda en 6/3/3/3 (índice 0 algo más cargado por los 3 preexistentes, pero no concentrado: 40% del total como máximo).
- Todos los ejercicios nuevos usan $N\leq 20$, cumpliendo la regla del topic. Los 3 ejercicios preexistentes de este archivo usan $N=30$ (identificar-parametros) y $N=40$ (esperanza-y-contraste-binomial), que violan esa regla; no se tocaron por instrucción explícita de no editar ejercicios ya existentes salvo problema real, se deja anotado acá para una futura pasada de limpieza (mismo hallazgo que en `CLSF_decisions.md`).

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/hipergeometrica` corre en 0 ERRORS, 0 WARNINGS.
