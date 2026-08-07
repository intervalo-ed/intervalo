# Decisiones, CLSF.json (topic: brown/distribuciones/poisson)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `reconocer-poisson` | 6 | 1 | 5 | 6 |
| `distractor-vecino` | 5 | 1 | 4 | 5 |
| `supuesto-violado` | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

**`reconocer-poisson`** (1 ya existente + 5 nuevos, uno por cada contexto de la
tabla, sin repetir ninguno): supermercado (ya existente, $\lambda=3$), call
center ($\lambda=5$), errores tipográficos por página ($\lambda=2$), autos en
semáforo ($\lambda=6$), mensajes en canal de soporte ($\lambda=7$), fallas de
máquina ($\lambda=1$).

**`distractor-vecino`** (1 ya existente + 4 nuevos, alternando confusión con
binomial y con geométrica): tornillos mal roscados (ya existente, confusión
binomial, $n=50,p=0{,}04$); páginas hasta el primer error tipográfico
(confusión geométrica, $p=0{,}2$); autos que superan el límite entre 20 fijos
(confusión binomial, $n=20,p=0{,}1$); mensajes hasta el primero urgente
(confusión geométrica, $p=0{,}15$); piezas defectuosas entre 25 fijas
(confusión binomial, $n=25,p=0{,}08$). Total: 3 binomial + 2 geométrica.

**`supuesto-violado`** (1 ya existente + 3 nuevos, cada uno con dos tramos de
tasa distinta dentro del mismo intervalo): máquina turno día/noche (ya
existente, tasas 2 y 5, intervalo 16h); call center madrugada/laboral (tasas
3 y 12, intervalo 10h); semáforo fuera de pico/pico (tasas 4 y 20, intervalo
3h); supermercado día de semana/sábado (tasas 2 y 9, intervalo combinado de
esos dos días).

## Decisiones de contenido

- Ningún contexto se repite más del ~30% dentro de una misma sub-familia:
  `reconocer-poisson` usa los 6 contextos de la tabla una vez cada uno;
  `distractor-vecino` usa 5 contextos distintos (2 no listados explícitamente
  en la tabla, tornillos y piezas, ambos análogos al contexto de fallas de
  máquina pero con un ángulo de inspección de lote fijo, que es justamente lo
  que necesita esta sub-familia para plantear un $n$ discreto); `supuesto-violado`
  usa 4 contextos distintos.
- Todos los ejercicios nuevos mantienen $\lambda \leq 15$ (o la tasa base que
  se reescala también queda dentro de ese rango).
- Corregí un error de diseño real detectado por el validador que afectaba
  también a los 3 ejercicios ya existentes (no solo a los nuevos): los 15
  ejercicios tenían `correct_index=0` sin excepción. Rebalanceé la posición
  de la opción correcta en las 15 filas (intercambiando `options` y
  `feedback_incorrect` en paralelo, sin tocar el contenido de ningún
  distractor ni de ninguna pregunta) para que la distribución quede pareja
  (5/5/5 entre los índices 0, 1 y 2). Esto sí tocó los 3 ejercicios
  preexistentes, pero solo en la posición de la opción correcta dentro del
  array, nunca en el texto de `question`, `options`, `feedback_correct`,
  `feedback_incorrect` ni `explanation`.
- Reescribí 2 párrafos de `question` que superaban el límite de 130
  caracteres de prosa (regla 36) partiéndolos con `\n\n`, sin cambiar el
  contenido.
- Reescribí el cierre de la `explanation` de un ejercicio (`distractor-vecino`,
  páginas hasta el primer error) que el validador marcó como anunciado tipo
  advertencia de diagnóstico (regla 34), sin cambiar el punto pedagógico.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic
brown/distribuciones/poisson` corre en 0 ERRORS / 0 WARNINGS para este topic.
