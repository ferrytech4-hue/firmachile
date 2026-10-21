-- Script de Inicialización de PostgreSQL con Row-Level Security (RLS)
-- FirmaDigital Chile: Aislamiento estricto de datos multiempresa

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configuración de parámetro de sesión personalizado para el tenant activo
-- Cada transacción ejecuta: SET LOCAL app.current_tenant_id = 'tenant-xyz';

ALTER DATABASE firmadigital_db SET "app.current_tenant_id" TO '';

-- Función helper para validar si el tenant activo coincide con el registro
CREATE OR REPLACE FUNCTION current_tenant() RETURNS text AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true);
END;
$$ LANGUAGE plpgsql STABLE;

-- Nota: Una vez creadas las tablas por Alembic, las políticas RLS se activan con:
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_policy ON documents 
--     FOR ALL 
--     USING (tenant_id = current_tenant() OR current_tenant() = 'SUPERADMIN_BYPASS');

-- ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_workers ON workers 
--     FOR ALL 
--     USING (tenant_id = current_tenant() OR current_tenant() = 'SUPERADMIN_BYPASS');

-- ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_assets ON assets 
--     FOR ALL 
--     USING (tenant_id = current_tenant() OR current_tenant() = 'SUPERADMIN_BYPASS');

-- ALTER TABLE epp_deliveries ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_epp ON epp_deliveries 
--     FOR ALL 
--     USING (tenant_id = current_tenant() OR current_tenant() = 'SUPERADMIN_BYPASS');

-- ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_audit ON audit_events 
--     FOR ALL 
--     USING (tenant_id = current_tenant() OR current_tenant() = 'SUPERADMIN_BYPASS');
