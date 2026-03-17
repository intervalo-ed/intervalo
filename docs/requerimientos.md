**GRADUS**

*Aprendizaje adaptativo para el análisis matemático*

Documento de Requerimientos

# **1\. Fundamento Pedagógico**

La investigación en ciencias cognitivas ha identificado dos principios que producen resultados de aprendizaje consistentemente superiores a los métodos de estudio convencionales: la evocación activa (active recall) y la repetición espaciada (spaced repetition).

La evocación activa consiste en recuperar un concepto desde la memoria en lugar de leerlo o repasar pasivamente. La repetición espaciada distribuye esas instancias de recuperación en el tiempo, aumentando los intervalos cada vez que el concepto es recordado correctamente y acortandolos cuando no lo es. Ambos principios actúan sobre los mecanismos de consolidación de la memoria a largo plazo.

El estudio del análisis matemático demanda no solo dominio procedimental sino también intuición visual sobre el comportamiento de las funciones. Reconocer rápidamente la familia de una función, su vocabulario y el efecto de sus parámetros es una competencia que complementa y potencia la comprensión formal: un estudiante que puede visualizar una función antes de operar sobre ella razona con mayor solidez sobre integrales, límites y derivadas.

Gradus aplica la evocación activa y la repetición espaciada al desarrollo específico de esa competencia visual, como herramienta complementaria al estudio formal de la disciplina.

| Hipótesis de diseño *Si un estudiante puede reconocer visualmente una función, manejar su vocabulario y entender el efecto de sus parámetros, desarrolla la base cognitiva que potencia su capacidad de razonar sobre ella en contextos formales más complejos.* |
| :---- |

# **2\. La Solución**

Gradus es una plataforma de práctica adaptativa web mobile-first que entrena el reconocimiento de funciones matemáticas mediante sesiones cortas y frecuentes. Combina evocación activa, repetición espaciada y ludificación inspirada en el sistema de cinturones del Jiu-Jitsu Brasilero. La estética es deliberadamente minimalista para mantener el foco en el contenido y facilitar la eventual migración a una aplicación nativa.

| Principio | Implementación |
| :---- | :---- |
| Evocación activa | El estudiante recupera la respuesta antes de verla, no la reconoce pasivamente |
| Repetición espaciada | El algoritmo SM-2 determina cuándo volver a mostrar cada tipo de función |
| Ludificación | Sistema de cinturones BJJ con rayas por dimensión de habilidad |
| Estética minimalista | Interfaz sin distracciones, preparada para portar a React Native en V2 |

# **3\. Nomenclatura del Producto**

| Concepto | Nombre |
| :---- | :---- |
| La plataforma | Gradus |
| Los ejercicios individuales | Ejercicios |
| La sesión diaria | Clase |
| La progresión | Cinturones con rayas (sistema BJJ) |
| El algoritmo interno | SM-2 (no visible para el usuario) |

| Sobre el nombre *Gradus refiere al Gradus ad Parnassum, tratado clásico del siglo XVIII. En latin significa paso o grado. Cada sesión es un gradus; cada cinturón es un grado alcanzado por demostración real de habilidad, no por tiempo transcurrido. El proyecto tiene orientación académica con mentalidad de startup: rigor en el contenido y el método, agilidad en la ejecución y el crecimiento.* |
| :---- |

# **4\. Alcance del MVP**

El MVP se enfoca exclusivamente en reconocimiento de funciones en dos dimensiones, entregado como aplicación web. El objetivo principal es conseguir usuarios orgánicos tempranos para validar el modelo pedagógico y ajustar el algoritmo con datos reales antes de invertir en desarrollo móvil nativo.

## **4.1 Tipos de función incluidos**

* Lineal

* Cuadrática

* Polinomial (grado 3 en adelante)

* Exponencial

* Logarítmica

* Trigonométrica (seno, coseno, tangente)

* Racional (con asíntotas)

## **4.2 Fuera del MVP**

* Funciones en tres dimensiones

* Razonamiento paramétrico con sliders interactivos

* Integrales, límites y derivadas

* Contribución de ejercicios por docentes

* Mecánica grupal y cursos (V3)

* Aplicaciones mobile nativas iOS y Android (V2)

# **5\. Tipos de Ejercicio**

Los tres tipos de ejercicio se combinan en cada sesión según el estado SM-2 del estudiante. Los tres están disponibles desde el cinturón blanco y se aplican a las funciones del nivel actual. En toda sesión aparecen también ejercicios de niveles anteriores con frecuencia ajustada por el algoritmo.

