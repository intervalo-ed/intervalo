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
    username = Column(String(30), unique=True, index=True, nullable=True)
    total_xp = Column(Integer, nullable=False, default=0)

    # Daily push-notification preferences. `notify_time` is "HH:MM" (15-min
    # steps) interpreted in `notify_timezone` (IANA). `notify_last_sent_on` is
    # the per-user idempotency guard (one send per local day).
    notify_enabled = Column(Boolean, nullable=False, default=False, server_default="false")
    notify_time = Column(String(5), nullable=True)
    notify_timezone = Column(String(64), nullable=True)
    notify_last_sent_on = Column(Date, nullable=True)

    # Rotación de copy: última categoría/variante enviada, para no repetirla en
    # el próximo envío (ver notification_copy.py). Se setea junto con
    # notify_last_sent_on en la misma transacción de claim (due_notifications).
    notify_last_category = Column(String(32), nullable=True)
    notify_last_variant_key = Column(String(64), nullable=True)

    # Detección de "te pasaron en el ranking": rank global (por total_xp) tal
    # como estaba la última vez que se chequeó a este usuario en
    # due_notifications — no un valor live. Solo se refresca para candidatos
    # efectivamente due, nunca en un full scan.
    notify_last_rank = Column(Integer, nullable=True)

    # IANA timezone del usuario (p.ej. "America/Argentina/Buenos_Aires"); define el
    # "día" de la repetición espaciada. Se autocompleta desde el navegador en cada
    # carga del home. NULL → fallback a Argentina (ver session_store.user_today).
    timezone = Column(String(64), nullable=True)

    # Racha global de días de actividad: días distintos (no necesariamente
    # consecutivos) con al menos una sesión completada. Define el multiplicador
    # de XP del modo Repaso. 30 días seguidos sin actividad resetean a 0.
    streak_days = Column(Integer, nullable=False, default=0, server_default="0")
    streak_last_date = Column(Date, nullable=True)

    # Desbloqueo de emojis (badges) por carrera. `emoji_worn` es el id del nodo
    # que el usuario muestra en el ranking; NULL = raíz del bucket (default).
    # Ver emoji_tree.py.
    #
    # `emoji_path` está MUERTA: describía una cadena append-only de nodos
    # desbloqueados, pero el desbloqueo no tiene estado propio — se deriva de
    # total_xp vía unlocked_depth() (ver la cabecera de emoji_tree.py). No la lee
    # ni la escribe nadie; queda la columna porque sacarla necesita migración.
    emoji_path = Column(Text, nullable=True)
    emoji_worn = Column(String(64), nullable=True)

    # Emails automáticos de retención (bounce + win-back). `email_unsubscribed`
    # es un opt-out global; los `*_sent_at` son la idempotencia de cada tipo de
    # mail (ver lifecycle_emails.py).
    email_unsubscribed = Column(Boolean, nullable=False, default=False, server_default="false")
    bounce_email_sent_at = Column(DateTime, nullable=True)
    winback_email_sent_at = Column(DateTime, nullable=True)
    # Último hito de multiplicador ya felicitado por email (3/9/18/30/45 días).
    # Se compara contra el tier derivado de streak_days: mayor ⇒ hay mail
    # pendiente. Se limpia al resetear la racha, así quien la pierde y vuelve a
    # llegar recibe la felicitación de nuevo. `sent_at` es observabilidad.
    streak_email_sent_tier = Column(Integer, nullable=True)
    streak_email_sent_at = Column(DateTime, nullable=True)

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
    motivation = Column(String(50), nullable=True)
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "course_id", name="unique_user_course"),)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class CourseProgress(Base):
    """Configuración y estado de progreso del usuario para un curso: cuántos
    ítems puede tener en aprendizaje a la vez (`active_cap`) y en qué iteración
    de progreso está (se incrementa al reiniciar el curso). Fila creada de forma
    lazy la primera vez que se necesita (default cap = ACTIVE_CAP_DEFAULT)."""
    __tablename__ = "course_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    iteration = Column(Integer, nullable=False, default=1, server_default="1")
    active_cap = Column(Integer, nullable=False, default=18, server_default="18")
    # Máximo de ejercicios por sesión de repaso (config del editor).
    session_size = Column(Integer, nullable=False, default=5, server_default="5")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="unique_user_course_progress"),
    )


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
    # Unit creada como "catch-up": un exercise_type/tema que quedó detrás del
    # frontier ya desbloqueado (p.ej. al agregar un ítem nuevo al catálogo). Se
    # excluye del cálculo de maestría/cinturón para no despromocionar un tema ya
    # dominado; se aprende como repaso extra.
    is_catchup = Column(Boolean, nullable=False, default=False, server_default="false")
    # Tema suspendido por el usuario desde el editor: se oculta del home y se
    # excluye de sesiones y del cálculo de maestría/cinturón. Reversible (Adelantar).
    suspended = Column(Boolean, nullable=False, default=False, server_default="false")

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


