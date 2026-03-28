# MVP

## Propósito de este documento

Lista las features del MVP, el contenido cubierto y la mecánica de progresión. El MVP está orientado a un curso de **Análisis Matemático I** y su objetivo es conseguir usuarios orgánicos tempranos que permitan validar el sistema e iterar con datos reales.

---

# **1. Features del MVP**

| Feature | Descripción |
| :---- | :---- |
| **Flujo de sesión** | Pregunta → selección de respuesta → feedback inmediato con respuesta correcta |
| **Banco de ejercicios** | Ejercicios paramétricos para cinturón blanco (7 topics × 3 habilidades = 21 ítems) | --TODO: corregir
| **Sistema de cinturones** | Cinturones Blanco, Azul, Violeta y Marrón con rayas internas y umbral de promoción |
| **Sistema de XP y niveles** | XP por ejercicio con bonuses de racha e hitos; barra de nivel al final de cada sesión |
| **Pantalla de progreso post-sesión** | Resumen con XP ganada, avance de nivel y ítems graduados |
| **Home** | Home para el usuario, desde ahi pude iniciar una clase, ver su progreso, compartir la app y acceder a la landing | --TODO: corregir
| **Registro vía google y login automatico** |  | - TODO: desarrollar

# **3. Contenido: Análisis Matemático I**

El contenido está organizado en cinturones. El MVP arranca con el cinturón blanco completo y los cinturones siguientes quedan desbloqueados a medida que el estudiante progresa.

## **3.1 Topics por cinturón (orden de aparición)**

| Items | Tema | Cinturón |
| :---- | :---- | :---- |
| 1 | Funciones Lineales | Blanco |
| 2 | Funciones Cuadráticas | Blanco |
| 3 | Funciones Polinomiales | Blanco |
| 4 | Funciones Exponenciales | Blanco |
| 5 | Funciones Logarítmicas | Blanco |
| 6 | Funciones Racionales | Blanco |
| 7 | Funciones Trigonométricas | Blanco |
| 8–13 | Límites y Continuidad  | Azul |
| 14–19 | Derivadas  | Violeta |
| 20–24 | Integrales  | Marrón |
| TBD | TBD | Negro |

---

# **4. Habilidades**

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

## **4.1 Habilidades por cinturón**

| Cinturón | Habilidades | Racional pedagógico |
| :---- | :---- | :---- |
| **Blanco** | CLSF · LEXI · FORM | Reconocimiento, vocabulario y formulación de funciones elementales |
| **Azul** | GRAF · RESV · CLSF | Lectura gráfica, resolución algebraica e identificación de discontinuidades |
| **Violeta** | GRAF · DERI · APLI | Interpretación geométrica, derivación y aplicaciones de la derivada |
| **Marrón** | GRAF · INTG · APLI | Área acumulada, técnicas de integración y aplicaciones del cálculo integral |
| **Negro** | TBD | TBD |
---

# **5. Sistema de Progresión**

Intervalo combina dos capas de progresión: **cinturones** que representan el dominio de un contenido matemático, y **niveles de XP** que reflejan la actividad acumulada del estudiante en el sistema. Ambas capas son independientes: los cinturones dependen de la calidad del aprendizaje; los niveles, del esfuerzo sostenido.

## **5.1 Cinturones**

Cada cinturón cubre un dominio matemático del curso de cálculo univariable y tiene un catálogo de ítems definido por la combinación de temas × habilidades.

* **Dos grados internos:** desbloqueadas por ítems graduados acumulados del cinturón actual.
* **Umbral de promoción:** al alcanzarlo, el sistema comienza a incluir ítems del siguiente cinturón en la sesión. No requiere completar todos los ítems del nivel actual.
* **Maestría opcional:** los ítems entre el umbral de promoción y el total del cinturón siguen disponibles sin bloquear el avance.

### Cinturón Blanco - Funciones

**Temas (7):** Lineal, Cuadrática, Polinomial, Exponencial, Logarítmica, Racional, Trigonométrica

**Habilidades:** CLSF · LEXI · FORM — **Total ítems:** 7 × 3 = 21

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 3 | Progreso visible |
| Segunda raya | 9 | Progreso visible |
| **Promoción a Azul** | 18 | Desbloquea cinturón Azul |
| Maestría | 21 | Opcional, sin efecto en promoción |

### Cinturón Azul - Límites

**Temas (6):** Límites algebraicos, Límites laterales, Límites al infinito, Continuidad, Formas indeterminadas, L'Hôpital

**Habilidades:** GRAF · RESV · CLSF — **Total ítems:** 6 × 3 = 18

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 2 | Progreso visible |
| Segunda raya | 6 | Progreso visible |
| **Promoción a Violeta** | 15 | Desbloquea cinturón Violeta |
| Maestría | 18 | Opcional, sin efecto en promoción |

### Cinturón Violeta - Derivadas

**Temas (6):** Definición como límite, Reglas básicas, Producto y cociente, Regla de la cadena, Funciones especiales, Derivadas implícitas

**Habilidades:** GRAF · DERI · APLI — **Total ítems:** 6 × 3 = 18

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 2 | Progreso visible |
| Segunda raya | 6 | Progreso visible |
| **Promoción a Marrón** | 15 | Desbloquea cinturón Marrón |
| Maestría | 18 | Opcional, sin efecto en promoción |

### Cinturón Marrón - Integrales

**Temas (5):** Integral indefinida, Teorema Fundamental del Cálculo, Sustitución, Integración por partes, Integrales impropias

**Habilidades:** GRAF · INTG · APLI — **Total ítems:** 5 × 3 = 15

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 2 | Progreso visible |
| Segunda raya | 5 | Progreso visible |
| **Promoción a Negro** | 12 | Desbloquea cinturón Negro |
| Maestría | 15 | Opcional, sin efecto en promoción |

## **5.3 Sistema de XP y Niveles**

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

Al terminar cada sesión, el estudiante ve su progreso de nivel: XP ganada en la sesión y barra de avance hacia el siguiente nivel.