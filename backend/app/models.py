import datetime
import enum
from sqlalchemy import (
    Column, String, Integer, DateTime, Boolean, ForeignKey, 
    Text, Numeric, Enum, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from .database import Base

class RoleEnum(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN_EMPRESA = "admin_empresa"
    SUPERVISOR = "supervisor"
    TRABAJADOR = "trabajador"
    AUDITOR = "auditor"

class SignatureTypeEnum(str, enum.Enum):
    SIMPLE = "simple"
    AVANZADA = "avanzada"

class DocumentStatusEnum(str, enum.Enum):
    BORRADOR = "borrador"
    PENDIENTE = "pendiente"
    FIRMADO = "firmado"
    RECHAZADO = "rechazado"
    VENCIDO = "vencido"
    CANCELADO = "cancelado"

class DocumentCategoryEnum(str, enum.Enum):
    CONTRATO = "contrato"
    ANEXO = "anexo"
    HOJA_CARGO = "hoja_cargo"
    EPP = "epp"
    AUTORIZACION = "autorizacion"
    ORDEN_TRABAJO = "orden_trabajo"
    ADMINISTRATIVO = "administrativo"

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(64), primary_key=True)
    rut = Column(String(12), unique=True, nullable=False, index=True)
    razon_social = Column(String(255), nullable=False)
    nombre_fantasia = Column(String(255), nullable=False)
    giro = Column(String(255), nullable=False)
    direccion = Column(String(255), nullable=False)
    comuna = Column(String(100), nullable=False)
    region = Column(String(100), nullable=False)
    telefono = Column(String(50), nullable=False)
    email_contacto = Column(String(255), nullable=False)
    plan_id = Column(String(50), default="empresa", nullable=False)
    estado_suscripcion = Column(String(50), default="activa", nullable=False)
    limite_documentos_mes = Column(Integer, default=250, nullable=False)
    documentos_consumidos_mes = Column(Integer, default=0, nullable=False)
    limite_almacenamiento_mb = Column(Integer, default=2500, nullable=False)
    almacenamiento_usado_mb = Column(Integer, default=0, nullable=False)
    limite_usuarios = Column(Integer, default=8, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    memberships = relationship("Membership", back_populates="tenant", cascade="all, delete-orphan")
    workers = relationship("Worker", back_populates="tenant", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="tenant", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="tenant", cascade="all, delete-orphan")
    epp_deliveries = relationship("EppDelivery", back_populates="tenant", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="tenant", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nombre_completo = Column(String(255), nullable=False)
    rut = Column(String(12), nullable=False, index=True)
    telefono = Column(String(50), nullable=True)
    mfa_habilitado = Column(Boolean, default=False, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")

class Membership(Base):
    __tablename__ = "memberships"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(Enum(RoleEnum), nullable=False)
    cargo = Column(String(150), nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="memberships")
    user = relationship("User", back_populates="memberships")

    __table_args__ = (UniqueConstraint("tenant_id", "user_id", name="uq_tenant_user_membership"),)

class Worker(Base):
    __tablename__ = "workers"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    rut = Column(String(12), nullable=False, index=True)
    nombres = Column(String(150), nullable=False)
    apellidos = Column(String(150), nullable=False)
    email = Column(String(255), nullable=False)
    telefono = Column(String(50), nullable=False)
    cargo = Column(String(150), nullable=False)
    faena_ubicacion = Column(String(255), nullable=False)
    fecha_ingreso = Column(String(20), nullable=False)
    estado = Column(String(50), default="activo", nullable=False)
    afp = Column(String(50), nullable=True)
    salud = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="workers")
    assignments = relationship("AssetAssignment", back_populates="worker")
    epp_deliveries = relationship("EppDelivery", back_populates="worker")

class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    categoria = Column(Enum(DocumentCategoryEnum), nullable=False)
    cuerpo_texto = Column(Text, nullable=False)
    variables_dinamicas = Column(JSON, nullable=True)
    activo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    titulo = Column(String(255), nullable=False)
    categoria = Column(Enum(DocumentCategoryEnum), nullable=False)
    tipo_firma_requerida = Column(Enum(SignatureTypeEnum), default=SignatureTypeEnum.SIMPLE, nullable=False)
    estado = Column(Enum(DocumentStatusEnum), default=DocumentStatusEnum.PENDIENTE, nullable=False, index=True)
    version = Column(Integer, default=1, nullable=False)
    hash_sha256 = Column(String(64), nullable=False, index=True)
    descripcion = Column(String(500), nullable=True)
    contenido_texto = Column(Text, nullable=True)
    nombre_archivo = Column(String(255), nullable=False)
    tamano_bytes = Column(Integer, default=0, nullable=False)
    storage_path = Column(String(500), nullable=True)
    creado_por_user_id = Column(String(64), nullable=False)
    creado_por_nombre = Column(String(255), nullable=False)
    trabajador_destinatario_id = Column(String(64), ForeignKey("workers.id", ondelete="SET NULL"), nullable=True)
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    fecha_vencimiento = Column(DateTime(timezone=True), nullable=False)
    fecha_completado = Column(DateTime(timezone=True), nullable=True)

    tenant = relationship("Tenant", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document", cascade="all, delete-orphan")
    signature_requests = relationship("SignatureRequest", back_populates="document", cascade="all, delete-orphan")

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(String(64), primary_key=True)
    document_id = Column(String(64), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    hash_sha256 = Column(String(64), nullable=False)
    storage_path = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="versions")

class SignatureRequest(Base):
    __tablename__ = "signature_requests"

    id = Column(String(64), primary_key=True)
    document_id = Column(String(64), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    verification_code = Column(String(30), unique=True, nullable=False, index=True)
    token = Column(String(128), unique=True, nullable=False, index=True)
    estado = Column(String(50), default="pendiente", nullable=False)
    texto_aceptacion_version = Column(String(50), default="v2.4-CL-LEY19799-DT", nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    document = relationship("Document", back_populates="signature_requests")
    signers = relationship("Signer", back_populates="signature_request", cascade="all, delete-orphan")

class Signer(Base):
    __tablename__ = "signers"

    id = Column(String(64), primary_key=True)
    signature_request_id = Column(String(64), ForeignKey("signature_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    rut = Column(String(12), nullable=False, index=True)
    nombre_completo = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    cargo = Column(String(150), nullable=False)
    orden_firma = Column(Integer, default=1, nullable=False)
    estado = Column(String(50), default="pendiente", nullable=False)
    tipo_firma = Column(Enum(SignatureTypeEnum), default=SignatureTypeEnum.SIMPLE, nullable=False)
    fecha_firma_utc = Column(DateTime(timezone=True), nullable=True)
    fecha_firma_clt = Column(String(100), nullable=True)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(500), nullable=True)
    cedula_serie = Column(String(50), nullable=True)
    motivo_rechazo = Column(Text, nullable=True)
    firma_imagen_url = Column(String(500), nullable=True)

    signature_request = relationship("SignatureRequest", back_populates="signers")
    events = relationship("SignatureEvent", back_populates="signer", cascade="all, delete-orphan")

class SignatureEvent(Base):
    __tablename__ = "signature_events"

    id = Column(String(64), primary_key=True)
    signer_id = Column(String(64), ForeignKey("signers.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False) # SENT, VIEWED, ACCEPTED, REJECTED, DOWNLOADED
    timestamp_utc = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    ip_address = Column(String(64), nullable=True)
    evidence_payload = Column(JSON, nullable=True)

    signer = relationship("Signer", back_populates="events")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    codigo_inventario = Column(String(50), nullable=False, index=True)
    nombre = Column(String(255), nullable=False)
    marca = Column(String(100), nullable=False)
    modelo = Column(String(100), nullable=False)
    numero_serie = Column(String(100), nullable=False)
    estado = Column(String(50), default="operativo", nullable=False)
    valor_estimado_clp = Column(Numeric(12, 2), default=0.0, nullable=False)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="assets")
    assignments = relationship("AssetAssignment", back_populates="asset")

class AssetAssignment(Base):
    __tablename__ = "asset_assignments"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String(64), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_id = Column(String(64), ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    fecha_entrega = Column(String(20), nullable=False)
    fecha_devolucion = Column(String(20), nullable=True)
    estado_entrega = Column(String(50), default="BUEN_ESTADO", nullable=False)
    responsable_entrega = Column(String(255), nullable=False)
    documento_cargo_id = Column(String(64), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    asset = relationship("Asset", back_populates="assignments")
    worker = relationship("Worker", back_populates="assignments")

class EppDelivery(Base):
    __tablename__ = "epp_deliveries"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    worker_id = Column(String(64), ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    supervisor_responsable = Column(String(255), nullable=False)
    faena_ubicacion = Column(String(255), nullable=False)
    fecha_entrega = Column(String(20), nullable=False)
    estado_firma = Column(String(50), default="pendiente", nullable=False)
    documento_id = Column(String(64), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    items_json = Column(JSON, nullable=False)
    observaciones_normativas = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

    tenant = relationship("Tenant", back_populates="epp_deliveries")
    worker = relationship("Worker", back_populates="epp_deliveries")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), nullable=True)
    user_nombre = Column(String(255), nullable=False)
    user_email = Column(String(255), nullable=False)
    accion = Column(String(100), nullable=False, index=True)
    recurso_tipo = Column(String(50), nullable=False)
    recurso_id = Column(String(64), nullable=False)
    detalles = Column(Text, nullable=False)
    ip_address = Column(String(64), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False, index=True)
    hash_evento = Column(String(64), nullable=False)

    tenant = relationship("Tenant", back_populates="audit_events")

class Plan(Base):
    __tablename__ = "plans"

    id = Column(String(50), primary_key=True)
    nombre = Column(String(100), nullable=False)
    precio_mensual_clp = Column(Integer, nullable=False)
    limite_documentos_mes = Column(Integer, nullable=False)
    limite_usuarios = Column(Integer, nullable=False)
    limite_almacenamiento_mb = Column(Integer, nullable=False)
    incluye_hojas_cargo_y_epp = Column(Boolean, default=True, nullable=False)
    incluye_api_rest = Column(Boolean, default=False, nullable=False)

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_id = Column(String(50), ForeignKey("plans.id"), nullable=False)
    status = Column(String(50), default="activa", nullable=False)
    payment_provider = Column(String(50), default="webpay", nullable=False)
    current_period_start = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False)

class ProviderIntegration(Base):
    __tablename__ = "provider_integrations"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    provider_type = Column(String(50), nullable=False) # 'FEA_ACEPTA', 'FEA_ESIGN', 'WEBPAY', 'FINTOC'
    status = Column(String(50), default="configurado", nullable=False)
    endpoint_url = Column(String(255), nullable=True)
    client_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)

class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(String(64), primary_key=True)
    tenant_id = Column(String(64), nullable=True)
    provider = Column(String(50), nullable=False)
    event_name = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    processed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, nullable=False)
