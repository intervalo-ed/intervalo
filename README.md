# Intervalo

## Índice

1. [Fundamento](#1-problema)
2. [Propuesta](#2-propuesta)
3. [Principios](#3-pilares)
4. [Sistema](#4-sistema)
---

# **1\. Problema**

El **entendimiento** y el **repaso** son dos partes esenciales del proceso de **aprendizaje**. 

Sin un repaso constante, los conceptos sobre los cuales ocupamos tiempo y energía en entender, se van degradando de manera gradual hasta quedar prácticamente olvidados. 

Por lo tanto, repasar con frecuencia es lo que determina si un concepto va a estar disponible cuando se lo necesita, ya sea para aplicarlo o para entender un nuevo concepto.

El repaso se puede pensar en dos dimensiones, cómo se repasa y con qué frecuencia.

Respecto al cómo se repasa, hay muchas formas, relectura pasiva, reescribir resúmenes, hacer mapas conceptuales, etc. El método que mayor evidencia científica acumula es la [evocación activa](https://www.adams.es/blogs/alumno/metodos/metodo-active-recall-oposiciones/) o *active recall* , que consiste en recuperar un concepto, ya sea para contestar una pregunta o resolver un problema, desde la memoria y sin tener acceso a material de consulta [(Dunlosky et al., 2013)](https://www.whz.de/fileadmin/lehre/hochschuldidaktik/docs/dunloskiimprovingstudentlearning.pdf).

Respecto a la frecuencia, la investigación que hay sobre la [repetición espaciada](https://es.wikipedia.org/wiki/Repaso_espaciado) o *spaced repetition* establece que cada vez que se repasa un concepto se reduce la velocidad a la que este se olvida [(Murre & Dros, 2015)](https://www.researchgate.net/publication/281824405_Replication_and_Analysis_of_Ebbinghaus'_Forgetting_Curve). Por ende, para cada concepto, el método es reducir la frecuencia de repaso cuando es recordado correctamente y aumentarla cuando no lo es.

Sin embargo, ambos métodos agregan **necesariamente** más complejidad y dedicación, por sobre la que ya existe. La evocación activa es más difícil que otros métodos y por lo tanto menos atractiva. La repetición espaciada es tediosa, porque requiere hacer un seguimiento de la retención de cada concepto.

# **2\. Propuesta**

Como propuesta frente a esta complejidad y dedicación agregada, *Intervalo* plantea un sistema que integra ambos métodos a través de una interfaz amigable gamificada y un algoritmo que automatiza las decisiones de repaso, reduciendo la fricción de aplicar estos métodos por cuenta propia.

La **gamificación** convierte el repaso en una experiencia con progresión visible. A través de un sistema de niveles y cinturones el estudiante puede ver en todo momento dónde está parado y hacia dónde va, haciendo tangible algo que de otro modo es muy abstracto. Transforma algo que puede sentirse como una obligación en algo concreto y motivador. Al presentar los ejercicios dentro de una experiencia estructurada y con retroalimentación inmediata, resolver problemas desde la memoria se vuelve menos intimidante y más parecido a un desafío que vale la pena enfrentar.

El **algoritmo** registra el desempeño del estudiante en cada ejercicio y ajusta continuamente qué practicar y con qué frecuencia. Los conceptos bien consolidados se repasan menos; los débiles, más. El resultado es que el tiempo de práctica se invierte donde más importa, sin que el estudiante tenga que tomar esa decisión.

*Intervalo* propone un método de repaso complementario a las clases, que es **eficiente**, **adaptativo** y **amigable**.

A partir de esto, surgen tres hipótesis de desarrollo.

Hipótesis | Descripción | Justificación 
---|---|---
| Exámenes | Si un estudiante usa regularmente el sistema durante su cursada, llega mejor preparado a las evaluaciones y obtiene mejores calificaciones. | El repaso activo y adaptativo durante el cuatrimestre refuerza los conceptos antes de que se deterioren, reduciendo la brecha entre lo aprendido en clase y lo que se puede demostrar en un examen. |
| Correlatividades | Si un estudiante repasa los conceptos de una materia con Intervalo, llega con una base más sólida a las materias que dependen de ella. | Los conocimientos previos no se pierden entre cuatrimestres. El estudiante llega a una correlativa con los fundamentos activos y disponibles, en lugar de tener que reconstruirlos desde cero. |
| Internalización | Si un estudiante practica con regularidad a lo largo del tiempo, desarrolla una capacidad más profunda para resolver problemas, más allá de los contenidos de cualquier materia en particular. | La práctica sostenida de evocación activa no solo retiene contenido sino que entrena el razonamiento. Con el tiempo, el estudiante se vuelve más ágil para enfrentar problemas nuevos porque tiene esquemas conceptuales más consolidados. |

# **3\. Pilares**

*Intervalo* es un sistema de repaso adaptativo gamificado que acompaña la cursada a partir de sesiones cortas y frecuentes. Combina evocación activa, repetición espaciada y una capa de gamificación inspirada en el sistema de cinturones del [Jiu-Jitsu Brasilero](https://es.wikipedia.org/wiki/Jiu-jitsu_brasile%C3%B1o#Sistema_de_grados) y una estética minimalista y moderna.

| Pilar | Features |
| :---- | :---- |
| Evocación Activa | Banco de problemas sobre múltiples habilidades y tipos de ejercicio. El estudiante recupera la respuesta desde la memoria antes de verla, sin reconocerla pasivamente. Cada sesión presenta los ejercicios más prioritarios según el estado del estudiante. |
| Repetición Espaciada | Algoritmo inspirado en [SM-2](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm) que determina cuándo repasar cada concepto según el desempeño del estudiante. Refuerza las dimensiones más débiles, omite las que ya están consolidadas y se adapta con el tiempo. |
| Gamificación | Sistema de graduaciones y niveles de XP obtenida por sesión. Interfaz amigable y satisfactoria de usar. Incentiva a la resolución de los problemas y recompensa el compromiso y el progreso del estudiante. |

# **4\. Sistema**

## **4.1\. Cursos**

*Intervalo* se organiza a través de cursos. Cada curso corresponde a una materia y contiene el banco de problemas, los cinturones y el seguimiento de progreso asociados a ella. El estudiante elige a qué cursos inscribirse y trabaja cada uno de forma independiente.

## **4.2\. Problemas**

Cada curso cuenta con un banco de problemas organizado por tema y habilidad. Los problemas están diseñados para ejercitar la evocación activa, el estudiante debe resolver o responder sin tener el material de consulta disponible. Dentro de cada tema existen distintos tipos de ejercicio, que apuntan a diferentes dimensiones del conocimiento. El sistema registra el desempeño por cada combinación de tema y tipo de ejercicio, lo que le permite al algoritmo construir un perfil detallado de las fortalezas y debilidades de cada estudiante.

## **4.3\. Algoritmo**

El algoritmo determina qué practicar y cuándo, sin que el estudiante tenga que tomar esa decisión. Está inspirado en [SM-2](https://help.remnote.com/en/articles/6026144-the-anki-sm-2-spaced-repetition-algorithm) y funciona sobre cada ítem de forma independiente. Después de cada ejercicio, evalúa la calidad de la respuesta y actualiza dos valores: el factor de facilidad y el intervalo de días hasta la próxima revisión.

El **factor de facilidad** `EF` refleja qué tan consolidado está un ítem para ese estudiante. Empieza en 2.5 para todos los ítems y se actualiza después de cada respuesta:
```
EF = EF + 0.1 − (5 − q) × (0.08 + (5 − q) × 0.02)
```

Donde `q` es la calidad de la respuesta, un valor de 1 a 5 que depende de la precisión y el tiempo que tardó el estudiante en responder. Una respuesta correcta y rápida sube el factor de facilidad; una respuesta incorrecta o lenta lo baja. El factor de facilidad tiene un mínimo de 1.3 y no tiene techo.

El **intervalo** `I` determina cuántos días van a pasar hasta la próxima revisión de ese ítem. Se calcula a partir del factor de facilidad acumulado:
```
I(0) = 1
I(1) = 2
I(n) = I(n-1) × EF
```

El intervalo crece de forma exponencial a medida que el estudiante demuestra dominio sostenido. El resultado siempre se redondea hacia abajo.

Un ítem se considera **graduado** cuando el estudiante lo resuelve correctamente de forma sostenida, momento en el que el intervalo de repaso se extiende de forma significativa y ese ítem deja de aparecer con frecuencia en las sesiones.

## **4.4\. Gamificación**

El progreso en Intervalo se representa a través de un sistema de cinturones inspirado en el [Jiu-Jitsu Brasilero](https://es.wikipedia.org/wiki/Jiu-jitsu_brasile%C3%B1o#Sistema_de_grados). Cada cinturón corresponde a un nivel de dominio dentro del curso y se obtiene al graduar un conjunto de ítems con desempeño sostenido. Dentro de cada cinturón existen rayas, que marcan el avance parcial hacia la siguiente graduación.

El sistema de experiencia complementa los cinturones con una dimensión de progreso continuo. El estudiante acumula XP en cada sesión según la calidad de sus respuestas y las rachas de práctica.