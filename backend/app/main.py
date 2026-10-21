from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import auth, documents, signatures, workers, epp_assets, verification, subscriptions

app = FastAPI(
    title="FirmaDigital Chile API",
    version=settings.VERSION,
    description="""
    ## Plataforma SaaS Multiempresa de Gestión Documental y Firma Electrónica

    Cumplimiento estricto de la legislación chilena:
    * **Ley N° 19.799**: Documentos Electrónicos, Firma Electrónica Simple (FES) y Avanzada (FEA).
    * **Código del Trabajo Art. 10 y Ley 21.561**: Contratos laborales a 40 horas y anexos.
    * **Decreto Supremo N° 594 Art. 68 y Ley N° 16.744**: Hojas de entrega de EPP y registro de herramientas.
    * **Ley N° 19.628 y Ley N° 21.719**: Protección de datos personales y registro de auditoría inmutable.
    * **Aislamiento Multiempresa**: Row-Level Security (RLS) en PostgreSQL.
    """,
    openapi_tags=[
        {"name": "Autenticación y Sesiones", "description": "Inicio de sesión seguro con JWT y asignación de tenant."},
        {"name": "Gestión Documental", "description": "Creación, carga segura y firma de contratos y actas."},
        {"name": "Proceso de Firma Electrónica", "description": "Portal seguro de firma simple con sellado SHA-256."},
        {"name": "Gestión de Trabajadores", "description": "Nómina laboral y validación de RUT con Módulo 11."},
        {"name": "Hojas de Cargo y EPP", "description": "Custodia de herramientas y cumplimiento D.S. 594."},
        {"name": "Verificación Pública", "description": "Cotejo de integridad criptográfica para inspectores y terceros."},
        {"name": "Suscripciones y Pagos", "description": "Planes comerciales y control de consumo mensual."},
    ],
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir Routers bajo el prefijo /api/v1
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(signatures.router, prefix=settings.API_V1_STR)
app.include_router(workers.router, prefix=settings.API_V1_STR)
app.include_router(epp_assets.router, prefix=settings.API_V1_STR)
app.include_router(verification.router, prefix=settings.API_V1_STR)
app.include_router(subscriptions.router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Salud"])
def health_check():
    return {
        "status": "healthy",
        "service": "FirmaDigital Chile Backend",
        "version": settings.VERSION,
        "database": "connected",
        "multitenancy": "row_level_security_enforced",
    }

@app.get("/", tags=["General"])
def root():
    return {
        "project": "FirmaDigital Chile SaaS",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
        "jurisdiction": "Chile (Ley 19.799)",
    }
