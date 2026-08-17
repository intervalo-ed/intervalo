# Flujo de diseño de una unidad — curso `algebra`

Cómo se diseña o rediseña una unidad completa, desde que no existe nada hasta que queda lista para generarse a escala.

**Qué NO es este documento.** No es un prompt de generación. Los prompts viven en `generation/<curso>-round<N>/generation-prompt.md` y describen el **ciclo de ejecución** ítem por ítem: leer la spec, generar, seedear, validar, commitear. Ese ciclo arranca asumiendo que el `topic-context.md` de cada topic ya existe y es correcto.

Este documento cubre la etapa **anterior**: cómo se produce esa spec. Es donde estaba el agujero real del proceso, y donde se perdía la mayor parte del tiempo en las rondas viejas.

**Caso de referencia**: rediseño de `violet/matrices` (ago-2026). Se cita a lo largo del texto porque es el primero que siguió este flujo de punta a punta. Resultado: 6 topics, 18 ítems, 54 ejercicios de muestra, 0 errores de validación, y dos bugs de tooling encontrados que afectaban a los tres cursos.

---

## La idea central

**El cuello de botella nunca fue escribir ejercicios, fue decidir qué ejercicio escribir.**

Generar primero y corregir después produce retrabajo permanente, porque cada corrección obliga a reescribir ejercicios que ya habían pasado el validador. Este flujo mueve todas las decisiones hacia adelante, para que la generación quede mecánica.

De ahí sale la regla que ordena todo lo demás: **el entregable de una ronda de diseño es el `topic-context.md`, no los ejercicios.** Los ejercicios de muestra son la validación barata de la spec antes de comprometer diez veces el volumen.

---

## Las cinco etapas

```
1. Investigación externa       →  ¿qué hay que cubrir y cómo se hace entender?
2. Decisión de estructura      →  topics, skills, orden, fronteras
3. Spec por topic              →  topic-context.md (el entregable real)
4. Muestra: 1 por sub-familia  →  el test de la spec
5. Testing real + promoción    →  feedback recurrente se vuelve regla
```

Ninguna etapa se saltea y ninguna se invierte. Si la etapa 4 sale difícil de escribir, el problema está en la 3, no en el ejercicio.

---

## Etapa 1: investigación externa

Se lanzan **dos agentes en paralelo** que responden preguntas **ortogonales**. Ninguna de las dos fuentes alcanza sola.

### Agente A, relevamiento curricular

Responde **qué se enseña y en qué orden** en las cátedras que cursa nuestro público. Es una restricción externa, no negociable: el alumno cursa una materia real y la plataforma la acompaña.

Universidades a relevar: **UBA** (CBC, FCEyN, FIUBA, FCE), **UTN** (FRBA y al menos dos regionales), **UNLP** (Ingeniería, Informática, Económicas). Tres familias de carreras: ingenierías, exactas y económicas.

Qué pedirle, en orden de valor:

1. **Guías de trabajos prácticos**, no solo programas analíticos. El programa dice qué se declara; la guía dice qué se ejercita. Cuando difieren, manda la guía.
2. **El número de unidad literal** de cada tema en cada cátedra, con la URL al lado. Sin eso no se puede contar nada.
3. **Los tipos de ejercicio ordenados por frecuencia**, que es lo que después alimenta la taxonomía de sub-familias.
4. **Bibliografía citada**, que revela el nivel de abstracción esperado.
5. **Errores frecuentes documentados** en material de cátedra. Son distractores gratis y reales.

### Agente B, fuente pedagógica

Responde **cómo se hace entender** el tema: las imágenes mentales, no las definiciones. En el caso de referencia fue la serie "Essence of Linear Algebra". Qué pedirle: la intuición central de cada concepto, los errores conceptuales que ataca explícitamente, y qué **no** cubre.

### Por qué dos y no una

Las dos fuentes **se contradijeron** en el caso de referencia, y esa tensión fue lo más productivo de la investigación. El relevamiento decía matrices antes que espacios vectoriales; la fuente pedagógica decía span y base antes que matrices. Resolverlo obligó a un hallazgo que ninguna de las dos daba servido: que "espacios vectoriales" no es un bloque monolítico, sino una mitad concreta que va antes y una abstracta que va al final.

