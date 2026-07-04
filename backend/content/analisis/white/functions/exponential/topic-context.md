## Patrón de modernización: tema `exponential` (LEXI / CLSF / FORM / GRAF)

### Eje conceptual

Una exponencial aparece cuando el cambio es **proporcional al valor actual** — crecimiento o decaimiento en porcentaje fijo por período:

| Señal en el enunciado | Familia |
|-----------------------|---------|
| "se duplica cada período" / "crece un X% por año" | exponencial creciente |
| "se reduce a la mitad" / "pierde el X% anual" | exponencial decreciente |
| "tasa fija por unidad / suma constante" | lineal |
| "un máximo / mínimo, curvatura única" | cuadrática |
| "múltiples picos / fases" | polinómica |
| "escala logarítmica / pH / Richter" | logarítmica |

**Diferencia cotidiana clave:** "suma \\$500 por mes" → lineal; "crece un 10% mensual" → exponencial.

### Biblioteca de contextos validados

Bacterias que se duplican, interés compuesto, depreciación de un auto, desintegración radiactiva (vida media), enfriamiento de un objeto (Newton), propagación de usuarios/app. Montos con `\\$`. Sin nombres propios.

### Auditoría de los 36 originales (junio 2026)

- `feedback_incorrect` estaba lleno en los 36 → vaciado a `""` en batch.
- `clsf_13` tenía pista en la opción correcta `(siempre creciente)` → eliminada.
- `clsf_01`, `clsf_05`, `clsf_08` sin párrafo de contexto → se agregó intro.
- `graph_view` no cuadrado en 7 ejercicios → se ajustaron bases y vistas.

### Cobertura por skill (exponential, 200 ejercicios)

**LEXI (50):** forma canónica $f(x) = a \cdot b^x$, dominio $\mathbb{R}$, imagen $(0,+\infty)$, asíntota horizontal, monotonía según base, $f(0)=a$, tasa de crecimiento ($r = b-1$), período de duplicación, vida media, número de Euler $e$, transformaciones (desplazamiento horizontal/vertical, reflexión), propiedades algebraicas, inyectividad, inversa (logaritmo), sin raíces reales, comparación de bases, comportamiento en $\pm\infty$.

**CLSF (50):** desde cotidiano (bacterias, interés, depreciación, enfriamiento), desde fórmula (formas transformadas), desde gráfico (asíntota desplazada, creciente vs decreciente, distinguir de logarítmica), imagen con desplazamiento, monotonía global, sin extremos locales. Distractor frecuente: **Exponencial ↔ Logarítmica**.

**FORM (50):** armar fórmula desde cotidiano ($B(t)=P_0 \cdot 2^t$, $M(t)=C(1+r)^t$, $V(t)=V_0(1-r)^t$), leer $a$ y $b$, evaluar $f(\text{valor})$, determinar $a$ y $b$ desde dos puntos, desplazamiento vertical, propiedades algebraicas, 5 ejercicios leer-desde-gráfico con `graph_fn`.

**GRAF (50):** *Tipo A (25)*: leer propiedades — creciente/decreciente, asíntota, $f(0)$, imagen, raíces, $f(1)$ para leer base, comportamiento en $\pm\infty$. *Tipo B (15)*: identificar la fórmula. *Tipo C (10)*: contexto cotidiano (bacterias, inversión, depreciación, enfriamiento, usuarios).

### `graph_fn` para GRAF exponential

Sintaxis mathjs. Usar bases ≈ 1,5 o escalar para fit cuadrado:

```
Crecientes:
  pow(1.5, x)              [-5,5,-0.5,8.5]    # base 1.5, f(0)=1
  pow(2, x)                [-4,4,-0.5,8.5]    # base 2
  exp(x)                   [-3,5,-0.5,8.5]    # base e
  2 * pow(1.5, x)          [-5,5,-0.5,10]     # a=2, f(0)=2
  3 * pow(2, x)            [-4,3,-0.5,10]     # a=3, f(0)=3

Decrecientes:
  pow(0.5, x)              [-4,4,-0.5,8.5]    # base 0.5
  pow(0.7, x)              [-6,4,-0.5,8.5]    # decae suave
  3 * pow(0.6, x)          [-4,6,-0.5,10]     # a=3

Con desplazamiento vertical:
  pow(2, x) + 2            [-4,4,-0.5,9.0]    # asíntota y=2, f(0)=3
  pow(0.5, x) + 1          [-4,6,-0.5,9.0]    # asíntota y=1, decreciente
  pow(2, x) - 1            [-4,5,-1.5,8.5]    # asíntota y=-1, tiene raíz en x=0
```

---

