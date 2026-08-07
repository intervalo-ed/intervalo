# Decisiones, GRAF.json (topic: brown/distribuciones/normal)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| reconocer-forma | 5 | 1 | 4 | 5 |
| identificar-media | 5 | 1 | 4 | 5 |
| comparar-dispersion | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

**reconocer-forma** (sin imagen, cualquier contexto de la lista sirve):
- #2 tiempo de un corredor en una carrera (población entrenada), $\mu=50$, $\sigma=6$ min
- #3 peso de paquetes despachados por una fábrica, $\mu=25$, $\sigma=2$ kg
- #4 puntaje de un examen estandarizado, $\mu=500$, $\sigma=80$ puntos
- #5 temperatura corporal en un consultorio, $\mu=36{,}5$, $\sigma=0{,}3$ °C
(el existente ya usaba "estaturas de población adulta"; no se repitió)

**identificar-media** (con imagen, contextos de magnitud chica según la nota específica del `topic-context.md`):
- #2 diferencia entre hora real y programada de salida de un colectivo urbano (minutos), $\mu=3$, $\sigma=1$
- #3 desviación de una pieza fabricada respecto de la medida de referencia (mm), $\mu=-2$, $\sigma=0{,}8$
- #4 error de lectura de un termómetro digital (°C), $\mu=0{,}8$, $\sigma=0{,}5$
- #5 diferencia entre peso real y peso declarado de un paquete pequeño (gramos), $\mu=-1{,}2$, $\sigma=1{,}5$
(el existente ya usaba "error de instrumento de medición de precisión", $\mu=1{,}5$, $\sigma=0{,}5$; los 4 nuevos son escenarios de desviación/error distintos entre sí y del existente, todos con $\sigma\in[0{,}5,5]$ y $\mu$ chico según la regla de alturas prolijas)

**comparar-dispersion** (sin imagen, comparación con dos fórmulas display):
- #2 dos versiones de un examen estandarizado, $\sigma_A=15$ vs. $\sigma_B=60$
- #3 dos equipos deportivos (estaturas), $\sigma_A=3$ vs. $\sigma_B=12$
- #4 dos modelos de dispositivo (duración de batería), $\sigma_A=1$ vs. $\sigma_B=5$
- #5 dos grupos etarios (temperatura corporal, adultos vs. niños), $\sigma_1=0{,}2$ vs. $\sigma_2=0{,}6$
(el existente ya usaba "dos máquinas de envasado", peso de paquetes)

## Decisiones de contenido

- Para `identificar-media` se siguió al pie de la letra la nota específica del `topic-context.md`: los 4 contextos nuevos son todos de "desviación/error de magnitud chica" (nunca estaturas/exámenes/fábrica con $\sigma$ grande), con $\sigma$ elegido en el rango $[0{,}5, 5]$ para que el pico de la curva ($1/(\sigma\sqrt{2\pi})$) caiga dentro de $[0{,}08, 0{,}8]$. Se verificó numéricamente: picos de $0{,}266$ a $0{,}798$ en los 4 nuevos ejercicios, todos dentro del rango prolijo.
- `graph_view` de cada `identificar-media` se calculó como $\mu \pm 5\sigma$ en $x$ y $[-0{,}05, \text{pico}\times 1{,}15]$ en $y$, mismo criterio que el ejercicio existente.
- Ninguna `question` de `identificar-media` menciona $\mu$; la mención aparece solo en la `explanation`, después de resolver.
- Los distractores numéricos de `identificar-media` siguen el patrón del ejercicio existente: los dos puntos de inflexión ($\mu-\sigma$, $\mu+\sigma$) y el valor de $\sigma$ mismo, para diagnosticar la confusión de tomar un punto de inflexión o la dispersión como si fuera la media.
- `correct_index` se redistribuyó activamente entre las 4 posiciones disponibles (reordenando `options` + `feedback_incorrect` en paralelo) para no concentrar la respuesta correcta siempre en el mismo índice, tanto en los ejercicios de 3 como de 4 opciones.
- Ningún ejercicio nuevo usa `graph_shade` (no aplica a este topic, ver `topic-context.md`).
- Sin desvíos del plan de la tabla de distribución objetivo.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/normal` corre en 0 ERRORS y 0 WARNINGS para el topic completo (`GRAF.json` + `FORM.json`).
