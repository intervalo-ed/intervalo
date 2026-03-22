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
| Repetición espaciada | Algoritmo Dual-Loop: adquisición con repetición intra-sesión + SM-2 para retención post-graduación |
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

## **4.1 Topics incluidos en el MVP (orden de aparición)**

| # | Topic | Cinturón |
| :---- | :---- | :---- |
| 1 | Lineal | Blanco |
| 2 | Cuadrática | Blanco |
| 3 | Exponencial | Blanco |
| 4 | Logarítmica | Blanco |
| 5 | Trigonométrica (seno, coseno, tangente) | Blanco |
| 6 | Racional (con asíntotas) | Blanco |
| 7 | Valor absoluto | Blanco |
| 8–13 | Límites y continuidad (6 topics) | Azul |
| 14–19 | Derivadas (6 topics) | Violeta |
| 20–25 | Integrales (6 topics) | Marrón |
| — | Análisis avanzado | Negro (TBD) |

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

Cada estudiante posee un único cinturón que representa su nivel global. La progresión es por demostración real de habilidad (ítems graduados), no por tiempo acumulado.

Cada cinturón tiene 3 franjas posibles, desbloqueadas por cantidad de ítems graduados dentro del cinturón actual. Un ítem se considera graduado cuando completa el loop corto (step 2 aprobado) y entra en fase de review.

En toda sesión aparecen también ejercicios de cinturones anteriores con frecuencia ajustada por el algoritmo SM-2, garantizando retención a largo plazo.

## **6.1 Lógica de franjas — Cinturón Blanco**

El cinturón blanco tiene 21 ítems (7 topics × 3 habilidades). Las 3 franjas se otorgan por ítems graduados acumulados:

| Estado | Ítems graduados | Hito pedagógico |
| :---- | :---- | :---- |
| Sin franjas | 0–2 | Inicio del camino |
| Primera franja | 3 | Primera familia dominada (~lineales completas) |
| Segunda franja | 9 | Tres familias dominadas (base sólida) |
| Tercera franja | 18 | Seis familias dominadas (listo para promover) |
| **Promoción a Azul** | 21 | Las 7 familias completas (3 ítems sobrantes de margen) |

La misma lógica se aplica a cada cinturón con su cantidad total de ítems.

## **6.2 Cinturones, topics y lógica pedagógica**

| Cinturón | Topics a dominar | Ítems totales | Lógica pedagógica |
| :---- | :---- | :---- | :---- |
| **Blanco** | Lineales, Cuadráticas, Exponenciales, Logarítmicas, Trigonométricas, Racionales, Valor absoluto | 21 | *Familias elementales del análisis. Base visual e intuitiva: forma, parámetros y vocabulario fundamental.* |
| **Azul** | Límites y continuidad (6 topics) | 18 | *Primer salto formal. Introduce límites finitos e infinitos, continuidad, discontinuidades y asíntotas.* |
| **Violeta** | Derivadas (6 topics) | 18 | *Introduces la variación instantánea. Reglas de derivación, regla de la cadena, aplicaciones (monotonía, extremos).* |
| **Marrón** | Integrales (6 topics) | 18 | *Cálculo de área y acumulación. Integral indefinida, técnicas (sustitución, partes), integral definida y TFC.* |
| **Negro** | TBD | TBD | *Análisis avanzado. Contenido y lógica de maestría a definir.* |

## **6.3 Topics por cinturón — detalle Azul, Violeta, Marrón**

