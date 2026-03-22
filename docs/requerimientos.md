**GRADUS**

*Acompañamiento adaptativo para el estudio de materias STEM*

Documento de Requerimientos

# **1\. Fundamento Pedagógico**

Las materias STEM universitarias —análisis matemático, álgebra lineal, física— enfrentan un problema estructural: los estudiantes llegan con niveles de base muy dispares. En un mismo aula conviven quienes tienen sólidos fundamentos y quienes arrastran brechas de la secundaria. El ritmo de la cursada no puede adaptarse a todos, y quienes quedan atrás rara vez logran ponerse al día por sus propios medios.

La investigación en ciencias cognitivas ha identificado dos principios que producen resultados de aprendizaje consistentemente superiores al estudio convencional: la **evocación activa** y la **repetición espaciada**.

La evocación activa consiste en recuperar un concepto desde la memoria en lugar de releerlo pasivamente. La repetición espaciada distribuye esas instancias de recuperación en el tiempo, aumentando los intervalos cada vez que el concepto es recordado correctamente y acortándolos cuando no lo es. Ambos principios actúan sobre los mecanismos de consolidación de la memoria a largo plazo.

Gradus aplica estos principios al acompañamiento de la cursada: no reemplaza al docente ni al estudio formal, sino que lo complementa mediante práctica frecuente y adaptativa. El sistema identifica las dimensiones más débiles de cada estudiante y refuerza específicamente esas áreas, omitiendo lo que ya está consolidado. El resultado es un entrenamiento que se adapta a cada persona y contribuye a nivelar las diferencias de base dentro del aula.

| Hipótesis de diseño *Si un estudiante acompaña su cursada interactuando regularmente con el sistema, llega mejor preparado a evaluaciones y clases porque practica de forma activa los conceptos que le cuestan más, en el momento en que más lo necesitan.* |
| :---- |

# **2\. La Solución**

Gradus es una plataforma de práctica adaptativa web mobile-first que acompaña la cursada de materias STEM mediante sesiones cortas y frecuentes. Combina evocación activa, repetición espaciada y una capa de progresión inspirada en el sistema de cinturones del Jiu-Jitsu Brasilero. La estética es deliberadamente minimalista para mantener el foco en el contenido.

| Principio | Implementación |
| :---- | :---- |
| Evocación activa | El estudiante recupera la respuesta antes de verla, no la reconoce pasivamente |
| Repetición espaciada | Algoritmo Dual-Loop: adquisición con repetición intra-sesión + SM-2 para retención post-graduación |
| Adaptación individual | El algoritmo refuerza las dimensiones más débiles de cada estudiante y omite las que ya están consolidadas |
| Progresión visible | Sistema de cinturones BJJ con rayas por ítems graduados y niveles de XP por sesión |
| Estética minimalista | Interfaz sin distracciones, preparada para portar a React Native en V2 |

# **3\. Nomenclatura del Producto**

| Concepto | Nombre |
| :---- | :---- |
| La plataforma | Gradus |
| Los ejercicios individuales | Ejercicios |
| La sesión diaria | Clase |
| La progresión | Cinturones con rayas (sistema BJJ) |
| El algoritmo interno | SM-2 Dual-Loop (no visible para el usuario) |

| Sobre el nombre *Gradus refiere al Gradus ad Parnassum, tratado clásico del siglo XVIII. En latin significa paso o grado. Cada sesión es un gradus; cada cinturón es un grado alcanzado por demostración real de habilidad, no por tiempo transcurrido. El proyecto tiene orientación académica con mentalidad de startup: rigor en el contenido y el método, agilidad en la ejecución y el crecimiento.* |
| :---- |

# **4\. Alcance del MVP**

El MVP se enfoca en el cinturón blanco —reconocimiento de funciones elementales en dos dimensiones— entregado como aplicación web. El objetivo principal es conseguir usuarios orgánicos tempranos para validar el modelo pedagógico y ajustar el algoritmo con datos reales.

