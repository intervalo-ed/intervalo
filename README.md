# Itervalo

## Índice

# **1\. Fundamento**

El aprendizaje y el repaso son dos caras del mismo proceso. Practicar con regularidad no es solo una estrategia para llegar mejor preparado a los exámenes, es lo que mantiene los conceptos disponibles cuando los necesitás en otra materia y lo que desarrolla la capacidad real de resolver problemas nuevos. 

Sin repaso sistemático, el esfuerzo invertido en aprender se diluye con el tiempo y los vacíos aparecen justo cuando más se necesita construir sobre esa base.

Hay dos principios que al aplicarse producen resultados de aprendizaje notablemente superiores, estas son la **evocación activa** y la **repetición espaciada**.

La evocación activa o *active recall* consiste en recuperar un concepto desde la memoria en lugar de releerlo pasivamente. 

La repetición espaciada o *spaced repetition* distribuye esas instancias de recuperación en el tiempo, aumentando los intervalos cada vez que el concepto es recordado correctamente y acortándolos cuando no lo es. Ambos principios actúan sobre los mecanismos de consolidación de la memoria a largo plazo.

A partir de estos principios, Intervalo refuerza y ayuda a retener los conceptos que se ven en clase mediante práctica frecuente y adaptativa. El sistema identifica las dimensiones más débiles de cada estudiante y refuerza específicamente esas áreas, omitiendo lo que ya está consolidado. El resultado es un entrenamiento inteligente que se adapta a las debilidades y fortalezas de cada persona.

Hipótesis | Descripción | Justificación 
---|---|---
| Exámenes | Si un estudiante usa regularmente el sistema durante su cursada, llega mejor preparado a las evaluaciones y obtiene mejores calificaciones. | El repaso activo y adaptativo durante el cuatrimestre refuerza los conceptos antes de que se deterioren, reduciendo la brecha entre lo aprendido en clase y lo que se puede demostrar en un examen. |
| Correlatividades | Si un estudiante repasa los conceptos de una materia con Intervalo, llega con una base más sólida a las materias que dependen de ella. | Los conocimientos previos no se pierden entre cuatrimestres. El estudiante llega a una correlativa con los fundamentos activos y disponibles, en lugar de tener que reconstruirlos desde cero. |
| Internalización | Si un estudiante practica con regularidad a lo largo del tiempo, desarrolla una capacidad más profunda para resolver problemas, más allá de los contenidos de cualquier materia en particular. | La práctica sostenida de evocación activa no solo retiene contenido sino que entrena el razonamiento. Con el tiempo, el estudiante se vuelve más ágil para enfrentar problemas nuevos porque tiene esquemas conceptuales más consolidados. |

# **2\. Principios**

Gradus es una plataforma de práctica adaptativa web mobile-first que acompaña la cursada de materias STEM mediante sesiones cortas y frecuentes. Combina evocación activa, repetición espaciada y una capa de progresión inspirada en el sistema de cinturones del Jiu-Jitsu Brasilero. La estética es deliberadamente minimalista para mantener el foco en el contenido.

| Principio | Implementación |
| :---- | :---- |
| Evocación Activa | El estudiante recupera la respuesta antes de verla, no la reconoce pasivamente |
| Repetición Espaciada | Algoritmo Dual-Loop: adquisición con repetición intra-sesión + SM-2 para retención post-graduación |
| Adaptación Individual Algorítimca | El algoritmo refuerza las dimensiones más débiles de cada estudiante y omite las que ya están consolidadas |
| Gamificación | Sistema de cinturones BJJ con rayas por ítems graduados y niveles de XP por sesión |

# **3\. Algoritmo Dual-Loop**

El algoritmo gestiona ítems independientes por estudiante, uno por cada combinación de tema × habilidad del cinturón activo. Cada ítem atraviesa dos fases con lógicas distintas: una fase de adquisición con repetición intra-sesión, y una fase de retención con espaciado creciente.

La especificación técnica completa —fórmulas, parámetros, ejemplos de progresión, curva de niveles— se encuentra en [docs/algorithm.md](algorithm.md).

## **3.1 Dos Fases**

| Fase | Nombre | Mecanismo | Objetivo |
| :---- | :---- | :---- | :---- |
| Loop Corto | Adquisición | Pasos fijos: misma sesión → 1 día → 3 días | Consolidar el concepto en días |
| Loop Largo | Retención | SM-2: intervalos crecientes hasta 21 días | Retención permanente con mínima carga |

## **3.2 Calificación**

El sistema infiere una calificación del 0 al 5 combinando acierto y tiempo de respuesta. No se le pregunta al estudiante cuán seguro estuvo; el comportamiento observable habla por sí solo.

