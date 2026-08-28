"""
universities.py — Forma canónica del campo `enrollments.university`.

El onboarding ofrece unos pocos accesos directos y un campo libre "Otra", así
que el mismo lugar entra escrito de mil formas: "UBA", "Uba", "uba",
"Universidad de Buenos Aires". Sin normalizar, cada variante es una universidad
distinta para la DB — el leaderboard le pone el chip gris de universidad
desconocida en vez de la tag de marca, y `/public/university-leaderboard`, que
agrupa por el string crudo, las cuenta como instituciones separadas.

El front ya canonicaliza antes de enviar (`canonicalUniversity` en
web/src/lib/university-tags.ts), pero el backend es el dueño de la escritura:
si solo lo hiciera el front, cualquier cliente que no sea el formulario podría
volver a ensuciar la columna. Este módulo cierra esa puerta en `/user/enroll`.

El listado está duplicado a propósito con el del front: allá se necesita el
color de marca para pintar la tag, acá solo la sigla, y son dos runtimes que no
comparten código. **Al agregar una universidad hay que tocar los dos archivos.**
La migración 20260814_0030 tiene una tercera copia, congelada — esa no se toca,
tiene que seguir haciendo lo que hizo el día que corrió.
"""

from __future__ import annotations

import unicodedata

# (sigla, nombre completo) — espejo de UNIVERSITY_TAGS del front.
UNIVERSITIES: list[tuple[str, str]] = [
    ("UBA", "Universidad de Buenos Aires"),
    ("UTN", "Universidad Tecnológica Nacional"),
    ("UNSAM", "Universidad Nacional de San Martín"),
    ("UNLP", "Universidad Nacional de La Plata"),
    ("UNC", "Universidad Nacional de Córdoba"),
    ("UNR", "Universidad Nacional de Rosario"),
    ("UNL", "Universidad Nacional del Litoral"),
    ("UNT", "Universidad Nacional de Tucumán"),
    ("UNS", "Universidad Nacional del Sur"),
    ("UADE", "Universidad Argentina de la Empresa"),
    ("ITBA", "Instituto Tecnológico de Buenos Aires"),
    ("UNLaM", "Universidad Nacional de La Matanza"),
    ("UNCUYO", "Universidad Nacional de Cuyo"),
    ("UNNE", "Universidad Nacional del Nordeste"),
    ("UNMDP", "Universidad Nacional de Mar del Plata"),
    ("UNLZ", "Universidad Nacional de Lomas de Zamora"),
    ("UNLU", "Universidad Nacional de Luján"),
    ("UNSA", "Universidad Nacional de Salta"),
    ("UNSJ", "Universidad Nacional de San Juan"),
    ("UNSL", "Universidad Nacional de San Luis"),
    ("UNRC", "Universidad Nacional de Río Cuarto"),
    ("UNTREF", "Universidad Nacional de Tres de Febrero"),
    ("UNQ", "Universidad Nacional de Quilmes"),
    ("UNCOMA", "Universidad Nacional del Comahue"),
    ("UNAM", "Universidad Nacional de Misiones"),
    ("UNPSJB", "Universidad Nacional de la Patagonia San Juan Bosco"),
    ("UNJu", "Universidad Nacional de Jujuy"),
    ("UNSE", "Universidad Nacional de Santiago del Estero"),
    ("UNGS", "Universidad Nacional de General Sarmiento"),
    ("UNICEN", "Universidad Nacional del Centro de la Provincia de Buenos Aires"),
    ("UNLPAM", "Universidad Nacional de La Pampa"),
    ("UNM", "Universidad Nacional de Moreno"),
    ("UNCA", "Universidad Nacional de Catamarca"),
    ("UADER", "Universidad Autónoma de Entre Ríos"),
    ("UNDAV", "Universidad Nacional de Avellaneda"),
    ("UNAJ", "Universidad Nacional Arturo Jauretche"),
    ("UNA", "Universidad Nacional de las Artes"),
    ("UNLaR", "Universidad Nacional de La Rioja"),
    ("UNPA", "Universidad Nacional de la Patagonia Austral"),
    ("UNF", "Universidad Nacional de Formosa"),
    ("UNER", "Universidad Nacional de Entre Ríos"),
    ("UNNOBA", "Universidad Nacional del Noroeste de la Provincia de Buenos Aires"),
    ("UNO", "Universidad Nacional del Oeste"),
    ("UNRN", "Universidad Nacional de Río Negro"),
    ("UNVM", "Universidad Nacional de Villa María"),
    ("UNLA", "Universidad Nacional de Lanús"),
    ("UCA", "Universidad Católica Argentina"),
    ("UP", "Universidad de Palermo"),
    ("UB", "Universidad de Belgrano"),
    ("Kennedy", "Universidad Argentina John F. Kennedy"),
    ("UAI", "Universidad Abierta Interamericana"),
    ("UM", "Universidad de Morón"),
    ("USAL", "Universidad del Salvador"),
    ("UCES", "Universidad de Ciencias Empresariales y Sociales"),
    ("UFLO", "Universidad de Flores"),
    ("Maimonides", "Universidad Maimónides"),
    ("Austral", "Universidad Austral"),
    ("UTDT", "Universidad Torcuato Di Tella"),
    ("UdeSA", "Universidad de San Andrés"),
    ("UCEMA", "Universidad del CEMA"),
    ("UCC", "Universidad Católica de Córdoba"),
    ("UCASAL", "Universidad Católica de Salta"),
    ("UBP", "Universidad Blas Pascal"),
    ("Champagnat", "Universidad Champagnat"),
    ("Barcelo", "Instituto Universitario Fundación Barceló"),
    ("ISALUD", "Universidad ISALUD"),
    ("UPC", "Universidad Provincial de Córdoba"),
    ("UNCAUS", "Universidad Nacional del Chaco Austral"),
    ("UNDEC", "Universidad Nacional de Chilecito"),
    ("UNRT", "Universidad Nacional de Río Tercero"),
    ("UNPAZ", "Universidad Nacional de José C. Paz"),
    ("UNAB", "Universidad Nacional Guillermo Brown"),
    ("UNAHUR", "Universidad Nacional de Hurlingham"),
    ("UNICABA", "Universidad de la Ciudad de Buenos Aires"),
    ("UNDEF", "Universidad de la Defensa Nacional"),
    ("UPE", "Universidad Provincial de Ezeiza"),
    ("UNMa", "Universidad Nacional Madres de Plaza de Mayo"),
    ("UNIPE", "Universidad Pedagógica Nacional"),
    ("UDC", "Universidad del Chubut"),
    ("UNLC", "Universidad Nacional de los Comechingones"),
    ("UNSO", "Universidad Nacional Raúl Scalabrini Ortiz"),
    ("UPSO", "Universidad Provincial del Sudoeste"),
    ("UNRAF", "Universidad Nacional de Rafaela"),
    ("UNTDF", "Universidad Nacional de Tierra del Fuego"),
    ("UNDELTA", "Universidad Nacional del Delta"),
    ("UPLAB", "Universidad Provincial de Laguna Blanca"),
    ("UNSADA", "Universidad Nacional de San Antonio de Areco"),
    ("UNVIME", "Universidad Nacional de Villa Mercedes"),
    ("UNPILAR", "Universidad Nacional de Pilar"),
    ("UNAU", "Universidad Nacional del Alto Uruguay"),
]


