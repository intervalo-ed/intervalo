## Patrón de modernización: tema `trigonometric`

Llevado de 47 → 200 ejercicios (50 × LEXI / CLSF / FORM / GRAF).

**Convenciones de notación:**
- Texto de ejercicio: `\operatorname{sen}(x)` (notación española).
- `graph_fn` y cálculos internos: `sin(x)`, `cos(x)` (mathjs).
- Nunca `sen` en `graph_fn`.

**Auditoría previa aplicada:**
- `feedback_incorrect` vaciado en los 47 originales.
- `graf_11.graph_view` corregido de dict a lista `[-6.5, 6.5, -2, 2]`.
- `lexi_06`, `graf_01`: `[-0.5,7,-2,2]` → `[-7,7,-2,2]`.
- `graf_10`: `[-0.5,7,-2,2]` → `[-5,5,-2,2]`.
- `form_02`: `[-7,7,-3,3]` → `[-7,7,-2,2]`.
- `graf_02/05/07/09`: `graph_fn` agregado.
- `clsf_01/05/08`: párrafo de contexto agregado.

**Biblioteca de `graph_fn`:**
```
sin(x)              [-7, 7, -2, 2]
cos(x)              [-7, 7, -2, 2]
2*sin(x)            [-7, 7, -3, 3]
-sin(x)             [-7, 7, -2, 2]
-cos(x)             [-7, 7, -2, 2]
3*sin(x)            [-7, 7, -4, 4]
3*cos(x)            [-7, 7, -4, 4]
sin(x)+1            [-7, 7, -1, 3]
sin(x)-1            [-7, 7, -3, 1]
cos(x)-2            [-7, 7, -4, 0]
-cos(x)+1           [-7, 7, -1, 3]
2*cos(x)            [-7, 7, -3, 3]
2*sin(x)+1          [-7, 7, -2, 4]
2*sin(2*x)          [-5, 5, -3, 3]
sin(2*x)            [-5, 5, -2, 2]
cos(2*x)            [-5, 5, -2, 2]
sin(2*x)+1          [-5, 5, -1, 3]
sin(x/2)            [-10, 10, -2, 2]
```

**Parámetros clave:**
- Amplitud = `|A|`; período = `2π/|B|`; máx = `D + |A|`; mín = `D - |A|`.
- Imagen = `[D − |A|, D + |A|]`.

**Grilla del eje x (π vs decimal) — automática según `graph_fn`:**
El gráfico (`math-graph.tsx`) pone el eje x en múltiplos de π (etiquetas π/2, π,
3π/2, 2π…) cuando detecta **función trig (`sin`/`cos`/`tan`) y NINGÚN `pi` en la
fórmula**, porque ahí x es un ángulo en radianes (`sin(x)`, `cos(2*x)`,
`sin(x/2)`). Los **aplicados**, donde x es tiempo/unidad real, **siempre llevan
`pi`** en `graph_fn` (`311*sin(100*pi*x)`, `10*sin(pi/12*(x-6))+20`,
`8*cos(pi/6*(x-1))+15`) → ahí el eje x queda **decimal**. El eje y es siempre
decimal (amplitud). Consecuencia para autoría: una sinusoide de ángulo puro NO
debe incluir `pi` (ni en un corrimiento como `sin(x - pi/3)`), o se la tratará
como aplicada (grilla decimal).

**Contextos cotidianos** (no pH, Richter, decibeles):
- Temperatura diaria/estacional: amplitud = (máx−mín)/2, eje = (máx+mín)/2.
- Mareas: período ≈ 12 h, amplitud = diferencia de nivel.
- Corriente alterna: `311·sin(100πt)` para 220 V / 50 Hz.
- Horas de luz solar: ciclo anual de 365 días.

**GRAF tipos:**
- A: leer propiedad (período, amplitud, imagen, máximos, raíces, eje de oscilación).
- B: identificar fórmula (distractores: seno vs coseno, amplitud vs período, signo).
- C: contexto cotidiano con gráfico real (temperatura, mareas, corriente).

**sync-catalog NO necesario**: GRAF ya existía para `trigonometric`.

---

## Estado (auditoría jul-2026), lo que falta para alinear con `authoring-context.md`

El tema más limpio de la unidad en formato: verificado programáticamente, prácticamente sin `\n\n$$` glue, sin em-dash, sin viñetas, sin explicaciones cortas. Solo dos pendientes reales:

