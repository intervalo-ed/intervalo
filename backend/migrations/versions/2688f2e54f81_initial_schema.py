"""Initial schema

Revision ID: 2688f2e54f81
Revises: 
Create Date: 2026-04-02 22:40:37.885115

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2688f2e54f81'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('google_id', sa.String(200), nullable=True),
        sa.Column('email', sa.String(200), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('google_id'),
        sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'])
    op.create_index(op.f('ix_users_email'), 'users', ['email'])

    # Create courses table
    op.create_table(
        'courses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('slug', sa.String(50), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug')
    )
    op.create_index(op.f('ix_courses_slug'), 'courses', ['slug'])

    # Create enrollments table
    op.create_table(
        'enrollments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('university', sa.String(100), nullable=True),
        sa.Column('career', sa.String(200), nullable=True),
        sa.Column('enrolled_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'course_id', name='unique_user_course')
    )

    # Create item_states table
    op.create_table(
        'item_states',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('belt', sa.String(20), nullable=False),
        sa.Column('topic', sa.String(50), nullable=False),
        sa.Column('skill', sa.String(10), nullable=False),
        sa.Column('phase', sa.String(20), nullable=False),
        sa.Column('step_index', sa.Integer(), nullable=True),
        sa.Column('ease_factor', sa.Float(), nullable=True),
        sa.Column('interval_days', sa.Integer(), nullable=True),
        sa.Column('repetitions', sa.Integer(), nullable=True),
        sa.Column('next_due', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_reviewed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'course_id', 'belt', 'topic', 'skill', name='unique_user_course_item')
    )
    op.create_index('idx_item_states_next_due', 'item_states', ['next_due'])
    op.create_index('idx_item_states_user_course', 'item_states', ['user_id', 'course_id'])

    # Create sessions table
    op.create_table(
        'sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('finished_at', sa.DateTime(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('abandoned', sa.Boolean(), nullable=True),
        sa.Column('exercises_total', sa.Integer(), nullable=False),
        sa.Column('exercises_correct', sa.Integer(), nullable=True),
        sa.Column('xp_earned', sa.Integer(), nullable=True),
        sa.Column('belt_on_start', sa.String(20), nullable=True),
        sa.Column('belt_on_finish', sa.String(20), nullable=True),
        sa.Column('belt_promoted', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_sessions_user_course', 'sessions', ['user_id', 'course_id'])
    op.create_index('idx_sessions_started_at', 'sessions', ['started_at'])
    op.create_index('idx_sessions_finished_at', 'sessions', ['finished_at'])

    # Create answers table
    op.create_table(
        'answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('exercise_id', sa.String(20), nullable=True),
        sa.Column('belt', sa.String(20), nullable=False),
        sa.Column('topic', sa.String(50), nullable=False),
        sa.Column('skill', sa.String(10), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('quality_score', sa.Integer(), nullable=True),
        sa.Column('xp_earned', sa.Integer(), nullable=True),
        sa.Column('answered_at', sa.DateTime(), nullable=True),
        sa.Column('intra_session_position', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_answers_session_id', 'answers', ['session_id'])
    op.create_index('idx_answers_user_course', 'answers', ['user_id', 'course_id'])
    op.create_index('idx_answers_answered_at', 'answers', ['answered_at'])
    op.create_index('idx_answers_belt_topic_skill', 'answers', ['belt', 'topic', 'skill'])

    # Create push_subscriptions table
    op.create_table(
        'push_subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=False),
        sa.Column('endpoint', sa.String(1000), nullable=False),
        sa.Column('p256dh', sa.String(1000), nullable=False),
        sa.Column('auth', sa.String(1000), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('last_used_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['course_id'], ['courses.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'endpoint', name='unique_user_endpoint')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('push_subscriptions')
    op.drop_table('answers')
    op.drop_table('sessions')
    op.drop_table('item_states')
    op.drop_table('enrollments')
    op.drop_table('courses')
    op.drop_table('users')
