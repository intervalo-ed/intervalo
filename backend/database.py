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

# Y el driver EXPLÍCITO, que no es cosmético: `postgresql://` a secas deja que
# SQLAlchemy elija el DBAPI, y cuál elige depende de su versión. El 24/09 salió
# SQLAlchemy 2.1, que cambió ese default de psycopg2 a psycopg (v3), y como el
# instalado es `psycopg2-binary` el backend murió acá mismo, en `create_engine`,
# con `ModuleNotFoundError: No module named 'psycopg'`. Producción estuvo caída
# sin un solo log de aplicación: ni llegó a correr las migraciones.
#
# El pin de requirements.txt evita ESE salto; esto evita la clase entera, porque
# con el driver en la URL la elección ya no depende de lo que resuelva pip.
#
# Se aplica sobre `postgresql://` y no sobre `postgres://` para que valga también
# cuando la variable ya venga con el esquema moderno, y deja en paz a una URL que
# traiga su propio driver: el día que se migre a psycopg 3, `postgresql+psycopg://`
# pasa por acá sin que nadie lo pise.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://", "postgresql+psycopg2://", 1)

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
