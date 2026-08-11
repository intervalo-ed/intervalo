# Decisiones, FORM.json (topic: brown/distribuciones/normal)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| identificar-parametros | 4 | 1 | 3 | 4 |
| formula-estandarizacion | 6 | 1 | 5 | 6 |
| propiedad-simetria | 5 | 1 | 4 | 5 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

**identificar-parametros** (abstracto/formal, permitido por diseño en FORM):
- #2 puntaje de examen estandarizado, vía fórmula de densidad explícita, $\mu=500$, $\sigma=100$
- #3 estaturas de población adulta, vía notación $N(170, 8^2)$
- #4 temperatura corporal, vía fórmula de densidad explícita, $\mu=36{,}5$, $\sigma=0{,}3$
(el existente ya usaba "duración de batería", $\mu=20$, $\sigma=5$)

**formula-estandarizacion**:
- #2 estaturas de población adulta, $N(170,8^2)$, $x=154$ → $Z=-2$
- #3 peso de paquetes de fábrica, $N(25,2^2)$, $x=28$ → $Z=1{,}5$
- #4 puntaje de examen estandarizado, $N(500,100^2)$, $x=350$ → $Z=-1{,}5$
- #5 duración de batería, $N(18,3^2)$, $x=27$ → $Z=3$
- #6 temperatura corporal, $N(36{,}5, 0{,}3^2)$, $x=36{,}65$ → $Z=0{,}5$
(el existente ya usaba "tiempo de un corredor", $N(50,6^2)$, $x=62$ → $Z=2$; los 5 nuevos cubren los 5 contextos restantes de la lista sin repetir ninguno)

**propiedad-simetria** (con lectura interpretativa):
- #2 estaturas de población adulta, $P(X>170)$
- #3 tiempo de un corredor, lectura interpretativa en prosa ("¿qué fracción termina en menos de 50 minutos?")
- #4 puntaje de examen estandarizado, $P(X<500)$
- #5 duración de batería, $P(X>15)$
(el existente ya usaba "peso de paquetes de fábrica", $P(X<12)$)

## Decisiones de contenido

- Todos los valores de $Z$ nuevos son distintos entre sí y del existente ($2, -2, 1{,}5, -1{,}5, 3, 0{,}5$), para no repetir el mismo resultado numérico dentro del ítem.
- En `identificar-parametros`, dos ejercicios (#2 puntaje, #4 temperatura) reintroducen la fórmula de densidad explícita con los números ya sustituidos (mismo formato que el existente); el tercero (#3 estaturas) usa la notación $N(\mu,\sigma^2)$ en cambio, para variar el formato de presentación entre los ejercicios de la sub-familia y ejercitar ambas lecturas (fórmula completa vs. notación compacta).
- `#3` de `propiedad-simetria` se redactó como pregunta interpretativa en prosa (3 opciones conceptuales: "la mitad"/"un cuarto"/"prácticamente todos") en vez de numérica, para dar variedad de formato dentro de la sub-familia sin salirse de la frontera del topic (nunca se pide un valor de tabla $Z$).
- `correct_index` se redistribuyó activamente en los 11 ejercicios numéricos nuevos de 4 opciones (reordenando `options` + `feedback_incorrect` en paralelo) para acercar la distribución final a uniforme entre 0-3: conteo final del archivo completo es 0:4, 1:5, 2:3, 3:3.
- Un warning inicial de regla 21 (3 fragmentos LaTeX inline en un mismo párrafo) y regla 34 (cierre anunciado como advertencia) apareció en la `explanation` de `identificar-parametros` #3 (estaturas); se corrigió reescribiendo el párrafo de cierre en voz de gerundio al frente ("Confundir ese segundo número con $\sigma$ directamente...") y quitando la repetición de notación completa.
- Dos warnings de regla 36 (párrafo de `question` >130 caracteres) aparecieron en `formula-estandarizacion` #5 (duración de batería) y `propiedad-simetria` #3 (tiempo de corredor); ambos se acortaron recortando cláusulas redundantes de contexto, sin perder el dato numérico necesario.
- Sin otros desvíos del plan.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/normal` corre en 0 ERRORS y 0 WARNINGS para el topic completo (`GRAF.json` + `FORM.json`).
