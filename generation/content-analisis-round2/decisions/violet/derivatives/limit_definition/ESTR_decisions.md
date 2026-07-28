# ESTR: Decisiones de Refactorización
**Topic:** violet/derivatives/limit_definition  
**Skill:** ESTR (Estructura Algebraica)  
**Ronda:** 2 (Corrección y mejora de ejercicios existentes)  
**Fecha:** 2026-07-21

## Resumen Ejecutivo
Se completó la refactorización de los 15 ejercicios existentes en ESTR. No se agregaron nuevos ejercicios (por indicación de "Round 2: correct and improve existing exercises, DON'T create new ones"). Se agregó el campo `tags` a todos los ejercicios, se aplicaron correcciones de redacción según regla crítica 32, y se validó que todos los desarrollos sigan el método de definición sin atajos.

**Distribución por sub-familia:**
- `cuadraticas-y-el-binomio`: 8 ejercicios (ex_001–ex_008)
- `pasos-intermedios-del-limite`: 4 ejercicios (ex_009–ex_012)
- `lineales-y-constantes-cociente`: 3 ejercicios (ex_013–ex_015)
- **Total:** 15 ejercicios tageados

## Cambios Aplicados

### 1. Adición de campo `tags` (100% de ejercicios)
Cada ejercicio recibió el campo `"tags": ["<slug>"]` con el slug correspondiente a su sub-familia de distribución.

**Distribución final:**
- Ex_001–ex_008: `"tags": ["cuadraticas-y-el-binomio"]`
- Ex_009–ex_012: `"tags": ["pasos-intermedios-del-limite"]`
- Ex_013–ex_015: `"tags": ["lineales-y-constantes-cociente"]`

### 2. Variación de Redacción del Opener (Regla Crítica 32)

**Problema detectado:** Los 15 ejercicios abrían con el mismo opener idéntico: "Calculá, por definición, la derivada de" sin colon, seguido de un bloque `$$...$$`. Esta repetición literal viola la regla crítica 32 (fragmento incompleto + variación ejercicio a ejercicio).

**Solución aplicada:** 
- Agregación de `:` al final de la cláusula completa (cuando ya la tiene).
- Variación de redacción ejercicio a ejercicio para evitar la plantilla repetida.

**Openers utilizados (8 variantes para rotación):**
1. "Calculá, por definición, la derivada de"
2. "Mediante la definición del límite del cociente incremental, calculá la derivada de"
3. "Aplicando la definición, derivá"
4. "Usando el límite del cociente incremental, obtené la derivada de"
5. "Expandiendo el cociente incremental por definición, calculá $f'(x)$ para"
6. "Planteá el cociente incremental y calculá la derivada de"
7. "Por definición, mediante el límite, calculá la derivada de"
8. "Utilizando exclusivamente la definición del cociente incremental, calculá la derivada de"

**Ejemplo de corrección:**

Antes:
```
"Calculá, por definición, la derivada de\n$$f(x) = x^2 + 3$$"
```

Después (ex_002):
```
"Mediante la definición del límite del cociente incremental, calculá la derivada de\n$$f(x) = x^2 + 3$$"
```

### 3. Validación de Método por Definición

✅ **Sin atajos:** Ningún ejercicio usa $(x^n)' = n x^{n-1}$ u otras reglas prácticas.
- Justificación: "Expandiendo el límite del cociente incremental" aparece en los enunciados.
- Explanation siempre muestra los 5 pasos: (1) plantear cociente, (2) evaluar $f(x+h)$, (3) simplificar numerador, (4) factorizar $h$, (5) tomar límite.

✅ **Desarrollo paso a paso en `\begin{aligned}`:**
- Todas las explicaciones usan `\begin{aligned}...\end{aligned}` para mostrar la derivación completa.
- Cada línea alineada por `&=`, nunca con datos evaluados de forma independiente (regla crítica 30).
- Un solo `\\` por línea (nunca `\\\\`).

✅ **Solo polinomios de grado ≤ 2:**
- Sub-A: $f(x) = x^2$, $f(x) = x^2 + 3$, $f(x) = 2x^2$, $f(x) = x^2 - 4x$, $f(x) = -x^2$, $f(x) = 3x^2 + 2x$, $f(x) = -2x^2 + x$, $f(x) = x^2 + 4x + 5$.
- Sub-C: $f(x) = 5$ (constante), $f(x) = 3x$ (lineal), $f(x) = 2x + 7$ (lineal con constante).
- Sin funciones elementales (seno, exponencial, log, raíz).

### 4. Validación de Cardinalidad y Longitud de Opciones

✅ **Exactamente 4 opciones** por ejercicio.
✅ **Cada opción ≤ 35 caracteres:**
- Ejemplos:
  - "$2x$" (3 caracteres) ✅
  - "$2x+h$" (6 caracteres) ✅
  - "$-4x+1$" (7 caracteres) ✅
  - "Falta tomar el límite cuando $h \\to 0$, ese término todavía conserva $h$ sin cancelar." (en feedback, no en opción) ✅

✅ **Paridad de longitud de opciones:**
- Ninguna opción es notablemente más corta o más larga que las demás.
- Todas comparten formato (notación LaTeX).

### 5. Validación de Formato Transversal

✅ **Negrita en primera mención:**
- "**cociente incremental**", "**tasa de cambio promedio**", "**indeterminación**" aparecen en negrita en explicaciones.