## **4.1 Topics incluidos en el MVP (orden de aparición)**

| # | Topic | Cinturón |
| :---- | :---- | :---- |
| 1 | Lineal | Blanco |
| 2 | Cuadrática | Blanco |
| 3 | Polinomial | Blanco |
| 4 | Exponencial | Blanco |
| 5 | Logarítmica | Blanco |
| 6 | Racional (con asíntotas) | Blanco |
| 7 | Trigonométrica (seno, coseno, tangente) | Blanco |
| 8–13 | Límites y continuidad (6 topics) | Azul |
| 14–19 | Derivadas (6 topics) | Violeta |
| 20–24 | Integrales (5 topics) | Marrón |
| — | Análisis avanzado | Negro (TBD) |

## **4.2 Fuera del MVP**

* Funciones en tres dimensiones

* Razonamiento paramétrico con sliders interactivos

* Contribución de ejercicios por docentes

* Mecánica grupal y cursos (modelo "for educators")

* Aplicaciones mobile nativas iOS y Android (V2)

# **5\. Habilidades**

Las habilidades son las dimensiones evaluadas dentro de cada cinturón. Cada una tiene un código de 4 letras en mayúscula, como los atributos en un juego de rol. Son transversales al sistema: el mismo código puede aparecer en distintos cinturones evaluando el mismo tipo de pensamiento aplicado a un dominio diferente.

| Código | Habilidad | Descripción |
| :---- | :---- | :---- |
| CLSF | Clasificación | Identifica y categoriza a partir de representaciones visuales o gráficas |
| LEXI | Léxico | Nombra y clasifica usando vocabulario matemático correcto |
| FORM | Formulación | Extrae y construye la expresión formal a partir de una representación |
| GRAF | Graficación | Interpreta el comportamiento de un concepto desde una gráfica |
| RESV | Resolución | Calcula y simplifica expresiones aplicando técnicas algebraicas |
| DERI | Derivación | Aplica reglas de derivación con precisión |
| INTG | Integración | Aplica técnicas de integración al tipo de expresión correcto |
| APLI | Aplicación | Usa el concepto del cinturón en problemas de contexto real o analítico |

Cada cinturón selecciona 3 habilidades de este catálogo según su dominio matemático. El conjunto de habilidades de un cinturón define qué tipo de ejercicios puede generar el sistema para ese nivel.

## **5.1 Habilidades por cinturón**

| Cinturón | Habilidades | Racional pedagógico |
| :---- | :---- | :---- |
| **Blanco** | CLSF · LEXI · FORM | Reconocimiento, vocabulario y formulación de funciones elementales |
| **Azul** | GRAF · RESV · CLSF | Lectura gráfica, resolución algebraica e identificación de discontinuidades |
| **Violeta** | GRAF · DERI · APLI | Interpretación geométrica, derivación y aplicaciones de la derivada |
| **Marrón** | GRAF · INTG · APLI | Área acumulada, técnicas de integración y aplicaciones del cálculo integral |
| **Negro** | TBD | TBD |

## **5.2 Tipos de ejercicio por habilidad (cinturón blanco)**

**CLSF — Clasificación:** Se muestra el gráfico de una función. El estudiante elige a qué familia pertenece entre cuatro opciones. Los distractores reflejan confusiones frecuentes entre familias visualmente similares.

**LEXI — Léxico:** Ejercicio en dos pantallas. Pantalla 1: gráfico o expresión algebraica como contexto. Pantalla 2: pregunta sobre nomenclatura o propiedades. Entrena la capacidad de leer y producir lenguaje matemático con precisión.

**FORM — Formulación:** Se muestra el gráfico de una función. El estudiante elige entre cuatro combinaciones de parámetros cuál corresponde a la curva observada. Entrena la conexión entre la representación visual y la expresión algebraica.

# **6\. Sistema de Progresión**

