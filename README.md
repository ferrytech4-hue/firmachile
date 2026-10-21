# FirmaDigital Chile

Plataforma SaaS Multiempresa para la creación, administración, suscripción y verificación de documentos electrónicos, contratos laborales (40 horas Ley 21.561), hojas de cargo de herramientas y entrega de Elementos de Protección Personal (EPP según D.S. 594 y Ley 16.744) en la República de Chile.

---

## 🚀 Características Principales

1. **Aislamiento Multiempresa Estricto (Row-Level Security)**:
   - Partición hermética de datos en PostgreSQL 16 por `tenant_id`.
   - La identidad de la empresa se resuelve de forma inmutable desde el token JWT en el servidor.
   - Protección contra inyección de IDs o acceso cruzado entre organizaciones.

2. **Firma Electrónica Simple (Ley N° 19.799)**:
   - Portal web responsivo optimizado para smartphones Android, tablets y navegadores de escritorio.
   - Canvas táctil interactivo para captura de trazo manuscrito.
   - Declaración de consentimiento expreso (Art. 3° Ley 19.799).
   - Verificación de Cédula de Identidad con registro de N° de serie.
   - Cálculo instantáneo del hash SHA-256 criptográfico del documento original.
   - Generación de **Certificado de Evidencia de Firma Electrónica** en PDF descargable con sello de tiempo UTC y horario oficial de Santiago de Chile (CLT).

3. **Módulo Laboral de Hojas de Cargo y Entrega de EPP**:
   - Asignación de herramientas de pañol con código de inventario, marca y número de serie.
   - Cumplimiento estricto del Artículo 68 del D.S. N° 594 (Ministerio de Salud) y Ley N° 16.744.
   - Catálogo de EPP con normas chilenas (NCh 461, NCh 772/1, NCh 1301, NIOSH P100).
   - Generación de comprobantes imprimibles y firmados para fiscalizaciones de la Dirección del Trabajo (DT).

4. **Nómina y Validación de RUT Chileno**:
   - Algoritmo oficial Módulo 11 del Registro Civil y SII de Chile.
   - Formateo automático de RUT (ej: `16.482.903-7`).
   - Importación masiva desde planillas Excel / CSV con validación previa.

5. **Portal Público de Verificación Criptográfica**:
   - Consulta libre por código de verificación (ej: `FD-CL-9842-8711`) o UUID.
   - Carga de archivo PDF para cotejo directo de hash SHA-256 en el navegador.

6. **Modelo Comercial SaaS**:
   - Tres planes: **Inicial** ($24.990 CLP), **Empresa** ($69.990 CLP) y **Profesional** ($149.990 CLP).
   - Monitoreo en tiempo real de consumo de cuotas (documentos emitidos, almacenamiento S3 y usuarios).
   - Preparación para pasarelas de pago recurrentes en Chile (Transbank Webpay Plus y Fintoc).

---

## 📁 Estructura del Repositorio

