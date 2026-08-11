# Decisiones, FORM.json (topic: brown/distribuciones/poisson)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `identificar-parametros` | 4 | 1 | 3 | 4 |
| `formula-directa` | 6 | 1 | 5 | 6 |
| `esperanza-varianza-y-ajuste-tasa` | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

**`identificar-parametros`** (1 ya existente + 3 nuevos): canal de soporte,
mensajes por cuarto de hora (ya existente, $\lambda=4$, mismo intervalo que
se pregunta); call center, llamadas por hora ($\lambda=9$, mismo intervalo);
errores tipográficos por página ($\lambda=3$, mismo intervalo); autos en
semáforo, tasa dada por minuto pero se pregunta por 30 segundos ($\lambda=10$
reescalado a $\lambda=5$, único de los 4 que exige reescalar el intervalo).

**`formula-directa`** (1 ya existente + 5 nuevos, cubriendo $k=0$, $k=1$ y
$k\geq2$): sismógrafo, sismos por semana (ya existente, $\lambda=2,k=3$);
call center ($\lambda=7,k=2$); supermercado ($\lambda=5,k=2$); errores
tipográficos ($\lambda=4,k=1$, caso con $1!=1$); autos en semáforo
($\lambda=6,k=0$, caso particular $P(X=0)=e^{-\lambda}$); fallas de máquina
($\lambda=2,k=2$).

**`esperanza-varianza-y-ajuste-tasa`** (1 ya existente + 4 nuevos, todos con
reescalado explícito de $\lambda$ al cambiar la duración del intervalo):
fotocopias, pedidos por hora a turno de 3 horas (ya existente,
$6\to\lambda=18$); canal de soporte, mensajes por minuto a intervalo de 4
minutos ($5\to\lambda=20$); semáforo, autos por minuto a intervalo de 30
segundos ($4\to\lambda=2$); máquina, fallas por mes a intervalo de 2 meses
($3\to\lambda=6$); corrector, errores por página a capítulo de 5 páginas
($2\to\lambda=10$).

## Decisiones de contenido

- Elegí valores de $\lambda$ distintos entre los ejercicios de una misma
  sub-familia para que ningún par sea una copia numérica del mismo cálculo
  (aunque algún valor de $\lambda$ se repite entre sub-familias distintas del
  mismo archivo, eso no reproduce el mismo cómputo porque cambia qué se
  pregunta: identificar $\lambda$, calcular $P(X=k)$, o ajustar el intervalo).
- Igual que en `CLSF.json`, corregí el mismo problema de diseño real (no solo
  en los ejercicios nuevos): las 15 filas tenían `correct_index=0`. Rebalanceé
  la posición de la opción correcta (intercambiando `options` y
  `feedback_incorrect` en paralelo) hasta una distribución pareja
  (4/4/4/3 entre los índices 0 a 3), sin tocar contenido de ningún campo.
- Reescribí el cierre de `explanation` de un ejercicio (`formula-directa`,
  supermercado) que el validador marcó como advertencia de diagnóstico
  (regla 34).
- Reescribí el párrafo final de la `explanation` de dos ejercicios
  (`formula-directa`, errores tipográficos y autos en semáforo $k=0$) que
  acumulaban demasiados fragmentos LaTeX inline sueltos y repetían
  $e^{-\lambda}$ tejido en prosa después de ya mostrarlo en un bloque
  display (reglas 21 y 35), sin cambiar el punto pedagógico de cada cierre.
- Acorté el `feedback_correct` del ejercicio de autos en semáforo ($k=0$),
  que encadenaba 3+ igualdades en un campo de una sola oración (regla de
  "fórmulas anchas"); el detalle de por qué $\lambda^0=1$ y $0!=1$ ya está en
  la `explanation`.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic
brown/distribuciones/poisson` corre en 0 ERRORS / 0 WARNINGS para este topic.
