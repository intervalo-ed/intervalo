# Topic: Distribución uniforme continua

Belt: `violet`, Unit: `distribuciones`, Topic: `uniforme`

Skills en este topic: `GRAF`, `FORM`.

Este topic tiene 2 ítems (uno por skill): `GRAF`, `FORM`.

Concepto: $X\sim U(a,b)$, densidad constante $f(x)=\dfrac{1}{b-a}$ en $[a,b]$. $E[X]=(a+b)/2$. Reutiliza directamente lo visto en `blue/variables/densidad` (rectángulo), ahora nombrado como distribución con parámetros propios.

**Nota de dependencia con integrales**: como en `blue/variables/densidad`, el área bajo $f(x)$ es siempre un rectángulo, calculable geométricamente sin técnica de integración (ver `probabilidad/course-context.md`).

---

## GRAF, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Leer la altura $h=1/(b-a)$ desde el intervalo mostrado | 6 | `lectura-altura` |
| Leer una probabilidad como proporción de un subintervalo (área de un rectángulo más chico) | 6 | `lectura-probabilidad-subintervalo` |
| Leer el intervalo $[a,b]$ desde el gráfico | 3 | `lectura-intervalo` |
| **Total** | **15** | |

---

## FORM, 15 ejercicios

| Sub-familia | Cantidad | Slug |
|---|---:|---|
| Densidad $f(x)=\dfrac{1}{b-a}$ | 6 | `formula-densidad` |
| $E[X]=(a+b)/2$ | 5 | `formula-esperanza` |
| $P(c\leq X\leq d)=\dfrac{d-c}{b-a}$ para un subintervalo $[c,d]\subseteq[a,b]$ | 4 | `formula-probabilidad-subintervalo` |
| **Total** | **15** | |

**Cardinalidad**: numérica corta → 4 opciones (grilla 2×2); conceptual → 3.

---

## `feedback_incorrect`, confusiones típicas (ambas skills)

| Concepto preguntado | Confusión a diagnosticar |
|---|---|
| Altura de la densidad | Usar $h=b-a$ en vez de $h=1/(b-a)$ (invertir la fracción) |
| Probabilidad de subintervalo | Calcular sobre la longitud total del dominio en vez de sobre el subintervalo pedido |
| Esperanza | Usar el punto medio del subintervalo pedido en vez del dominio completo $[a,b]$ |
| Lectura de intervalo | Confundir dónde la densidad vale $0$ con los extremos $a$ y $b$ donde empieza a valer $h$ |

---

## Reglas específicas del topic

- **Intervalos enteros cortos** (longitud 2 a 8) para que los cálculos sean manejables a mano.
- **Cada ejercicio reintroduce la fórmula** que usa (regla crítica 31).

## Checklist del topic

- [ ] Todo intervalo $[a,b]$ es entero con longitud entre 2 y 8
- [ ] Ningún ejercicio requiere técnica de integración, solo geometría de rectángulos
- [ ] `tags` con el slug de la tabla, conteo por slug verificado contra el target
- [ ] Cardinalidad: GRAF/FORM conceptual → 3 opciones; ejercicios numéricos → 4 opciones ≤35 caracteres
