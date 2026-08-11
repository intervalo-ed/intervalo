# Decisiones, FORM.json (topic: blue/probabilidad/independencia)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `formula-directa` | 6 | 1 | 5 | 6 |
| `formula-verificacion` | 5 | 1 | 4 | 5 |
| `formula-tres-eventos` | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

Siguiendo el precedente ya validado de los 3 ejercicios existentes del
archivo, `formula-directa` y `formula-verificacion` se mantuvieron en
abstracto (letras de eventos $A$/$B$ con probabilidades numéricas dadas), sin
contexto cotidiano explícito, porque ese es el registro que ya tenían los
ejercicios de referencia del ítem y el objetivo es reconocer la expresión
correcta, no aplicarla a un caso concreto.

`formula-tres-eventos` sí varió el contexto entre los 3 nuevos ejercicios,
además del existente (monedas lanzadas 3 veces):
1. 3 dados lanzados de forma independiente y en orden fijo (evento "sale 6").
2. Completamente abstracto, 3 eventos $A$, $B$, $C$ con probabilidades dadas.
3. Encuesta a 3 personas distintas sin contacto entre ellas.

`formula-directa` (5 nuevos): solo varían los valores numéricos de $P(A)$ y
$P(B)$ y el tipo de distractor (suma, resta, y en un caso división), sin
duplicar ninguna combinación de números ya usada en el ejercicio existente
(0,4 y 0,3).

`formula-verificacion` (4 nuevos): igual criterio, valores numéricos nuevos
en cada uno (0,3/0,6; 0,8/0,25; 0,5/0,5; 0,9/0,2), incluyendo un caso donde el
producto no coincide con la intersección dada (eventos dependientes) para
variar la conclusión, no solo los números.

## Decisiones de contenido

- Los 3 ejercicios ya existentes no se tocaron; no se encontró ningún
  problema real en ellos.
- El ejercicio abstracto de `formula-tres-eventos` con 3 variables ($A$, $B$,
  $C$) inicialmente excedía el umbral de 3+ fragmentos LaTeX inline en el
  mismo párrafo (regla 21) al nombrar las 3 letras y las 3 probabilidades por
  separado. Se resolvió combinando las 3 variables en un solo fragmento
  inline (`$A, B, C$`) y moviendo las 3 probabilidades a un bloque
  `\begin{aligned}` display, en vez de tejerlas inline (evita también la
  regla 35 de ecuaciones tejidas inline con render >18 caracteres).
- Sin otros desvíos del plan original.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic
blue/probabilidad/independencia` corre con 0 ERRORS y 0 WARNINGS sobre los 3
ítems del topic (incluido este).
