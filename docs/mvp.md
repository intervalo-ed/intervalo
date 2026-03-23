# MVP — Intervalo

## Propósito de este documento

Lista las features del MVP, el contenido cubierto y la mecánica de progresión. El MVP está orientado a un curso de **Análisis Matemático I** y su objetivo es conseguir usuarios orgánicos tempranos que permitan validar el modelo pedagógico e iterar con datos reales.

---

# **1. Features del MVP**

| Feature | Descripción |
| :---- | :---- |
| **Flujo de sesión** | Pregunta → selección de respuesta → feedback inmediato con respuesta correcta |
| **Generador de ejercicios** | Ejercicios paramétricos para cinturón blanco (7 topics × 3 habilidades = 21 ítems) |
| **Sistema de cinturones** | Cinturones Blanco, Azul, Violeta y Marrón con rayas internas y umbral de promoción |
| **Sistema de XP y niveles** | XP por ejercicio con bonuses de racha e hitos; barra de nivel al final de cada sesión |
| **Pantalla de progreso post-sesión** | Resumen con XP ganada, avance de nivel y ítems graduados |
| **Avatar básico** | Personaje configurable (género, peinado, color de pelo) al iniciar |
| **Donación voluntaria** | Pantalla de celebración con opción de donación al graduarse de cinturón Azul por primera vez |
| **Web mobile-first** | Aplicación web responsiva, optimizada para uso desde el celular |

## **1.1 Fuera del MVP**

* Login y cuentas de usuario persistentes (V1 puede arrancar con sesión local)
* Funciones en tres dimensiones
* Razonamiento paramétrico con sliders interactivos
* Contribución de ejercicios por docentes
* Mecánica grupal y cursos (modelo "for educators")
* Aplicaciones mobile nativas iOS y Android (V2)

---

# **2. Flujo de la aplicación**

```
Inicio
  └─ Configuración de avatar (una vez)
       └─ Pantalla principal / Dashboard
            └─ Iniciar sesión
                 └─ [loop] Pregunta → Respuesta → Feedback
                      └─ Fin de sesión
                           └─ Resumen: XP ganada · avance de nivel · ítems graduados
                                └─ [si corresponde] Pantalla de raya o promoción de cinturón
                                     └─ [si cinturón Azul por primera vez] Pantalla de donación voluntaria
```

Cada sesión trabaja sobre los ítems debidos según el algoritmo Dual-Loop: ítems en adquisición (loop corto) y ítems en revisión (loop largo SM-2). La sesión termina cuando se agotan los ítems programados para el día.

---

# **3. Contenido: Análisis Matemático I**

El contenido está organizado en cinturones. El MVP arranca con el cinturón blanco completo y los cinturones siguientes quedan desbloqueados a medida que el estudiante progresa.

## **3.1 Topics por cinturón (orden de aparición)**

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

## **4.2 Tipos de ejercicio por habilidad (cinturón blanco)**

**CLSF — Clasificación:** Se muestra el gráfico de una función. El estudiante elige a qué familia pertenece entre cuatro opciones. Los distractores reflejan confusiones frecuentes entre familias visualmente similares.

**LEXI — Léxico:** Ejercicio en dos pantallas. Pantalla 1: gráfico o expresión algebraica como contexto. Pantalla 2: pregunta sobre nomenclatura o propiedades. Entrena la capacidad de leer y producir lenguaje matemático con precisión.

**FORM — Formulación:** Se muestra el gráfico de una función. El estudiante elige entre cuatro combinaciones de parámetros cuál corresponde a la curva observada. Entrena la conexión entre la representación visual y la expresión algebraica.

---

# **5. Sistema de Progresión**

Intervalo combina dos capas de progresión: **cinturones** que representan el dominio de un contenido matemático, y **niveles de XP** que reflejan la actividad acumulada del estudiante en el sistema. Ambas capas son independientes: los cinturones dependen de la calidad del aprendizaje; los niveles, del esfuerzo sostenido.

## **5.1 Cinturones**

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

## **5.2 Saltos entre cinturones**

* **Blanco a Azul**: transición del objeto (funciones) al comportamiento (límites). Primer contacto con el análisis formal.
* **Azul a Violeta**: de observar comportamientos a cuantificarlos. La derivada como herramienta operativa.
* **Violeta a Marrón**: de la derivación a la integración. Acumulación como operación inversa.
* **Marrón a Negro**: TBD.

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

---

# **6. Avatar del Estudiante**

Cada estudiante tiene un avatar que porta el cinturón correspondiente a su nivel actual. La personalización se configura una única vez al iniciar y es lo primero que ve el usuario antes de su primera sesión.

## **6.1 Opciones disponibles en el MVP**

* Género del personaje
* Peinado (selección de opciones predefinidas)
* Color de pelo

## **6.2 Fuera del MVP — V3**

* Kimonos y accesorios desbloqueables
* Vista de avatares en contexto grupal
* Customización avanzada general
