## Patrón de modernización: tema `linear`

Tras modernizar 150 ejercicios del tema `linear` (50 LEXI + 50 CLSF + 50 FORM),
se documentan los patrones y contextos para referencia futura:

### LEXI (léxico, 50 ejercicios)
- **Mayoría abstracto/vocabulario puro**: nombre de parámetros ($m$, $b$), forma $f(x) = mx + b$,
  signo de $m$ → monotonía, dominio/imagen, raíz, casos especiales ($m = 0$).
- **Algunos con contexto liviano**: sueldo, saldo, tanque. Contexto ilustra el término sin forzar.
- **Sin modelado pesado**: la idea es que el usuario conozca las palabras clave antes de
  entender "por qué" una situación es lineal.

### CLSF (clasificación, 50 ejercicios)
- **Núcleo: "Qué modelan"** — dada una situación en palabras, decidir si es lineal.
  - Lineal: tasa constante (sueldo fijo + comisión, tanque pierde 5 L/min, abono + costo por GB).
  - No-lineal: tasa multiplicativa (interés compuesto → exponencial), área (x²) → cuadrática.
- **Distractores**: elegir familia equivocada (confundir lineal con cuadrática/exp/log).
- **Variante gráfica**: clasificar desde la forma visual (recta vs parábola vs curva).
- **Monotonía**: intervalo donde crece/decrece (respuesta: ℝ entero si $m ≠ 0$).
- **[CORREGIDO jun-2026]** Los CLSF con contexto cotidiano (clsf_11..20, 31..40)
  tenían la pregunta pegada al contexto y abreviada a `¿Qué familia?`. Se separó
  contexto/pregunta con `\n\n` y se reescribió cada pregunta nombrando la
  magnitud concreta (ver reglas en *Redacción del enunciado*).

### FORM (formulación, 50 ejercicios)
- **Núcleo: "Armar la fórmula desde enunciado"** — extraer $m$ (tarifa/pendiente) y $b$ (costo fijo)
  de una situación cotidiana, escribir $f(x) = mx + b$.
  - Taxi: "500 fijo + 200/km" → $C(k) = 500 + 200k$ (ojo: $m = 200$, $b = 500$).
  - Tanque: "60 L, pierde 4 L/h" → $V(t) = 60 - 4t$ (ojo: $m = -4$).
  - Distractores: confundir $m$ ↔ $b$, signo invertido, sumar en lugar de multiplicar.
- **Variante gráfica**: leer ecuación desde gráfico (pendiente = "sube X por cada 1 en X", intercepto Y).
- **Raíz y imagen**: resolver $f(x) = 0$, imagen sobre dominio restringido $[a, b]$.

### Biblioteca de contextos (reutilizable, variar números)
Taxi/remis, plomero/gasista, sueldo fijo + comisión, abono celular + GB,
factura luz/gas, alquiler bici/auto por hora, suscripción + costo por uso,
tanque llena/vacía a ritmo, nafta, ahorro mensual, saldo SUBE/tarjeta,
distancia a velocidad, descuento por cantidad, peso por libro.

**Montos**: siempre con `\$` escapado (en JSON: `\\$`).
**Gráficos**: respetar 1:1 (pendientes `|m| ≤ 3`).

### Diferencia LEXI vs CLSF vs FORM
- **LEXI**: "¿Cómo se llama esto?" → respuesta: palabra clave.
- **CLSF**: "¿A qué familia pertenece?" (fórmula o situación) → respuesta: familia.
- **FORM**: "Construye/lee la fórmula" → respuesta: ecuación $f(x) = mx + b$.

La **progresión natural es LEXI → CLSF → FORM**: primero vocabulario,
luego clasificar modelos cotidianos, luego armar las fórmulas.

---

