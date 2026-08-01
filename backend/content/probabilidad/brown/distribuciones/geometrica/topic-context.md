# Topic: Distribución geométrica

Belt: `brown`, Unit: `distribuciones`, Topic: `geometrica`

Skills en este topic: `CLSF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `CLSF`, `FORM`.

Concepto: $X\sim Geom(p)$ modela la cantidad de ensayos hasta el **primer** éxito. $P(X=k)=(1-p)^{k-1}p$, $E[X]=1/p$. Única distribución discreta con **pérdida de memoria**.

**Frontera con el resto del topic:** la distinción con `binomial` (cuenta éxitos en $n$ fijo, no ensayos hasta el primero) y con `negativa` (busca el $r$-ésimo éxito con $r>1$, la geométrica es el caso $r=1$) es la fuente principal de distractores.

**Marco de la unidad:** ver la nota de marco compartido en `binomial/topic-context.md`. `CLSF` evalúa reconocer-propia / distractor-vecino / supuesto-violado; `FORM` evalúa identificar-parametros / formula-directa / esperanza-y-propiedad (acá la propiedad distintiva es la pérdida de memoria).

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer geométrica (ensayos hasta el primer éxito) | 6 | `reconocer-geometrica` |
| Distractor: la historia parece geométrica pero en realidad es binomial ($n$ fijo, cuenta éxitos totales) o binomial negativa (busca el $r$-ésimo éxito con $r>1$) | 5 | `distractor-vecino` |
| Supuesto violado: la probabilidad de éxito cambia con cada intento (mejora o empeora), rompiendo la pérdida de memoria | 4 | `supuesto-violado` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Identificar $p$ desde un contexto dado | 4 | `identificar-parametros` |
| Fórmula $P(X=k)=(1-p)^{k-1}p$ | 6 | `formula-directa` |
| $E[X]=1/p$ y propiedad de pérdida de memoria, con lectura interpretativa | 5 | `esperanza-y-perdida-memoria` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## Contextos variados

- Arranque de un auto en un día frío: cada intento de encendido tiene la misma probabilidad de prender.
- Llamadas a un cliente hasta que atiende, con la misma probabilidad de atender en cada intento.
- Tiros a un aro hasta encestar el primero, con porcentaje de acierto fijo.
- Intentos de acertar una contraseña de $n$ dígitos al azar, uno por uno, hasta acertar (con reposición del espacio de búsqueda).
- Rondas de un juego de mesa tirando un dado hasta obtener un número específico.
- Postulaciones a un puesto de trabajo hasta recibir la primera respuesta positiva, con la misma probabilidad de éxito en cada postulación.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Geométrica vs. binomial | Tratar como geométrico un problema con $n$ fijo que en realidad cuenta el total de éxitos (eso es binomial) |
| Geométrica vs. negativa | Aplicar la fórmula geométrica cuando el enunciado pide el $r$-ésimo éxito con $r>1$ |
| Supuesto violado | No notar que la probabilidad de éxito cambia con la práctica o el desgaste y tratar la situación como geométrica igual |
| Fórmula | Invertir el exponente, usando $(1-p)^{k}p^{k-1}$ o similar |
| Fórmula | Contar el ensayo exitoso entre los "fracasos", usando $(1-p)^k$ en vez de $(1-p)^{k-1}$ |
| Pérdida de memoria | Creer que la probabilidad de éxito cambia según cuántos fracasos ya ocurrieron |
| Esperanza | Interpretar $E[X]=1/p$ como "la cantidad exacta de intentos que van a hacer falta" en vez de un promedio a largo plazo |

---

## Reglas específicas del topic

- **Contextos válidos**: ver tabla de arriba.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).
- **Toda `explanation` de este topic (`CLSF` y `FORM`) incluye un párrafo breve que interpreta intuitivamente el concepto central del ejercicio.** En `esperanza-y-perdida-memoria` esa interpretación es doble: $E[X]=1/p$ es el promedio de intentos si se repitiera el experimento muchas veces (no una garantía puntual, un $p$ chico da un promedio grande de intentos); y la pérdida de memoria significa que haber fallado ya varias veces no cambia la probabilidad del próximo intento, el proceso "no recuerda" los fracasos anteriores.
- **`supuesto-violado`**: la historia describe alguien que mejora o empeora con la práctica (tirador que se acostumbra al aro, vendedor que se pone nervioso tras rechazos), rompiendo la pérdida de memoria; las opciones incluyen una que nombra esa razón explícitamente.

## Checklist del topic

- [ ] Todo contexto de `reconocer-geometrica` pregunta por el número de ensayos hasta el **primer** éxito, nunca un total fijo de $n$
- [ ] `distractor-vecino` varía entre confundir con binomial y con binomial negativa en distintos ejercicios
- [ ] `supuesto-violado` nombra explícitamente por qué la pérdida de memoria falla, sin nombrar la distribución "correcta"
- [ ] Toda `explanation` tiene su párrafo de interpretación intuitiva
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
