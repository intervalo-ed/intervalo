# Topic: Definición de variable aleatoria

Belt: `blue`, Unit: `variables`, Topic: `definicion_var`

Skills en este topic: `LEXI`, `CLSF`.

Este topic tiene 2 ítems (uno por skill): `LEXI`, `CLSF`.

Concepto: una **variable aleatoria** $X:\Omega\to\mathbb{R}$ asigna un valor numérico a cada resultado del espacio muestral. Según el conjunto de valores que toma, se clasifica en **discreta** (contable, típicamente conteos) o **continua** (recorre un intervalo real, típicamente mediciones).

**Frontera con el resto de la unidad:** ronda 1 de este topic apunta a 15 ejercicios/skill (ver `generation/content-probabilidad-round1/0-generation-prompt.md`). Ningún ejercicio calcula todavía función puntual, densidad, acumulada, esperanza ni varianza; eso empieza en los topics siguientes.

---

## LEXI, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Definición de variable aleatoria como función $\Omega\to\mathbb{R}$ | 6 | `definicion-variable-aleatoria` |
| Distinción discreta vs. continua (definición) | 5 | `definicion-discreta-continua` |
| Vocabulario: dominio/recorrido (soporte) de $X$ | 4 | `definicion-soporte` |
| **Total** | **15** | |

---

## CLSF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Clasificar un contexto como variable discreta (conteos: cantidad de clientes, de fallas, de caras) | 6 | `clasificar-discreta` |
| Clasificar un contexto como variable continua (mediciones: tiempo, peso, temperatura, distancia) | 6 | `clasificar-continua` |
| Caso borde: una magnitud que se mide continua pero se redondea/registra de forma discreta, o viceversa | 3 | `clasificar-caso-borde` |
| **Total** | **15** | |

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

- **Contextos discretos válidos**: cantidad de clientes, de llamadas, de artículos defectuosos, de caras en $n$ tiradas.
- **Contextos continuos válidos**: tiempo de espera, duración de una batería, peso, altura, temperatura.
- **Reintroducir la definición** de variable aleatoria en cada ejercicio que la evalúa indirectamente (regla crítica 31), incluso en `CLSF`.

## Checklist del topic

- [ ] Cada contexto de `CLSF` es inequívocamente discreto o continuo, salvo la sub-familia de caso borde
- [ ] Ningún ejercicio asume función puntual, densidad, acumulada, esperanza o varianza
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: LEXI/CLSF conceptual → 3 opciones
