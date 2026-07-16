# Gamificación y diseño de ejercicios en Intervalo

> **Cómo usar este documento:** es el "por qué" detrás de las reglas de `authoring-context.md`. No contiene reglas nuevas ni constraints operativos, todos los constraints activos viven en `authoring-context.md`, `generation-instructions.md` y el `topic-context.md` correspondiente. Usalo para decidir cuando tengas dudas sobre matices que las reglas mecánicas no cubren (qué tono darle a una explicación, cómo elegir entre dos contextos cotidianos equivalentes, cuándo un chiste "cierra" y cuándo sobra).

Marco de referencia: *Actionable Gamification* (Yu-kai Chou), framework Octalysis. Cada
Core Drive tiene una posición en el octágono: arriba = **White Hat** (motivación positiva,
sostenible), abajo = **Black Hat** (urgencia, eficaz pero puede dejar mal gusto); izquierda
= **Left Brain** (extrínseco, motivado por obtener algo), derecha = **Right Brain**
(intrínseco, la actividad es el premio).

---

## Diagnóstico de la sesión actual

La sesión está sobre-indexada en el lado extrínseco/urgente y subdesarrollada en el
intrínseco:

- **CD2, Development & Accomplishment** (dominante): XP, ranking, belts, confeti.
  Left Brain + White Hat. Fácil de diseñar; riesgo real: un badge sin desafío real
  detrás no significa nada. Si el ejercicio es trivial, CD2 se vacía aunque la animación
  sea espectacular.
- **CD8, Loss & Avoidance** (segundo motor): la premisa del SRS entero es "repasar
  antes de olvidar". Presente en el contador de pendientes, los ítems vencidos, el
  reintento-con-menos-XP. Black Hat voluntario y saludable (como ir al gym).
- **CD3, Empowerment of Creativity & Feedback** (el más débil y el más importante para
  esta iteración): ver sección dedicada más abajo.
- **CD4, Ownership & Possession**: opera entre sesiones, el árbol de emojis, el belt
  que "se posee", el username coloreado en el ranking. Los contextos cotidianos en los
  enunciados son su puerta de entrada dentro del ejercicio.
- **CD6, Scarcity**: el "no hay repaso hoy" es un *appointment dynamic* sano del SRS
  diario.
- **CD7, Unpredictability**: qué ítem toca en la sesión es impredecible, pero la UI no
  lo comunica todavía.

---

## CD3, Empowerment of Creativity & Feedback

El "golden corner" del Octalysis: White Hat + Right Brain simultáneamente. Es el único
drive intrínseco y positivo a la vez, y el antídoto a la "gamification fatigue", lo que
mantiene vivos ajedrez o Starcraft sin contenido nuevo constante. Vive en el loop:

> **elección significativa → feedback inmediato → ajuste**

Hoy la sesión es básicamente un quiz de CD2. Las dos vías para meter CD3 sin tocar el
motor de SRS:

1. **`feedback_incorrect` por distractor**: al elegir mal, el panel naranja deja de ser
   genérico ("¿Seguro? Revisá tu respuesta...") y muestra *exactamente por qué esa
   opción es la confusión clásica que es*. El feedback es accionable y atado a la
   elección concreta del usuario, no a la pregunta en abstracto.

2. **Cardinalidad ajustada al número real de confusiones**: una elección es
   "significativa" en el sentido de CD3 solo si cada opción representa una decisión
   real. La regla operativa (ver `authoring-context.md`) fija la cardinalidad por
   **tipo de respuesta**: numérica corta → 4 (cada distractor es un error aritmético
   distinto y genuino, además de que el front las compacta en grilla 2×2), conceptual
   → 3 (tres confusiones clásicas alcanzan), binario → excepcional. Lo que genera
   fatiga no es "4" en abstracto, sino rellenar con opciones que nadie elegiría por
   razones reales. Cuatro errores de cálculo plausibles son cuatro elecciones
   significativas; cuatro variantes de una pregunta sí/no son ruido.

---

## Cardinalidad de opciones y Sistema 1/Sistema 2 (Kahneman)

Marco: *Pensar rápido, pensar despacio* (Kahneman). Sistema 1 = pensamiento automático,
rápido, por reconocimiento de patrones. Sistema 2 = pensamiento deliberado, analítico,
lento.

El quiebre de simetría en las opciones no es estético, es funcional. Opciones de
cantidad/forma pareja invitan al Sistema 1 a descartar por comparación visual (longitud
del texto, primera letra, si "suena" a número grande) en vez de analítica. Reducir la
cardinalidad donde el concepto lo permite **fuerza al Sistema 2 a pronunciarse sobre el
contenido**, no sobre el bulto de las opciones.

**Calibración (la regla operativa es por tipo de respuesta, ver `authoring-context.md`).**
La tabla de abajo es orientativa por skill, pero la fuente de verdad es el tipo de
respuesta: numérica corta → 4, conceptual/textual → 3, binario → excepcional.

