"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-03-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Tenants
    op.create_table(
        'tenants',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('rut', sa.String(length=12), nullable=False, unique=True),
        sa.Column('razon_social', sa.String(length=255), nullable=False),
        sa.Column('nombre_fantasia', sa.String(length=255), nullable=False),
        sa.Column('giro', sa.String(length=255), nullable=False),
        sa.Column('direccion', sa.String(length=255), nullable=False),
        sa.Column('comuna', sa.String(length=100), nullable=False),
        sa.Column('region', sa.String(length=100), nullable=False),
        sa.Column('telefono', sa.String(length=50), nullable=False),
        sa.Column('email_contacto', sa.String(length=255), nullable=False),
        sa.Column('plan_id', sa.String(length=50), nullable=False, server_default='empresa'),
        sa.Column('estado_suscripcion', sa.String(length=50), nullable=False, server_default='activa'),
        sa.Column('limite_documentos_mes', sa.Integer(), nullable=False, server_default='250'),
        sa.Column('documentos_consumidos_mes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('limite_almacenamiento_mb', sa.Integer(), nullable=False, server_default='2500'),
        sa.Column('almacenamiento_usado_mb', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('limite_usuarios', sa.Integer(), nullable=False, server_default='8'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_tenants_rut', 'tenants', ['rut'])

    # 2. Users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('nombre_completo', sa.String(length=255), nullable=False),
        sa.Column('rut', sa.String(length=12), nullable=False),
        sa.Column('telefono', sa.String(length=50), nullable=True),
        sa.Column('mfa_habilitado', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # 3. Memberships
    op.create_table(
        'memberships',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(length=64), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),
        sa.Column('cargo', sa.String(length=150), nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('tenant_id', 'user_id', name='uq_tenant_user_membership'),
    )

    # 4. Workers
    op.create_table(
        'workers',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('rut', sa.String(length=12), nullable=False),
        sa.Column('nombres', sa.String(length=150), nullable=False),
        sa.Column('apellidos', sa.String(length=150), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('telefono', sa.String(length=50), nullable=False),
        sa.Column('cargo', sa.String(length=150), nullable=False),
        sa.Column('faena_ubicacion', sa.String(length=255), nullable=False),
        sa.Column('fecha_ingreso', sa.String(length=20), nullable=False),
        sa.Column('estado', sa.String(length=50), nullable=False, server_default='activo'),
        sa.Column('afp', sa.String(length=50), nullable=True),
        sa.Column('salud', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_workers_tenant_id', 'workers', ['tenant_id'])
    op.create_index('ix_workers_rut', 'workers', ['rut'])

    # 5. Documents
    op.create_table(
        'documents',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('titulo', sa.String(length=255), nullable=False),
        sa.Column('categoria', sa.String(length=50), nullable=False),
        sa.Column('tipo_firma_requerida', sa.String(length=50), nullable=False, server_default='simple'),
        sa.Column('estado', sa.String(length=50), nullable=False, server_default='pendiente'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('hash_sha256', sa.String(length=64), nullable=False),
        sa.Column('descripcion', sa.String(length=500), nullable=True),
        sa.Column('contenido_texto', sa.Text(), nullable=True),
        sa.Column('nombre_archivo', sa.String(length=255), nullable=False),
        sa.Column('tamano_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('storage_path', sa.String(length=500), nullable=True),
        sa.Column('creado_por_user_id', sa.String(length=64), nullable=False),
        sa.Column('creado_por_nombre', sa.String(length=255), nullable=False),
        sa.Column('trabajador_destinatario_id', sa.String(length=64), sa.ForeignKey('workers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('fecha_creacion', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('fecha_vencimiento', sa.DateTime(timezone=True), nullable=False),
        sa.Column('fecha_completado', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_documents_tenant_id', 'documents', ['tenant_id'])
    op.create_index('ix_documents_hash_sha256', 'documents', ['hash_sha256'])

    # 6. Audit Events
    op.create_table(
        'audit_events',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('tenant_id', sa.String(length=64), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(length=64), nullable=True),
        sa.Column('user_nombre', sa.String(length=255), nullable=False),
        sa.Column('user_email', sa.String(length=255), nullable=False),
        sa.Column('accion', sa.String(length=100), nullable=False),
        sa.Column('recurso_tipo', sa.String(length=50), nullable=False),
        sa.Column('recurso_id', sa.String(length=64), nullable=False),
        sa.Column('detalles', sa.Text(), nullable=False),
        sa.Column('ip_address', sa.String(length=64), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('hash_evento', sa.String(length=64), nullable=False),
    )
    op.create_index('ix_audit_events_tenant_id', 'audit_events', ['tenant_id'])

def downgrade() -> None:
    op.drop_table('audit_events')
    op.drop_table('documents')
    op.drop_table('workers')
    op.drop_table('memberships')
    op.drop_table('users')
    op.drop_table('tenants')
