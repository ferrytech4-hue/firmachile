# Arquitectura de FirmaDigital Chile

## 1. Visión General del Sistema
FirmaDigital Chile es una plataforma SaaS multiempresa de nivel corporativo orientada a la creación, administración, suscripción electrónica y custodia legal inmutable de documentos laborales, contratos de trabajo (Ley 21.561 de 40 horas), anexos, hojas de cargo de herramientas y entrega de Elementos de Protección Personal (D.S. 594 y Ley 16.744).

```
   ┌────────────────────────────────────────────────────────┐
   │         Frontend SPA / PWA (React + TypeScript)        │
   │  (Web Responsive, Tablet Android, Firma en Pantalla)   │
   └───────────────────────────┬────────────────────────────┘
                               │ HTTPS / REST (OpenAPI)
                               ▼
   ┌────────────────────────────────────────────────────────┐
   │             Backend API (Python + FastAPI)             │
   │ - Autenticación JWT y Resolución de Tenant             │
   │ - Validación Módulo 11 RUT Oficial de Chile            │
   │ - Generación de Evidencias Criptográficas SHA-256      │
   │ - Control de Consumo de Cuotas por Plan SaaS           │
   └───────────────┬────────────────────────┬───────────────┘
                   │                        │
                   ▼                        ▼
   ┌───────────────────────────┐  ┌─────────────────────────┐
   │   PostgreSQL 16 con RLS   │  │   Almacenamiento S3     │
   │ (Row-Level Security por   │  │   Privado (MinIO/AWS)   │
   │    tenant_id estricto)    │  │ (PDFs cifrados AES-256) │
   └───────────────────────────┘  └─────────────────────────┘
```

## 2. Aislamiento Multiempresa y Row-Level Security (RLS)

### 2.1 Principio de Autorización en Servidor
El identificador de empresa (`tenant_id`) se extrae **exclusivamente** del token JWT firmado con algoritmo criptográfico `HS256` en el servidor tras autenticación contra la tabla `memberships`.
Bajo ninguna circunstancia se confía en un encabezado arbitrario (como `X-Tenant-Id` o parámetros de consulta) para determinar el tenant activo.

### 2.2 Row-Level Security en PostgreSQL
Cada conexión transaccional al motor de base de datos ejecuta:
```sql
SET LOCAL app.current_tenant_id = :tenant_id;
```
Y las tablas críticas (`documents`, `workers`, `assets`, `epp_deliveries`, `audit_events`) aplican la directiva:
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON documents 
    FOR ALL 
    USING (tenant_id = current_setting('app.current_tenant_id', true));
```
Cualquier intento de consultar el ID de un documento perteneciente a otra empresa es rechazado por el motor con `HTTP 403 Forbidden` y se registra una alerta inmutable en el log de auditoría forense (`CROSS_TENANT_ACCESS_BLOCKED`).

## 3. Integridad Criptográfica de la Firma Electrónica Simple (FES)
Conforme al Artículo 3° de la Ley N° 19.799:
1. El firmante revisa el documento íntegro en pantalla.
2. Ingresa su RUT validado y opcionalmente el N° de Serie de su Cédula de Identidad física.
3. Plasma su trazo manuscrito en el lienzo táctil (Canvas).
4. Otorga consentimiento expreso sobre la versión del texto legal.
5. El sistema calcula el hash SHA-256 del contenido + metadatos + marca temporal UTC y hora oficial de Chile (CLT).
6. Se genera un código de verificación público único (ej. `FD-CL-XXXX-XXXX`) y el Certificado de Evidencia en PDF.