## **5.1 Tipo 1 — Reconocimiento Visual**

Se muestra el gráfico de una función. El estudiante elige a qué familia pertenece entre cuatro opciones. Los distractores reflejan confusiones frecuentes entre familias visualmente similares.

| Ejemplo A *Pantalla: curva que crece lentamente, pasa por (1, 0\) y tiende a infinito hacia la derecha.* ¿De qué tipo es esta función?   A)  Exponencial   B)  Logaritmica  \[CORRECTO\]   C)  Cuadratica   D)  Racional |
| :---- |

| Ejemplo B *Pantalla: dos ramas simétricas que se abren hacia arriba, vértice en el origen.* ¿De qué tipo es esta función?   A)  Cubica   B)  Valor absoluto   C)  Cuadratica  \[CORRECTO\]   D)  Raíz cuadrada |
| :---- |

## **5.2 Tipo 2 — Vocabulario Matemático**

Ejercicio en dos pantallas. Pantalla 1: gráfico o expresión algebraica como contexto. Pantalla 2: pregunta sobre nomenclatura o propiedades. Entrena la capacidad de leer y producir lenguaje matemático con precisión.

| Ejemplo A *Pantalla 1: gráfico de f(x) \= 1/x con dos ramas y líneas punteadas en x \= 0 e y \= 0\.* Pantalla 2: ¿Cómo se llaman las líneas que la curva se aproxima pero nunca alcanza?   A)  Tangentes   B)  Asíntotas  \[CORRECTO\]   C)  Ejes de simetría   D)  Rectas directrices |
| :---- |

| Ejemplo B *Pantalla 1: gráfico de f(x) \= x2 \- 4 con vértice en (0, \-4) y cruces sobre el eje X resaltados.* Pantalla 2: ¿Cómo se denominan los puntos donde la función intersecta el eje X?   A)  Vértices   B)  Asíntotas   C)  Raíces  \[CORRECTO\]   D)  Imágenes |
| :---- |

## **5.3 Tipo 3 — Identificacion de Parametros**

Se muestra el gráfico de una función. El estudiante elige entre cuatro combinaciones de parámetros cual corresponde a la curva observada. Entrena la conexión entre la representación visual y la expresión algebraica.

| Ejemplo A — Función lineal *Pantalla: recta con pendiente positiva moderada que intersecta el eje Y en un valor negativo.* ¿Cuál de estas expresiones corresponde a la recta del gráfico?   A)  y \= 2x \+ 3   B)  y \= \-x \+ 1   C)  y \= 2x \- 2  \[CORRECTO\]   D)  y \= 0.5x \+ 3 |
| :---- |

| Ejemplo B — Función cuadrática *Pantalla: parábola angosta que se abre hacia arriba con vértice desplazado hacia la derecha.* ¿Cuál de estas expresiones corresponde a la parábola del gráfico?   A)  f(x) \= x2 \+ 2   B)  f(x) \= 0.5(x \- 3)2   C)  f(x) \= \-2(x \- 3)2   D)  f(x) \= 3(x \- 3)2  \[CORRECTO\] |
| :---- |

# **6\. Sistema de Progresión: Cinturones BJJ**

Cada estudiante posee un único cinturón que representa su nivel global. La progresión es por demostración real de habilidad, no por tiempo acumulado. Dentro de cada cinturón existen dos rayas posibles, correspondientes a dos de las tres dimensiones evaluadas: reconocimiento visual, vocabulario matemático e identificación de parámetros. El orden de obtención de las rayas es libre.

Las funciones de cada cinturón son las que el estudiante debe dominar para avanzar al siguiente. En toda sesión aparecen también ejercicios de cinturones anteriores con frecuencia ajustada por el algoritmo SM-2, garantizando retención a largo plazo sobre todo el contenido previo.

## **6.1 Lógica de rayas y promoción**

| Estado | Reconocimiento | Vocabulario | Parámetros |
| :---- | :---- | :---- | :---- |
| Sin rayas | — | — | — |
| Una raya | **Aprobado** | — | — |
| Una raya | — | **Aprobado** | — |
| Una raya | — | — | **Aprobado** |
| Dos rayas | **Aprobado** | **Aprobado** | — |
| Dos rayas | **Aprobado** | — | **Aprobado** |
| Dos rayas | — | **Aprobado** | **Aprobado** |
| **Promoción al siguiente cinturón** | **Aprobado** | **Aprobado** | **Aprobado** |