Si las dos fuentes coinciden, no aprendiste nada que no supieras. **Buscá activamente la fuente que pueda contradecir a la otra.**

---

## Etapa 2: decisión de estructura

### Buscar el criterio que vuelve empírica la pregunta

Ante una decisión de diseño ambigua, la jugada no es sopesar argumentos en abstracto: es encontrar el criterio que la convierte en algo contable.

En el caso de referencia, la pregunta "¿matrices antes o después de espacios vectoriales?" era irresoluble desde la pedagogía pura. El criterio que la cerró fue **"lo importante es qué ven primero los alumnos en sus clases"**, y con eso pasó a ser un conteo: 7 cátedras a 4, y 5 a 1 dentro de ingeniería.

Ese criterio casi siempre depende de para qué existe el producto, no de matemática, así que **lo aporta el usuario**. Si la decisión está trabada, la pregunta correcta no es "¿cuál es mejor?" sino "¿qué criterio la decide?".

### Tope de 3 skills por topic

No negociable. Obliga a justificar cada exclusión, y esas justificaciones quedan escritas en la spec. Sin el tope se agregan skills donde parecen plausibles y la unidad queda inflada y despareja.

Cada topic declara en su `topic-context.md` **qué skills tiene y por qué no tiene las otras**. Ejemplos del caso de referencia: `operaciones` sin `CLSF` porque la suma admite un solo caso y no hay nada que clasificar; `sistemas` sin `LEXI` porque es la más sustituible ahí y el porqué vive igual en las explicaciones.

### Apartarse de la mayoría es válido, pero se documenta

Si la evidencia dice una cosa y hay una razón propia para hacer otra, se hace otra **y se escribe la razón**. Sin eso, la próxima ronda lo "arregla" de vuelta.

Caso de referencia: casi todas las cátedras dan la inversa antes que el determinante, porque la calculan por Gauss-Jordan. Nosotros no enseñamos ese algoritmo, así que nuestra fórmula de $2\times2$ y nuestro criterio de existencia dependen del determinante, que por lo tanto va antes. Documentado en `inverse/topic-context.md`.

### Qué se toca en esta etapa

- `course.json`: topics, orden, skills, tooltips y `short_description`.
- `course-context.md`: el mapa de cinturones, el estado matemático del alumno, y una nota fechada explicando el rediseño y sus razones.
- Los topics que se sacan **se archivan**, no se borran: `backend/content/archive/algebra/<belt>/<unit>/<topic>/`.

---

## Etapa 3: la spec por topic

Un `topic-context.md` por topic. Es el entregable real de toda la ronda.

### Secciones obligatorias

| Sección | Qué contiene |
|---|---|
| Encabezado | Belt, unit, topic, skills declaradas **y por qué no están las otras** |
| Concepto | La definición central en `$$...$$`, y la posición en la secuencia: qué topics anteriores puede usar y cuáles todavía no existen (regla crítica 31) |
| Función dentro de la unidad | Para qué sirve este topic en el arco. Si no se puede explicar, el topic sobra |
| Una tabla por skill | Sub-familias con cantidad, **slug**, objetivo pedagógico y conceptos que toca |
| Cardinalidad | 3 opciones para conceptuales, 4 para numéricas |
| Contextos variados | Qué situaciones concretas usar en cada sub-familia, y cuáles quedan en abstracto por diseño |
| Confusiones típicas | Tabla de concepto contra confusión a diagnosticar, que alimenta los `feedback_incorrect` |
| Reglas específicas del topic | Rangos numéricos, prohibiciones, notación |
| Checklist | Verificable ítem por ítem al cerrar |

### La frontera fina: la sección de mayor rendimiento

La regla crítica 31 dice que un topic no puede usar conceptos de topics posteriores. En abstracto es inaplicable, porque hay conceptos que **existen en dos versiones**, una operativa y una estructural, y solo una está permitida.

Escribir explícitamente qué puede significar cada concepto en ese cinturón previene una clase entera de errores. Del caso de referencia, en `course-context.md`:

- **Rango**: cantidad de filas no nulas de la escalonada. Nunca dimensión del espacio fila.
- **Inversibilidad**: por determinante no nulo. Nunca por independencia lineal de las columnas.
- **Conjunto solución**: una particular más una del homogéneo. Nunca "espacio nulo" ni "subespacio".
- **Combinación lineal**: sumar vectores escalados, sobre vectores explícitos. Nunca como herramienta para decidir independencia.

