# Decisiones, CLSF.json (topic: brown/distribuciones/hipergeometrica)

## Plan cumplido

| Sub-familia | Target | Ya había | Generados (ronda 2) | Total |
|---|---:|---:|---:|---:|
| reconocer-hipergeometrica | 6 | 1 | 5 | 6 |
| distractor-vecino | 5 | 1 | 4 | 5 |
| supuesto-violado | 4 | 1 | 3 | 4 |
| **Total** | **15** | **3** | **12** | **15** |

## Contextos usados

- `reconocer-hipergeometrica` (ya había: sorteo de empleados): nuevos en urna de bochas, mazo de cartas, panel de jurados, estanque de peces, lote de piezas (control de calidad). 5 contextos distintos, ninguno repetido dentro de la sub-familia.
- `distractor-vecino` (ya había: control de calidad de piezas, confusión binomial): nuevos en urna con reposición (binomial), mazo de cartas para conteo combinatorio puro, panel de jurados con reposición (binomial), estanque de peces para conteo combinatorio puro. Cubre ambas variantes que pide el `topic-context.md` (confusión con binomial y con conteo combinatorio puro), 2 de cada tipo entre los nuevos, más el existente de tipo binomial (total 3 binomial / 2 combinatorio).
- `supuesto-violado` (ya había: inspector de cajas, se agregan cajas nuevas): nuevos en estanque de peces (se liberan peces marcados nuevos a mitad de la pesca), lista de empleados (se suman empleados transferidos a mitad del sorteo), panel de jurados (se incorporan candidatos nuevos a mitad de las entrevistas).

## Decisiones de contenido

- Los distractores de tipo "conteo combinatorio puro" (`distractor-vecino`, 2 ejercicios) se redactaron con una opción de prosa conceptual ("Un conteo fijo, no aleatorio") junto a dos opciones que nombran explícitamente la distribución en prosa ("Es la distribución $Hip(...)$" / "Es la distribución $Bin(...)$") en vez de solo la notación pelada, para evitar la asimetría de longitud entre una opción de prosa y dos fórmulas sueltas (regla 4 de `authoring-context.md`). Sin este ajuste el validador marcaba la opción correcta como notablemente más larga.
- `correct_index` se distribuyó de forma pareja entre 0/1/2 a lo largo del archivo completo (los 3 ejercicios preexistentes tienen `correct_index=0` fijo, no se tocaron; los 12 nuevos se repartieron para compensar y quedar en 5/5/5 en total).
- Todos los ejercicios nuevos usan $N\leq 20$, cumpliendo la regla del topic. Se detectó que 2 de los 3 ejercicios preexistentes de `CLSF` (control de calidad con $N=15$) y sobre todo los de `FORM` preexistentes ($N=30$ y $N=40$) violan esa regla; no se tocaron por instrucción explícita de no editar ejercicios ya existentes salvo problema real, se deja anotado acá para una futura pasada de limpieza.

## Warnings que quedaron

Ninguno. `python content/validate_content.py --course probabilidad --topic brown/distribuciones/hipergeometrica` corre en 0 ERRORS, 0 WARNINGS tras el ajuste de las dos opciones de conteo combinatorio puro.