Gradus combina dos capas de progresión: **cinturones** que representan el dominio de un contenido matemático, y **niveles de XP** que reflejan la actividad acumulada del estudiante en el sistema. Ambas capas son independientes: los cinturones dependen de la calidad del aprendizaje; los niveles, del esfuerzo sostenido.

## **6.1 Cinturones**

Cada cinturón cubre un dominio matemático del curso de cálculo univariable y tiene un catálogo de ítems definido por la combinación de temas × habilidades. La progresión es por demostración real de dominio —ítems graduados— no por tiempo acumulado.

```
Blanco (Funciones) → Azul (Límites) → Violeta (Derivadas) → Marrón (Integrales) → Negro (TBD)
```

**Mecánica compartida por todos los cinturones:**

* **2 rayas internas** desbloqueadas por ítems graduados acumulados del cinturón actual.
* **Umbral de promoción:** al alcanzarlo, el sistema comienza a incluir ítems del siguiente cinturón en la sesión. No requiere completar todos los ítems del nivel actual.
* **Maestría opcional:** los ítems entre el umbral de promoción y el total del cinturón siguen disponibles sin bloquear el avance.

### Cinturón Blanco — Funciones

**Temas (7):** Lineal, Cuadrática, Polinomial, Exponencial, Logarítmica, Racional, Trigonométrica

**Habilidades:** CLSF · LEXI · FORM — **Total ítems:** 7 × 3 = 21

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 3 | Progreso visible |
| Segunda raya | 9 | Progreso visible |
| **Promoción a Azul** | 18 | Desbloquea cinturón Azul |
| Maestría | 21 | Opcional, sin efecto en promoción |

### Cinturón Azul — Límites

**Temas (6):** Límites algebraicos, Límites laterales, Límites al infinito, Continuidad, Formas indeterminadas, L'Hôpital

**Habilidades:** GRAF · RESV · CLSF — **Total ítems:** 6 × 3 = 18

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 2 | Progreso visible |
| Segunda raya | 6 | Progreso visible |
| **Promoción a Violeta** | 15 | Desbloquea cinturón Violeta |
| Maestría | 18 | Opcional, sin efecto en promoción |

### Cinturón Violeta — Derivadas

**Temas (6):** Definición como límite, Reglas básicas, Producto y cociente, Regla de la cadena, Funciones especiales, Derivadas implícitas

**Habilidades:** GRAF · DERI · APLI — **Total ítems:** 6 × 3 = 18

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 2 | Progreso visible |
| Segunda raya | 6 | Progreso visible |
| **Promoción a Marrón** | 15 | Desbloquea cinturón Marrón |
| Maestría | 18 | Opcional, sin efecto en promoción |

### Cinturón Marrón — Integrales

**Temas (5):** Integral indefinida, Teorema Fundamental del Cálculo, Sustitución, Integración por partes, Integrales impropias

**Habilidades:** GRAF · INTG · APLI — **Total ítems:** 5 × 3 = 15

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 2 | Progreso visible |
| Segunda raya | 5 | Progreso visible |
| **Promoción a Negro** | 12 | Desbloquea cinturón Negro |
| Maestría | 15 | Opcional, sin efecto en promoción |

### Cinturón Negro — TBD

Cubre los temas restantes del curso de cálculo univariable. Contenido y mecánica de maestría a definir una vez consolidados los cinturones anteriores con datos reales de usuarios.

## **6.2 Saltos entre cinturones**

* **Blanco a Azul**: transición del objeto (funciones) al comportamiento (límites). Primer contacto con el análisis formal.
* **Azul a Violeta**: de observar comportamientos a cuantificarlos. La derivada como herramienta operativa.
* **Violeta a Marrón**: de la derivación a la integración. Acumulación como operación inversa.
* **Marrón a Negro**: TBD.

## **6.3 Sistema de XP y Niveles**

