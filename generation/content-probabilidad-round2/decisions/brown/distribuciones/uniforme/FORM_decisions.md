# Decisiones, FORM.json (topic: brown/distribuciones/uniforme)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| formula-densidad | 5 | 1 | 4 | 5 |
| formula-esperanza | 5 | 1 | 4 | 5 |
| formula-probabilidad-subintervalo | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

`FORM` no lleva imagen (no es un ítem `GRAF`), así que `graph_fn`/`graph_view`/`graph_shade`/`graph_free_aspect` quedan en `null` en los 15 ejercicios, igual que ya estaban en los 3 preexistentes.

## Contextos usados

**formula-densidad** (4 nuevos): fila de banco (0-7 min, $f=1/7$), puntero en escala (0-6 cm, $f=1/6$), partícula en canal (0-5 mm, $f=1/5$), colectivo en franja horaria (2-6 min, $f=1/4$). El preexistente usaba dispensador de líquido (0-8 L, $f=1/8$).

**formula-esperanza** (4 nuevos): fila de banco (1-7 min, $E=4$), puntero en escala (1-5 cm, $E=3$), partícula en canal (2-8 mm, $E=5$), colectivo en franja horaria (4-8 min, $E=6$). El preexistente usaba descarga de archivo (2-10 seg, $E=6$).

**formula-probabilidad-subintervalo** (4 nuevos): puntero en escala (0-8 cm, subintervalo 2-5, $P=3/8$), partícula en canal (0-5 mm, subintervalo 1-4, $P=3/5$), colectivo en franja horaria (0-7 min, subintervalo 2-6, $P=4/7$), dispensador de líquido (1-9 L, subintervalo 3-7, $P=1/2$). El preexistente usaba fila de cajero automático (0-6 min, subintervalo 2-5, $P=1/2$).

## Decisiones de contenido

- En `formula-esperanza` se eligieron los pares $(a,b)$ evitando que $(a+b)/2$ coincidiera numéricamente con $b-a$ (lo que hubiera dejado dos distractores con el mismo valor que la correcta); por eso los intervalos no son todos del mismo largo.
- `correct_index` se distribuyó deliberadamente entre las 4 posiciones en los 12 ejercicios nuevos (3 sub-familias × 4 ejercicios, uno en cada índice 0-3), para no perpetuar el sesgo de los 3 ejercicios preexistentes, que estaban los 3 en índice 0.
- Los distractores de `formula-densidad` y `formula-probabilidad-subintervalo` siguen el mismo patrón de confusión que ya usaban los ejercicios preexistentes del propio archivo (invertir la fracción, usar un extremo del subintervalo sobre el dominio total en vez del ancho real), variando solo los números; se consideró más consistente que inventar confusiones nuevas sin precedente en el archivo.
- Sin desvíos del plan más allá de lo ya anotado.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/uniforme` corre en 0 ERRORS y 0 WARNINGS.