| Skill | Proceso dominante | Cardinalidad típica |
|-------|-------------------|--------------|
| `LEXI`, `CLSF` | Sistema 1, reconocimiento rápido de categoría/término | 3 conceptual · 4 si la respuesta es numérica corta |
| `ESTR` | puente: conceptual pero con estados discretos | 3 |
| `GRAF` | Sistema 1 perceptual (leer la curva) + Sistema 2 para valor | 3 si es categórica · 4 si es valor/fórmula |
| `RESL` | Sistema 2 deliberado: cálculo puro o con contexto cotidiano | 4 (errores de procedimiento genuinos) |

El binario (2 opciones) se reserva para criterios genuinamente sí/no sin tercera
confusión plausible, y no debe superar ~3 ítems por archivo de 50: en masa vuelve la
sesión un juego de moneda.

**Grilla compacta 2×2**: cuando las 4 opciones son valores numéricos o expresiones
cortas, el layout en matrix concentra las opciones visualmente y el Sistema 1 no puede
buscar patrones de longitud de texto, el juicio queda forzado al valor en sí. Estado:
implementado en el front (se activa con 4 opciones, todas ≤35 caracteres).

**Estructura de embudo invertido en el enunciado**: contexto liviano → objeto matemático
en `$$` → restricción/pregunta final. Cada capa reduce en volumen pero aumenta en
abstracción, evita que el ojo escanee el enunciado entero como un bloque homogéneo.
Sin esta estructura, el Sistema 1 lee el último bloque como la pregunta y omite las
restricciones intermedias.

---

## Sin nombres propios, por qué

Los nombres propios ("Juan", "María", "Alejandro") activan sesgos automáticos de
Sistema 1 que no tienen nada que ver con el razonamiento matemático: género percibido
del personaje, simpatía o antipatía por la asociación con personas conocidas,
connotaciones culturales. Ese ruido distrae del contenido y puede introducir sesgos en
la dificultad percibida del ejercicio. Los roles genéricos ("un vendedor", "una empresa",
"un remis") anclan el contexto al problema sin activar esas asociaciones.

---

## Contextos cotidianos y CD4 (Ownership)

CD4 opera cuando el usuario siente que algo "le pertenece". Dentro del ejercicio, el
vehículo es que el enunciado hable del mundo del estudiante: costos, sueldos, tarifas
de transporte, producción, temperatura, situaciones en las que el alumno ya tiene
intuición informal. Al resolver, el conocimiento matemático se "instala" en un contexto
que ya le pertenece afectivamente, lo que aumenta la probabilidad de que lo recuerde
fuera de la sesión.

---

## Cierre de la explicación: advertencia por defecto, humor excepcional

El error es el estado emocional más frágil de la sesión para CD2: el usuario acaba de
fallar y su "accomplishment" está momentáneamente amenazado. La tercera parte de la
`explanation` es la que trabaja ese momento, y por defecto lo hace señalando la
**confusión típica o dando un consejo práctico**:

1. **Cierra el loop metacognitivo**: nombrar el error clásico ("ojo, esto suele
   confundirse con la imagen") le da al alumno una regla accionable para la próxima,
   que es lo que consolida el aprendizaje después de fallar.
2. **Reduce la fricción afectiva sin frivolizar**: enmarca el error como algo previsto
   y común, no como una falla personal. Baja la carga emocional apoyándose en el
   contenido, no en un chiste.

**Por qué el humor es ahora la excepción y no la regla:** cuando cada explicación
remata con un chiste, el remate deja de sorprender (se vuelve fórmula) y a veces
compite con la advertencia útil por el último renglón, que es el que más se recuerda.
El humor sigue siendo válido, pero solo cuando surge naturalmente una **analogía
cotidiana exagerada** (una consecuencia práctica o una escena burocrática absurda)
que además refuerza el concepto. Enunciada en tono formal, funciona como ancla de
memoria sin volverse tic. Los antropomorfismos y los chistes externos al tema quedan
fuera siempre.

---

## Distractores plausibles, por qué no absurdos

Un distractor absurdo (`f(x) = 🍕` entre opciones algebraicas serias) no activa
ningún proceso cognitivo relevante: el Sistema 1 lo descarta en milisegundos por
anomalía. No hay aprendizaje.

Un distractor plausible (un resultado que se obtiene si se olvida el signo, si se
confunde dominio con imagen, si se aplica mal una regla) activa metacognición: el
usuario tiene que *argumentar internamente* por qué esa opción está mal antes de
elegir. Ese argumento interno es el momento exacto de aprendizaje.

Los `feedback_incorrect` amplifican esto: al elegir el distractor plausible, la pista
dice exactamente *cuál* fue el argumento equivocado que llevó ahí, completando el
loop de CD3.

---

## LEXI como skill de transición

`LEXI` es el skill con menor engagement por unidad de dificultad: es puro recall de
Sistema 1, sin cálculo ni juicio conceptual. En el modelo cerrado (belts azul/violeta/
marrón), `LEXI` no sobrevive como skill independiente. La estrategia es redistribuir
su contenido: las definiciones que son genuinamente binarias (sabe/no sabe el término)
se absorben en `CLSF` reformulado como reconocimiento de concepto, o se eliminan si
el concepto ya aparece implícito en otros skills del mismo tema.
