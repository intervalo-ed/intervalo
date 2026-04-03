from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    """User model with Google OAuth support."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String(200), unique=True, index=True, nullable=True)
    email = Column(String(200), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    enrollments = relationship("Enrollment", back_populates="user")
    item_states = relationship("ItemState", back_populates="user")
    sessions = relationship("Session", back_populates="user")
    answers = relationship("Answer", back_populates="user")
    push_subscriptions = relationship("PushSubscription", back_populates="user")


class Course(Base):
    """Course model - catalog of available courses."""
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    enrollments = relationship("Enrollment", back_populates="course")
    item_states = relationship("ItemState", back_populates="course")
    sessions = relationship("Session", back_populates="course")
    answers = relationship("Answer", back_populates="course")
    push_subscriptions = relationship("PushSubscription", back_populates="course")


class Enrollment(Base):
    """Enrollment model - user → course + onboarding data."""
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    university = Column(String(100), nullable=True)
    career = Column(String(200), nullable=True)
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    # Unique constraint: one enrollment per user per course
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="unique_user_course"),)

    # Relationships
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class ItemState(Base):
    """ItemState model - SM-2 state for each item per user per course."""
    __tablename__ = "item_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    # Item identity (composite key pattern)
    belt = Column(String(20), nullable=False)
    topic = Column(String(50), nullable=False)
    skill = Column(String(10), nullable=False)

    # SM-2 state
    phase = Column(String(20), nullable=False, default="learning")
    step_index = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=1)
    repetitions = Column(Integer, default=0)
    next_due = Column(Date, nullable=True)

    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_reviewed_at = Column(DateTime, nullable=True)

    # Unique constraint on composite key
    __table_args__ = (
        UniqueConstraint(
            "user_id", "course_id", "belt", "topic", "skill",
            name="unique_user_course_item"
        ),
        Index("idx_item_states_next_due", "next_due"),
        Index("idx_item_states_user_course", "user_id", "course_id"),
    )

    # Relationships
    user = relationship("User", back_populates="item_states")
    course = relationship("Course", back_populates="item_states")


class Session(Base):
    """Session model - represents a review/practice session."""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    # Timeline
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    abandoned = Column(Boolean, default=False)

    # Results
    exercises_total = Column(Integer, nullable=False)
    exercises_correct = Column(Integer, default=0)
    xp_earned = Column(Integer, default=0)

    # Belt progress
    belt_on_start = Column(String(20), nullable=True)
    belt_on_finish = Column(String(20), nullable=True)
    belt_promoted = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_sessions_user_course", "user_id", "course_id"),
        Index("idx_sessions_started_at", "started_at"),
        Index("idx_sessions_finished_at", "finished_at"),
    )

    # Relationships
    user = relationship("User", back_populates="sessions")
    course = relationship("Course", back_populates="sessions")
    answers = relationship("Answer", back_populates="session")


class Answer(Base):
    """Answer model - individual exercise answer in a session."""
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    # Exercise identification
    exercise_id = Column(String(20), nullable=True)
    belt = Column(String(20), nullable=False)
    topic = Column(String(50), nullable=False)
    skill = Column(String(10), nullable=False)

    # Response data
    is_correct = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer, nullable=True)
    quality_score = Column(Integer, nullable=True)
    xp_earned = Column(Integer, default=0)

    # Timing
    answered_at = Column(DateTime, default=datetime.utcnow)
    intra_session_position = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_answers_session_id", "session_id"),
        Index("idx_answers_user_course", "user_id", "course_id"),
        Index("idx_answers_answered_at", "answered_at"),
        Index("idx_answers_belt_topic_skill", "belt", "topic", "skill"),
    )

    # Relationships
    session = relationship("Session", back_populates="answers")
    user = relationship("User", back_populates="answers")
    course = relationship("Course", back_populates="answers")


class PushSubscription(Base):
    """PushSubscription model - Web Push notification subscriptions."""
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    # Push subscription data (Web Push API)
    endpoint = Column(String(1000), nullable=False)
    p256dh = Column(String(1000), nullable=False)
    auth = Column(String(1000), nullable=False)

    # Tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "endpoint", name="unique_user_endpoint"),
    )

    # Relationships
    user = relationship("User", back_populates="push_subscriptions")
    course = relationship("Course", back_populates="push_subscriptions")
