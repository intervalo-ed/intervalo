# Decisiones, FORM.json (topic: brown/distribuciones/negativa)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| `identificar-parametros` | 4 | 1 | 3 | 4 |
| `formula-directa` | 6 | 1 | 5 | 6 |
| `esperanza-y-relacion-geometrica` | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

`identificar-parametros` (1 existente + 3 nuevos): editorial/manuscritos aceptados (existente). Nuevos: vendedor/pólizas cerradas, arquero/goles convertidos, sorteo/ruleta.

`formula-directa` (1 existente + 5 nuevos): dardos/aciertos (existente). Nuevos: vendedor/ventas, currículums/respuestas positivas, sorteo/extracciones, inspección/piezas defectuosas, redes/posts exitosos. Entre el existente y los 5 nuevos se cubren los 6 contextos de la tabla, uno cada uno.

`esperanza-y-relacion-geometrica` (1 existente + 4 nuevos): reclutador/candidatos que cumplen perfil (existente, análogo a inspección por ser una búsqueda de coincidencias). Nuevos: arquero/goles, sorteo/extracciones, vendedor/pólizas, redes/posts exitosos.

## Decisiones de contenido

**Elección de $p=0{,}5$ en los 5 ejercicios nuevos de `formula-directa`.** Se usó $p=0{,}5$ en todos los casos nuevos (variando $r$ y $k$) para que $P(X=k)$ diera siempre una fracción de denominador potencia de 2, calculable a mano y corta de mostrar en una opción (ej. `$5/64$`), replicando el estilo del ejercicio preexistente de dardos. Con $p=0{,}5$, el distractor de "exponentes invertidos" (mencionado en el `topic-context.md` como confusión típica) coincide numéricamente con la respuesta correcta por simetría ($p^r(1-p)^{k-r}=p^{k-r}(1-p)^r$ cuando $p=0{,}5$), así que ese distractor puntual no se usó en los 5 ejercicios nuevos; en su lugar se usaron los otros dos distractores de la tabla de confusiones del topic (omitir el binomial, y usar $\binom{k}{r}$ en vez de $\binom{k-1}{r-1}$), más un distractor de "usar $p$ solo". El distractor de exponentes invertidos sigue cubierto por el ejercicio preexistente de dardos, que también usa $p=0{,}5$ pero via un distractor equivalente ("repartir mal el exponente" = usar $\binom{k}{r}$).

Los 4 nuevos de `esperanza-y-relacion-geometrica` incluyen, cada uno, el párrafo de interpretación intuitiva que exige el `topic-context.md` ($E[X]=r/p$ como $r$ veces el promedio de una geométrica), igual que el ejercicio preexistente.

Sin más desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/negativa` corre en 0 ERRORS, 0 WARNINGS tras acortar dos párrafos de `explanation` que superaban los 200 caracteres en su tramo de prosa.
