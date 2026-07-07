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

## Estado (auditoría jul-2026), lo que falta para alinear con `authoring-context.md`

Verificado programáticamente sobre los 4 JSON (post-auditoría de junio, que ya había vaciado `feedback_incorrect` a `""` en batch: sigue vacío en los 200, sin el bug de duplicado con `feedback_correct` que sí aparece en otros temas).

1. **`feedback_incorrect` falta en los 200 ítems** (los 4 skills en `""`, sin excepción). Completar como `array<string|null>` paralelo a `options`, `null` en el índice correcto, voz descriptiva nunca acusatoria (`authoring-context.md` §Pistas).
2. **`\n\n` pegado a bloques `$$...$$`**: LEXI 3 (#3,4,9), CLSF 3 (#10,12,49), FORM 0 (limpio), GRAF 0 (limpio).
3. **Em-dash `—`/en-dash `–`**: LEXI 5 (#9,24,25,33,42), CLSF 2 (#29,32), FORM 4 (#11,14,34,40), GRAF 3 (#9,21,46).
4. **Explicaciones con viñetas `•`/sub-ítems `-`**: LEXI 4 (#10,14,42,46), CLSF 18 (#0,4,5,7,8,11,13,14,25,26,28,38,39,40,41,42,45,49), FORM 4 (#0,11,12,32), GRAF 18 (#11,16,17,25-39 en bloque). Reescribir a los 3 párrafos de prosa.
5. **`explanation` bajo 250 caracteres**, el defecto más extendido del tema: LEXI 7, CLSF 7, FORM 32/50 (más de la mitad), **GRAF 45/50 (casi todo el archivo)**. El patrón repetido en GRAF es "señal visual + regla + fórmula corta" sin un párrafo de cierre; sumar una advertencia/consejo o ampliar el concepto general para cruzar el mínimo.
6. **Cierres con humor/antropomorfismo**: no se detectaron casos en los 4 JSON. Igual verificar al escribir cierres nuevos: por defecto son advertencia/consejo neutro.
7. **`correct_index` sesgado**: LEXI {0:7,1:19,2:20,3:4}, CLSF {0:5,1:15,2:23,3:7}, FORM {0:10,1:19,2:17,3:4}, GRAF {0:17,1:17,2:14,3:2}. Rebalancear a ~{0:12,1:13,2:12,3:13} reordenando `options` (mismo contenido, nueva posición) y sincronizando `feedback_incorrect`.

### Confusiones fuente para `feedback_incorrect`, por skill

**LEXI:** dominio ($\mathbb{R}$) ↔ imagen ($(0,+\infty)$) invertidos; $f(0)=a$ confundido con la base $b$; base $b>1$ (creciente) ↔ $0<b<1$ (decreciente) invertidos; creer que la exponencial tiene raíces reales (nunca toca la asíntota); tasa de crecimiento $r=b-1$ confundida con la base $b$ misma; período de duplicación ↔ vida media invertidos; desplazamiento vertical (mueve la asíntota) ↔ desplazamiento horizontal (mueve $f(0)$ pero no la asíntota) confundidos; la inversa (logaritmo) confundida con la función misma o creer que no es inyectiva; comparación de bases: mayor base crece más rápido a la derecha, no necesariamente vale más en $x=0$; comportamiento en $\pm\infty$ invertido (hacia $-\infty$ se acerca a la asíntota si $b>1$, hacia $+\infty$ diverge).

**CLSF:** **Exponencial ↔ Logarítmica** (el distractor más frecuente del tema, ver eje conceptual); "tasa fija / suma constante" leído como exponencial cuando es lineal; crecimiento rápido confundido con cuadrática o polinómica (que sí tienen un extremo o múltiples fases, la exponencial no); imagen con desplazamiento vertical mal calculada; creer que la exponencial tiene extremos locales o cambios de monotonía (siempre es estrictamente creciente o decreciente, nunca ambas).

**FORM:** valor inicial $a$ ↔ factor multiplicativo $b$ intercambiados al armar la fórmula; en interés compuesto, confundir la tasa $r$ con el factor completo $(1+r)$; en depreciación, signo de la tasa (crecer en vez de decrecer o viceversa); error al despejar $a$ y $b$ desde dos puntos dados; desplazamiento vertical confundido con $f(0)$ (el desplazamiento mueve la asíntota, $f(0)$ es el valor de la función ahí); en propiedades algebraicas ($b^x \cdot b^y = b^{x+y}$, etc.), sumar donde corresponde multiplicar o viceversa; al leer desde gráfico, confundir $f(0)$ con la base $b$ (que se lee de $f(1)/f(0)$, no directamente).

**GRAF:** creciente ↔ decreciente invertidos según la dirección visual de la curva; asíntota horizontal confundida con una raíz (la curva se acerca pero nunca cruza, no hay raíces reales); $f(0)$ confundido con la base $b$ (la base se lee comparando $f(1)$ con $f(0)$, no leyendo un solo punto); imagen ↔ dominio invertidos; comportamiento en $\pm\infty$ invertido (cuál lado se achata contra la asíntota y cuál diverge, según el signo de la base).

### Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal:**
- [ ] `feedback_incorrect` completo en los 50 ítems por skill: `array` del largo de `options`, `null` en el correcto
- [ ] Ningún `\n\n` pegado a un bloque `$$...$$`
- [ ] Ningún em-dash `—` ni en-dash `–`
- [ ] Ninguna explicación con viñetas `•` ni sub-ítems `-`
- [ ] Cierres de `explanation` en advertencia/consejo, sin humor ni antropomorfismo
- [ ] `explanation` supera los 250 caracteres entre las 3 partes (foco especial en GRAF y FORM)
- [ ] `correct_index` variado, no concentrado en un solo índice (objetivo ~12-13 por índice)
- [ ] Montos con `\$` escapado
- [ ] Distractor Exponencial↔Logarítmica presente en CLSF donde corresponda