Los niveles son una capa de reconocimiento transversal basada en el esfuerzo acumulado. Cada ejercicio otorga XP independientemente de si el estudiante acierta o no; el acierto y la velocidad de respuesta determinan cuánto.

**Curva de niveles:** basada en φ^(1/6) (razón áurea, sexta parte), que produce una progresión suave y perceptiblemente creciente. La XP necesaria para subir de nivel crece ~8.35% por nivel.

**Otorgamiento de XP:**

| Situación | XP |
| :---- | :---- |
| Cualquier ejercicio intentado | +1 (base) |
| Acierto fluente (calidad 5, < 6s) | +4 adicional |
| Acierto normal (calidad 4, 6–12s) | +2 adicional |
| Acierto con esfuerzo (calidad 3, > 12s) | +1 adicional |
| Error (calidad 1) | +0 adicional |
| 5 respuestas correctas consecutivas | +5 bonus de racha |
| 10 respuestas correctas consecutivas | +15 bonus de racha |
| Obtener una raya | +50 bonus de hito |
| Promoción de cinturón | +200 bonus de hito |

Al terminar cada clase, el estudiante ve su progreso de nivel: XP ganada en la sesión y barra de avance hacia el siguiente nivel.

# **7\. Avatar del Estudiante**

Cada estudiante tiene un avatar que porta el cinturón correspondiente a su nivel actual. La personalización inicial es minimalista y se configura una única vez al crear la cuenta.

## **7.1 Opciones disponibles en el MVP**

* Género del personaje
* Peinado (selección de opciones predefinidas)
* Color de pelo

## **7.2 Fuera del MVP — V3**

* Kimonos y accesorios desbloqueables
* Vista de avatares en contexto grupal
* Customización avanzada general

# **8\. Algoritmo de Progresión (Dual-Loop)**

El algoritmo gestiona ítems independientes por estudiante, uno por cada combinación de tema × habilidad del cinturón activo. Cada ítem atraviesa dos fases con lógicas distintas: una fase de adquisición con repetición intra-sesión, y una fase de retención con espaciado creciente.

La especificación técnica completa —fórmulas, parámetros, ejemplos de progresión, curva de niveles— se encuentra en [docs/algorithm.md](algorithm.md).

## **8.1 Diseño de dos fases**

| Fase | Nombre | Mecanismo | Objetivo |
| :---- | :---- | :---- | :---- |
| Loop Corto | Adquisición | Pasos fijos: misma sesión → 1 día → 3 días | Consolidar el concepto en días |
| Loop Largo | Retención | SM-2: intervalos crecientes hasta 21 días | Retención permanente con mínima carga |

## **8.2 Calificación por respuesta**

El sistema infiere una calificación del 0 al 5 combinando acierto y tiempo de respuesta. No se le pregunta al estudiante cuán seguro estuvo; el comportamiento observable habla por sí solo.

| Resultado | Tiempo | Calificación | Interpretación |
| :---- | :---- | :---- | :---- |
| Correcto | < 6 segundos | **5** | Fluente, sin dudar |
| Correcto | 6 – 12 segundos | **4** | Bien, con pequeña pausa |
| Correcto | > 12 segundos | **3** | Recordó con esfuerzo |
| Incorrecto | cualquiera | **1** | Fallo |

## **8.3 Criterio de graduación**

Un ítem se gradúa al completar el último paso del loop corto (step 2) con calificación ≥ 3. La graduación es inmediata y permanente: el ítem no regresa a learning aunque el estudiante falle en review.

| La tabla de intentos como activo de datos *Cada respuesta queda registrada con tema, habilidad, acierto, calificación y tiempo. Este historial permite identificar los distractores que generan mayor confusión, los temas con mayor tasa de abandono, y si el tiempo de respuesta predice la retención. Es el insumo para superar el algoritmo actual con modelos propios en versiones futuras.* |
| :---- |

# **9\. Monetización**

