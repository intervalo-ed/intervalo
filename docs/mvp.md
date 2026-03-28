# MVP

El MVP está orientado a un curso de **Análisis Matemático I**. Desde la perspectiva del estudiante, el objetivo es incorporar *Intervalo* como hábito de repaso, hacer sesiones cortas con frecuencia, acumular progreso visible y llegar mejor preparado a los exámenes. Desde la perspectiva del equipo, el objetivo es conseguir usuarios orgánicos tempranos que usen el sistema de manera real, generen datos de comportamiento y permitan validar la mecánica e iterar con evidencia.

---

## Índice

1. [Features](#1-features)
2. [Sesión](#2-sesión)
3. [Ejercicios](#3-ejercicios)
4. [Cinturones](#4-cinturones)
5. [XP y niveles](#5-xp-y-niveles)
6. [Progreso](#6-progreso)
7. [Home](#7-home)
8. [Registro](#8-registro)

---

# **1\. Features**

| Feature | Descripción |
| :---- | :---- |
| **Flujo de sesión** | Pregunta → selección de respuesta → feedback inmediato con respuesta correcta |
| **Banco de ejercicios** | Ejercicios paramétricos para los cuatro cinturones del MVP (72 ítems en total) |
| **Sistema de cinturones** | Cinturones Blanco, Azul, Violeta y Marrón con rayas internas y umbral de promoción |
| **Sistema de XP y niveles** | XP por ejercicio con bonuses de racha e hitos; barra de nivel al final de cada sesión |
| **Pantalla de progreso post-sesión** | Resumen con XP ganada, avance de nivel e ítems graduados |
| **Home** | Punto de entrada del usuario: iniciar sesión, ver progreso, compartir la app y acceder a la landing |
| **Registro vía Google y login automático** | Registro con Google OAuth y acceso directo en visitas subsiguientes |

---

# **2\. Sesión**

La sesión es la unidad central de práctica. El estudiante ve una pregunta, selecciona una respuesta entre las opciones disponibles y recibe feedback inmediato: se indica si acertó y se muestra la respuesta correcta. El ciclo se repite hasta completar la sesión.

El algoritmo determina qué ejercicios aparecen en cada sesión según el estado de cada ítem para ese estudiante: prioriza los que están próximos a su fecha de repaso y los que tienen menor factor de facilidad.

---

# **3\. Ejercicios**

El banco está organizado en cinturones. Cada cinturón cubre un dominio matemático del curso y define un conjunto de ítems a partir de la combinación de temas y habilidades evaluadas en ese nivel.

## **3\.1\. Topics por cinturón**

| Items | Tema | Cinturón |
| :---- | :---- | :---- |
| 1 | Funciones Lineales | Blanco |
| 2 | Funciones Cuadráticas | Blanco |
| 3 | Funciones Polinomiales | Blanco |
| 4 | Funciones Exponenciales | Blanco |
| 5 | Funciones Logarítmicas | Blanco |
| 6 | Funciones Racionales | Blanco |
| 7 | Funciones Trigonométricas | Blanco |
| 8–13 | Límites y Continuidad | Azul |
| 14–19 | Derivadas | Violeta |
| 20–24 | Integrales | Marrón |
| TBD | TBD | Negro |

## **3\.2\. Habilidades**

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

## **3\.3\. Habilidades por cinturón**

| Cinturón | Habilidades | Racional |
| :---- | :---- | :---- |
| **Blanco** | CLSF · LEXI · FORM | Reconocimiento, vocabulario y formulación de funciones elementales |
| **Azul** | GRAF · RESV · CLSF | Lectura gráfica, resolución algebraica e identificación de discontinuidades |
| **Violeta** | GRAF · DERI · APLI | Interpretación geométrica, derivación y aplicaciones de la derivada |
| **Marrón** | GRAF · INTG · APLI | Área acumulada, técnicas de integración y aplicaciones del cálculo integral |
| **Negro** | TBD | TBD |

---

# **4\. Cinturones**

Cada cinturón corresponde a un dominio matemático del curso y se obtiene graduando un conjunto de ítems con desempeño sostenido. Dentro de cada cinturón hay dos rayas que marcan el avance parcial. Al alcanzar el umbral de promoción, el sistema comienza a incluir ítems del siguiente cinturón en la sesión sin requerir completar todos los del nivel actual. Los ítems restantes siguen disponibles como maestría opcional.

## **4\.1\. Blanco — Funciones**

**Temas (7):** Lineal, Cuadrática, Polinomial, Exponencial, Logarítmica, Racional, Trigonométrica

**Habilidades:** CLSF · LEXI · FORM — **Total ítems:** 7 × 3 = 21

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 3 | Progreso visible |
| Segunda raya | 9 | Progreso visible |
| **Promoción a Azul** | 18 | Desbloquea cinturón Azul |
| Maestría | 21 | Opcional, sin efecto en promoción |

## **4\.2\. Azul — Límites**

**Temas (6):** Límites algebraicos, Límites laterales, Límites al infinito, Continuidad, Formas indeterminadas, L'Hôpital

**Habilidades:** GRAF · RESV · CLSF — **Total ítems:** 6 × 3 = 18

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 2 | Progreso visible |
| Segunda raya | 6 | Progreso visible |
| **Promoción a Violeta** | 15 | Desbloquea cinturón Violeta |
| Maestría | 18 | Opcional, sin efecto en promoción |

## **4\.3\. Violeta — Derivadas**

**Temas (6):** Definición como límite, Reglas básicas, Producto y cociente, Regla de la cadena

**Habilidades:** GRAF · DERI · APLI — **Total ítems:** 6 × 3 = 18

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 2 | Progreso visible |
| Segunda raya | 6 | Progreso visible |
| **Promoción a Marrón** | 15 | Desbloquea cinturón Marrón |
| Maestría | 18 | Opcional, sin efecto en promoción |

## **4\.4\. Marrón — Integrales**

**Temas (5):** Integral indefinida, Teorema Fundamental del Cálculo, Sustitución, Integración por partes, Integrales definidas

**Habilidades:** GRAF · INTG · APLI — **Total ítems:** 5 × 3 = 15

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primera raya | 2 | Progreso visible |
| Segunda raya | 5 | Progreso visible |
| **Promoción a Negro** | 12 | Desbloquea cinturón Negro |
| Maestría | 15 | Opcional, sin efecto en promoción |

---

# **5\. XP y niveles**

Los niveles son una capa de reconocimiento transversal basada en el esfuerzo acumulado. Cada ejercicio otorga XP independientemente de si el estudiante acierta o no; el acierto y la velocidad de respuesta determinan cuánto. La XP necesaria para subir de nivel crece un 8% por nivel.

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

---

# **6\. Progreso**

Al terminar cada sesión, el estudiante ve un resumen con la XP ganada en esa sesión, la barra de avance hacia el siguiente nivel y los ítems que graduó durante la práctica.

---

# **7\. Home**

El home es el punto de entrada del usuario. Desde ahí puede iniciar una sesión, ver su estado actual (cinturón, rayas e ítems graduados), compartir la app y acceder a la landing.

---

# **8\. Registro**

El registro se hace a través de Google OAuth: el estudiante autentica con su cuenta de Google sin necesidad de crear usuario ni contraseña. En visitas subsiguientes, el sistema reconoce la sesión activa y accede directamente sin requerir interacción.