| Caso especial: cinturon negro *El cinturon negro otorga hasta dos rayas sobre las dimensiones de la funcion racional a eleccion del estudiante. La tercera dimensión queda como objetivo de maestría permanente sin promoción ulterior, dado que no existe un cinturón siguiente.* |
| :---- |

## **6.2 Cinturones, funciones y lógica pedagógica**

| Cinturón | Color | Funciones a dominar | Lógica pedagógica |
| :---- | :---- | :---- | :---- |
| **Blanco** |  | Lineal | *Introduce pendiente e intercepto como primeros parámetros. Base visual e intuitiva del reconocimiento de funciones.* |
| **Azul** |  | Cuadrática, Polinomica | *Introduce vértice, apertura y raíces múltiples. Primer salto de complejidad paramétrica.* |
| **Violeta** |  | Exponencial, Logarítmica | *Par natural por ser inversas entre sí. Introduce asíntotas y bases como parámetro clave.* |
| **Marrón** |  | Trigonométricas | *Introduce periodo y amplitud, parámetros ausentes en todas las funciones anteriores. El salto más exigente.* |
| **Negro** |  | Racional | *Introduce la función racional con síntomas verticales y horizontales simultáneos. Las dos rayas se obtienen sobre dos dimensiones a elección del estudiante. La tercera dimensión es maestría permanente sin promoción ulterior.* |

## **6.3 Saltos entre cinturones**

* **Blanco a Azul**: la cuadrática introduce vértice y apertura. Primer salto de complejidad paramétrica.

* **Azul a Violeta**: primer encuentro con asíntotas y funciones inversas entre sí. El estudiante comienza a percibir relaciones entre familias.

* **Violeta a Marrón**: las trigonométricas introducen periodo y amplitud, parámetros ausentes en todas las funciones anteriores. El salto conceptualmente más exigente.

* **Marron a Negro**: la funcion racional combina asintotas verticales y horizontales simultaneas, incorporando complejidad estructural que ninguna funcion anterior presenta de forma combinada.

# **7\. Avatar del Estudiante**

Cada estudiante tiene un avatar que porta el cinturón correspondiente a su nivel actual. La personalización inicial es minimalista y se configura una única vez al crear la cuenta.

## **7.1 Opciones disponibles en el MVP**

* Genero del personaje

* Peinado (selección de opciones predefinidas)

* Color de pelo

## **7.2 Fuera del MVP — V3**

* Kimonos y lycras desbloqueables vía microtransacciones

* Accesorios adicionales

* Vista de avatares en contexto grupal

* Customización avanzada general

# **8\. Algoritmo de Progresión (SM-2 Adaptado)**

El algoritmo gestiona 21 ítems independientes por estudiante, uno por cada combinación de función y dimensión de habilidad. Cada ítem tiene su propio estado que evoluciona con cada respuesta.

## **8.1 Estado de cada ítem**

| ease factor        → arranca en 2.5 intervalo          → arranca en 1 dia repeticiones       → arranca en 0 next\_review        → hoy revisiones válidas → arranca en 0  (contador hacia graduación) |
| :---- |

## **8.2 Calificación por respuesta**

El sistema infiere una calificación del 0 al 5 combinando acierto y tiempo de respuesta:

| Acierto \+ tiempo \< 4s   → calificación 5  (perfecto, sin dudar) Acierto \+ tiempo 4-8s   → calificación 4  (bien, pequeña duda) Acierto \+ tiempo \> 8s   → calificación 3  (recordó con esfuerzo) Error                   → calificación 1  (fallo) |
| :---- |

## **8.3 Actualización del estado del item**

| Si calificacion \< 3:     intervalo          \= 1 día     repeticiones       \= 0     revisiones validas \= 0     EF baja según fórmula SM-2 Si calificacion \>= 3:     Si repeticiones \== 0: intervalo \= 1     Si repeticiones \== 1: intervalo \= 2     Si repeticiones \>  1: intervalo \= intervalo anterior x EF     intervalo    \= min(intervalo calculado, techo máximo)     repeticiones \= repeticiones \+ 1     EF           \= max(EF actualizado, 1.3) |
| :---- |