Gradus es gratuito para todos los estudiantes. El acceso al sistema de práctica adaptativa, los cinturones, los niveles y el progreso pedagógico no tienen costo ni condición económica.

## **9.1 Donación voluntaria al graduarse de cinturón Azul**

Cuando un estudiante alcanza el umbral de promoción al cinturón Azul, se le presenta una pantalla de celebración que incluye la opción de hacer una donación a voluntad para sostener el proyecto. La donación no es requisito para continuar; es un gesto de apoyo de quien ya experimentó el valor del sistema.

* Sin montos mínimos ni máximos
* Sin beneficios exclusivos asociados a la donación
* Integración con plataformas locales (Cafecito para Argentina) y métodos internacionales
* Reconocimiento opcional del donante en un listado de colaboradores dentro de la plataforma

La elección del cinturón Azul como momento de solicitud es deliberada: el estudiante ya completó semanas de práctica, vivió la mejora en su comprensión de funciones y límites, y tiene criterio propio para evaluar si el sistema vale su apoyo.

## **9.2 Modelo "for educators" (futuro)**

Una vez que el sistema madure a través de usuarios orgánicos gratuitos y el algoritmo esté validado con datos reales, se contempla un modelo de negocio orientado a docentes e instituciones educativas. Este modelo permitiría:

* Configuración de cinturones y contenido personalizado por curso o institución
* Métricas de seguimiento agregadas por grupo (sin exposer datos individuales)
* Integración con el calendario académico de cada materia
* Panel de docente para observar el progreso colectivo e identificar contenidos con mayor dificultad

| Principio de diseño *Ningún contenido pedagógico ni ventaja de progresión estará atado a pagos. La monetización opera sobre contribución voluntaria en el modelo inicial y sobre servicios de valor agregado para instituciones en versiones futuras, preservando la equidad de acceso al aprendizaje.* |
| :---- |

# **10\. Requerimientos Funcionales**

## **10.1 Autenticación y Perfil**

* Registro con correo electrónico o Google
* Configuración de avatar al crear la cuenta
* Perfil con grilla de dominio personal visible por cinturón
* Historial de sesiones y progresión por tema y habilidad

## **10.2 Motor de Ejercicios**

* Banco inicial de ejercicios curado manualmente
* Generador de ejercicios paramétrico con tres niveles de dificultad por tema
* Selección automática del ejercicio según estado SM-2 del estudiante
* Las tres habilidades del cinturón activo disponibles en toda sesión
* Ejercicios de cinturones anteriores presentes en toda sesión con frecuencia ajustada por el algoritmo

## **10.3 Algoritmo de Progresión**

* Algoritmo Dual-Loop por par tema-habilidad: fase de adquisición (loop corto) y fase de retención (SM-2)
* Calificación 0 a 5 inferida de acierto y tiempo de respuesta
* Repetición intra-sesión para ítems en step 0 del loop corto (máximo 2 reinserciones)
* Graduación al completar los pasos del loop corto; SM-2 aplicado únicamente post-graduación
* Todos los parámetros del modelo configurables sin modificar código
* Historial completo de intentos almacenado para análisis futuro

## **10.4 Sistema de Cinturones y Rayas**

* Un cinturón único por estudiante: Blanco, Azul, Violeta, Marrón, Negro
* Dos rayas por cinturón, desbloqueadas por ítems graduados acumulados según umbrales del catálogo
* La promoción al siguiente cinturón se activa al alcanzar el umbral (no requiere maestría completa)
* Maestría opcional disponible para quien quiera completar el 100% del cinturón
* Cinturón Negro: contenido y mecánica de maestría TBD

## **10.5 Sistema de XP y Niveles**

* XP otorgada por cada ejercicio según calificación y rachas de aciertos
* Bonos de hito al obtener una raya o promocionarse de cinturón
* Pantalla de resumen al final de cada clase con XP ganada y barra de progreso hacia el siguiente nivel
* Nivel calculado mediante curva φ^(1/6) precalculada (50 niveles en el MVP)

