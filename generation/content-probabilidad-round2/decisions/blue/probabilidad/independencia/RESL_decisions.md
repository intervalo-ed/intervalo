# Decisiones, RESL.json (topic: blue/probabilidad/independencia)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `resl-interseccion` | 5 | 1 | 4 | 5 |
| `resl-verificacion` | 5 | 1 | 4 | 5 |
| `resl-repeticion` | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

`resl-interseccion` (4 nuevos, abstracto con $P(A)$/$P(B)$ numéricos, igual
registro que el ejercicio existente): valores 0,4/0,5; 0,8/0,25; 0,35/0,4;
0,15/0,6, ninguno duplicado del existente (0,6/0,5). Los distractores varían
entre suma, resta, división, y errores de cálculo plausibles (multiplicar el
mismo dato dos veces, correr la coma decimal), manteniendo la regla de
"distractor del mismo orden de magnitud" salvo el caso de overflow >1 que ya
lleva la advertencia intrínseca de la regla de "valor sospechoso camuflado".

`resl-verificacion` (4 nuevos, mismo estilo Sí/No con justificación numérica
que el ejercicio existente): valores 0,5/0,6/0,3 (independientes); 0,7/0,2/0,1
(dependientes); 0,4/0,9/0,36 (independientes); 0,25/0,8/0,15 (dependientes).
Se alternó deliberadamente el resultado (independientes/dependientes) para no
sesgar el patrón de respuesta.

`resl-repeticion` (4 nuevos, contexto rotado):
1. Un dado lanzado 2 veces, evento "mayor a 4" en ambas.
2. Urna con reposición, 2 extracciones, ambas bola roja.
3. Máquina expendedora que falla con probabilidad dada, 2 usos.
4. Encuesta a 4 personas distintas sin contacto, las 4 responden que sí.

Ningún contexto se repite más del 30% dentro de su sub-familia.

## Decisiones de contenido

- Los 3 ejercicios ya existentes no se tocaron; no se encontró ningún
  problema real en ellos.
- `resl-verificacion` mantiene la cardinalidad de 3 opciones conceptuales
  (Sí/No con justificación), igual que el ejercicio de referencia ya
  validado en el archivo, en vez de la cardinalidad numérica de 4 por
  defecto de RESL: la respuesta que se pide ahí es un juicio Sí/No con
  motivo, no un valor numérico, así que aplica la regla general de
  "cardinalidad según tipo de respuesta" de `authoring-context.md` en vez
  del default de skill.
- Dos ejercicios de `resl-verificacion` (los de $P(A)=0{,}7$/$0{,}2$ y
  $P(A)=0{,}25$/$0{,}8$) tenían inicialmente una opción correcta
  notablemente más larga que el distractor "$P(A)\neq P(B)$" (regla 4,
  gap ≥5 en render). Se corrigió alargando ese distractor a "$P(A)$ es
  distinto de $P(B)$ en este experimento" sin cambiar su significado.
- Se corrigieron varios párrafos de `question`/`explanation` que excedían el
  límite de caracteres (reglas 36 y de párrafos ≤200), partiéndolos con
  `\n\n`, sin alterar el contenido matemático.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic
blue/probabilidad/independencia` corre con 0 ERRORS y 0 WARNINGS sobre los 3
ítems del topic (incluido este).
