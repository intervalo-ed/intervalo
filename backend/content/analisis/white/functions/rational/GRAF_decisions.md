# Decisiones, GRAF.json (topic: white/functions/rational)

## Ronda 2: Regeneración y correcciones

### Cambios aplicados
- **Adición de tags**: Cada uno de los 50 ejercicios recibió un `tags` field con el slug correcto de su sub-familia según topic-context.md
- **Validación de explicaciones**: Todas las explicaciones cumplen el mínimo de 300 caracteres y estructura de 3 partes (concepto → aplicación → cierre)
- **Distribución balanceada**: Separación en tipos A (lectura de propiedades), B (identificación de fórmula) y C (contexto cotidiano)

### Distribución por tipo
- **Tipo A** (lectura de propiedades del gráfico): 31 ejercicios
- **Tipo B** (identificar fórmula entre opciones): 15 ejercicios  
- **Tipo C** (contexto cotidiano con k/x): 4 ejercicios

### Plan cumplido (Tipo A)
| Sub-familia | Target | Generados | Estado |
|---|---:|---:|---|
| Cantidad de asíntotas totales | 2 | 2 | ✓ |
| Cantidad de asíntotas verticales | 3 | 3 | ✓ |
| Ubicación de la asíntota vertical | 3 | 3 | ✓ |
| Valor de la asíntota horizontal | 3 | 3 | ✓ |
| Cuadrantes de las ramas | 2 | 2 | ✓ |
| Dirección de las ramas | 2 | 2 | ✓ |
| Monotonía en un intervalo | 2 | 2 | ✓ |
| Interceptos con eje X | 2 | 2 | ✓ |
| Interceptos con eje Y | 2 | 2 | ✓ |
| Valor aproximado en un punto | 2 | 2 | ✓ |
| Dominio desde el gráfico | 1 | 1 | ✓ |
| Existencia de extremos | 1 | 1 | ✓ |
| Imagen desde el gráfico | 1 | 1 | ✓ |
| Simetría / paridad | 1 | 1 | ✓ |
| Límites laterales en la AV | 2 | 2 | ✓ |
| Cantidad de ramas | 1 | 1 | ✓ |
| Signo de la función en intervalo | 1 | 1 | ✓ |
| **Subtotal Tipo A** | **31** | **31** | **✓** |

### Plan cumplido (Tipo B y C)
| Tipo | Sub-familia | Target | Generados | Estado |
|---|---|---:|---:|---|
| B | Identificar fórmula desde gráfico | 15 | 15 | ✓ |
| C | Contexto cotidiano (k/x) | 4 | 4 | ✓ |
| **Total** | | **50** | **50** | **✓** |

### Cambios por ejercicio
- **Ejercicios 1-50**: Asignación de tags por tipo (A/B/C) y sub-familia, sin modificar contenido

### Verificación de estructura
- ✓ Todos los 50 ejercicios tienen `tags` field con exactamente 1 slug
- ✓ Todas las explicaciones ≥ 300 caracteres
- ✓ Todos los `feedback_incorrect` son arrays paralelos a options, con null en correct_index
- ✓ Distribución de tags coincide exactamente con targets de topic-context.md
- ✓ Los 50 ejercicios tienen `graph_fn` y `graph_view` válidos (gráficos embebidos)

## Conteo real por sub-familia
| Sub-familia (slug) | Cantidad |
|---|---:|
| cantidad-asintotas-totales | 2 |
| cantidad-asintotas-verticales-graf | 3 |
| cantidad-ramas | 1 |
| contexto-cotidiano-racional | 4 |
| cuadrantes-ramas | 2 |
| direccion-ramas | 2 |
| dominio-desde-grafico | 1 |
| existencia-extremos | 1 |
| formula-desde-grafico | 15 |
| imagen-desde-grafico | 1 |
| interceptos-x-graf | 2 |
| interceptos-y-graf | 2 |
| limites-laterales-av | 2 |
| monotonia-intervalo-graf | 2 |
| signo-en-intervalo | 1 |
| simetria-paridad-graf | 1 |
| ubicacion-asintota-vertical | 3 |
| valor-aproximado | 2 |
| valor-asintota-horizontal | 3 |
| **Total** | **50** |

---
