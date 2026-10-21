from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from .config import settings

# Engine SQLAlchemy 2
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Generador de sesión SQLAlchemy estándar"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def set_tenant_context(db: Session, tenant_id: str) -> None:
    """
    Configura la variable de sesión en PostgreSQL para hacer cumplir Row-Level Security (RLS)
    al nivel de motor de base de datos.
    """
    db.execute(text("SET LOCAL app.current_tenant_id = :tenant_id"), {"tenant_id": tenant_id})
