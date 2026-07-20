# Topic: Distribución normal

Belt: `violet`, Unit: `distribuciones`, Topic: `normal`

Skills en este topic: `GRAF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `GRAF`, `FORM`.

Concepto: $X\sim N(\mu,\sigma^2)$, densidad en forma de campana simétrica centrada en $\mu$, dispersión controlada por $\sigma$. Se estandariza con $Z=(X-\mu)/\sigma$ a $N(0,1)$. Cierra `violet/distribuciones`.

**Nota de dependencia con integrales**: cualquier probabilidad de la normal se busca vía la variable estandarizada $Z$ y valores de tabla ya dados (nunca se pide integrar la densidad), consistente con la nota de `probabilidad/course-context.md`.

---

## GRAF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Reconocer la forma de campana simétrica | 5 | `reconocer-forma-normal` |
| Identificar el centro $\mu$ desde el gráfico (eje de simetría, punto máximo) | 5 | `identificar-media` |
| Comparar dispersión entre dos curvas normales (mayor $\sigma$ = más achatada y ancha) | 5 | `comparar-dispersion` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Estandarización $Z=(X-\mu)/\sigma$ | 7 | `formula-estandarizacion` |
| Simetría de la normal ($P(X<\mu)=0{,}5$) | 4 | `propiedad-simetria` |
| Identificar $\mu$ y $\sigma$ desde la fórmula de la densidad | 4 | `identificar-parametros` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Estandarización | Invertir la fórmula, usando $Z=(\mu-X)/\sigma$ o $Z=\sigma/(X-\mu)$ |
| Dispersión | Creer que un $\sigma$ mayor da una curva más alta y angosta (en realidad es más achatada y ancha, el área bajo la curva sigue siendo $1$) |
| Simetría | Creer que $P(X<\mu)\neq 0{,}5$ o que depende de $\sigma$ |
| Identificar parámetros | Confundir $\sigma$ con $\sigma^2$ al leer la notación $N(\mu,\sigma^2)$ |
| Centro | Confundir el punto de inflexión de la curva con el máximo (el máximo está exactamente en $\mu$) |

---

## Reglas específicas del topic

- **Parámetros con valores simples** ($\mu$, $\sigma$ enteros o con un decimal), consistente con el resto de la unidad.
- **Ningún ejercicio pide el valor numérico de una probabilidad de tabla** (eso excede la frontera de este topic sin una tabla de valores $Z$ provista); los cálculos se limitan a estandarización, simetría e identificación de parámetros.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).

## Checklist del topic

- [ ] Ningún ejercicio requiere consultar una tabla de valores $Z$ no provista en el enunciado
- [ ] Los ejercicios de dispersión comparan correctamente la forma (más ancha = mayor $\sigma$)
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: GRAF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
