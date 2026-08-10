# Topic: Distribución binomial

Belt: `brown`, Unit: `distribuciones`, Topic: `binomial`

Skills en este topic: `CLSF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `CLSF`, `FORM`.

Concepto: $X\sim Bin(n,p)$ modela la cantidad de éxitos en $n$ ensayos independientes idénticos con probabilidad de éxito constante $p$. $P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}$, $E[X]=np$, $\mathrm{Var}(X)=np(1-p)$.

**Frontera con el resto del topic:** primera distribución de la unidad. La distinción con `geometrica` (busca el primer éxito, no cuenta éxitos en $n$ fijos) y con `hipergeometrica` (sin reposición, población finita) es la fuente principal de distractores en `CLSF`.

**Marco de la unidad (mismo para las 5 distribuciones discretas):** `CLSF` evalúa tres roles de reconocimiento (reconocer la propia / distinguirla de una vecina confundible / detectar que ningún modelo estándar del curso aplica porque falla un supuesto); `FORM` evalúa tres roles de aplicación (leer parámetros de un contexto / aplicar la fórmula puntual / trabajar la esperanza y varianza con su lectura interpretativa). Ver `distribuciones` en conjunto: el mismo esqueleto se repite en `geometrica`, `hipergeometrica`, `negativa` y `poisson`, cada uno instanciándolo con lo propio de su modelo.

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer binomial ($n$ ensayos independientes idénticos, cuenta éxitos totales) | 6 | `reconocer-binomial` |
| Distractor: la historia parece binomial pero en realidad es geométrica (busca el primer éxito) o hipergeométrica (sin reposición) | 5 | `distractor-vecino` |
| Supuesto violado: $p$ no es constante entre ensayos, ninguna distribución del curso aplica directo | 4 | `supuesto-violado` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Identificar $n$ y $p$ desde un contexto dado | 4 | `identificar-parametros` |
| Fórmula $P(X=k)=\binom{n}{k}p^k(1-p)^{n-k}$ | 6 | `formula-directa` |
| $E[X]=np$, $\mathrm{Var}(X)=np(1-p)$, con lectura interpretativa | 5 | `esperanza-varianza` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## Contextos variados

Rotar entre estos para no repetir siempre monedas/dados (tope ~30% del mismo contexto por sub-familia):

- Control de calidad: $n$ piezas de una línea de producción, cada una con la misma probabilidad de salir defectuosa.
- Encuestas: $n$ personas consultadas, cada una responde sí/no con la misma probabilidad de decir sí.
- Tiros libres de un jugador de básquet, con porcentaje de acierto fijo, en una serie de $n$ intentos.
- Turnos en una ruleta de casino, apostando siempre al mismo color en $n$ tiradas.
- Vacunación: $n$ pacientes reciben una vacuna con la misma probabilidad conocida de generar una reacción leve.
- Envíos de un correo: $n$ paquetes despachados, cada uno con la misma probabilidad de llegar a tiempo.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Binomial vs. geométrica | Aplicar la binomial a un problema que en realidad pregunta "cuántos ensayos hasta el primer éxito" (eso es geométrica) |
| Binomial vs. hipergeométrica | Aplicar la binomial cuando la extracción es sin reposición de una población chica y finita |
| Supuesto violado | No notar que $p$ cambia ensayo a ensayo (por aprendizaje, cansancio o desgaste) y tratar la situación como binomial igual |
| Fórmula | Olvidar el coeficiente combinatorio $\binom{n}{k}$, dejando solo $p^k(1-p)^{n-k}$ |
| Fórmula | Invertir los exponentes, usando $p^{n-k}(1-p)^k$ |
| Parámetros | Confundir $n$ (cantidad de ensayos) con $k$ (cantidad de éxitos buscada) al identificar los datos del contexto |
| Varianza | Creer que mayor varianza significa "más éxitos en promedio" en vez de "más variabilidad entre una tanda de $n$ ensayos y otra" |

---

## Reglas específicas del topic

- **Contextos válidos**: ver tabla de arriba.
- **$n$ acotado** (≤30) para que $\binom{n}{k}$ no genere números que se descarten por magnitud a ojo.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).
- **Toda `explanation` de este topic (`CLSF` y `FORM`) incluye un párrafo breve que interpreta intuitivamente el concepto central del ejercicio**, además del mecanismo de cálculo (regla 44 ya pide intuición sobre el *por qué* de una fórmula nueva; esta regla pide además interpretar su *significado* en el contexto). En `reconocer-binomial`/`distractor-vecino`/`supuesto-violado` esa interpretación explica qué distingue al mecanismo binomial de sus vecinos en términos llanos (por qué "contar éxitos en $n$ intentos fijos" es distinto de "esperar hasta el primero"). En `esperanza-varianza` el párrafo interpretativo es central: $E[X]=np$ es el promedio de éxitos si se repitiera la tanda de $n$ ensayos muchísimas veces, no el resultado garantizado de una tanda puntual; una $\mathrm{Var}(X)$ mayor significa que la cantidad de éxitos varía más de una tanda a otra, no que se esperen más éxitos.
- **`supuesto-violado`**: la historia describe un escenario donde $p$ cambia de ensayo a ensayo (ej. un arquero que se cansa, un vendedor que gana confianza con cada llamada exitosa) y las opciones incluyen una que nombra explícitamente esa razón como motivo de que ninguna distribución estándar del curso aplique.

## Checklist del topic

- [ ] Todo contexto de `reconocer-binomial` tiene $n$ fijo y ensayos independientes idénticos
- [ ] `distractor-vecino` varía entre confundir con geométrica y con hipergeométrica en distintos ejercicios
- [ ] `supuesto-violado` nombra explícitamente por qué $p$ deja de ser constante, sin nombrar la distribución "correcta" que sí aplicaría
- [ ] Toda `explanation` tiene su párrafo de interpretación intuitiva, no solo el mecanismo de cálculo
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: CLSF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
