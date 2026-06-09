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
    """User model — identity is owned by Clerk; `clerk_user_id` is the link."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String(200), unique=True, index=True, nullable=True)
    email = Column(String(200), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    display_name = Column(String(200), nullable=True)
    total_xp = Column(Integer, nullable=False, default=0)

    # Daily push-notification preferences. `notify_time` is "HH:MM" (15-min
    # steps) interpreted in `notify_timezone` (IANA). `notify_last_sent_on` is
    # the per-user idempotency guard (one send per local day).
    notify_enabled = Column(Boolean, nullable=False, default=False, server_default="false")
    notify_time = Column(String(5), nullable=True)
    notify_timezone = Column(String(64), nullable=True)
    notify_last_sent_on = Column(Date, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    enrollments = relationship("Enrollment", back_populates="user")
    unit_states = relationship("UnitState", back_populates="user")
    sessions = relationship("Session", back_populates="user")
    answers = relationship("Answer", back_populates="user")
    push_subscriptions = relationship("PushSubscription", back_populates="user")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    enrollments = relationship("Enrollment", back_populates="course")
    unit_states = relationship("UnitState", back_populates="course")
    sessions = relationship("Session", back_populates="course")
    answers = relationship("Answer", back_populates="course")
    push_subscriptions = relationship("PushSubscription", back_populates="course")
    exercises = relationship("Exercise", back_populates="course")
    belt_infos = relationship("BeltInfo", back_populates="course")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    university = Column(String(100), nullable=True)
    career = Column(String(200), nullable=True)
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "course_id", name="unique_user_course"),)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class UnitState(Base):
    """SM-2 state for each (belt, topic, exercise_type) unit per user per course."""
    __tablename__ = "unit_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    belt = Column(String(20), nullable=False)
    topic = Column(String(50), nullable=False)
    exercise_type = Column(String(20), nullable=False)

    phase = Column(String(20), nullable=False, default="learning")
    step_index = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=1)
    repetitions = Column(Integer, default=0)
    next_due = Column(Date, nullable=True)
    attempted = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_reviewed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "user_id", "course_id", "belt", "topic", "exercise_type",
            name="unique_user_course_unit",
        ),
        Index("idx_unit_states_next_due", "next_due"),
        Index("idx_unit_states_user_course", "user_id", "course_id"),
    )

    user = relationship("User", back_populates="unit_states")
    course = relationship("Course", back_populates="unit_states")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    abandoned = Column(Boolean, default=False)

    exercises_total = Column(Integer, nullable=False)
    exercises_correct = Column(Integer, default=0)
    xp_earned = Column(Integer, default=0)

    # "main" for the daily spaced-repetition session, "zen" for free practice.
    # Only "main" sessions count toward the 1-per-day gate.
    mode = Column(String(16), nullable=False, default="main", server_default="main")

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_sessions_user_course", "user_id", "course_id"),
        Index("idx_sessions_started_at", "started_at"),
        Index("idx_sessions_finished_at", "finished_at"),
    )

    user = relationship("User", back_populates="sessions")
    course = relationship("Course", back_populates="sessions")
    answers = relationship("Answer", back_populates="session")


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    exercise_id = Column(String(20), nullable=True)
    belt = Column(String(20), nullable=False)
    topic = Column(String(50), nullable=False)
    exercise_type = Column(String(20), nullable=False)

    is_correct = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer, nullable=True)
    quality_score = Column(Integer, nullable=True)
    xp_earned = Column(Integer, default=0)

    answered_at = Column(DateTime, default=datetime.utcnow)
    intra_session_position = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_answers_session_id", "session_id"),
        Index("idx_answers_user_course", "user_id", "course_id"),
        Index("idx_answers_answered_at", "answered_at"),
        Index("idx_answers_belt_topic", "belt", "topic"),
    )

    session = relationship("Session", back_populates="answers")
    user = relationship("User", back_populates="answers")
    course = relationship("Course", back_populates="answers")


class Exercise(Base):
    """Question bank scoped by course, belt, topic."""
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    external_id = Column(String(100), nullable=True)
    belt = Column(String(20), nullable=False)
    topic = Column(String(50), nullable=False)
    exercise_type = Column(String(20), nullable=False)
    question = Column(Text, nullable=False)
    option_a = Column(Text, nullable=False)
    option_b = Column(Text, nullable=False)
    option_c = Column(Text, nullable=False)
    option_d = Column(Text, nullable=False)
    correct_index = Column(Integer, nullable=False)
    has_math = Column(Boolean, default=False)
    feedback_correct = Column(Text, nullable=False)
    feedback_incorrect = Column(Text, nullable=False)
    graph_fn = Column(String(500), nullable=True)
    graph_view = Column(String(100), nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_exercises_lookup", "course_id", "belt", "topic"),
        UniqueConstraint("course_id", "external_id", name="uq_exercises_course_external_id"),
        Index("idx_exercises_external_id", "course_id", "external_id"),
    )

    course = relationship("Course", back_populates="exercises")


class BeltInfo(Base):
    __tablename__ = "belt_info"

    id          = Column(Integer, primary_key=True, index=True)
    course_id   = Column(Integer, ForeignKey("courses.id"), nullable=False)
    belt        = Column(String(20), nullable=False)
    headline    = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint("course_id", "belt", name="uq_belt_info_course_belt"),
    )

    course = relationship("Course", back_populates="belt_infos")


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    endpoint = Column(String(1000), nullable=False)
    p256dh = Column(String(1000), nullable=False)
    auth = Column(String(1000), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "endpoint", name="unique_user_endpoint"),
    )

    user = relationship("User", back_populates="push_subscriptions")
    course = relationship("Course", back_populates="push_subscriptions")