**Azul — Límites y continuidad:**
Límites finitos (algebraico + gráfico) · Límites al infinito y asíntotas · Límites laterales y discontinuidades · Continuidad en un punto · Límites notables (sin x/x, etc.) · Indeterminaciones (L'Hôpital)

**Violeta — Derivadas:**
Definición y notación · Reglas básicas (potencia, suma) · Regla del producto y cociente · Regla de la cadena · Derivadas de funciones elementales · Aplicaciones (monotonía, extremos)

**Marrón — Integrales:**
Integral indefinida y antiderivadas · Reglas básicas de integración · Sustitución simple · Integración por partes · Integral definida (Riemann → TFC) · Aplicaciones (área, área entre curvas)

## **6.4 Saltos entre cinturones**

* **Blanco a Azul**: transición del objeto (funciones) al comportamiento (límites). Primer contacto con el análisis formal.

* **Azul a Violeta**: de observar comportamientos a cuantificarlos. La derivada como herramienta operativa.

* **Violeta a Marrón**: el salto de la derivación a la integración. Acumulación como operación inversa.

* **Marrón a Negro**: TBD.

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

# **8\. Algoritmo de Progresión (Dual-Loop)**

El algoritmo gestiona 21 ítems independientes por estudiante, uno por cada combinación de función y dimensión de habilidad. Cada ítem atraviesa dos fases con lógicas distintas: una fase de adquisición con repetición intra-sesión, y una fase de retención con espaciado creciente. La especificación técnica completa se encuentra en [docs/algoritmo.md](algoritmo.md).

## **8.1 Diseño de dos fases**

La separación explícita entre adquisición y retención resuelve el problema central de SM-2 puro: en la fase de aprendizaje inicial, el espaciado importa menos que la repetición inmediata. Una vez consolidado el concepto, el espaciado creciente garantiza retención a largo plazo con mínima carga.

| Fase | Nombre | Mecanismo | Objetivo |
| :---- | :---- | :---- | :---- |
| Loop Corto | Adquisición | Pasos fijos: misma sesión → 1 día → 3 días | Consolidar el concepto en días |
| Loop Largo | Retención | SM-2: intervalos crecientes hasta 21 días | Retención permanente con mínima carga |

## **8.2 Estado de cada ítem**

| phase            → "learning" o "review" step\_index       → paso actual en learning (0, 1, 2) ease\_factor      → relevante en review; arranca en 2.5 al graduarse intervalo         → días hasta próxima revisión repeticiones      → repeticiones consecutivas exitosas en review next\_review      → fecha de próxima aparición |
| :---- |

## **8.3 Calificación por respuesta**

El sistema infiere una calificación del 0 al 5 combinando acierto y tiempo de respuesta:

| Acierto \+ tiempo \< 4s   → calificación 5  (fluente, sin dudar) Acierto \+ tiempo 4-8s   → calificación 4  (bien, pequeña pausa) Acierto \+ tiempo \> 8s   → calificación 3  (recordó con esfuerzo) Error                   → calificación 1  (fallo) |
| :---- |

## **8.4 Loop Corto — Fase de Adquisición**

Los ítems nuevos comienzan en step 0. Cada respuesta exitosa (calificación ≥ 3) avanza al siguiente paso. Un fallo retrocede un paso. Al completar el último paso con éxito, el ítem se gradúa y entra en review.

| Paso | Intervalo | Comportamiento ante fallo |
| :---- | :---- | :---- |
| Step 0 | misma sesión | Reinsertar en la sesión actual (máx. 2 veces) |
| Step 1 | 1 día | Volver a step 0, next\_review = hoy |
| Step 2 | 3 días | Volver a step 1, next\_review = hoy + 1 día |

La reinserción en step 0 permite al estudiante corregir el error dentro de la misma sesión, imitando la práctica de repetición inmediata antes de espaciar.

## **8.5 Loop Largo — Fase de Retención (SM-2)**

Una vez graduado, el ítem sigue el algoritmo SM-2: los intervalos crecen según el Ease Factor (EF) del estudiante. No hay repetición intra-sesión en esta fase.

| Si calificación \< 3:     intervalo    \= 1 día     repeticiones \= 0     EF baja según fórmula SM-2 Si calificación \>= 3:     Si repeticiones \== 0: intervalo \= 1     Si repeticiones \== 1: intervalo \= 6     Si repeticiones \>  1: intervalo \= intervalo anterior × EF     intervalo    \= min(intervalo calculado, 21 días)     repeticiones \= repeticiones \+ 1     EF           \= max(EF actualizado, 1.3) |
| :---- |

## **8.6 Criterio de graduación**

Un ítem se gradúa al completar el paso 2 (último paso del loop corto) con calificación ≥ 3. La graduación es inmediata y permanente: el ítem no regresa a learning aunque el estudiante falle en review.

Cada graduación otorga una dimensión aprobada para la función correspondiente. Cuando las tres dimensiones de una función están aprobadas, el estudiante avanza de cinturón.

## **8.7 Dificultad del ejercicio generado**

| Condición | Dificultad |
| :---- | :---- |
| Ítem en learning step 0 | Fácil |
| Ítem en learning step 1–2 | Media |
| Ítem en review con EF \< 1.8 | Fácil |
| Ítem en review con EF 1.8–2.4 | Media |
| Ítem en review con EF \> 2.4 | Difícil |

## **8.8 Construcción de la sesión**

| Paso 1 — Ítems de learning vencidos   Buscar ítems en phase="learning" con next\_review \<= hoy   Prioridad sobre ítems de review (ventana de repaso más estrecha) Paso 2 — Ítems de review vencidos   Buscar ítems en phase="review" con next\_review \<= hoy   Ordenar por next\_review ascendente Paso 3 — Completar con contenido nuevo   Si hay menos de 5 ítems vencidos, incorporar ítem nuevo del cinturón actual Paso 4 — Limitar y reordenar   Cortar al máximo de 15 ejercicios por sesión   Garantizar distancia mínima de 2 entre ejercicios de la misma función |
| :---- |

Los ítems en step 0 pueden reinsertarse al final de la cola durante la sesión si el estudiante falla (máximo 2 reinserciones).

## **8.9 Parámetros del modelo**

Todos los parámetros viven en `SM2Config` y pueden ajustarse sobre datos reales sin modificar la lógica del algoritmo.

| \# | Parámetro | Valor | Impacto |
| :---- | :---- | :---- | :---- |
| **1** | Pasos de aprendizaje | \[0, 1, 3\] días | Velocidad de graduación. El valor 0 habilita repetición intra-sesión. |
| **2** | Máx. reinserciones intra-sesión | 2 | Cuántas veces puede reaparecer un ítem en step 0 por sesión. |
| **3** | Calificación mínima para avanzar | 3 | Por debajo = fallo. |
| **4** | Intervalo inicial en review | 7 días | Primera separación post-graduación. |
| **5** | Intervalo máximo en review | 21 días | Techo de espaciado para ítems retenidos. |
| **6** | EF inicial en review | 2.5 | Punto de partida del Ease Factor al graduarse. |
| **7** | EF mínimo absoluto | 1.3 | Piso del EF; evita aparición diaria indefinida de ítems muy difíciles. |
| **8** | EF mínimo para dominio sólido | 2.5 | Umbral de fluidez en review. |
| **9** | Umbrales de tiempo de respuesta | 4s / 8s | Definen si un acierto vale 5, 4 o 3. |
| **10** | Máximo de ejercicios por sesión | 15 | Techo de carga por sesión (~5 minutos). |
| **11** | Mínimo antes de introducir contenido nuevo | 5 | Si hay menos ítems vencidos, se incorpora material nuevo. |
| **12** | Distancia mínima entre ejercicios de la misma función | 2 | Impide que el estudiante resuelva por contexto inmediato. |

| La tabla de intentos como activo de datos *Cada respuesta queda registrada con función, dimensión, acierto, calificación y tiempo. Este historial permite identificar los distractores que generan mayor confusión, las funciones con mayor tasa de abandono, y si el tiempo de respuesta predice la retención. Es el insumo para superar el algoritmo actual con modelos propios en versiones futuras.* |
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

* Algoritmo Dual-Loop por par función-dimensión: fase de adquisición (loop corto) y fase de retención (SM-2)

* Calificación 0 a 5 inferida de acierto y tiempo de respuesta

* Repetición intra-sesión para ítems en step 0 del loop corto (máximo 2 reinserciones)

* Graduación al completar los pasos del loop corto; SM-2 aplicado únicamente post-graduación

* Todos los parámetros del modelo configurables sin modificar código

* Historial completo de intentos almacenado para análisis futuro

## **11.4 Sistema de Cinturones y Franjas**

* Un cinturón único por estudiante: Blanco, Azul, Violeta, Marrón, Negro

* Tres franjas por cinturón, desbloqueadas por ítems graduados acumulados (umbrales: 3 / 9 / 18)

* La promoción al siguiente cinturón requiere completar todos los ítems del cinturón actual

* Cinturón Negro: contenido y mecánica de maestría TBD

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