## **10.6 Monetización**

* Pantalla de donación voluntaria al graduarse de cinturón Azul
* Integración con Cafecito y métodos de pago internacionales
* La donación no afecta la progresión ni el acceso a ninguna funcionalidad

# **11\. Requerimientos No Funcionales**

* Web mobile-first: diseñada para navegador en pantallas de 390 px de ancho mínimo
* Sesiones cortas: un ejercicio completo en menos de 60 segundos
* Estética minimalista: sin distracciones visuales, foco en el contenido matemático
* Diseño con restricciones mobile desde el primer día para facilitar la migración a app nativa en V2
* Botones de tamaño táctil adecuado, flujo de una acción por pantalla
* Contraste visual suficiente para uso en entornos con iluminación variable

# **12\. Diseño de Base de Datos**

La base de datos está implementada en PostgreSQL. Las entidades principales del sistema:

| Tabla | Propósito |
| :---- | :---- |
| users | Registro de usuarios, credenciales, configuración de avatar y metadatos de actividad |
| belt\_catalog | Catálogo de cinturones, temas y habilidades. Tabla estática modificada solo por el equipo. |
| exercises | Banco de ejercicios. Cada ejercicio pertenece a un cinturón, un tema y una habilidad. |
| user\_progress | Estado SM-2 por tupla usuario-cinturón-tema-habilidad: EF, intervalo, repeticiones, next\_review, phase. |
| user\_xp | XP total acumulada y nivel actual por usuario. |
| exercise\_attempts | Historial completo de respuestas. Registro permanente. Dataset de mejora futura del algoritmo. |

# **13\. Stack Tecnológico**

| Capa | Tecnología |
| :---- | :---- |
| Frontend web | React + Vite (mobile-first, preparado para React Native en V2) |
| Backend | FastAPI (Python) |
| Base de datos | PostgreSQL via Supabase (en MVP: estado en memoria) |
| Gráficos de funciones | SVG propio con detección de discontinuidades (sin dependencias externas) |
| Renderizado matemático | KaTeX (fórmulas LaTeX inline) |
| Algoritmo SM-2 | Implementación propia en Python, modular y parametrizable |
| Deploy backend | Railway o Render |
| Distribución web | Vercel o Netlify |

# **14\. Equipo**

| Rol | Responsabilidades |
| :---- | :---- |
| Científico de Datos | Algoritmo SM-2, sistema de XP, generador de ejercicios, análisis de datos de uso, mejora continua del modelo de progresión |
| Desarrollador Backend | FastAPI, base de datos, endpoints, autenticación, integración de pagos |
| Desarrollador Frontend | React mobile-first, integración con API, diseño de interfaz con estética minimalista |
| Analista de Crecimiento | Mapeo de comunidades universitarias (grupos de Facebook, Discord, WhatsApp por comisión), adquisición orgánica temprana |

| Orientación del proyecto *Gradus es una plataforma de práctica adaptativa con orientación académica y alma de startup. Rigor en el contenido pedagógico y el modelo algorítmico; mentalidad ágil en la ejecución, el crecimiento y la iteración sobre datos reales.* |
| :---- |

# **15\. Roadmap**

| Versión | Contenido y objetivo |
| :---- | :---- |
| V1 — MVP Web | Cinturón blanco completo, tres habilidades, generador paramétrico, cinturones con rayas, sistema de XP y niveles, avatar básico, donación voluntaria al graduarse de Azul, web mobile-first. Foco en adquisición orgánica y ajuste del algoritmo con datos reales. |
| V2 — Apps Mobile | Aplicación nativa para iOS y Android en React Native, consumiendo el mismo backend sin modificaciones. |
| V3 — Educators y Social | Modelo "for educators" con personalización y métricas por curso, mecánica grupal, tablero de avatares por rango, expansión del catálogo de contenido y resto del backlog. |