| Resultado | Tiempo | Calificación | Interpretación |
| :---- | :---- | :---- | :---- |
| Correcto | < 6 segundos | **5** | Fluente, sin dudar |
| Correcto | 6 – 12 segundos | **4** | Bien, con pequeña pausa |
| Correcto | > 12 segundos | **3** | Recordó con esfuerzo |
| Incorrecto | cualquiera | **1** | Fallo |

## **3.3 Graduación**

Un ítem se gradúa al completar el último paso del loop corto (step 2) con calificación ≥ 3. La graduación es inmediata y permanente: el ítem no regresa a learning aunque el estudiante falle en review.

| La tabla de intentos como activo de datos *Cada respuesta queda registrada con tema, habilidad, acierto, calificación y tiempo. Este historial permite identificar los distractores que generan mayor confusión, los temas con mayor tasa de abandono, y si el tiempo de respuesta predice la retención. Es el insumo para superar el algoritmo actual con modelos propios en versiones futuras.* |
| :---- |


# **4\. Gamificación**

## **4.1 Cinturones**

## **4.2 Experiencia**

# **5\. Monetización**

Gradus es gratuito para todos los estudiantes. El acceso al sistema de práctica adaptativa, los cinturones, los niveles y el progreso pedagógico no tienen costo ni condición económica.

## **5.1 Donación voluntaria al graduarse de cinturón Azul**

Cuando un estudiante alcanza el umbral de promoción al cinturón Azul por primera vez en alguno de los cursos, se le presenta una pantalla de celebración que incluye la opción de hacer una donación a voluntad para sostener el proyecto. La donación no es requisito para continuar; es un gesto de apoyo de quien ya experimentó el valor del sistema.

* Sin montos mínimos ni máximos
* Sin beneficios exclusivos asociados a la donación
* Integración con plataformas locales (Cafecito para Argentina) y métodos internacionales
* Reconocimiento opcional del donante en un listado de colaboradores dentro de la plataforma

La elección del cinturón Azul como momento de solicitud es deliberada: el estudiante ya completó semanas de práctica, vivió la mejora en su comprensión de funciones y límites, y tiene criterio propio para evaluar si el sistema vale su apoyo.

## **5.2 Modelo "for educators" (futuro)**

Una vez que el sistema madure a través de usuarios orgánicos gratuitos y el algoritmo esté validado con datos reales, se contempla un modelo de negocio orientado a docentes e instituciones educativas. Este modelo permitiría:

* Configuración de cinturones y contenido personalizado por curso o institución
* Métricas de seguimiento agregadas por grupo (sin exposer datos individuales)
* Integración con el calendario académico de cada materia
* Panel de docente para observar el progreso colectivo e identificar contenidos con mayor dificultad

| Principio de diseño *Ningún contenido pedagógico ni ventaja de progresión estará atado a pagos. La monetización opera sobre contribución voluntaria en el modelo inicial y sobre servicios de valor agregado para instituciones en versiones futuras, preservando la equidad de acceso al aprendizaje.* |


# **6\. Equipo**

| Rol | Responsabilidades |
| :---- | :---- |
| Científico de Datos | Algoritmo SM-2, sistema de XP, generador de ejercicios, análisis de datos de uso, mejora continua del modelo de progresión |
| Desarrollador Backend | Base de datos, endpoints, autenticación, integración de pagos |
| Desarrollador Frontend | React mobile-first, integración con API, diseño de interfaz con estética minimalista |
| Analista de Crecimiento | Mapeo de comunidades universitarias (grupos de Facebook, Discord, WhatsApp por comisión), adquisición orgánica temprana, obtención de feedback, retención de usuarios |

| Orientación del proyecto *Gradus es una plataforma de práctica adaptativa con orientación académica y alma de startup. Rigor en el contenido pedagógico y el modelo algorítmico; mentalidad ágil en la ejecución, el crecimiento y la iteración sobre datos reales.* |
| :---- |

# **7\. Roadmap**

| Versión | Contenido |
| :---- | :---- |
| V1 — MVP Web | Cinturón blanco completo, tres habilidades, generador paramétrico, cinturones con rayas, sistema de XP y niveles, avatar básico, donación voluntaria al graduarse de Azul, web mobile-first. Foco en adquisición orgánica y ajuste del algoritmo con datos reales. |
| V2 — Mobile | Aplicación nativa para iOS y Android en React Native, consumiendo el mismo backend sin modificaciones. |
| V3 — Cursos | Apertura a de otros cursos generalistas propios de carreras STEM. |
| V4 — Educators y Social | Modelo "for educators" con personalización y métricas por curso, mecánica grupal, tablero de avatares por rango, expansión del catálogo de contenido y resto del backlog. |