Sin esa lista, la unidad depende silenciosamente de la siguiente y nadie lo nota hasta que un alumno se traba.

### Antes de cerrar la etapa: leer las tablas de la unidad entera de corrido

Las `topic-context.md` se escriben de a una y se leen de a una, y por eso el choque entre dos sub-familias de topics distintos no aparece nunca mientras se las escribe. **Se detecta solo poniendo las tablas de la unidad completa una debajo de la otra** y preguntándose, fila por fila, si dos de ellas se resuelven con el mismo procedimiento (regla 67).

Dos cosas se revisan en esa pasada:

- **Slugs repetidos entre topics.** Un tag tiene que identificar una sola sub-familia en todo el curso, porque si no, cualquier consulta por tag mezcla dos cosas distintas. En la pasada de ago-2026 sobre `algebra` había 7.
- **Sub-familias gemelas**, que es el problema serio. En `blue` dos de ellas habían producido literalmente el mismo ejercicio; en `violet` hay tres que se resuelven todas igualando el determinante a cero. El arreglo va escrito en las `topic-context.md` de los dos topics, como una nota de frontera que fija qué cambia: el objeto de entrada o la forma de la respuesta.

Es la misma clase de trabajo que la frontera fina, pero en el otro eje: aquélla separa un topic de los cinturones vecinos, ésta separa dos topics de la misma unidad.

---

## Etapa 4: la muestra

**Un ejercicio por sub-familia**, no más. Con 3 skills y 3 sub-familias por skill, son 9 ejercicios por topic.

No es contenido de producción, es **el test de la spec**. Si un ejercicio sale difícil de escribir, ambiguo o redundante, el problema está en la sub-familia, no en el ejercicio: volvé a la etapa 3.

### Cómo elegir cada ejercicio

El diferencial de Intervalo es la combinación de tres cosas, y conviene evaluarlas explícitamente antes de escribir:

1. **Simplicidad**: respondible mentalmente en menos de 90 segundos (regla 55).
2. **Cotidianeidad**: una situación real donde el objeto matemático organiza datos que importan, en registro Paenza (regla 43).
3. **Momento "ajá"**: algo que el alumno no vio venir y que le reordena el concepto.

El tercero es el más difícil y el que más rinde. Ejemplos del caso de referencia que funcionaron: la tabla de distancias entre ciudades es simétrica **por lo que significa**, no por sus números; un sistema con dos soluciones distintas tiene automáticamente infinitas; el producto exige que las dimensiones encajen porque **son el mismo conjunto de insumos**, mirado una vez como consumo y otra como precio.

### Formato "representar un problema con matrices"

Validado en testing con pedido explícito de usarlo más. Encaja donde el objeto matemático organiza datos reales, y **no** encaja donde los contextos disponibles son geométricos. Esa decisión se toma por topic y se escribe en su spec, para no relitigarla cada ronda.

### Verificación de la etapa

```bash
python seed_content.py --course algebra --prune
```

```bash
python content/validate_content.py --course algebra
```

Cero ERROR es condición de cierre. Los WARNING se revisan uno por uno: los de `regla tags` son esperables durante la generación parcial, el resto se corrige o **se justifica por escrito**. Un falso positivo justificado es mejor que un umbral ajustado para que desaparezca.

El check `duplicates` (regla 65) merece atención propia: compara los números de los enunciados **entre todos los topics de la unidad**, porque el repaso los mezcla en la misma sesión. Es el único que cruza archivos, y en la ronda de `spaces` encontró tres pares de ítems que resolvían la misma cuenta desde topics distintos.

### El validador no ve si una distractora es la correcta disfrazada

Ninguna herramienta detecta que dos opciones nombren el mismo objeto con palabras distintas (regla 64). Es una lectura manual obligatoria al cerrar cada ítem, y la pregunta a hacerse es "¿existe algún caso donde esta distractora y la correcta sean lo mismo?". En `spaces` apareció con el polinomio nulo contra el número cero, y el `feedback_incorrect` había inventado una diferencia falsa para sostenerlo.

Si cambiaron las skills de algún topic, además:

```bash
bun run scripts/sync-catalog.ts
```

---