class UnitStateArchive(Base):
    """Snapshot de las UnitState al reiniciar un curso. Preserva el progreso de
    iteraciones anteriores (no se pierde el dato) mientras `unit_states` queda
    solo con la iteración vigente, así las queries activas y el cálculo de
    cinturón no necesitan filtrar por iteración."""
    __tablename__ = "unit_state_archive"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    iteration = Column(Integer, nullable=False, default=1)

    belt = Column(String(20), nullable=False)
    topic = Column(String(50), nullable=False)
    exercise_type = Column(String(20), nullable=False)

    phase = Column(String(20), nullable=False)
    step_index = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=1)
    repetitions = Column(Integer, default=0)
    next_due = Column(Date, nullable=True)
    attempted = Column(Boolean, default=False)
    is_catchup = Column(Boolean, nullable=False, default=False)
    suspended = Column(Boolean, nullable=False, default=False)

    archived_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_unit_state_archive_user_course", "user_id", "course_id"),
    )


class ItemExerciseCycle(Base):
    """Ejercicios ya servidos en el ciclo actual de un ítem (belt+topic+
    exercise_type) para un usuario. Garantiza que no se repita un ejercicio
    hasta haber completado todos los del ítem: se resetea (vacía) cuando el
    ciclo se agota, o cuando el usuario reinicia el curso (ver reset_course)."""
    __tablename__ = "item_exercise_cycles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    belt = Column(String(20), nullable=False)
    topic = Column(String(50), nullable=False)
    exercise_type = Column(String(20), nullable=False)

    # JSON-encoded list de Exercise.external_id ya servidos en el ciclo vigente.
    served_external_ids = Column(Text, nullable=False, default="[]", server_default="[]")

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint(
            "user_id", "course_id", "belt", "topic", "exercise_type",
            name="unique_user_course_item_cycle",
        ),
        Index("idx_item_exercise_cycles_user_course", "user_id", "course_id"),
    )


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

    # Iteración de progreso del curso al momento de la sesión (ver CourseProgress).
    # Reiniciar el curso incrementa la iteración; el histórico queda etiquetado.
    iteration = Column(Integer, nullable=False, default=1, server_default="1")

    # "main" for the daily spaced-repetition session, "practice" for free practice.
    # "main" sessions are gated to one per day, except the user can keep starting
    # new ones while pending (due) items remain — see create_session_db.
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
    # Identificador estable del ejercicio real que vio el usuario (p. ej.
    # "white_definition_clsf_01"). exercise_id es solo el slot posicional de la
    # sesión ("ex_000"); este campo permite saber con certeza qué ejercicio se
    # sirvió, y es lo que alimenta el ciclo de no-repetición por ítem
    # (ver ItemExerciseCycle). Lo reporta el cliente al responder.
    exercise_external_id = Column(String(100), nullable=True)
    belt = Column(String(20), nullable=False)
    topic = Column(String(50), nullable=False)
    exercise_type = Column(String(20), nullable=False)

    is_correct = Column(Boolean, nullable=False)
    response_time_ms = Column(Integer, nullable=True)
    quality_score = Column(Integer, nullable=True)
    xp_earned = Column(Integer, default=0)
    # XP de esta respuesta antes del multiplicador de racha diaria (por intento
    # y dificultad personal del ítem). xp_earned - xp_base = XP extra ganado
    # gracias al multiplicador, mostrado en el resumen de sesión.
    xp_base = Column(Integer, nullable=False, default=0, server_default="0")

    # Iteración de progreso del curso (ver CourseProgress). Reiniciar el curso
    # incrementa la iteración; las respuestas viejas quedan etiquetadas.
    iteration = Column(Integer, nullable=False, default=1, server_default="1")

    answered_at = Column(DateTime, default=datetime.utcnow)
    intra_session_position = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_answers_session_id", "session_id"),
        Index("idx_answers_user_course", "user_id", "course_id"),
        Index("idx_answers_answered_at", "answered_at"),
        Index("idx_answers_belt_topic", "belt", "topic"),
        Index("idx_answers_exercise_external_id", "exercise_external_id"),
        # Un slot de sesión se responde una sola vez. La clave es el slot
        # (ex_000) y NO exercise_external_id: una sesión más larga que el pool de
        # la unidad repite externals legítimamente en slots distintos. Los NULL
        # (Answer sintético del onboarding) quedan exentos. El guard "amable"
        # vive en record_answer_db; esto es la red de contención en el esquema.
        Index("uq_answers_session_slot", "session_id", "exercise_id", unique=True),
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
    graph_shade = Column(String(100), nullable=True)
    # true desactiva el aspecto 1:1 forzado de Mafs (solo probabilidad, ver
    # authoring-context.md sección Gráficos); ausente/false = comportamiento
    # actual sin cambios.
    graph_free_aspect = Column(Boolean, nullable=True)
    # Tabla de datos embebida en el enunciado, serializada como JSON (columnas,
    # filas y la columna que pinta cada opción). Ver authoring-context.md,
    # sección Tablas. Se llama table_data y no table para no confundirse con el
    # __table__ de SQLAlchemy; en el JSON de autoría y en la API es "table".
    table_data = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    # Estado editorial del contenido (viene del JSON de autoría, ver
    # seed_content.py). Usado por feedback_survey.py para priorizar ítems no
    # revisados a la hora de elegir qué ejercicio lleva la micro-encuesta.
    reviewed = Column(Boolean, nullable=True)
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


