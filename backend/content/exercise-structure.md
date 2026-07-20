# Anatomía de un ejercicio de Intervalo

Este es el **plano** de un ejercicio: qué partes lo componen, qué hace cada una y
qué reglas (cualitativas y cuantitativas) tiene que cumplir. Sirve para dos cosas:
decidir de un vistazo si un ejercicio está bien armado, y para que alguien que nunca
generó contenido entienda la estructura antes de escribir el primero.

- **Este documento es el resumen legible.** Da la forma y los números clave.
- **`authoring-context.md` es la fuente de verdad exhaustiva.** Cada regla acá cita
  su número (`R4`, `R18`, …) para que puedas ir al detalle fino, los ejemplos
  ❌/✅ y las excepciones. Si algo de acá y de allá parecen chocar, gana
  `authoring-context.md`; avisá para actualizar este resumen.
- **Se mantiene al día.** Cuando cambia una regla estructural, este plano se
  actualiza junto con `authoring-context.md`.

Flujo de generación completo (rondas, ciclo por topic, validación):
`generation-workflow.md`.

---

## El esqueleto: un ejercicio es un objeto JSON

Cada ejercicio vive dentro de un archivo `{SKILL}.json` (un array de ejercicios). Los
campos:

| Campo | Tipo | Rol |
|-------|------|-----|
| `question` | `string` | **El enunciado.** Contexto + fórmula + pregunta. |
| `options` | `array<string>` | **Las respuestas.** 2 a 4. Una correcta, el resto distractores. |
| `correct_index` | `int` | Índice (0-based) de la opción correcta. |
| `feedback_correct` | `string` | Confirmación corta al acertar (1 oración). |
| `feedback_incorrect` | `array<string\|null>` | Pista por distractor, paralela a `options`. `null` en el índice correcto. |
| `explanation` | `string` | El "¿Por qué?" completo. 3 partes, mínimo 300 caracteres. |
| `tags` | `array<string>` | Slug de la sub-familia del ejercicio (de la tabla del `topic-context.md`). |
| `has_math` | `bool` | `true` si hay LaTeX en cualquier campo. |
| `graph_fn`, `graph_view` | `string`/`array`/`null` | Gráfico embebido (solo skills `GRAF`). |
| `correct_index`, `reviewed` | | metadata. `external_id` **no va en el JSON** (lo infiere el seeder de la ruta). |

Los **cuatro componentes que redactás** son `question`, `options`, `feedback_*` y
`explanation`. Una sección para cada uno abajo.

---

## 1. Enunciado (`question`)

**Rol:** plantear el problema. Estructura de **embudo invertido**: contexto
liviano → objeto matemático aislado → pregunta puntual. Cada capa baja en volumen
y sube en abstracción.

### Criterios cualitativos

- **Sitúa el concepto desde la primera oración** en ejercicios abstractos (nombrar
  función/límite/derivada/integral antes del tecnicismo). No aplica si un gráfico
  o una función a trozos ya dan ese contexto. (R24)
- **Reintroduce la definición o fórmula central** que la pregunta necesita, aunque
  ya haya aparecido en otro ejercicio. Cada ejercicio se lee solo. (R31)
