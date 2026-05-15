# KPIs MPV Intervalo

En este documento dejo anotadas las métricas que definí utilizar para medir y mejorar el producto de intervalo para una segunda version reestructurada en typescript.

## Métricas de renteción

El objetivo de estas métricas es entender el comportamiento de los usuarios repecto al producto en general, abstrayendonos del contenido del curso inicial.

### Cohort retension

- medimos la retención de cohortes por períodos donde las muestras sean significativas, la idea es ver si las curvas se achatan en algun punto, lo que indica la creacion del habito con el producto

- medimos este kpi para distintos tipos de actividad (abrió la app / completo una sesión) x unidad de tiempo

**Cálculo:**

- agrupamos usuarios por semana de inscripción (cohorte)
- para cada cohorte C y cada semana N posterior a la inscripción:
  `retención(C, N) = usuarios de C activos en semana N / tamaño total de C`
- "activo" se mide en dos definiciones paralelas:
  - abrió la app al menos una vez en la semana
  - registró al menos una respuesta en la semana
- output: matriz triangular cohorte × semanas-desde-inscripción, más curva promedio
- requiere mínimo ~30 usuarios por cohorte para ser informativo; si no se llega, agrupar por mes

### Días y horarios de uso

- la idea es tener un heatmap de la semana para entender mejor en que bandas de tiempo se usa el producto

**Cálculo:**

- para cada sesión registramos día de la semana y hora de inicio en hora local del usuario
- celda del heatmap:
  `celda(día, hora) = sesiones iniciadas en esa franja / total de sesiones`
- output: matriz 7×24 normalizada
- segmentar entre días lectivos y fin de semana, los promedios mezclados pierden información

### Notificaciones push

- la idea es ver el % de las notificaciones que se responden, para ver si son utiles y que impacto tienen en los dias y horarios de uso

**Cálculo:**

- por cada notificación entregada (no enviada, entregada) marcamos 1 si el usuario abrió la app dentro de los 30 minutos posteriores, 0 si no
- tasa global:
  `tasa_respuesta = aperturas dentro de ventana / notificaciones entregadas`
- cortes:
  - por hora de envío → optimización de horario
  - por sistema operativo (iOS y Android tienen comportamientos distintos)
  - por cantidad de notificaciones recibidas por el usuario en los últimos 7 días → detección de fatiga

### Duración, performance y abandono de sesiones

- la idea es ir encontrando la duración de las sesiones ideal, analizando si abandonan antes de tiempo y si la performance mas allá de los ejercicios decae en algún punto

**Cálculo:**

- duración en tiempo:
  `duración = timestamp(última respuesta) − timestamp(primera respuesta)`
  reportar mediana y percentiles 25/75/90 (distribución asimétrica, el promedio engaña)
- duración en ejercicios:
  `ejercicios_por_sesión = respuestas registradas en la sesión`
  mediana y percentiles
- curva de abandono:
  `curva(n) = % de sesiones que terminaron exactamente en el ejercicio n`
  el punto de inflexión donde la curva cae sugiere el límite natural de tolerancia
- performance por posición en sesión:
  `% aciertos(posición n) = aciertos en el ejercicio n-ésimo de la sesión / total de respuestas en posición n`
  detectar caída por fatiga
  
  

## Métricas de contenido

### Aciertos por item

- la idea es medir que items son empiricamente más dificiles que otros, y hacer comparaciones por tema, habilidad y cinturón, buscando desviós e insights sobre si son faciles o difíciles y si eso requiere cambios o no

**Cálculo:**

- contar solo primeros intentos en fase Entendimiento (aísla dificultad intrínseca, sin contaminar con reintentos ni con revisiones de Retención)
- por ítem I:
  `% aciertos(I) = primeros intentos correctos a I en Entendimiento / total primeros intentos a I en Entendimiento`
- reportar con intervalo de confianza Wilson al 95% (con muestras chicas el porcentaje puntual engaña)
- mínimo 30 respuestas por ítem para que sea confiable
- agregaciones para comparación:
  - promedio de % aciertos por Tema
  - promedio de % aciertos por Habilidad (transversal a temas)
  - promedio de % aciertos por Cinturón

### Intentos hasta graduación

- la idea es mirar las distribuciones de cuantos intentos son necesarios para graduarse por item, y hacer comparaciones entre items utilizando la mediana

**Cálculo:**

- para cada par (usuario U, ítem I) que ya graduó:
  `intentos(U, I) = cantidad de respuestas que U dio a I antes de pasar a fase Retención`
- por ítem reportar la distribución completa, no solo la mediana, la forma importa (cola larga = problema pedagógico, bimodal = posible problema de prerrequisitos)
- métricas resumen para comparar entre ítems:
  - mediana
  - percentil 90
  - % de usuarios que graduaron en el mínimo posible (3 respuestas correctas seguidas, dado el esquema de steps mismo día → +1 día → +2 días)
- excluir del cálculo a usuarios que aún no graduaron el ítem (censura a la derecha) y reportar qué % fue excluido

### Items graduados en el tiempo

- la idea es analizar curvas donde se midan los items promedio/median para cada dia /semana desde el inicio

**Cálculo:**

- por usuario U y día t desde su inscripción:
  `items_graduados(U, t) = cantidad de ítems que U graduó hasta t días después de inscribirse`
- vista poblacional:
  `curva(t) = mediana sobre usuarios de items_graduados(U, t)`
  reportar con banda percentiles 25/75
- tiempo para alcanzar hitos (vista complementaria):
  `tiempo_para_N(U) = días desde inscripción hasta graduar N ítems`
  reportar como distribución sobre usuarios, con N = 10 (~medio Azul) y N = 18 (Azul completo)
- para comparar cohortes de forma limpia: fijar ventana común (ej: "ítems graduados en los primeros 30 días") y excluir usuarios con menos de 30 días de antigüedad
- métrica complementaria de eficiencia:
  `eficiencia(U) = ítems graduados / horas de uso acumuladas`
  separa progreso por dedicación de progreso por eficacia del algoritmo
