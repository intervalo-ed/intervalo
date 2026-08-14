"""Canonicalizar enrollments.university

El step de universidad del onboarding guardaba el campo "Otra" tal cual lo
escribía la persona. Quien tipeaba "Uba" en vez de tocar la sugerencia "UBA"
quedaba con un valor que no matchea ninguna tag conocida: en el leaderboard le
salía el chip gris de universidad desconocida en vez de la tag azul, y encima
contaba como una universidad aparte en el ranking por universidad
(`/public/university-leaderboard` agrupa por el string crudo).

El formulario ya no lo deja pasar (`canonicalUniversity` en
web/src/lib/university-tags.ts), pero las filas viejas siguen mal. Esta
migración las reescribe: cualquier valor cuya forma normalizada (minúsculas,
sin tildes, sin espacios al borde) coincida con la sigla o el nombre completo
de una tag conocida pasa a la sigla canónica. Lo que no matchea queda intacto —
son universidades reales sin tag propia.

La tabla va congelada acá a propósito: es la foto de las tags al 2026-08-14. Si
mañana se agrega una universidad al listado del front, esta migración tiene que
seguir haciendo exactamente lo mismo que hizo el día que corrió.

Revision ID: 20260814_0030
Revises: 20260813_0029
Create Date: 2026-08-14
"""
import unicodedata
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260814_0030"
down_revision: Union[str, Sequence[str], None] = "20260813_0029"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# (sigla, nombre completo) — espejo de UNIVERSITY_TAGS al 2026-08-14.
TAGS: list[tuple[str, str]] = [
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
    decomposed = unicodedata.normalize("NFD", value.lower())
    return "".join(c for c in decomposed if unicodedata.category(c) != "Mn").strip()


def _canonical() -> dict[str, str]:
    """normalizado -> sigla. La sigla gana sobre el nombre completo si dos
    entradas colisionan, porque se inserta primero."""
    mapping: dict[str, str] = {}
    for key, full_name in TAGS:
        mapping.setdefault(_norm(key), key)
        mapping.setdefault(_norm(full_name), key)
    return mapping


def upgrade() -> None:
    conn = op.get_bind()
    canonical = _canonical()
    rows = conn.execute(
        sa.text(
            "SELECT DISTINCT university FROM enrollments "
            "WHERE university IS NOT NULL AND university <> ''"
        )
    ).fetchall()

    for (stored,) in rows:
        key = canonical.get(_norm(stored))
        if key is None or key == stored:
            continue
        conn.execute(
            sa.text(
                "UPDATE enrollments SET university = :key WHERE university = :stored"
            ).bindparams(key=key, stored=stored)
        )


def downgrade() -> None:
    # Irreversible: el valor original que había escrito cada persona no se
    # guarda en ningún lado, así que no hay a qué volver.
    pass