## Etapa 5: testing real y promoción a regla

### Antes de testear, verificar que el feedback se guarde

`backend/.env` del worktree tiene que tener `ENABLE_DEV_ENDPOINTS=1`. Sin esa línea el endpoint `/dev/test-feedback` devuelve 404 y **el feedback nunca llega al disco**, aunque la app no muestre ningún error. Ya pasó una vez y costó cientos de sesiones de testing perdidas.

Editar el `.env` no dispara el reload de uvicorn, que solo mira archivos `.py`: hay que reiniciar el proceso a mano.

El feedback aterriza en `backend/.test-feedback/<sesion>.md`. Una sesión sin ningún texto cargado no genera archivo.

### Feedback que se repite es una regla, no N fixes

Es el mecanismo que hace que el corpus mejore en vez de solo parchearse. En el caso de referencia, tres de cuatro comentarios decían lo mismo con distintas palabras, y eso no fueron tres correcciones sino **la regla 62** de `authoring-context.md`.

El destino de cada hallazgo:

| Alcance | Dónde va |
|---|---|
| Aplica a todo el corpus | Regla numerada en `authoring-context.md` |
| Aplica a la unidad o al topic | Sección "Hallazgos de testing" del `topic-context.md` |
| Es un caso puntual | Se arregla y no se documenta |

### Antes de tocar el contenido, revisar el tooling

Los dos hallazgos más grandes del caso de referencia **no eran de contenido**. Las opciones con matrices nunca entraban en la grilla 2×2 porque `latexVisualLength` no sabía medir entornos de matriz, y `render_len` del validador tenía exactamente la misma ceguera. El síntoma apareció en un ejercicio; la causa estaba dos capas abajo y afectaba a los tres cursos.

Reflejo permanente: **cuando un ejercicio se ve mal, preguntarse primero si el problema es del heurístico.**

### Validador y humano no son redundantes

Ninguno de los cuatro comentarios de testing del caso de referencia era detectable por el validador: redundancia del enunciado, registro que sonaba a manual, "poné la matriz como ejemplo". Y el validador caza cosas que ninguna lectura humana atrapa: largos de párrafo, conteo de LaTeX inline, paridad de opciones.

Son complementarios. No se puede prescindir de ninguno de los dos.

---

## Al cerrar el diseño de la unidad

Con las cinco etapas cerradas, la unidad queda lista para escalar de 1 a 5 ejercicios por sub-familia, o sea 15 por ítem. Ese escalado **ya no es diseño**, es ejecución: sigue el ciclo por ítem del `generation-prompt.md` de la ronda correspondiente en `generation/`.

Checklist de cierre:

- [ ] `course.json` refleja los topics, el orden y las skills finales
- [ ] `course-context.md` tiene la nota fechada del rediseño, con sus razones y la frontera fina del cinturón
- [ ] Un `topic-context.md` por topic, con todas las secciones obligatorias
- [ ] Los topics removidos están en `backend/content/archive/`, no borrados
- [ ] Un ejercicio por sub-familia, todos con `tags`
- [ ] `validate_content.py` en 0 ERROR; cada WARNING corregido o justificado por escrito
- [ ] Catálogo del front regenerado y `tsc` limpio, si cambiaron las skills
- [ ] Testing real hecho, y cada hallazgo recurrente promovido a regla

---

## Anti-patrones, todos observados en rondas anteriores

- **Generar ejercicios antes de tener la spec.** Garantiza retrabajo: cada corrección posterior obliga a reescribir contenido que ya había pasado el validador.
- **Escalar a 5 por sub-familia antes de testear la muestra.** Multiplica por cinco el costo de cualquier error de diseño.
- **Debatir una decisión de estructura en abstracto** en vez de buscar el criterio que la vuelve contable.
- **Agregar una skill porque "queda bien"** en vez de respetar el tope de 3 y justificar las exclusiones.
- **Apartarse de la práctica mayoritaria sin dejar escrita la razón**, lo que hace que la próxima ronda lo revierta.
- **Arreglar el ejercicio cuando el bug está en el heurístico.**
- **Ajustar un umbral del validador para silenciar un falso positivo**, en vez de justificarlo por escrito.
- **Tratar cada comentario de testing como un fix aislado**, sin preguntarse si tres comentarios distintos son en realidad la misma regla.
