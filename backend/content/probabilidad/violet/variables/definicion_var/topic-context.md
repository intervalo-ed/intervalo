# Topic: Definición de variable aleatoria

Belt: `violet`, Unit: `variables`, Topic: `definicion_var`

Skills en este topic: `LEXI`, `CLSF`.

Este topic tiene 2 ítems (uno por skill): `LEXI`, `CLSF`.

Concepto: una **variable aleatoria** $X:\Omega\to\mathbb{R}$ asigna un valor numérico a cada resultado del espacio muestral. Según el conjunto de valores que toma, se clasifica en **discreta** (contable, típicamente conteos) o **continua** (recorre un intervalo real, típicamente mediciones).

**Frontera con el resto de la unidad:** ronda 1 de este topic apunta a 15 ejercicios/skill (ver `generation/content-probabilidad-round1/0-generation-prompt.md`). Ningún ejercicio calcula todavía función puntual, densidad, acumulada, esperanza ni varianza; eso empieza en los topics siguientes.

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Definición de variable aleatoria como función $\Omega\to\mathbb{R}$ | 6 | `definicion-variable-aleatoria` | Reconocer la definición formal de variable aleatoria como función, no como el experimento ni el resultado | $X:\Omega\to\mathbb{R}$, distinción variable vs. evento vs. experimento |
| Distinción discreta vs. continua (definición) | 5 | `definicion-discreta-continua` | Conocer la definición abstracta de discreta (contable) vs. continua (intervalo real), a nivel de vocabulario, sin clasificar un contexto concreto | Conjunto contable vs. intervalo real |
| Vocabulario: dominio/recorrido (soporte) de $X$ | 4 | `definicion-soporte` | Identificar el vocabulario de dominio/recorrido (soporte) de $X$ | Soporte de $X$, distinción dominio ($\Omega$) vs. recorrido (valores numéricos) |
| **Total** | **15** | | | |

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug | Objetivo pedagógico | Conceptos que toca |
|---|---:|---|---|---|
| Clasificar un contexto como variable discreta (conteos: cantidad de clientes, de fallas, de caras) | 6 | `clasificar-discreta` | Clasificar un contexto de conteo como variable discreta | Conteos, valores aislados $0,1,2,\dots$ |
| Clasificar un contexto como variable continua (mediciones: tiempo, peso, temperatura, distancia) | 6 | `clasificar-continua` | Clasificar una medición como variable continua | Mediciones, cualquier valor de un intervalo real |
| Caso borde: una magnitud que se mide continua pero se redondea/registra de forma discreta, o viceversa | 3 | `clasificar-caso-borde` | Distinguir la naturaleza real de la magnitud del modo en que se registra el dato | Naturaleza de la magnitud vs. forma de registro, trampa de "decimales visibles = continua" |
| **Total** | **15** | | | |

### Contextos variados

- **Discretos**: cantidad de clientes que ingresan a un local, de llamadas a un call center, de artículos defectuosos en un lote, de caras en $n$ tiradas, de mensajes recibidos, de autos que cruzan un peaje.
- **Continuos**: tiempo de espera, duración de una batería, peso, altura, temperatura, distancia recorrida, volumen de líquido.
- **Caso borde**: edad registrada en años cumplidos (continua por naturaleza, discretizada al redondear), monto en pesos con centavos (discreta por naturaleza, aunque tenga decimales), temperatura redondeada al grado más cercano (continua redondeada), calificación en una escala de 1 a 10 con enteros (discreta aunque parezca una medición continua). Ningún experimento debe superar ~30% de los ítems de una misma sub-familia.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Discreta vs. continua | Creer que toda variable con valores decimales es continua (el dinero en pesos con centavos sigue siendo discreto, cuenta unidades mínimas) |
| Discreta vs. continua | Creer que toda variable continua debe reportarse con decimales visibles |
| Definición de variable aleatoria | Confundir la variable aleatoria (la función) con el resultado del experimento o con el evento en sí |
| Caso borde | Clasificar por cómo se *registra* el dato (redondeado a un entero) en vez de por la naturaleza real de la magnitud medida |

---

## Reglas específicas del topic

- **Contextos cotidianos (regla crítica 43)**: `CLSF` usa siempre un contexto concreto de la tabla de arriba, nunca un "objeto abstracto" sin nombrar. `LEXI` es la excepción intencional: sus 3 sub-familias evalúan vocabulario/definición formal (qué es una variable aleatoria, discreta vs. continua, soporte), así que quedan en abstracto salvo que un contexto entre sin forzarlo (ej. `definicion-soporte` ya usa el dado como ilustración del concepto, sin que sea el foco de la pregunta).
- **Contextos**: ver tabla de "Contextos variados" más arriba, con el límite de ~30% de ítems por sub-familia usando el mismo contexto.
- **Reintroducir la definición** de variable aleatoria en cada ejercicio que la evalúa indirectamente (regla crítica 31), incluso en `CLSF`.

## Checklist del topic

- [ ] Cada contexto de `CLSF` es inequívocamente discreto o continuo, salvo la sub-familia de caso borde
- [ ] Ningún ejercicio asume función puntual, densidad, acumulada, esperanza o varianza
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: LEXI/CLSF conceptual → 3 opciones