1. **`feedback_incorrect` falta en los 200 ítems** (los 4 skills en `""`, sin excepción). Completar como `array<string|null>` paralelo a `options`, `null` en el índice correcto, voz descriptiva nunca acusatoria (`authoring-context.md` §Pistas).
2. **Antropomorfismo del seno/coseno, un problema localizado en LEXI y CLSF** (no aparece en FORM/GRAF): varios cierres de `explanation` personifican las funciones trigonométricas con rasgos humanos, violación directa de la regla crítica 7 (`authoring-context.md`). Encontrados:
   - **LEXI** #15 ("el coseno llega... con toda la energía. El seno prefiere arrancar despacio"), #18 ("¡Qué disciplina!"), #23 ("el piso en que vive"), #24 ("el seno llega tarde a la fiesta... la invitación decía"), #47 ("el seno siempre llega tarde, pero llega"), #48 ("sin drama con el eje $X$").
   - **CLSF** #28 ("el seno pesimista que en vez de subir, decide bajar primero"), #33 ("el seno ahora duerme... pero sigue soñando"), #42 ("el coseno siempre empieza con lo mejor. El seno prefiere arrancar... y ganarlo").
   - Reescribir estos cierres a advertencia/consejo neutro (ej. nombrar la diferencia real: coseno arranca en su máximo, seno arranca en cero) sin personificación.
3. **Defectos menores de formato** (no requieren pasada completa, solo tocar los ítems puntuales): `\n\n$$` glue en CLSF #10; em-dash en LEXI #29, CLSF #39, GRAF #16; viñetas en LEXI #10, CLSF #11-12, FORM #10, GRAF #10.
4. **`correct_index` con sesgo moderado** (menor que en el resto de la unidad, pero corregible): LEXI {0:4,1:17,2:21,3:8}, CLSF {0:6,1:18,2:15,3:11}, FORM {0:7,1:16,2:17,3:10}, GRAF {0:5,1:10,2:21,3:14}. Rebalancear a ~{0:12,1:13,2:12,3:13}.

### Confusiones fuente para `feedback_incorrect`, por skill

**LEXI:** seno ↔ coseno confundidos en valores clave ($\operatorname{sen}(0)=0$ vs $\cos(0)=1$); período $2\pi/|B|$ invertido (multiplicar por $B$ en vez de dividir); amplitud ↔ período confundidos; imagen $[D-|A|, D+|A|]$ mal calculada (olvidar el valor absoluto o el desplazamiento $D$); monotonía (creciente/decreciente) en un intervalo dado invertida.

**CLSF:** reconocer trigonométrica desde el gráfico (oscilación regular y periódica) confundida con otra familia; contar mal la cantidad de ciclos completos en un intervalo; distinguir seno de coseno desde el gráfico (dónde arranca: cero vs. máximo); reflejo (signo negativo, ej. $-\cos(x)$) confundido con un desplazamiento; un contexto aplicado (consumo eléctrico estacional, corriente alterna) mal reconocido como no periódico.

**FORM:** amplitud ↔ período confundidos al leer $f(x) = A\operatorname{sen}(Bx+C)+D$; máximo/mínimo con desplazamiento vertical ($D+|A|$ / $D-|A|$) mal calculado; error de fase al resolver dónde la función cruza el eje; al armar fórmula desde gráfico, amplitud confundida con el eje de oscilación $D$; período de $\cos(\pi x)$ u otras $B$ no enteras mal aplicado en la fórmula $2\pi/|B|$.

**GRAF:** contar mal máximos o ciclos completos en el intervalo mostrado; diferencia visual seno/coseno (dónde arranca la curva) mal identificada; período leído incorrectamente desde el gráfico; monotonía (creciente/decreciente) en un tramo invertida; en los aplicados, parámetros del modelo (amplitud, eje de oscilación, hora del máximo) confundidos entre sí.

### Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal:**
- [ ] `feedback_incorrect` completo en los 50 ítems por skill: `array` del largo de `options`, `null` en el correcto
- [ ] Sin antropomorfismo del seno/coseno en los cierres (LEXI y CLSF, ver lista de ítems arriba)
- [ ] `correct_index` variado, no concentrado en un solo índice (objetivo ~12-13 por índice)
- [ ] Notación española `\operatorname{sen}(x)` en texto, `sin(x)` solo en `graph_fn`