def _norm(value: str) -> str:
    """Minúsculas, sin tildes, sin espacios al borde — la forma con la que se
    comparan dos maneras de escribir la misma universidad."""
    decomposed = unicodedata.normalize("NFD", value.lower())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn").strip()


_FULL_BY_SIGLA: dict[str, str] = {sigla: nombre for sigla, nombre in UNIVERSITIES}

# normalizado -> sigla. La sigla se inserta antes que el nombre completo para
# que gane si alguna vez colisionan.
_BY_NORM: dict[str, str] = {}
for _key, _full_name in UNIVERSITIES:
    _BY_NORM.setdefault(_norm(_key), _key)
    _BY_NORM.setdefault(_norm(_full_name), _key)


def article_for(value: str | None) -> str:
    """El artículo que le corresponde a una universidad: "la UBA", "el ITBA".

    Se deduce del nombre completo, no de la sigla: casi todas son "Universidad"
    (femenino) pero hay dos institutos —ITBA y Barceló— que piden "el". Deducirlo
    en vez de mantener una lista aparte significa que agregar una casa de
    estudios nueva no obliga a acordarse de nada.
    """
    if not value:
        return "la"
    nombre = _FULL_BY_SIGLA.get(value.strip())
    return "el" if nombre and nombre.startswith("Instituto") else "la"


def canonical_university(value: str | None) -> str | None:
    """Devuelve la sigla canónica si `value` es una universidad conocida escrita
    de cualquier forma; si no, el texto sin espacios al borde. None y vacío
    pasan derecho: no todas las filas tienen universidad cargada."""
    if value is None:
        return None
    stripped = value.strip()
    if not stripped:
        return stripped
    return _BY_NORM.get(_norm(stripped), stripped)
