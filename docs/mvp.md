# MVP

El MVP está orientado a un curso de **Análisis Matemático I**. 
Desde la perspectiva del estudiante, el objetivo es incorporar *Intervalo* como hábito de repaso, hacer sesiones cortas con frecuencia, acumular progreso visible y llegar mejor preparado a los exámenes. 
Desde la perspectiva del equipo, el objetivo es conseguir usuarios orgánicos tempranos que usen el sistema de manera real, generen datos de comportamiento y permitan validar la mecánica e iterar con evidencia.

---

# **1\. Features**

| Feature | Descripción |
| :---- | :---- |
| [**Banco de Ejercicios**](#2-banco-de-ejercicios) | Múltiples ejercicios para cada combinación de tema y habilidad dentro del curso, con explicaciones breves por ítem |
| [**Algoritmo de Repetición Espaciada**](#3-algoritmo-de-repetición-espaciada) | Cada ítem tiene un intervalo de repaso individual que se ajusta según el desempeño del estudiante, priorizando los ítems difíciles y espaciando los dominados |
| [**Home**](#4-home) | Pantalla principal desde donde el estudiante inicia repasos, consulta su progreso, comparte la app y accede al sitio del proyecto |
| [**Registro vía Google y Login Automático**](#5-registro) | Autenticación con Google OAuth sin contraseña y acceso directo automático en visitas posteriores |
| [**Repaso**](#6-flujo-de-repaso) | Sesión de aproximadamente 12 ejercicios con feedback inmediato y explicaciones breves, con resumen de resultados y progreso al finalizar |
| [**Tutorial**](#7-tutorial) | Primera sesión guiada que presenta el sistema de forma interactiva y recolecta el tipo de carrera y universidad del estudiante |
| [**Sistema de XP**](#8-sistema-de-xp) | Puntos de experiencia por ejercicio con bonuses de racha e hitos, y barra de nivel visible al finalizar cada repaso y en la home |
| [**Sistema de Cinturones**](#9-sistema-de-cinturones) | Cinco cinturones (Blanco, Azul, Violeta, Marrón, Negro) con grados internos que el estudiante avanza graduando ítems con desempeño sostenido |

---

# **2\. Banco de Ejercicios**

El banco está organizado en cinturones. Cada cinturón cubre un dominio matemático del curso y define un conjunto de ítems. Las habilidades se asignan a nivel de tema: cada tema tiene su propio subconjunto de habilidades según su densidad conceptual (entre 2 y 4 habilidades por tema).

## **2\.1\. Temas e ítems**

| Cinturón | Temas | Ítems |
| :---- | :---- | :---- |
| Blanco | Lineal, Cuadrática, Polinomial, Exponencial, Logarítmica, Racional, Trigonométrica | 23 |
| Azul | Lím. algebraicos, Lím. laterales, Lím. al infinito, Continuidad, Factorización, Racionalización | 17 |
| Violeta | Def. de límite, Interp. geométrica, Reglas básicas, Prod./Cociente, Cadena, L'Hôpital | 20 |
| Marrón | Integral indefinida, Sustitución, Integración por partes, Integral definida | 12 |
| Negro | Análisis de funciones, Optimización, Cálculo de área, T. Fundamental | 13 |
| **Total** | | **85** |

## **2\.2\. Habilidades**

Las habilidades son las dimensiones evaluadas dentro de cada cinturón. Cada una tiene un código de 4 letras en mayúscula, como los atributos en un juego de rol. Son transversales al sistema: el mismo código puede aparecer en distintos cinturones evaluando el mismo tipo de pensamiento aplicado a un dominio diferente. Las habilidades se asignan a nivel de tema individual, no de manera uniforme por cinturón.

| Código | Habilidad | Descripción |
| :---- | :---- | :---- |
| CLSF | Clasificación | Identifica y categoriza a partir de representaciones visuales o gráficas |
| LEXI | Léxico | Nombra y clasifica usando vocabulario matemático correcto |
| FORM | Formulación | Extrae y construye la expresión formal a partir de una representación |
| GRAF | Graficación | Interpreta el comportamiento de un concepto desde una gráfica |
| RESL | Resolución | Calcula y simplifica expresiones aplicando técnicas algebraicas |
| ESTR | Estrategia | Elige y justifica la técnica adecuada para abordar un problema |
| DERI | Derivación | Aplica reglas de derivación con precisión |
| INTG | Integración | Aplica técnicas de integración al tipo de expresión correcto |
| APLI | Aplicación | Usa el concepto del cinturón en problemas de contexto real o analítico |

# **3\. Algoritmo de Repetición Espaciada**

El sistema implementa un algoritmo de repetición espaciada basado en SM-2. Cada ítem tiene un estado individual por estudiante que registra el factor de facilidad, el intervalo hasta el próximo repaso y el número de repeticiones acumuladas. Después de cada respuesta, el algoritmo actualiza estos valores según la calidad del intento y recalcula cuándo volver a mostrar ese ítem.

El resultado es que los ítems difíciles reaparecen con más frecuencia y los dominados se espacian progresivamente, maximizando la retención con el menor esfuerzo posible.

---

# **4\. Home**

El home es el punto de entrada del usuario. Desde ahí puede iniciar una sesión, ver su estado actual (cinturón, grados e ítems graduados), compartir la app y acceder a la landing.

---

# **5\. Registro**

El registro se hace a través de Google OAuth: el estudiante autentica con su cuenta de Google sin necesidad de crear usuario ni contraseña. En visitas subsiguientes, el sistema reconoce la sesión activa y accede directamente sin requerir interacción.

---

# **6\. Flujo de Repaso**

La sesión es la unidad central de práctica. El estudiante ve una pregunta, selecciona una respuesta entre las opciones disponibles y recibe feedback inmediato: se indica si acertó y se muestra la respuesta correcta. El ciclo se repite hasta completar la sesión.

Al terminar cada sesión, el estudiante ve un resumen con la XP ganada, la barra de avance hacia el siguiente nivel y los ítems que graduó durante la práctica.

---

# **7\. Tutorial**

El tutorial es la primera experiencia del estudiante con el sistema. Está diseñado en formato de sesión de ejercicios para presentar los fundamentos y pilares del sistema de forma interactiva. También recolecta el tipo de carrera y universidad del estudiante.

---

# **8\. Sistema de XP**

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
| Obtener un grado | +50 bonus de hito |
| Promoción de cinturón | +200 bonus de hito |

---

# **9\. Sistema de Cinturones**

Cada cinturón corresponde a un dominio matemático del curso y se obtiene graduando un conjunto de ítems con desempeño sostenido. Dentro de cada cinturón hay dos grados que marcan el avance parcial. Al alcanzar el umbral de promoción, el sistema comienza a incluir ítems del siguiente cinturón en la sesión sin requerir completar todos los del nivel actual. Los ítems restantes siguen disponibles como maestría opcional.

## **9\.1\. Blanco — Funciones**

**Temas y habilidades por tema:**

| Tema | Habilidades | Ítems |
| :---- | :---- | :---- |
| Lineal | CLSF · LEXI · FORM | 3 |
| Cuadrática | CLSF · LEXI · FORM | 3 |
| Polinomial | CLSF · LEXI · FORM | 3 |
| Exponencial | CLSF · LEXI · FORM | 3 |
| Logarítmica | CLSF · LEXI · FORM | 3 |
| Racional | CLSF · LEXI · FORM · GRAF | 4 |
| Trigonométrica | CLSF · LEXI · FORM · GRAF | 4 |
| **Total** | | **23** |

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primer grado | 3 | Progreso visible |
| Segundo grado | 9 | Progreso visible |
| **Promoción a Azul** | 20 | Desbloquea cinturón Azul |
| Maestría | 23 | Opcional, sin efecto en promoción |

## **9\.2\. Azul — Límites**

**Temas y habilidades por tema:**

| Tema | Habilidades | Ítems |
| :---- | :---- | :---- |
| Lím. algebraicos | LEXI · RESL · ESTR | 3 |
| Lím. laterales | LEXI · RESL · GRAF | 3 |
| Lím. al infinito | LEXI · RESL · GRAF | 3 |
| Continuidad | CLSF · RESL · GRAF | 3 |
| Factorización | LEXI · RESL · ESTR | 3 |
| Racionalización | RESL · ESTR | 2 |
| **Total** | | **17** |

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primer grado | 3 | Progreso visible |
| Segundo grado | 8 | Progreso visible |
| **Promoción a Violeta** | 14 | Desbloquea cinturón Violeta |
| Maestría | 17 | Opcional, sin efecto en promoción |

## **9\.3\. Violeta — Derivadas**

**Temas y habilidades por tema:**

| Tema | Habilidades | Ítems |
| :---- | :---- | :---- |
| Def. de límite | LEXI · ESTR · CLSF · GRAF | 4 |
| Interp. geométrica | LEXI · GRAF · APLI · ESTR | 4 |
| Reglas básicas | LEXI · DERI · ESTR | 3 |
| Prod./Cociente | DERI · ESTR · APLI | 3 |
| Cadena | DERI · ESTR · APLI | 3 |
| L'Hôpital | RESL · ESTR · APLI | 3 |
| **Total** | | **20** |

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primer grado | 4 | Progreso visible |
| Segundo grado | 10 | Progreso visible |
| **Promoción a Marrón** | 17 | Desbloquea cinturón Marrón |
| Maestría | 20 | Opcional, sin efecto en promoción |

## **9\.4\. Marrón — Integrales**

**Temas y habilidades por tema:**

| Tema | Habilidades | Ítems |
| :---- | :---- | :---- |
| Integral indefinida | LEXI · INTG · ESTR | 3 |
| Sustitución | INTG · ESTR · APLI | 3 |
| Integración por partes | INTG · ESTR · APLI | 3 |
| Integral definida | INTG · GRAF · APLI | 3 |
| **Total** | | **12** |

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primer grado | 3 | Progreso visible |
| Segundo grado | 7 | Progreso visible |
| **Promoción a Negro** | 10 | Desbloquea cinturón Negro |
| Maestría | 12 | Opcional, sin efecto en promoción |

## **9\.5\. Negro — Análisis**

**Temas y habilidades por tema:**

| Tema | Habilidades | Ítems |
| :---- | :---- | :---- |
| Análisis de funciones | DERI · APLI · CLSF · GRAF | 4 |
| Optimización | DERI · APLI · ESTR | 3 |
| Cálculo de área | INTG · APLI · GRAF | 3 |
| T. Fundamental | INTG · APLI · ESTR | 3 |
| **Total** | | **13** |

| Grado | Ítems graduados | Efecto |
| :---- | :---- | :---- |
| Primer grado | 5 | Progreso visible |
| Segundo grado | 9 | Progreso visible |
| **Maestría** | 13 | Cinturón final |
