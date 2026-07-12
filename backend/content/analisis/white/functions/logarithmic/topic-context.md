## Patrón de modernización: tema `logarithmic`

**Rama:** `modernizacion-logarithmic` | **Fecha:** 2026-06-17 | **PR:** pendiente

### Partida
36 ejercicios originales (11 LEXI + 14 CLSF + 11 FORM + 0 GRAF).

### Resultado
200 ejercicios: 50 × LEXI / CLSF / FORM / GRAF.

### Auditoría de los 36 originales (script `audit_logarithmic.py`)
- `feedback_incorrect` vaciado a `""` en todos (36/36).
- Párrafo de contexto agregado a `clsf_01`, `clsf_05`, `clsf_08` (tenían pregunta de gráfico sin descripción previa).
- `graph_view` corregido en 7 ejercicios con gráfico: estándar para `log2(x)` sin desplazamiento → `[-0.5, 8.5, -3, 5]`; ajustes análogos para variantes.

### Convenciones específicas de logarítmicas

**graph_fn en mathjs:**
- base 2: `log2(x)`
- natural: `ln(x)`
- base arbitraria b: `log(x)/log(b)` (mathjs usa `log` como logaritmo natural)
- negado: `-log2(x)`
- desplazado: `log2(x)+1`, `log2(x-1)`, `log2(x+1)`, `log2(x)-1`
- escalado: `2*log2(x)`
- base < 1: `log(x)/log(0.5)`

**graph_view estándar** (dominio visible hasta x≈8.5 para que xRange≈yRange≈8-9):
```
log2(x)              [-0.5, 8.5, -3, 5]
log(x)/log(3)        [-0.5, 8.5, -3, 5]
ln(x)                [-0.5, 8.5, -2, 5]
log(x)/log(4)        [-0.5, 8.5, -2, 4]
-log2(x)             [-0.5, 8.5, -4, 4]
log(x)/log(0.5)      [-0.5, 8.5, -4, 4]
log2(x)+1            [-0.5, 8.5, -2, 6]
log2(x)-1            [-0.5, 8.5, -4, 4]
log2(x)+2            [-0.5, 8.5, -1, 7]
log2(x-1)            [0.5, 9.5, -3, 4]
log2(x+1)            [-1.5, 7.5, -3, 4]
ln(x-1)              [0.5, 9.5, -2, 4]
2*log2(x)            [-0.5, 8.5, -4, 6]
log2(x-1)+1          [0.5, 9.5, -2, 5]
```

**Contextos cotidianos** (sin pH, Richter ni decibeles):
- Inversión: "¿cuántos años para llegar a $M$?" → tiempo = logaritmo del factor de crecimiento.
- Bacterias: "¿cuántas horas para multiplicarse por N?" → logaritmo del factor.
- Deuda: "¿cuántos meses para que la deuda se duplique/triplique?" → ídem.
- Depreciación inversa: "¿cuántos años para que el auto valga la mitad?" → logaritmo del factor de depreciación.

**Puntos clave de $\log_b(x)$:**
- Siempre pasa por $(1, 0)$.
- Pasa por $(b, 1)$ — clave para identificar la base.
- Asíntota vertical en $x = 0$ (o en $x = c$ si hay desplazamiento horizontal).
- Imagen = $\mathbb{R}$ siempre.
- Dominio = $(0, +\infty)$ para la básica, $(c, +\infty)$ con desplazamiento horizontal $-c$.

**sync-catalog obligatorio** porque GRAF es skill nueva para `logarithmic`:
`bun run scripts/sync-catalog.ts` desde `web/`.

---

## Estado (auditoría jul-2026), lo que falta para alinear con `authoring-context.md`

Verificado programáticamente sobre los 4 JSON (post-auditoría de junio, que ya había vaciado `feedback_incorrect`: sigue vacío en los 200, sin bug de duplicado).

