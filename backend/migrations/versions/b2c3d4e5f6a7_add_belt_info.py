"""add belt_info table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-10
"""
from typing import Union, Sequence
import sqlalchemy as sa
from alembic import op

revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    belt_info_table = op.create_table(
        'belt_info',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('belt', sa.String(20), nullable=False),
        sa.Column('headline', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('course_id', 'belt', name='uq_belt_info_course_belt'),
    )
    op.create_index('ix_belt_info_id', 'belt_info', ['id'])

    # Datos de belt_info eliminados de la migración.
    # El seed lo hace seed_content.py (corre en startup vía main.py).
    _seed = [
        {
            "id": 1,
            "course_id": 1,
            "belt": "white",
            "headline": "Funciones",
            "description": (
                "Trabajás tu capacidad para reconocer, describir y manipular "
                "las distintas familias de funciones que se suelen ver en "
                "Análisis Matemático I."
            ),
        },
        {
            "id": 2,
            "course_id": 1,
            "belt": "blue",
            "headline": "Límites y Continuidad",
            "description": (
                "Explorás el comportamiento de funciones al acercarse a un punto. "
                "Aprendés a calcular límites con técnicas algebraicas e identificar "
                "continuidad e indeterminaciones."
            ),
        },
        {
            "id": 3,
            "course_id": 1,
            "belt": "violet",
            "headline": "Derivadas",
            "description": (
                "Dominás las reglas de derivación y su interpretación geométrica. "
                "Usás derivadas para analizar funciones y resolver problemas de "
                "optimización."
            ),
        },
        {
            "id": 4,
            "course_id": 1,
            "belt": "brown",
            "headline": "Integrales",
            "description": (
                "Aprendés a calcular integrales indefinidas y definidas usando "
                "sustitución e integración por partes, conectando con el "
                "Teorema Fundamental del Cálculo."
            ),
        },
        {
            "id": 5,
            "course_id": 1,
            "belt": "black",
            "headline": "Análisis completo",
            "description": (
                "Integrás todo lo aprendido para analizar funciones en profundidad, "
                "resolver problemas de optimización y área, y aplicar el "
                "Teorema Fundamental del Cálculo."
            ),
        },
    ]
    # op.bulk_insert(belt_info_table, _seed)  # datos manejados por seed_content.py


def downgrade() -> None:
    op.drop_index('ix_belt_info_id', table_name='belt_info')
    op.drop_table('belt_info')
