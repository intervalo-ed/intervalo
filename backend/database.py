import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

# Database URL from environment or use SQLite for development.
# Railway exposes the Postgres URL with the legacy `postgres://` scheme that
# SQLAlchemy no longer recognizes; normalize it to `postgresql://`.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./intervalo.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure engine based on database type
if DATABASE_URL.startswith("sqlite"):
    # SQLite en dev: NullPool → una conexión por request. StaticPool comparte
    # UNA sola conexión entre threads, y como FastAPI corre endpoints en
    # threadpool, requests paralelos (p.ej. el prefetch dual analisis+probabilidad
    # del dashboard) pisan cursor state y devuelven filas corruptas
    # (`IndexError: tuple index out of range`).
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
    )
else:
    # PostgreSQL configuration for production
    engine = create_engine(DATABASE_URL, echo=False)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency for FastAPI to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)


def drop_db():
    """Drop all tables from the database (development only)."""
    Base.metadata.drop_all(bind=engine)