1. **`feedback_incorrect` falta en los 200 ítems** (los 4 skills en `""`, sin excepción). Completar como `array<string|null>` paralelo a `options`, `null` en el índice correcto, voz descriptiva nunca acusatoria (`authoring-context.md` §Pistas).
2. **`\n\n` pegado a bloques `$$...$$`**: LEXI 28/50 (más de la mitad), CLSF 18, FORM 24, GRAF 2. LEXI y FORM son los más afectados.
3. **Em-dash `—`/en-dash `–`**: LEXI 5 (#8,11,26,41,47), CLSF 9 (#0,4,18,20,22,25,35,42,44), FORM 1 (#12), GRAF 1 (#10).
4. **Explicaciones con viñetas `•`/sub-ítems `-`**: LEXI 3 (#8,10,42), CLSF 13, FORM 1 (#26), GRAF 0 (limpio).
5. **`explanation` bajo 250 caracteres**: LEXI 24/50, CLSF 12, FORM 34/50, **GRAF 45/50 (casi todo el archivo)**. Mismo patrón que en `exponential`: falta el párrafo de concepto general o el cierre de advertencia/consejo.
6. **Cierres con humor/antropomorfismo**: no se detectaron casos (verificado con scan de palabras clave). Igual revisar al escribir cierres nuevos.
7. **`correct_index` sesgado, el más desparejo del tema**: LEXI {0:4,1:9,2:27,3:10}, CLSF {0:4,1:11,2:22,3:13}, FORM {0:5,1:15,2:22,3:8}, **GRAF {0:1,1:5,2:13,3:31}** (31/50 en índice 3, casi nada en 0). Rebalancear a ~{0:12,1:13,2:12,3:13} reordenando `options` (mismo contenido, nueva posición) y sincronizando `feedback_incorrect`.

### Confusiones fuente para `feedback_incorrect`, por skill

**LEXI:** dominio ($(0,+\infty)$) ↔ imagen ($\mathbb{R}$) invertidos, al revés que en exponencial (acá el dominio es el restringido); asíntota vertical (en $x=0$ o desplazada) confundida con una asíntota horizontal (la logarítmica no tiene); el punto fijo $(1,0)$ confundido con $(0,1)$ o con el punto $(b,1)$ que sirve para leer la base; base $b>1$ (creciente) ↔ $0<b<1$ (decreciente) invertidos; propiedad del producto $\log(a\cdot b) = \log a + \log b$ confundida con $\log(a+b)$; propiedad del cociente con el signo invertido; propiedad de la potencia $\log(a^n) = n\log a$ olvidando multiplicar por $n$; cambio de base $\log_b(x) = \ln(x)/\ln(b)$ invertido como $\ln(b)/\ln(x)$; confundir cuál función es la inversa de cuál (exponencial ↔ logarítmica); creer que $\log(0)$ existe o que $\log(1) \neq 0$.

**CLSF:** **Logarítmica ↔ Exponencial** (inversas, el distractor más frecuente del tema, en espejo con `exponential`); un crecimiento que se frena leído como exponencial (es logarítmico) o viceversa; "cuántos períodos para llegar a..." (se despeja el tiempo, es logarítmica) confundido con "cuánto vale después de..." (es exponencial); confundir con una raíz o con otra función de crecimiento lento.

**FORM:** al armar $t = \log_b(\text{factor})$ desde un contexto (inversión, bacterias, deuda, depreciación), confundir qué va adentro del logaritmo o la base a usar; propiedad del cociente con el signo invertido (restar cuando corresponde sumar o viceversa); propiedad de la potencia olvidando el factor $n$; error de cambio de base al evaluar numéricamente; confundir qué variable se despeja (tiempo vs. monto).

**GRAF:** asíntota vertical confundida con horizontal; dominio ↔ imagen invertidos; el punto $(1,0)$ y el punto $(b,1)$ mal leídos para identificar la base; monotonía invertida según el signo de la base; comportamiento cerca de la asíntota (decrece sin cota) confundido con el comportamiento en $+\infty$ (crece sin cota, pero muy lento).

### Checklist del topic, verificar antes de dar por cerrado cada skill

**Transversal:**
- [ ] `feedback_incorrect` completo en los 50 ítems por skill: `array` del largo de `options`, `null` en el correcto
- [ ] Ningún `\n\n` pegado a un bloque `$$...$$` (foco en LEXI y FORM)
- [ ] Ningún em-dash `—` ni en-dash `–`
- [ ] Ninguna explicación con viñetas `•` ni sub-ítems `-`
- [ ] Cierres de `explanation` en advertencia/consejo, sin humor ni antropomorfismo
- [ ] `explanation` supera los 250 caracteres entre las 3 partes (foco especial en GRAF y FORM)
- [ ] `correct_index` variado, no concentrado en un solo índice (objetivo ~12-13 por índice; GRAF necesita el rebalanceo más grande del tema)
- [ ] Montos con `\$` escapado
- [ ] Distractor Logarítmica↔Exponencial presente en CLSF donde corresponda