El techo máximo es 7 días en general. Una vez que el estudiante se gradúa en una dimensión, el techo sube a 21 días para los ítems de esa dimensión, liberando espacio en la sesión para contenido nuevo.

## **8.4 Dificultad del ejercicio generado**

Antes de mostrar un ejercicio, el algoritmo lee el EF actual del item y selecciona el nivel de dificultad del generador:

| EF \< 1.8          → dificultad 1  (ejercicio fácil) EF entre 1.8-2.4  → dificultad 2  (ejercicio medio) EF \> 2.4          → dificultad 3  (ejercicio difícil) |
| :---- |

Un estudiante experto en una dimensión tiene EF alto y estable, por lo que recibe únicamente ejercicios de dificultad 3 de forma natural, sin lógica adicional.

## **8.5 Criterio de graduación en una dimensión**

| ¿El intervalo está en el techo (7 días)?   → SI ¿El EF es \>= 2.5?                          → SI → revisiones validas \+= 1 Si revisiones válidas \== 3:     → GRADUADO en esta dimensión     → se otorga una raya en el cinturón actual Si el estudiante falla en cualquier revisión:     → revisiones validas \= 0  (reset) |
| :---- |

## **8.6 Construcción de la sesion**

| Paso 1 — Ítems vencidos   Buscar items dónde next review \<= hoy   Ordenar por next review ascendente (el más atrasado primero) Paso 2 — Completar si hay menos del mínimo items sesión vencidos   Incorporar item nuevo según progresión de cinturones del estudiante Paso 3 — Limitar al máximo de ejercicios por sesión   Cortar la lista en max ejercicios sesion items Paso 4 — Mezclar   Garantizar distancia mínima entre ejercicios de la misma función |
| :---- |

## **8.7 Parámetros del modelo**

Todos los parámetros viven en un archivo de configuración en el backend y pueden ajustarse sobre datos reales sin modificar la lógica del algoritmo.

| \# | Parámetro | Valor sugerido | Impacto potencial |
| :---- | :---- | :---- | :---- |
| **1** | Intervalo máximo general (techo) | 7 días | *Determina la frecuencia mínima de aparición de cualquier ítem. Si es muy alto el estudiante puede quedarse sin contenido en próximas sesiones. Si es muy bajo el repaso se vuelve redundante y reduce la motivación.* |
| **2** | EF mínimo para revisión válida | 2.5 | *Umbral de fluidez requerido para contar hacia la graduación. Un valor alto exige dominio sólido antes de graduar; uno bajo permite graduaciones con recuerdo inestable.* |
| **3** | Revisiones válidas consecutivas para graduacion | 3 | *Cantidad de evidencia sostenida requerida. Valores altos reducen falsos positivos en la graduación pero enlentecen la progresión percibida.* |
| **4** | Máximo de ejercicios por sesión | 10 | *Controla la carga cognitiva y el tiempo de uso. Sesiones muy largas generan fatiga y abandono; muy cortas pueden no alcanzar masa crítica de repaso.* |
| **5** | EF inicial | 2.5 | *Punto de partida de todo ítem nuevo. Un valor alto asume competencia previa y sube la dificultad rápido; uno bajo es conservador y puede aburrir a estudiantes con base sólida.* |
| **6** | EF mínimo absoluto (piso) | 1.3 | *Evita que items muy difíciles aparecen diariamente de forma indefinida. Un piso muy alto protege la experiencia pero puede enmascarar dificultades reales.* |
| **7** | Umbrales de tiempo de respuesta | 4s / 8s | *Definen si un acierto vale 5, 4 o 3\. Umbrales muy estrictos penalizan a estudiantes reflexivos; muy permisivos no distinguen fluidez real de recuerdo lento.* |
| **8** | Intervalo máximo post-graduación | 21 días | *Una vez graduado en una dimensión, los ítems pueden espaciarse más. Libera capacidad en la sesión para contenido nuevo sin abandonar la retención a largo plazo.* |
| **9** | Umbrales de EF para dificultad del generador | 1.8 / 2.4 | *Mapean el EF al nivel de ejercicio generado. Si los cortes están mal calibrados, estudiantes avanzados reciben ejercicios triviales o principiantes reciben ejercicios inaccesibles.* |
| **10** | Mínimo de ejercicios antes de introducir contenido nuevo | 5 | *Si hay menos ítems vencidos que este valor el sistema incorpora material nuevo. Un umbral bajo introduce novedades demasiado rápido; uno alto puede generar sesiones repetitivas.* |
| **11** | Distancia mínima entre ejercicios de la misma función en sesión | 2 | *Impide que el estudiante resuelva por contexto inmediato en lugar de por reconocimiento genuino. Crítico para la honestidad pedagógica de cada sesión.* |

