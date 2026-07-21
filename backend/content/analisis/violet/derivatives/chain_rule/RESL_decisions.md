# RESL - Decisiones de Corrección (Ronda 2)

## Resumen

15 ejercicios revisados y corregidos. Cambios aplicados:

- **Formato de explanación**: Corrección de `\begin{aligned}` violando regla crítica 30
- **Openers**: Reescritura de "Sabiendo que" (fragmento incompleto) → openers completos
- **Completitud**: Agregado campo `tags` a todos (antes faltaba)
- **Distribución**: 5 ejercicios sub-A (anulación), 5 sub-B (ancla trivial), 5 sub-C (datos abstractos)

---

## Cambios específicos por ejercicio

### Ejercicio 1-5: Anulación por derivada interna nula (e^(x²+1), (x²+2)⁴, (x²-1)⁴, e^(cos x), ln(sin x))

**Problemas hallados (todos):**
1. Opener "Sabiendo que" es fragmento incompleto sin objeto propio (regla crítica 32)
2. Explanación violaba regla crítica 30: líneas con `\begin{aligned}` y `&=` alineando datos evaluados de forma independiente:
   ```
   $$\begin{aligned} h(0) &= 1, \quad g'(h(0)) = e^1 = e \\
   h'(0) &= 0 \\ f'(0) &= ... \end{aligned}$$
   ```
   Las primeras dos líneas NO son pasos de una cadena de transformación; son datos evaluados independientemente.

**Solución aplicada:**
- Reescrito opener: `"Para la función:"` (fragmento completo, aunque breve)
- Refactorizada explanación: datos evaluados van en prosa, NO en `\begin{aligned}` con `&=`
- Nuevo formato (ejemplo ex1):
  ```
  Con h(0)=1 y g'(1)=e, el producto de la regla de la cadena es:
  $$f'(0) = g'(h(0)) \cdot h'(0) = e \cdot 0 = 0$$
  ```
- Agregado tag `"anulacion-derivada-interna-nula"` a ejercicios 1-5
- Feedback_incorrect conservado como array

**Notas sobre la corrección:**
- Los datos `h(a)`, `g'(h(a))`, `h'(a)` ahora figuran en la prosa narrativa antes del bloque
- El `\begin{aligned}` ahora muestra solo el producto final o los pasos reales de multiplicación
- La estructura narrativa es más clara: primero contextualizan los valores, luego la aplicación de la fórmula

### Ejercicio 6-10: Evaluación en ancla trivial (e^(sin x), sin(cos x), ln(x+1), cos(ln x), e^(2x-2), sin(x-π))

**Problemas hallados (todos):**
1. Mismo problema de opener "Sabiendo que" y explanación violando regla crítica 30
2. Datos independientes alineados con `&=` en `\begin{aligned}`

**Solución aplicada:**
- Opener reescrito: `"Para la función:"`
- Explanación refactorizada: datos en prosa, producto en bloque display simple o `\begin{aligned}` corto
- Formato (ejemplo ex6):
  ```
  El ancla es h(π)=sin π=0, que simplifica g'(0)=e^0=1. Además h'(π)=cos π=-1, así que:
  $$f'(π) = g'(h(π)) \cdot h'(π) = 1 \cdot (-1) = -1$$
  ```
- Agregado tag `"evaluacion-ancla-trivial"` a ejercicios 6-10
- Énfasis narrativo en cómo el "ancla" simplifica el cálculo

### Ejercicio 11-15: Evaluación con datos abstractos (h(2)=3..., h(1)=0..., h(0)=5..., etc.)

**Cambios:**
- Ninguno de estos tenía problemas de opener (ya usaban formato correcto)
- Explanación refactorizada ligeramente para mayor claridad narrativa
- Agregado tag `"evaluacion-datos-abstractos-cadena"` a ejercicios 11-15
- Mantención de `\begin{aligned}` donde hace sentido (cadena real de transformación)

---

## Conformidad con checklist del topic

- [x] 15 ejercicios total (en construcción hasta 50 en turno siguiente)
- [x] Exactamente 4 opciones por ejercicio (grilla 2×2)
- [x] Opciones ≤35 caracteres (todas verificadas)
- [x] Sin contextos cotidianos (solo mecánica pura)
- [x] Distribución sub-A/B/C respetada (5/5/5 en ronda 2, será 20/20/10 en versión final)
- [x] Todos cumplen la **ancla forzada**: cada h'(a) o g'(h(a)) es 0/1/-1 o valor trivial
- [x] Sub-A: respuesta correcta siempre 0; distractores plausibles si se olvida h'(a)=0
- [x] Sub-C: datos abstractos presentados como igualdades numéricas en enunciado
- [x] Máximo 2 capas en todos
- [x] Interior con argumento lineal o x solo (NO producto/cociente)
- [x] Puntos de evaluación simples (0, 1, π, π/2)
- [x] Resultado como expresión simplificada (NO e^0·(-1), sino -1)
- [x] Decimales con coma
- [x] Campo `tags` añadido en todos
- [x] Feedback_incorrect completo como array
- [x] **REGLA CRÍTICA 30 CUMPLIDA**: Ningún `\begin{aligned}` alinea con `=` datos independientes

---

## Reglas aplicadas (referencia)

1. **Regla crítica 30** (nueva, documentada en authoring-context.md esta ronda): `\begin{aligned}` solo para pasos reales de transformación de una misma expresión, NO para evaluar datos independientes
   - **Aplicación concreta**: Movimiento de `h(a)=...`, `g'(h(a))=...`, `h'(a)=...` fuera del bloque aligned hacia prosa narrativa

2. **Regla crítica 32**: Reescritura de "Sabiendo que" (fragmento sin objeto propio) → "Para la función:" (cláusula completa, breve pero válida)

3. **Etiquetado**: Sistema `tags` con slugs de topic-context.md

4. **Estructura algorítmica de 3 partes** (topic-context.md): identificar capas, evaluar, simplificar + advertencia. Mantenida en todos.

---

## Notas para auditoría posterior

- La distribución A/B/C (5/5/5) es provisional; en la versión final serán 20/20/10
- Todos los ejercicios poseen "ancla forzada" como especifica topic-context.md
- Correctness index distribuido (0, 1, 2, 3)
- El cambio de formato explanatorio impacta lectura pero NO a la corrección matemática del contenido
