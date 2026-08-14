# Formato de los reportes de Intervalo

Todos los reportes de esta carpeta siguen el mismo formato: **tech report de
Google DeepMind**, con gráficos en **matplotlib + seaborn** y la paleta de la
marca. Este documento explica cómo replicarlo.

La referencia visual es el paper *LearnLM: Improving Gemini for Learning*
(arXiv 2412.16429). El generador de trabajo está en [`gen_report.py`](gen_report.py):
copialo, cambiá las constantes de datos y corré `python gen_report.py`.

> **Los PDF no van al repo.** Están gitignorados (`docs/reports/*.pdf`) porque son
> artefactos regenerables y pesados. Lo que se versiona es este documento y el
> generador.

---

## 1. Estructura de la página

Papel A4 (`8.27 × 11.69 in`), márgenes `L = 0.115` / `R = 0.885` en coordenadas
de figura. Todo se dibuja con `fig.text()` y `fig.add_axes()` sobre un
`PdfPages`; no hay LaTeX de por medio.

**Página 1**
1. Wordmark `intervalo` arriba a la izquierda, en negro, tamaño ~13pt.
2. Fecha (o rango) arriba a la derecha, en itálica 7.2pt.
3. Regla horizontal de 1.1pt cerrando la cabecera.
4. Título, subtítulo con la escala del dato, y abstract en **negrita**.
5. Secciones numeradas, cada una con su figura y su pie.
6. Nota de fuentes de datos al pie, en gris.

**Páginas siguientes**
- El título corrido va centrado arriba, 7.2pt, seguido de la misma regla.
- Número de página abajo a la derecha, sobre una regla de 0.7pt.

## 2. Tipografía

| Rol | Fuente | Cuerpo |
|---|---|---|
| Título | Cambria bold | 19.5 |
| Subtítulo | Cambria | 13.5 |
| Encabezados de sección | Cambria bold | 12 |
| Abstract | DejaVu Serif bold | 9.2 |
| Cuerpo | DejaVu Serif | 9 |
| Pies de figura | DejaVu Serif | 7.2 |
| Ejes y leyendas | DejaVu Serif | 7.2–8 |

Cambria para la jerarquía y DejaVu Serif para el texto corrido. Es la misma
separación que usa el paper de referencia (ahí, Charter para display).

**Por qué Cambria:** DejaVu Serif Bold es demasiado pesada para un título y se
veía tosca al lado del original. Cambria tiene un trazo bastante más fino. Si
hay que reemplazarla, las candidatas del sistema que más se le acercan son
Century Schoolbook y Constantia.

## 3. Paleta

Sale de `web/src/lib/catalog/index.ts` y `web/src/app/globals.css`:

```python
INDIGO      = "#5457e5"   # --primary
INDIGO_SOFT = "#7e80f7"   # --chart-5
BLUE        = "#1B63D6"   # cinturón azul (BELT_ONDARK_VIVID)
VIOLET      = "#9B2FC9"   # cinturón violeta
BROWN       = "#8B4A1F"   # cinturón marrón
INK         = "#131324"   # --background, usado como tinta sobre papel
MUTED       = "#a4b3c6"   # --muted-foreground, notas al pie
GRID        = "#d8dce6"   # grilla de los ejes
```

Convención: **índigo para la serie principal**, índigo suave para etapas
derivadas o secundarias, y los colores de cinturón para categorías.

⚠️ El cinturón blanco (`#FAFAFA`) **no se usa**: sobre papel blanco es
invisible. Si hace falta una cuarta categoría, va marrón.

## 4. Gráficos

Estilo `seaborn.whitegrid`: fondo blanco, grilla suave solo en el eje de la
magnitud, y `despine` de los bordes superior y derecho.

```python
sns.set_theme(style="whitegrid", font="DejaVu Serif")

def strip(ax, axis="x"):
    ax.grid(axis=axis, visible=False)
    sns.despine(ax=ax, top=True, right=True)
```

Reglas que se aplicaron:
- Etiquetar los valores sobre las barras cuando son pocas; con muchas, dejar
  solo el eje.
- Leyenda sin marco (`legend.frameon = False`).
- Embudos en barras horizontales, con el porcentaje del total **y** del paso
  anterior en la etiqueta.
- Pies de figura con el prefijo `Figura N |` en negrita, igual que el paper.

## 5. Dos trampas que costaron tiempo

**El wrapping por caracteres no sirve.** `textwrap.wrap(width=N)` corta por
cantidad de caracteres, que no tiene relación con el ancho real: dejaba media
pulgada de margen derecho sin usar. La función `_wrap()` del generador mide el
ancho renderizado de cada línea candidata con `get_window_extent()` y corta
recién cuando excede la columna. Usar siempre esa.

**El bloque de texto y las figuras deben terminar en el mismo margen.** Al
mezclar texto medido con ejes posicionados a mano es fácil que no coincidan;
conviene verificar el PDF renderizado, no confiar en el cálculo.

## 6. Consistencia de los números — lo más importante

El error más fácil de cometer, y el que más confunde a quien lee, es **mezclar
definiciones de la misma métrica entre figuras**. Pasó en la primera versión de
este reporte: el embudo decía 294 personas y el gráfico diario sumaba 521.

Las dos definiciones eran válidas pero distintas:
- **Embudo:** personas únicas activas en una ventana → conjunto deduplicado.
- **Gráfico diario:** personas por día de *primera* visita → las barras no se
  pueden sumar para obtener el total del embudo.

Reglas para el próximo reporte:

1. **Fijar una ventana temporal única** y usar exactamente el mismo corte en
   todas las consultas, incluidos los límites (`>= inicio AND < fin`).
2. **Nombrar la métrica por lo que mide.** Si la barra cuenta primeras visitas,
   la leyenda dice «Personas nuevas», no «Entraron».
3. **Si un total no es la suma de las partes, explicarlo en el pie.** En este
   reporte: `213 + 65 personas nuevas del 12 y 13 + 16 del 11/08 que volvieron
   = 294`. El lector tiene que poder cerrar la cuenta.
4. **Declarar lo que queda afuera y por qué.** El 11/08 se excluyó del embudo
   porque la instrumentación (`utm_source`, `onboarding_step`) se desplegó esa
   misma noche, así que sus etapas intermedias están subcontadas.

## 7. De dónde salen los datos

| Métrica | Fuente |
|---|---|
| Tráfico, embudo, atribución, A/B | PostHog (MCP `execute-sql`, HogQL) |
| Registros, inscripciones, sesiones, respuestas | Postgres de producción |
| Grupos publicados por día | Google Sheet del tracker de difusión |

Para Postgres se usa el helper `backend/dbq.py` a través de Railway, que evita
tener la URL de conexión en el repo:

```bash
railway run --service BBDD bash -c \
  'export DB_URL="$DATABASE_PUBLIC_URL"; python dbq.py "$(cat consulta.sql)"'
```

Las consultas largas van en un archivo `.sql` y se pasan con `$(cat ...)`: el
escapeo de comillas en línea rompe con facilidad.

## 8. Checklist antes de dar por cerrado un reporte

- [ ] Todas las cifras salen de la misma ventana temporal.
- [ ] Los totales que no son suma de partes están explicados en el pie.
- [ ] Ningún texto se superpone con otro ni con un eje (revisar el PDF, no el código).
- [ ] Las líneas de texto llegan al margen derecho.
- [ ] Cada figura tiene pie y cada pie dice qué mira y qué concluir.
- [ ] Los porcentajes citados en el abstract coinciden con los de las figuras.
- [ ] El PDF quedó en `docs/reports/` y no se subió al repo.