```
firmadigital-chile/
├── backend/                  # API FastAPI (Python 3.11)
│   ├── alembic/              # Migraciones versionadas de base de datos
│   │   ├── versions/         # 001_initial_schema.py
│   │   └── env.py
│   ├── app/
│   │   ├── main.py           # Entrypoint FastAPI con documentación OpenAPI
│   │   ├── config.py         # Configuración y variables de entorno
│   │   ├── database.py       # Motor SQLAlchemy 2 y helpers RLS
│   │   ├── models.py         # Modelos declarativos relacionales
│   │   ├── schemas.py        # Validación Pydantic y RUT Módulo 11
│   │   ├── security.py       # Hashing bcrypt, JWT y resolución de tenant
│   │   ├── rut_validator.py  # Algoritmo chileno de validación de RUT
│   │   └── routers/          # Endpoints modulares
│   │       ├── auth.py
│   │       ├── documents.py
│   │       ├── signatures.py
│   │       ├── workers.py
│   │       ├── epp_assets.py
│   │       ├── verification.py
│   │       └── subscriptions.py
│   ├── Dockerfile
│   └── requirements.txt
├── src/                      # Frontend SPA / PWA (React + TypeScript)
│   ├── components/           # Vistas y componentes ERP modernos
│   ├── services/             # Almacenamiento local particionado con RLS
│   ├── utils/                # Generador de PDF (jsPDF), RUT y SHA-256
│   └── types.ts              # Modelos de dominio tipados
├── tests/                    # Pruebas automatizadas (Pytest)
│   ├── conftest.py           # Fixtures de dos empresas independientes
│   ├── test_isolation.py     # Pruebas de penetración y aislamiento multiempresa
│   ├── test_signatures.py    # Pruebas de flujo de firma y auditoría
│   └── test_rut.py           # Pruebas de cálculo de dígito verificador RUT
├── infra/                    # Infraestructura y despliegue
│   ├── docker-compose.yml    # PostgreSQL 16 + MinIO + FastAPI + Frontend
│   ├── Dockerfile.frontend
│   └── postgres/init.sql     # Row-Level Security y funciones de sesión
├── docs/                     # Documentación técnica y jurídica
│   ├── architecture.md       # Arquitectura multiempresa y RLS
│   ├── fe_avanzada.md        # Especificación de integración FEA
│   └── chile_legal_compliance.md # Marco legal chileno (Ley 19.799, DT, DS 594)
├── .github/workflows/ci.yml  # Automatización CI/CD con GitHub Actions
├── .env.example              # Variables de entorno modelo
└── README.md
```

---

## 🛠️ Instalación y Ejecución Local con Docker Compose

### Requisitos previos
- Docker Desktop 24+ y Docker Compose v2.
- Node.js 20+ (para desarrollo local de frontend si no se usa contenedor).
- Python 3.11+ (para desarrollo backend directo).

### Paso 1: Clonar y configurar variables de entorno
```bash
git clone https://github.com/tu-usuario/firmadigital-chile.git
cd firmadigital-chile
cp .env.example .env
```

### Paso 2: Levantar el entorno completo
```bash
docker compose -f infra/docker-compose.yml up -d --build
```

Esto iniciará:
- **Frontend SPA**: `http://localhost:3000`
- **Backend FastAPI**: `http://localhost:8000` (Docs Swagger en `http://localhost:8000/docs`)
- **PostgreSQL 16**: `localhost:5432` (Base de datos: `firmadigital_db`)
- **MinIO S3**: `http://localhost:9001` (Consola de almacenamiento de PDFs)

### Paso 3: Ejecutar migraciones de base de datos
```bash
docker compose -f infra/docker-compose.yml exec backend alembic upgrade head
```

---

## 🧪 Ejecución de Pruebas Automatizadas

Las pruebas verifican matemáticamente el aislamiento multiempresa y el flujo de firma simple:

```bash
# Ejecutar en contenedor o entorno virtual
pytest tests/ -v
```

Resultado esperado de las pruebas:
- `test_tenant_isolation_prevents_cross_tenant_document_read`: Pasa (verifica HTTP 403 al intentar acceder a otra empresa).
- `test_tenant_can_read_own_document`: Pasa (acceso autorizado al dueño del recurso).
- `test_list_documents_only_returns_current_tenant_records`: Pasa (filtrado hermético).
- `test_document_creation_and_signature_flow`: Pasa (creación, cálculo de hash SHA-256, firma en portal y verificación pública).
- `test_rut_modulo_11_calculation`: Pasa (validación matemática de RUTs chilenos).

---

## 🔒 Cumplimiento Normativo en Chile

- **Ley N° 19.799**: Firma Electrónica Simple para actos laborales y comerciales.
- **Dirección del Trabajo**: Dictamen N° 789/15 y Ord. N° 4890/074 sobre almacenamiento inmutable y acceso libre para trabajadores.
- **Ley N° 21.561**: Cláusulas de jornada ordinaria de 40 horas semanales.
- **Decreto Supremo N° 594 Art. 68**: Entrega gratuita de EPP y registro firmado de instrucción de uso.
- **Ley N° 19.628 y Ley N° 21.719**: Protección de datos personales y registro de auditoría inmutable sin retención de contraseñas o claves privadas.