class Feedback(Base):
    """User-submitted feedback (error report, idea, or comment) from settings."""
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    categoria = Column(String(20), nullable=False)  # error | idea | comentario
    mensaje = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class ExerciseFeedback(Base):
    """Micro-encuesta post-ejercicio (dificultad/explicación) y reporte de
    problemas de contenido. `exercise_external_id` es la clave real del
    ejercicio (Exercise.external_id), no el slot de sesión (Answer.exercise_id),
    para poder agregar respuestas del mismo ítem entre sesiones/usuarios.
    `answered_at` NULL = impression mostrada pero no respondida (skip),
    necesario para el kill-switch de feedback_survey.py."""
    __tablename__ = "exercise_feedback"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    exercise_external_id = Column(String(100), nullable=False)

    question_type = Column(String(1), nullable=False)  # "A" | "B" | "C"
    value = Column(String(30), nullable=True)  # muy_facil|justo|muy_dificil / util|no_util / categoría de reporte
    free_text = Column(Text, nullable=True)

    shown_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    answered_at = Column(DateTime, nullable=True)

    # Mail de agradecimiento por reportar (question_type="C"), ver
    # lifecycle_emails.due_report_thanks_emails. NULL = todavía no se mandó.
    thanks_sent_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_exfb_user_course", "user_id", "course_id"),
        Index("idx_exfb_session", "session_id"),
        Index("idx_exfb_user_item", "user_id", "exercise_external_id"),
    )

    user = relationship("User")
    session = relationship("Session")
    course = relationship("Course")


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


class NotificationSend(Base):
    """Historial de notificaciones push enviadas: una fila por usuario por
    envío (no por dispositivo), con la categoría/variante de copy elegida
    (ver notification_copy.py) y si se llegó a clickear. A diferencia de
    User.notify_last_* (que solo guardan el último estado, para el guard de
    idempotencia diario), esta tabla es append-only y permite analizar
    efectividad por categoría/variante a lo largo del tiempo."""
    __tablename__ = "notification_sends"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    category = Column(String(30), nullable=False)
    variant_key = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    body = Column(String(500), nullable=False)

    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    # Resultado que devolvió el push service (FCM/APNs), reportado por el
    # notifier después de intentar el envío. La fila se crea al elegir el copy,
    # o sea antes de intentar mandar, así que sin esto un envío que nunca salió
    # queda idéntico a uno exitoso y no se puede distinguir "la ignoraron" de
    # "nunca llegó". "ok" | "error_<status>" | "error" (fallo sin status).
    # NULL = todavía sin reportar (o envío anterior a esta columna).
    delivery_status = Column(String(20), nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    # Se completa desde notificationclick en el service worker (ver sw.js);
    # None mientras no se haya clickeado. Idempotente: el primer click gana.
    opened_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_notification_sends_user_id", "user_id"),
        Index("idx_notification_sends_sent_at", "sent_at"),
    )
