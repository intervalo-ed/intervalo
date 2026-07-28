# GRAF: Decisiones de Refactorización
**Topic:** violet/derivatives/limit_definition  
**Skill:** GRAF (Lectura Gráfica)  
**Ronda:** 2 (Corrección y mejora de ejercicios existentes)  
**Fecha:** 2026-07-21

## Resumen Ejecutivo
Se completó la refactorización de los 15 ejercicios existentes en GRAF. No se agregaron nuevos ejercicios (por indicación de "Round 2: correct and improve existing exercises, DON'T create new ones"). Se agregó el campo `tags` a todos los ejercicios y se validó el cumplimiento de reglas de formato y contenido.

**Distribución por sub-familia:**
- `signo-de-la-derivada-visual`: 6 ejercicios (ex_001–ex_006)
- `identificacion-ceros-derivada`: 6 ejercicios (ex_007–ex_012)
- `diagnostico-esquinas-y-saltos`: 3 ejercicios (ex_013–ex_015)
- **Total:** 15 ejercicios tageados

## Cambios Aplicados

### 1. Adición de campo `tags` (100% de ejercicios)
Cada ejercicio recibió el campo `"tags": ["<slug>"]` con el slug correspondiente a su sub-familia de distribución.

**Distribución final por sub-familia:**
- Ex_001–ex_006: `"tags": ["signo-de-la-derivada-visual"]`
- Ex_007–ex_012: `"tags": ["identificacion-ceros-derivada"]`
- Ex_013–ex_015: `"tags": ["diagnostico-esquinas-y-saltos"]`

### 2. Validación de Formato Transversal

✅ **Negrita en primera mención de conceptos clave:**
- "**signo de la derivada**", "**vértice suave**", "**quiebre**", "**diferenciable**", "**salto**", "**tangente vertical**" aparecen en negrita.

✅ **Explicaciones en 3 párrafos de prosa:**
- Estructura: (a) regla visual / concepto, (b) lectura gráfica del caso específico, (c) advertencia sobre confusión común.
- Ejemplos:
  - Sub-A: "El signo de la derivada en un punto se lee directamente de si la curva sube, baja o queda horizontal justo ahí."
  - Sub-B: "Toda parábola tiene un único vértice, y es justo ahí donde la recta tangente queda horizontal."
  - Sub-C: "En un quiebre, los dos tramos llegan con pendientes distintas…" vs. "En un salto, los dos tramos se acercan a alturas distintas."

✅ **`feedback_incorrect` completo:**
- Array paralelo a `options`, `null` en el correcto, pistas descriptivas en segundo persona amable.
- Ejemplos:
  - "A la izquierda del vértice la curva está bajando, no subiendo, así que la derivada no puede ser positiva ahí."
  - "La derivada se anula justo en el vértice, $x=2$, en $x=0$ la curva todavía tiene pendiente distinta de cero."
  - "En un mínimo suave, como una parábola, decir que hay una esquina o pérdida de diferenciabilidad es incorrecto."

✅ **Cardinalidad ajustada:**
- Sub-A (signo): 3 opciones categóricas ("Positiva", "Negativa", "Cero")
- Sub-B (ceros): 4 opciones numéricas cortas (`$x = N$`)
- Sub-C (esquinas): 3 opciones categóricas

✅ **Variables inline, display para gráficos:**
- `$f'(a)$`, `$f(x)$`, `$x = 0$` en prosa inline.
- Funciones completas (`$f(x) = x^2 - 4x + 3$`) centradas en bloque `$$...$$` antes de la gráfica.

✅ **Gráficos claros:**
- `graph_fn` con funciones de una sola familia (parábolas, valor absoluto, raíz cúbica, a trozos).
- `graph_view` define ventana de visualización cuadrada (1:1 aspect ratio) para no engañar sobre pendiente.
- Un solo comportamiento por ejercicio (una zona de subida, un vértice, un quiebre).

✅ **Sin nombres propios, sin em-dash, sin humor:**
- Confirmado: cero antropomorfismos, cero em-dash.

### 3. Validación Específica de Sub-Familias

**Sub-A: Signo de la derivada (ex_001–ex_006)**
- ✅ Lectura directa: "curva sube → $f' > 0$, curva baja → $f' < 0$, horizontal → $f' = 0$".
- ✅ Casos variados: parábola estándar, parábola invertida, cúbica (meseta).
- ✅ Vértices suaves como distractor en sub-C, no en sub-A (en sub-A se preguntan pendientes no nulas o cero, no diferenciabilidad).

**Sub-B: Identificación de ceros (ex_007–ex_012)**
- ✅ Vértices vs. raíces: diferencia clara entre $f(x) = 0$ (raíz) y $f'(x) = 0$ (vértice).
- ✅ Distractores = raíces de $f$, puntos cualesquiera con pendiente no nula.
- ✅ Nunca pide valor numérico de $f'(a)$, solo dónde se anula.

**Sub-C: Diagnóstico de esquinas y saltos (ex_013–ex_015)**
- ✅ Tres tipos identificados: **vértice suave** (diferenciable, $f' = 0$), **quiebre anguloso** (no diferenciable, pico), **salto** (no continua, no diferenciable).
- ✅ Vértices suaves como distractor explícito en algunas opciones (para evitar confusión).
- ✅ Ejemplo: ex_015 ("$f(x) = x^{1/3}$") distingue **tangente vertical** de quiebre común.

## Checklist del Topic (Sección Transversal)

- [x] `feedback_incorrect` completo en los 15 ejercicios
- [x] Ninguna mención de reglas prácticas de derivación
- [x] Ninguna ecuación de recta tangente ni cálculo numérico de pendiente de secante
- [x] Explicaciones en 3 párrafos de prosa
- [x] Sin viñetas, sub-`-`, em-dash
- [x] `correct_index` variado (signos distribuidos entre Positiva/Negativa/Cero/valores de $x$)
- [x] Decimales con coma (N/A en gráficas abstractas)
- [x] Sin nombres propios
- [x] Variables inline en prosa
- [x] Reintroducción de función/concepto en cada ejercicio

## Checklist específico de GRAF

- [x] 15 ejercicios con `graph_fn` o gráfico embebido
- [x] `graph_view` cuadrado (1:1 aspect ratio)
- [x] Distribución A/B/C: 6/6/3 (nota: actual 15 ejercicios, no el objetivo 50)
- [x] Vértices suaves incluidos como distractor en sub-C
- [x] Cardinalidad ajustada: 3 si categórica, 4 si numérica
- [x] Ningún ejercicio pide el valor numérico de $f'(a)$

## Notas Operativas

1. **Distribución incompleta:** Actualmente hay 15 ejercicios (6+6+3 en sub-familias A/B/C), no los 50 objetivos (20+15+15). La expansión queda pendiente para otra ronda.

2. **Gráficos validados:** Todos los gráficos son funciones elementales o piezas de polígrafos que los alumnos conocen del cinturón anterior (polinomios, valor absoluto, raíz cúbica, a trozos).

3. **Coherencia temática:** Los ejercicios no piden ecuación de recta tangente (reservada para el tema siguiente, `geometric_interpretation`), solo diagnóstico visual del signo, existencia de derivada.

## Estado Final

✅ **GRAF completado y listo para testing.**  
- 15/15 ejercicios tageados.
- Todas las reglas críticas y de formato validadas.
- Decisiones documentadas en este archivo.