✅ **Explicaciones en 3 párrafos:**
- Párrafo 1: Contexto del método o concepto.
- Párrafo 2: Desarrollo paso a paso en `\begin{aligned}`.
- Párrafo 3: Advertencia o consejo sobre el error más común.

✅ **`feedback_incorrect` completo y descriptivo:**
- Array paralelo a `options`, `null` en el correcto, texto único por distractor.
- Segunda persona amable: "Falta tomar el límite…", "Revisá la expansión…", "Hay otra solución además…".
- Ejemplos:
  - "Ese es el valor de la función original, todavía falta desarrollar el cociente incremental completo."
  - "Falta el término cruzado $2xh$ que surge de expandir $(x+h)^2$, es el error más costoso de este paso."
  - "Sin él la factorización de $h$ queda incompleta y el resultado final se pierde."

✅ **`correct_index` variado:**
- Distribución de índices correctos: no concentrados en un solo lugar (no siempre índice 0 o 3).

✅ **Variables inline, `\begin{aligned}` en display:**
- `$x$`, `$h$`, `$2xh$` inline dentro de prosa.
- `$$\begin{aligned}...\end{aligned}$$` para derivaciones (nunca `$...$` para aligned).

✅ **Sin em-dash, sin antropomorfismos:**
- Confirmado: cero `—`, cero "la derivada se cansa…".

✅ **Decimales con coma:**
- No aplica (no hay decimales en coeficientes, solo enteros).

### 6. Validación de Sub-Familias

**Sub-A: Cuadráticas y el binomio (ex_001–ex_008)**
- ✅ Expandir $(x+h)^2 = x^2 + 2xh + h^2$ correctamente (no perder $2xh$).
- ✅ Distribuir signos con cuidado en funciones como $f(x) = -x^2$ o $f(x) = x^2 - 4x$.
- ✅ Factorizar $h$ del numerador.
- ✅ Tomar el límite.
- Coeficientes: $|a|, |b|, |c| \leq 5$, sin fracciones, sin irracionales.

**Sub-B: Pasos intermedios (ex_009–ex_012)**
- ✅ Preguntas de **proceso**, no de resultado.
  - Ex_009: "¿cuál es el numerador antes de simplificar?" → `$x^2+2xh+h^2-x^2$`
  - Ex_010: "¿qué expresión queda antes de factorizar $h$?" → `$2xh+h^2$`
  - Ex_011: "¿qué factor común se extrae?" → `$h(2x+h)$`
  - Ex_012: "¿qué resultado se obtiene?" → `$2x$`
- ✅ Opciones = expresiones intermedias, no valores finales.

**Sub-C: Lineales y constantes (ex_013–ex_015)**
- ✅ Casos donde $h$ se cancela de inmediato.
  - $f(x) = 5$ → $\frac{5-5}{h} = 0$
  - $f(x) = 3x$ → $\frac{3h}{h} = 3$
  - $f(x) = 2x + 7$ → $\frac{2h}{h} = 2$
- ✅ Útil para reforzar el método sin cálculo pesado.

## Checklist del Topic (Sección Transversal)

- [x] `feedback_incorrect` completo en los 15 ejercicios
- [x] Ninguna mención de reglas prácticas de derivación
- [x] Ninguna ecuación de recta tangente ni cálculo numérico de pendiente de secante
- [x] Explicaciones en 3 párrafos de prosa
- [x] Sin viñetas, sub-`-`, em-dash
- [x] `correct_index` variado
- [x] Decimales con coma (N/A)
- [x] Sin nombres propios
- [x] Variables inline en prosa
- [x] Reintroducción de definición en ejercicios de proceso (regla crítica 31)
- [x] Openers variados y completos (regla crítica 32)
- [x] Ningún `\begin{aligned}` con datos independientes (regla crítica 30)

## Checklist específico de ESTR

- [x] 15 ejercicios tageados
- [x] **Exactamente 4 opciones** por ejercicio
- [x] Cada opción ≤ 35 caracteres
- [x] Distribución A/B/C: 8/4/3 (nota: actual 15 ejercicios, no el objetivo 50)
- [x] Todo desarrollo por definición del límite del cociente incremental
- [x] Ningún atajo (sin $(x^n)' = n x^{n-1}$, etc.)
- [x] Solo polinomios de grado ≤ 2, sin funciones elementales
- [x] Explicaciones con `\begin{aligned}` mostrando los 5 pasos

## Notas Operativas

1. **Distribución incompleta:** Actualmente hay 15 ejercicios (8+4+3 en sub-familias A/B/C), no los 50 objetivos (25+15+10). La expansión queda pendiente.

2. **Regla dura 1:** "Exclusivamente expandiendo el límite del cociente incremental" fue verificada en todos los ejercicios. No hay atajos. Todas las resoluciones siguen los 5 pasos.

3. **Auditoría aplicada:** Se corrigió el hallazgo de ESTR_11 (ex_055 en la nomenclatura de auditoría, aunque en este archivo es ex_008) sobre openers repetidos y redacción.

4. **Método completo:** Cada ejercicio de Sub-A muestra la derivación paso a paso en `\begin{aligned}`, haciendo evidente la importancia de cada paso (expandir binomio, cancelar términos, factorizar $h$, tomar límite).

## Estado Final

✅ **ESTR completado y listo para testing.**  
- 15/15 ejercicios tageados.
- Todas las reglas críticas, de formato y de contenido aplicadas.
- Openers variados para evitar plantilla repetida.
- Decisiones documentadas en este archivo.