| La tabla de intentos como activo de datos *Cada respuesta queda registrada con función, dimensión, acierto, calificación y tiempo. Este historial permite identificar los distractores que generan mayor confusión, las funciones con mayor tasa de abandono, y si el tiempo de respuesta predice la retención. Es el insumo para superar SM-2 puro con modelos propios en versiones futuras.* |
| :---- |

# **9\. Monetización**

El modelo de monetización de Gradus combina dos fuentes complementarias diseñadas para ser compatibles con el perfil de usuario universitario argentino: accesibles en monto, opcionales en naturaleza, y alineadas con la identidad del producto.

## **9.1 Microtransacciones por items cosméticos**

Los items cosméticos son mejoras visuales del avatar que no afectan la progresión pedagógica ni el algoritmo. Son puramente opcionales y no generan ventaja competitiva.

* Kimonos de distintos colores y estilos, desbloqueables individualmente

* Lycras y accesorios de entrenamiento

* Items especiales de edición limitada vinculados a fechas del calendario académico

El precio por ítem debe ser accesible para el contexto universitario argentino. El modelo de referencia es el de juegos móviles con economía de ítems a bajo costo unitario y alta variedad.

## **9.2 Donaciones voluntarias**

Los usuarios que quieran sostener el proyecto de forma directa pueden realizar donaciones voluntarias sin contraprestación obligatoria. Esta vía refuerza el posicionamiento académico y comunitario de Gradus: un proyecto construido con y para estudiantes universitarios.

* Integración con plataformas de donación como Cafecito para el mercado argentino

* Sin niveles de donación ni beneficios exclusivos asociados en el MVP

* Reconocimiento opcional del donante en un listado de colaboradores dentro de la plataforma

| Principio de diseño *Ningún contenido pedagógico ni ventaja de progresión estará atado a pagos. La monetización opera exclusivamente sobre la capa estética y la contribución voluntaria, preservando la equidad de acceso al aprendizaje.* |
| :---- |

# **10\. Infraestructura y Costos Estimados**

Los costos de infraestructura escalan gradualmente con el crecimiento de la base de usuarios. Con el stack definido, el MVP puede operar a costo casi nulo durante la etapa de validación.

| Versión | Usuarios estimados | Costo mensual estimado |
| :---- | :---- | :---- |
| MVP | Decenas a cientos | USD 0 a 7 |
| Crecimiento temprano | Cientos a miles | USD 32 a 50 |
| Escala | Decenas de miles | USD 150 a 300 |

## **10.1 Servicios por etapa**

MVP: Supa Base tier gratuito (500 MB, 50.000 usuarios), Render tier gratuito o básico (USD 7/mes), Vercel gratuito, Desmos API sin costo para uso no comercial.

Crecimiento temprano: Supabase Pro USD 25/mes, Render o Railway con servidor siempre activo USD 7 a 25/mes, Vercel gratuito.

Escala: Supa Base USD 50 a 100/mes según volumen, backend con autoscaling en AWS ECS o Google Cloud Run USD 50 a 150/mes, CDN para gráficos propios en V2.

| El costo que más importa vigilar *La tabla de ejercicios aumenta con cada ejercicio resuelto. Con 10.000 usuarios activos haciendo 10 ejercicios tres veces por semana se generan 300.000 filas nuevas semanales. Diseñar los índices correctos desde el día uno es responsabilidad del Data Developer y evita migraciones costosas en etapas posteriores.* |
| :---- |

# **11\. Requerimientos Funcionales**

## **11.1 Autenticación y Perfil**

* Registro con correo electrónico o Google

* Configuración de avatar al crear la cuenta

* Perfil con matriz de dominio personal visible

* Historial de sesiones y progresión por función

## **11.2 Motor de Ejercicios**

* Banco inicial de ejercicios curado manualmente

* Generador de ejercicios paramétrico con tres niveles de dificultad por función

* Selección automática del ejercicio según estado SM-2 del estudiante

* Los tres tipos de ejercicio disponibles desde el cinturón blanco

* Distractores diseñados para reflejar confusiones reales entre familias de funciones

