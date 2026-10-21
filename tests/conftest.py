import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models import Tenant, User, Membership, RoleEnum, Document, DocumentStatusEnum, DocumentCategoryEnum
from backend.app.security import get_password_hash, create_access_token

# Base de datos SQLite en memoria para tests rápidos o PostgreSQL
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def seed_two_tenants(db):
    """Crea dos empresas independientes con sus respectivos usuarios administradores."""
    # Tenant 1: Andina
    t1 = Tenant(
        id="tenant-andina",
        rut="76.842.190-K",
        razon_social="Constructora Andina SpA",
        nombre_fantasia="Andina",
        giro="Construcción",
        direccion="Av. Andrés Bello 2457",
        comuna="Providencia",
        region="RM",
        telefono="+56 2 2984 5500",
        email_contacto="andina@empresa.cl",
        limite_documentos_mes=250,
        documentos_consumidos_mes=5,
    )
    db.add(t1)

    # Tenant 2: Minera
    t2 = Tenant(
        id="tenant-minera",
        rut="77.102.340-5",
        razon_social="Servicios Mineros del Norte S.A.",
        nombre_fantasia="Minera del Norte",
        giro="Minería",
        direccion="Av. Balmaceda 1020",
        comuna="Antofagasta",
        region="Antofagasta",
        telefono="+56 55 241 8900",
        email_contacto="minera@empresa.cl",
        limite_documentos_mes=1500,
        documentos_consumidos_mes=10,
    )
    db.add(t2)

    # Usuarios
    u1 = User(
        id="user-andina",
        email="admin@andina.cl",
        password_hash=get_password_hash("password123"),
        nombre_completo="Admin Andina",
        rut="10.920.311-5",
    )
    u2 = User(
        id="user-minera",
        email="admin@minera.cl",
        password_hash=get_password_hash("password123"),
        nombre_completo="Admin Minera",
        rut="11.834.902-1",
    )
    db.add(u1)
    db.add(u2)

    # Membresías
    m1 = Membership(
        id="mem-1",
        tenant_id="tenant-andina",
        user_id="user-andina",
        role=RoleEnum.ADMIN_EMPRESA,
        cargo="Administrador",
    )
    m2 = Membership(
        id="mem-2",
        tenant_id="tenant-minera",
        user_id="user-minera",
        role=RoleEnum.ADMIN_EMPRESA,
        cargo="Administrador",
    )
    db.add(m1)
    db.add(m2)

    # Documento confidencial perteneciente a Minera
    doc_minera = Document(
        id="doc-confidencial-minera",
        tenant_id="tenant-minera",
        titulo="Acuerdo Confidencial Turnos Minería Subterránea",
        categoria=DocumentCategoryEnum.CONTRATO,
        hash_sha256="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        nombre_archivo="acuerdo.pdf",
        creado_por_user_id="user-minera",
        creado_por_nombre="Admin Minera",
        fecha_vencimiento=datetime.utcnow() + timedelta(days=10),
    )
    db.add(doc_minera)

    db.commit()

    # Tokens JWT
    token_andina = create_access_token({"sub": "user-andina", "tenant_id": "tenant-andina", "role": "admin_empresa"})
    token_minera = create_access_token({"sub": "user-minera", "tenant_id": "tenant-minera", "role": "admin_empresa"})

    return {
        "tenant_andina": t1,
        "tenant_minera": t2,
        "token_andina": token_andina,
        "token_minera": token_minera,
        "doc_minera_id": "doc-confidencial-minera"
    }