- **Nunca se enmarca contra otro ejercicio** ("a diferencia del anterior", "un caso más
  difícil"): los ejercicios se presentan desordenados e independientes. (R24)
- **La fórmula central va aislada en su propio bloque `$$...$$`**, nunca tejida
  inline dentro de la pregunta, sobre todo si es una fracción. El texto acompaña la
  fórmula en oraciones propias, antes y/o después. (R18)
- **Contexto y pregunta en párrafos separados** por `\n\n`. (Formato de párrafos)
- **Situación cotidiana concreta + pregunta directa**, no "¿qué significa X?".
  Sin muletillas de aclaración ("es decir…", "o sea…"), sin "¿qué rótulo formal…?"
  (usar "¿qué sería…?"), sin preguntas telegráficas ("¿Qué familia?"). (Redacción)
- **Sin adjetivos decorativos** ("moderno", "eficiente") ni nombres propios (usar
  roles genéricos: "un vendedor", "un remis"). (R5)
- **Negrita en consignas invertidas**: `**incorrecta**`, `**falsa**`, `**no
  cumple**`. La restricción crítica del cierre **no** se negrita (fricción
  deseada). (R1 / Negrita)
- **Primera mención de conceptos clave en negrita**: `**dominio**`, `**imagen**`,
  `**codominio**`, `**preimagen**`, `**unicidad**`. Solo la primera. (R3)

### Criterios cuantitativos

| Criterio | Valor |
|----------|-------|
| Fragmento antes de un `$$` | Cláusula completa que **cierra en `.` o `:`** (R9, R32) |
| Separador contexto ↔ pregunta | `\n\n` (línea en blanco) |
| Separador texto ↔ fórmula `$$` | un solo `\n` (R2) |
| Aperturas repetidas | Variar ejercicio a ejercicio; misma apertura literal en ≥30% del archivo = plantilla (warning) (R32) |
| Aclaraciones entre paréntesis/comillas | máximo **1 por oración** (R13) |
| Declaración `A : X \to Y` | cabe en una línea mobile (~30 chars); conjuntos de 2-4 elementos de 1-2 chars (LaTeX/display) |

---

## 2. Opciones (`options`)

**Rol:** una respuesta correcta y distractores que son **confusiones clásicas**
reales (dominio↔imagen, signo invertido, cardinalidad…), no relleno.

### Criterios cualitativos

- **Paridad de longitud y forma.** La correcta **no** puede ser la única
  notablemente más larga **ni** más corta que el resto, ni la única con otro
  formato numérico (entera entre decimales), ni la única con glosa entre
  paréntesis o relleno ("solamente"). Cualquiera de esas asimetrías delata la
  respuesta. Se iguala hacia el medio: recortar la correcta a su idea esencial o
  darles a los distractores algo que compita de verdad, nunca inflar con relleno.
  (R4, R15)
- **Distractores del mismo orden de magnitud** que la correcta (~3-5× máximo): un
  distractor 37× más grande se descarta a ojo sin razonar. Cada distractor debe
  salir de un error de cálculo plausible. (Distractores)
- **Notación consistente dentro del set**: si una opción usa LaTeX/símbolos,
  ninguna otra es prosa libre. Preferencia por LaTeX ante la duda. (Notación)
- **Sin negrita nunca** en `options`. (R1)
- **Sin glosa redundante**: no agregar el nombre de familia entre paréntesis a una
  opción que ya es una fórmula autoexplicativa; no repetir la etiqueta de eje si la
  pregunta ya fijó el orden. (R22, R19)
- **"Cuadrática" y "Polinómica" no conviven** en la misma grilla (toda cuadrática
  es polinómica → ambigüedad).

### Criterios cuantitativos

| Criterio | Valor |
|----------|-------|
| Cardinalidad | **2-4 opciones** |
| Respuesta conceptual/textual | **3 opciones** por defecto |
| Respuesta numérica corta | **4 opciones** (activan grilla 2×2) |
| Binario (Sí/No) | 2, solo si el criterio es genuinamente binario |
| Grilla 2×2 — límite con LaTeX (`$`) | **≤16 caracteres** por opción |
| Grilla 2×2 — límite texto plano | **≤25 caracteres** por opción |
| Correcta "más larga" (bias) | > **1.5×** la mediana de distractores = revisar |
| Correcta "más corta" (bias) | < **0.6×** la mediana de distractores = revisar |
| Fracciones cortas en grilla 2×2 | notación de barra `1/3`, no `\dfrac{1}{3}` (altura pareja) (R20) |

---

## 3. Feedbacks (`feedback_correct` + `feedback_incorrect`)

**Rol:** respuesta inmediata en el segundo intento. El `feedback_correct` confirma;
cada `feedback_incorrect` explica **por qué esa confusión es la confusión que es**,
sin revelar la correcta. No es una mini-explicación (eso lo cubre `explanation`).

### Criterios cualitativos

- **Nombra el error, no la cura.** Señala la confusión (signo, dominio↔imagen,
  contexto físico vs. matemático) sin dar el valor correcto ni nombrar la opción
  buena. (Pistas)
- **Nunca acusar al alumno en tercera persona.** Prohibido "Confunde X", "Invierte
  los roles", "Olvida el negativo". Voces válidas: descriptiva del concepto ("Ese
  es el codominio, no la imagen…") o segunda persona amable ("estás tomando…", "hay
  otra solución además…"). (Pistas)
- **Autosuficiente:** cada pista se entiende sola, no asume que se leyó otra.
- **Contenido según skill:** `RESL` → error de procedimiento/signo/paso salteado;
  `ESTR`/`CLSF` → la condición que falta; `GRAF` → qué parte del gráfico releer.

### Criterios cuantitativos

| Criterio | Valor |
|----------|-------|
| `feedback_incorrect` | array **del mismo largo que `options`** |
| Índice de la correcta | **`null`** |
| Cada distractor | string no vacío, cierra en puntuación terminal |
| Largo de pista | ideal **1 oración**, 2 máximo; ≤2 renglones mobile (3 tolerable, 4 tope) |
| `feedback_correct` | **1 oración**, ideal ≤160 caracteres |
| Igualdades en `feedback_correct` | mover la derivación a `explanation` si encadena 3+ `=` |

---

## 4. Explicación (`explanation`)

**Rol:** el "¿Por qué?". No declara *qué* pasa, **razona el porqué**: el mecanismo
que produce la regla o la clasificación. (R25)

### Estructura de 3 partes

1. **Concepto abstracto:** la fórmula, regla o propiedad general que aplica.
2. **Aplicación al ejemplo:** desglose paso a paso. Con 2+ pasos de álgebra, usar
   `$$\begin{aligned}...\end{aligned}$$` con `&=` de alineación.
3. **Cierre útil (cuando aporta):** advertencia de la confusión típica o consejo
   práctico, en voz neutra. Humor solo excepcional (analogía cotidiana exagerada en
   tono formal), **nunca antropomorfismos ni chistes**. Si no hay cierre pertinente,
   la explicación termina en la aplicación. (R7)

### Criterios cualitativos

- **Justifica el mecanismo, no solo el resultado.** (R25)
- **Nunca invoca conceptos fuera de la frontera del cinturón** (en `white`, sin
  derivadas/límites/integrales). (R12)
- **Primera mención de conceptos clave en negrita** (igual que en `question`). (R3)
- **Preferí la fórmula central centrada** en `$$...$$` por sobre inline cuando es el
  objeto del razonamiento. (Modo inline vs display)
- **Intercalá fórmulas centradas entre segmentos de prosa para dar ritmo** a una
  explicación o resolución larga. La fórmula centrada es un ancla visual que
  reengancha la lectura rápida (sistema 1) entre bloques de texto: sacá a `$$...$$`
  los momentos clave (planteo, resultado intermedio, resultado final) y dejá la
  prosa entre medio narrando el porqué. **No es centrar todo** (una explicación
  toda de bloques sin prosa pierde el razonamiento): es alternar prosa ↔ fórmula ↔
  prosa cuando el tramo es denso. Si es corta y de un paso, no fuerces el corte.
  (Modo inline vs display)

### Criterios cuantitativos

| Criterio | Valor |
|----------|-------|
| Longitud total | **mínimo 300 caracteres** (las 3 partes juntas) |
| Largo de párrafo | **máximo ~200 caracteres**, ideal ~100 |
| Separador entre párrafos de prosa | `\n\n` |
| Fragmentos `$...$` inline por párrafo | **2+ = señal de dividir** el párrafo o subir la fórmula a `$$` (R21) |
| Cierre de cada párrafo | puntuación terminal (`.`) obligatoria (R17) |

---

## Reglas transversales de formato (aplican a todos los campos)

Estas valen en `question`, `options`, `feedback_*` y `explanation` por igual:

- **`$$...$$` va pegado con UN solo `\n`**, nunca `\n\n`. (R2)
- **Mayúscula al empezar toda oración**, incluso tras una fórmula display o si
  arranca con una variable minúscula (`$b$`). (R10)
- **Nunca cortar una oración a la mitad** para meter una fórmula en el medio: el
  fragmento previo cierra en `.`/`:`, lo que sigue es oración nueva. (R9)
- **Prohibido el guion largo `—` (em-dash)** y el `–` (en-dash) en prosa; usar
  `,`/`:`/`;`/`.`. (R6)
- **Prohibidos los símbolos ✓ / ✗ / ✘** en cualquier campo. (R14)
- **Un `\begin{aligned}` va SIEMPRE en `$$...$$`** (nunca `$...$`), con un solo
  `\\` por salto de línea. (R17b)
- **`\text{}` en un display solo para notación corta** (unidades, subíndices), nunca
  una cláusula en español: las palabras van en la prosa. (R26)
- **Dinero con `\$` escapado** (en JSON: `\\$`); un `$` suelto lo toma KaTeX como
  delimitador y rompe el render. (LaTeX y signo `$`)
- **Fórmulas anchas → partir en pasos**, nunca scroll horizontal ni cadena
  `A = B = C = D` larga. (Fórmulas anchas)

---

## Cómo se verifica

Buena parte de estos criterios se chequea solo:

```bash
python content/validate_content.py --course analisis --topic <belt/unit/topic>
```

- **ERROR** (exit 1, se corrige siempre): longitud/puntuación/formato inequívocos
  (explanation < 300, `\n\n$$`, em-dash, ✓/✗, opener sin cierre, `\text{}` largo,
  `tags` faltante, `correct_index` sesgado > 50%, `feedback_incorrect` mal
  formado…).
- **WARNING** (se revisa con criterio): heurísticas (sesgo de longitud de opciones,
  párrafo largo, 2+ inline, feedback acusatorio, plantilla de apertura).

Lo que **no** es automatizable y queda en el checklist manual del `topic-context.md`:
que la explicación razone el porqué (R25), que un `aligned` no aliñe datos sueltos
(R30), que cada ejercicio reintroduzca su definición (R31) y las reglas duras del topic
(`+C`, límites actualizados, frontera del cinturón).