* Ejercicios de cinturones anteriores presentes en toda sesión con frecuencia ajustada

## **11.3 Algoritmo de Progresión**

* Implementación de SM-2 por par función-dimension

* Calificación 0 a 5 inferida de acierto y tiempo de respuesta

* Criterio de graduación por intervalo en techo y EF estabilizado

* Todos los parámetros del modelo configurables sin modificar código

* Historial completo de intentos almacenado para análisis futuro

## **11.4 Sistema de Cinturones y Rayas**

* Un cinturon unico por estudiante: Blanco, Azul, Violeta, Marron, Negro

* Dos rayas posibles por cinturón, obtenibles en orden libre

* Las dos rayas más la dimensión pendiente completan la promoción al siguiente cinturón

* El cinturon negro otorga dos rayas sobre la funcion racional; la tercera dimension es maestria permanente

## **11.5 Monetización**

* Tienda de items cosméticos con integración de pago

* Boton de donacion voluntaria con integración a Cafecito

* Los items cosméticos no afectan la progresión ni el algoritmo

# **12\. Requerimientos No Funcionales**

* Web mobile-first: diseñada para navegador en pantallas de 390 px de ancho mínimo

* Sesiones cortas: un ejercicio completo en menos de 60 segundos

* Estética minimalista: sin distracciones visuales, foco en el contenido matemático

* Diseño con restricciones mobile desde el primer día para facilitar la migración a app nativa en V2

* Botones de tamaño tactil adecuado, flujo de una acción por pantalla

* Contraste visual suficiente para uso en entornos con iluminación variable

# **13\. Diseno de Base de Datos**

La base de datos está implementada en PostgreSQL. Las seis entidades principales del sistema:

| Tabla | Propósito |
| :---- | :---- |
| users | Registro de usuarios, credenciales, configuración de avatar y metadatos de actividad |
| functions | Catálogo de tipos de función. Tabla estática, modificada solo por el equipo. |
| skill\_types | Los tres tipos de ejercicio. Tres filas fijas en el MVP. |
| exercises | Banco de ejercicios. Cada ejercicio pertenece a una función y a un tipo. |
| user progress | Estado SM-2 por par usuario-función-tipo: EF, intervalo, repeticiones, next review y revisiones válidas. |
| exercise\_attempts | Historial completo de respuestas. Registro permanente. Dataset de mejora futura del algoritmo. |

# **14\. Stack Tecnologico**

| Capa | Tecnología |
| :---- | :---- |
| Frontend web | React (mobile-first, preparado para React Native en V2) |
| Backend | Fast API (Python) |
| Base de datos | PostgreSQL via Supabase |
| Gráficos de funciones | Desmos API en MVP; render propio en V2 |
| Algoritmo SM-2 | Implementación propia en Python |
| Deploy backend | Railway o Render |
| Distribución web | Vercel o Netlify |

# **15\. Equipo**

| Rol | Responsabilidades |
| :---- | :---- |
| Científico de Datos | Algoritmo SM-2, generador de ejercicios, análisis de datos de uso, mejora continua del modelo de progresión |
| Desarrollador Backend | Fast API, base de datos, infraestructura, endpoints, autenticación, integración de pagos |
| Desarrollador Frontend | React mobile-first, integración con API, diseño de interfaz con estética minimalista, tienda de items |
| Analista de Crecimiento | Mapeo de comunidades universitarias (grupos de Facebook, Discord, WhatsApp por comision), adquisición orgánica temprana |

| Orientación del proyecto *Gradus es una plataforma de práctica adaptativa con orientación académica y alma de startup. Rigor en el contenido pedagógico y el modelo algorítmico; mentalidad ágil en la ejecución, el crecimiento y la iteración sobre datos reales.* |
| :---- |

# **16\. Roadmap**

| Versión | Contenido y objetivo |
| :---- | :---- |
| V1 — MVP Web | Tres tipos de ejercicio, generador paramétrico, funciones en 2D, cinturones con rayas, avatar básico, microtransacciones y donaciones, web mobile-first. Foco en adquisición orgánica y ajuste del algoritmo con datos reales. |
| V2 — Apps Mobile | Aplicación nativa para iOS y Android en React Native, consumiendo el mismo backend sin modificaciones. |
| V3 — Social y Customizacion | Mecánica grupal, cursos, tablero de avatares por rango, expansión del catálogo de items cosméticos, customización avanzada y resto del backlog. |

